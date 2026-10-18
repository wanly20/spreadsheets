// The course model: knowledge items (from content/knowledge_lessonN.js, read
// as-is), the levels in content/course.js, the extra practice in
// content/practice.js, and the session builders that turn them into steps.
// Pure functions apart from loadKnowledge(), so tools/check_content.mjs can
// import this file in Node and build every session the app can build.
import { course } from "../content/course.js";
import { practice } from "../content/practice.js";

export { course, practice };

/** Plain text of a definition: [[ ]] removed. */
export const plainDef = (d) => String(d).replace(/\[\[(.+?)\]\]/g, "$1");
/** The revision prompt: `review` if given, else the definition with ____ for [[ ]]. */
export const promptOf = (k) => k.review || String(k.def).replace(/\[\[(.+?)\]\]/g, "____");
const norm = (s) => String(s).toLowerCase().replace(/[‘’“”"]/g, "'").replace(/[—–]/g, "-").replace(/\s+/g, " ").trim();
export const factIn = (fact, def) => norm(plainDef(def)).includes(norm(fact));

// ------------------------------------------------------------------ loading
/** Browser: load content/knowledge_lessonN.js (a plain script that declares
 *  `const lessonNKnowledge = [...]`) for every lesson that is ready. */
export async function loadKnowledge() {
  const out = {};
  for (const l of course.lessons.filter((x) => !x.comingSoon)) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = `content/knowledge_lesson${l.n}.js`;
      s.onload = res;
      s.onerror = () => rej(new Error(`Couldn't load ${s.src}`));
      document.head.appendChild(s);
    });
    // Top-level const in a classic script is global but not on window.
    out[l.n] = Function(`return typeof lesson${l.n}Knowledge !== "undefined" ? lesson${l.n}Knowledge : []`)();
  }
  return out;
}

// ------------------------------------------------------------------ model
/** Build the model from { n: knowledgeArray }. Returns { lessons, items, byId, warnings }. */
export function buildModel(knowledge) {
  const warnings = [];
  const items = [];
  const byId = new Map();
  const lessons = course.lessons.map((l) => {
    if (l.comingSoon || !knowledge[l.n]) return { ...l, comingSoon: true, levels: [], items: [] };
    const list = knowledge[l.n].map((k, i) => ({
      id: `${l.n}:${k.term}`,
      lesson: l.n,
      order: i,
      term: k.term,
      def: k.def,
      defPlain: plainDef(k.def),
      prompt: promptOf(k),
      kind: k.kind,
      at: k.at,
      extra: practice[k.term] || null,
    }));
    list.forEach((it) => { items.push(it); byId.set(it.id, it); });
    // Assign items to levels by term; unlisted items join the level whose
    // listed items are nearest in slide order.
    const levels = (l.levels || []).map((lv) => ({ ...lv, lesson: l.n, items: [] }));
    const placed = new Set();
    levels.forEach((lv) => lv.terms.forEach((t) => {
      const it = list.find((x) => x.term === t);
      if (!it) { warnings.push(`Level ${lv.id} lists "${t}", which isn't in knowledge_lesson${l.n}.js`); return; }
      lv.items.push(it); placed.add(it);
    }));
    for (const it of list) {
      if (placed.has(it)) continue;
      warnings.push(`"${it.term}" (lesson ${l.n}) isn't listed in any level: added automatically`);
      if (!levels.length) levels.push({ id: `${l.n}-1`, title: "Practice", icon: "star", lesson: l.n, items: [], terms: [] });
      let best = levels[levels.length - 1];
      for (const lv of levels) if (lv.items.length && lv.items[0].at <= it.at) best = lv;
      best.items.push(it);
      best.items.sort((a, b) => a.order - b.order);
    }
    return { ...l, levels: levels.filter((lv) => lv.items.length), items: list };
  });
  for (const term of Object.keys(practice)) {
    if (!items.some((it) => it.term === term) && course.lessons.some((l) => !l.comingSoon)) {
      // Only a warning: the practice may belong to a lesson that isn't ready yet.
      warnings.push(`content/practice.js has exercises for "${term}", which isn't in any ready lesson`);
    }
  }
  allItems = items;
  return { lessons, items, byId, warnings };
}

// ------------------------------------------------------------------ helpers
export function makeRng(seed) {
  if (seed == null) return Math.random;
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const shuffleR = (a, rng) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const pickR = (a, rng) => a[Math.floor(rng() * a.length)];

/** Resolve list-valued targets (one picked at random; gridMove keeps from/to/value aligned). */
function resolve(ex, rng) {
  const out = { ...ex };
  if (ex.type === "gridMove") {
    const k = Math.floor(rng() * [].concat(ex.from).length);
    out.from = [].concat(ex.from)[k]; out.to = [].concat(ex.to)[k % [].concat(ex.to).length]; out.value = [].concat(ex.value)[k % [].concat(ex.value).length];
  } else if (Array.isArray(ex.target) && ex.type !== "gridMulti") out.target = pickR(ex.target, rng); // gridMulti: both ranges
  return out;
}

/** Distractor terms for an item: same lesson first, same kind and nearby slides preferred. */
function otherTerms(item, pool, n, rng) {
  const cands = pool.filter((x) => x.id !== item.id && x.term.toLowerCase() !== item.term.toLowerCase());
  const score = (x) => (x.kind === item.kind ? 0 : 10) + Math.abs(x.at - item.at) / 8 + rng() * 6;
  return cands.map((x) => [score(x), x]).sort((a, b) => a[0] - b[0]).slice(0, n).map((p) => p[1]);
}

const STOP = new Set(["a", "an", "the", "to", "of", "and", "or", "in", "on", "vs"]);
const termWords = (term) => term.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w));
/** A word without a plural ending, so "formulas" matches "formula". */
const stem = (w) => (w.length > 4 ? w.replace(/(es|s)$/, "") : w);
/** True when a hidden ([[…]]) word is part of the term, e.g. [[Fill]] in "fill colour". */
export function blanksGiveAway(item) {
  const hidden = blanksOf(item.def).join(" ").toLowerCase();
  return termWords(item.term).some((w) => new RegExp(`\\b${stem(w)}`, "i").test(hidden));
}
/** The [[…]] words of a definition, in order. */
export const blanksOf = (def) => [...String(def).matchAll(/\[\[(.+?)\]\]/g)].map((m) => m[1]);

/**
 * The prompt for "Which term matches?", never with gaps in it:
 * the `review` text if there is one, else the definition read naturally
 * (brackets removed). Returns null when that would give the term away
 * (a hidden word is part of the term, or the term itself appears).
 */
export function termPrompt(item) {
  if (item.review) return item.review;
  if (blanksGiveAway(item)) return null;
  const text = item.defPlain;
  const re = new RegExp(`\\b${item.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return re.test(text) ? null : text;
}

/** Every item of every ready lesson (set by buildModel), for topping up wrong chips. */
let allItems = [];

/**
 * Wrong chips for "Fill the gaps": hidden words of other items in the same
 * pool first, then (if there aren't enough) of the rest of its lesson and of earlier lessons, nearest first.
 * Never one of the answers.
 */
function gapDistractors(item, pool, answers, n, rng) {
  const lower = new Set(answers.map((a) => a.toLowerCase()));
  const seen = new Set(lower);
  // Prefer chips of a similar length to the answers, so the length doesn't give it away.
  const avg = answers.reduce((s, a) => s + a.length, 0) / answers.length;
  const words = (list) => {
    const out = [];
    for (const x of shuffleR(list, rng)) {
      if (x.id === item.id) continue;
      for (const w of blanksOf(x.def)) if (!seen.has(w.toLowerCase())) { seen.add(w.toLowerCase()); out.push(w); }
    }
    return out.map((w) => [Math.abs(w.length - avg) + rng() * 6, w]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
  };
  const out = words(pool).slice(0, n);
  for (let l = item.lesson; out.length < n && l >= 1; l--) {
    out.push(...words(allItems.filter((x) => x.lesson === l)).slice(0, n - out.length));
  }
  return out;
}

/** The automatic exercises every item gets. */
export function genericExercises(item, pool, rng) {
  const out = [];
  const blanks = blanksOf(item.def);
  if (blanks.length) {
    const wrong = gapDistractors(item, pool, blanks, blanks.length <= 2 ? 3 : 2, rng);
    out.push({ type: "gaps", gen: "gaps", item: item.id, def: item.def, answers: blanks, showTerm: !blanksGiveAway(item), chips: shuffleR([...blanks, ...wrong], rng) });
  }
  const prompt = termPrompt(item);
  const terms = otherTerms(item, pool, 3, rng);
  if (prompt && terms.length >= 2) {
    out.push({ type: "choice", gen: "defToTerm", item: item.id, quote: prompt, prompt: "Which term matches?", correct: item.term, wrong: terms.map((t) => t.term), termOptions: true });
  }
  const defs = otherTerms(item, pool.filter((x) => x.defPlain.length <= 150), 2, rng);
  if (defs.length >= 2 && item.defPlain.length <= 170) {
    out.push({ type: "choice", gen: "termToDef", item: item.id, term: item.term, prompt: "What does this mean?", correct: item.defPlain, wrong: defs.map((t) => t.defPlain), long: true });
  }
  // Mix the order a little so a level gets all three kinds.
  return shuffleR(out, rng);
}

export function authoredExercises(item, rng) {
  return (item.extra?.exercises || []).map((ex) => ({ ...resolve(ex, rng), item: item.id }));
}

/** A matching exercise for 4 items with short definitions, if there are enough. */
function matchExercise(pool, rng) {
  const short = shuffleR(pool.filter((x) => x.defPlain.length <= 70), rng).slice(0, 4);
  if (short.length < 4) return null;
  return { type: "match", items: short.map((x) => x.id), pairs: short.map((x) => ({ term: x.term, def: x.defPlain })) };
}

/** Avoid the same item twice in a row where possible. */
function spread(list, rng) {
  const a = shuffleR(list, rng);
  for (let i = 1; i < a.length; i++) {
    if (a[i].item && a[i].item === a[i - 1].item) {
      const j = a.findIndex((x, k) => k > i && x.item !== a[i - 1].item && (!a[k + 1] || a[k + 1].item !== a[i].item));
      if (j > 0) [a[i], a[j]] = [a[j], a[i]];
    }
  }
  return a;
}

// ------------------------------------------------------------------ sessions
export const LEVEL_MIN = 8, LEVEL_MAX = 12;

/**
 * A level: for each new item a learn card then one question on it; then a
 * mixed block (a second question per item, plus 1–2 retrieval questions from
 * earlier levels of the same lesson). 8–12 questions in all.
 */
export function levelSession(model, level, { seed, need = () => -1 } = {}) {
  const rng = makeRng(seed);
  const lesson = model.lessons.find((l) => l.n === level.lesson);
  const pool = lesson.items;
  const steps = [];
  const rest = [];
  const firstBlock = [];
  const spare = new Map();
  level.items.forEach((item, i) => {
    const authored = shuffleR(authoredExercises(item, rng), rng);
    const generic = genericExercises(item, level.items.length >= 4 ? level.items : pool, rng);
    // Alternate which term question comes first, so a level has both kinds.
    if (generic.length > 1 && (i % 2 === 1) !== (rng() < 0.2)) generic.reverse();
    // First question: hands-on if there is one. Second: a term question for
    // every other item, another hands-on one for the rest.
    const first = authored.shift() || generic.shift();
    const second = i % 2 === 0 ? generic.shift() || authored.shift() : authored.shift() || generic.shift();
    firstBlock.push({ type: "learn", item: item.id }, first);
    if (second) rest.push(second);
    spare.set(item, [...generic, ...authored]);
  });
  // A matching game when the level has enough short definitions.
  const m = matchExercise(level.items, rng);
  if (m) rest.push(m);
  // Too many? Drop "which term matches?" questions first (the matching game covers them).
  while (level.items.length + rest.length > LEVEL_MAX) {
    const k = rest.findIndex((x) => x.gen === "defToTerm");
    rest.splice(k >= 0 ? k : rest.length - 1, 1);
  }
  let count = level.items.length + rest.length;
  // Retrieval from earlier levels of this lesson (weakest first).
  const idx = lesson.levels.indexOf(level);
  const earlier = lesson.levels.slice(0, Math.max(0, idx)).flatMap((l) => l.items);
  const review = earlier.map((it) => [need(it.id) + rng(), it]).sort((a, b) => b[0] - a[0]).map((p) => p[1]);
  for (const it of review.slice(0, 2)) {
    if (count >= LEVEL_MAX) break;
    const ex = pickR([...authoredExercises(it, rng), ...genericExercises(it, pool, rng)], rng);
    if (ex) { rest.push({ ...ex, retrieval: true }); count++; }
  }
  // Top up to the minimum with spare questions on the new items.
  let k = 0;
  while (count < LEVEL_MIN && level.items.some((it) => spare.get(it).length)) {
    const it = level.items[k++ % level.items.length];
    const ex = spare.get(it).shift();
    if (ex) { rest.push(ex); count++; }
  }
  return [...firstBlock, ...spread(rest, rng)].filter(Boolean);
}

/** A review: questions only, weakest/least-seen items first, plus one matching game. */
export function reviewSession(model, items, { seed, count = 12, need = () => -1, match = true } = {}) {
  const rng = makeRng(seed);
  const ranked = items.map((it) => [(need(it.id) < 0 ? 4 : need(it.id)) + rng() * 4, it]).sort((a, b) => b[0] - a[0]).map((p) => p[1]);
  const chosen = ranked.slice(0, Math.min(count, ranked.length));
  const pool = items.length >= 4 ? items : model.items;
  const steps = chosen.map((it) => pickR([...authoredExercises(it, rng), ...genericExercises(it, pool, rng)], rng)).filter(Boolean);
  // Short sessions get a second question on the weakest items.
  for (let i = 0; steps.length < Math.min(count, 8) && i < chosen.length; i++) {
    const ex = pickR(genericExercises(chosen[i], pool, rng), rng);
    if (ex) steps.push(ex);
  }
  const out = spread(steps, rng);
  if (match) {
    const m = matchExercise(items, rng);
    if (m) out.splice(Math.min(out.length, 3 + Math.floor(rng() * 3)), 0, m);
  }
  return out;
}

/** Every node on the path, in order: levels, then each lesson's review, then the big review. */
export function pathNodes(model) {
  const nodes = [];
  for (const l of model.lessons) {
    if (l.comingSoon) continue;
    l.levels.forEach((lv, i) => nodes.push({ id: lv.id, kind: "level", lesson: l.n, title: lv.title, icon: lv.icon || "star", index: i + 1, level: lv }));
    if (l.review) nodes.push({ id: l.review.id, kind: "review", lesson: l.n, title: l.review.title, icon: "repeat", items: l.items });
  }
  return nodes;
}
