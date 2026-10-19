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
      review: k.review || null,
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

/** How many versions an exercise has (a list of targets, or of cells to move). */
const versions = (ex) => (ex.type === "gridMove" ? [].concat(ex.from).length : Array.isArray(ex.target) && ex.type !== "gridMulti" ? ex.target.length : 1);

/** Resolve list-valued targets (one picked at random; gridMove keeps from/to/value aligned). */
function resolve(ex, rng) {
  const out = { ...ex };
  if (ex.type === "gridMove") {
    const k = Math.floor(rng() * [].concat(ex.from).length);
    out.from = [].concat(ex.from)[k]; out.to = [].concat(ex.to)[k % [].concat(ex.to).length]; out.value = [].concat(ex.value)[k % [].concat(ex.value).length];
  } else if (Array.isArray(ex.target) && ex.type !== "gridMulti") out.target = pickR(ex.target, rng); // gridMulti: both ranges
  return out;
}

/** Distractor terms for an item: its confusable terms first (practice.js `confusable`), then the
 *  same lesson (never another lesson while this one has enough), same kind and nearby slides. */
function otherTerms(item, pool, n, rng) {
  const cands = pool.filter((x) => x.id !== item.id && x.term.toLowerCase() !== item.term.toLowerCase());
  const confusable = new Set(item.extra?.confusable || []);
  const score = (x) => (confusable.has(x.term) ? -100 : 0) + (x.lesson === item.lesson ? 0 : 40) + (x.kind === item.kind ? 0 : 10) + Math.abs(x.at - item.at) / 8 + rng() * 6;
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
  if (item.review && !/_{3,}/.test(item.review)) return item.review; // a review with gaps isn't a quote
  if (blanksGiveAway(item)) return null;
  const text = item.defPlain;
  const re = new RegExp(`\\b${item.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return re.test(text) ? null : text;
}

/** Every item of every ready lesson (set by buildModel), for topping up wrong chips. */
let allItems = [];

/**
 * Wrong chips for "Fill the gaps": the item's own `gapChips` (practice.js) first, then hidden words
 * of other items in the same pool, then (if there aren't enough) of the items the student has met
 * (`met`; by default this lesson and earlier lessons), nearest first. Never one of the answers,
 * and never a word from a level the student hasn't reached yet when `met` is given.
 */
function gapDistractors(item, pool, answers, n, rng, met) {
  const lower = new Set(answers.map((a) => a.toLowerCase()));
  const seen = new Set(lower);
  const out = [];
  for (const w of shuffleR(item.extra?.gapChips || [], rng)) {
    if (out.length < n && !seen.has(w.toLowerCase())) { seen.add(w.toLowerCase()); out.push(w); }
  }
  // Prefer chips of a similar length to the answers, so the length doesn't give it away.
  const avg = answers.reduce((s, a) => s + a.length, 0) / answers.length;
  const words = (list) => {
    const found = [];
    for (const x of shuffleR(list, rng)) {
      if (x.id === item.id) continue;
      for (const w of blanksOf(x.def)) if (!seen.has(w.toLowerCase())) { seen.add(w.toLowerCase()); found.push(w); }
    }
    return found.map((w) => [Math.abs(w.length - avg) + rng() * 6, w]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
  };
  const metIds = met ? new Set(met.map((x) => x.id)) : null;
  const ok = (x) => !metIds || metIds.has(x.id);
  out.push(...words(pool.filter(ok)).slice(0, n - out.length));
  for (let l = item.lesson; out.length < n && l >= 1; l--) {
    out.push(...words(allItems.filter((x) => x.lesson === l && ok(x))).slice(0, n - out.length));
  }
  return out;
}

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** A word of the term that appears in `text` (as a whole word or its plural), or null. */
const COMMON = new Set(["cell", "cells", "text", "sheet"]); // in most definitions: they give nothing away
function termWordIn(term, text) {
  return termWords(term).filter((w) => !COMMON.has(w)).find((w) => new RegExp(`\\b${escRe(stem(w))}(e?s)?\\b`, "i").test(text)) || null;
}

/**
 * A word of the term in the right meaning only ("Press Ctrl + Z to undo…" for undo), or in the
 * quote and only the right term's name, picks the answer by itself. Then one wrong option is
 * swapped for one that shares the word; if none does, returns null (leave the question out).
 */
function noGiveaway(item, text, wrong, pool, key) {
  const w = termWordIn(item.term, text);
  if (!w || wrong.some((x) => termWordIn(w, key(x)))) return wrong;
  const swap = pool.find((x) => x.id !== item.id && !wrong.includes(x) && x.term.toLowerCase() !== item.term.toLowerCase() && termWordIn(w, key(x)));
  return swap ? [...wrong.slice(0, -1), swap] : null;
}

/** The automatic exercises every item gets. `met`: the items the student has met (for gap chips). */
export function genericExercises(item, pool, rng, { met } = {}) {
  const out = [];
  const blanks = blanksOf(item.def);
  if (blanks.length) {
    const wrong = gapDistractors(item, pool, blanks, blanks.length <= 2 ? 3 : 2, rng, met);
    out.push({ type: "gaps", gen: "gaps", item: item.id, def: item.def, answers: blanks, showTerm: item.extra?.gapShowTerm || !blanksGiveAway(item), chips: shuffleR([...blanks, ...wrong], rng) });
  }
  const prompt = termPrompt(item);
  let terms = otherTerms(item, pool, 3, rng);
  if (prompt) terms = noGiveaway(item, prompt, terms, pool, (x) => x.term);
  if (prompt && terms && terms.length >= 2) {
    out.push({ type: "choice", gen: "defToTerm", item: item.id, quote: prompt, prompt: "Which term matches?", correct: item.term, wrong: terms.map((t) => t.term), termOptions: true,
      others: Object.fromEntries(terms.map((t) => [t.term, { term: t.term, def: t.defPlain }])) });
  }
  const short = pool.filter((x) => x.defPlain.length <= 150);
  const defs = noGiveaway(item, item.defPlain, otherTerms(item, short, 2, rng), short, (x) => x.defPlain);
  if (defs && defs.length >= 2 && item.defPlain.length <= 170) {
    out.push({ type: "choice", gen: "termToDef", item: item.id, term: item.term, prompt: "What does this mean?", correct: item.defPlain, wrong: defs.map((t) => t.defPlain), long: true,
      others: Object.fromEntries(defs.map((t) => [t.defPlain, { term: t.term, def: t.defPlain }])) });
  }
  // Mix the order a little so a level gets all three kinds.
  return shuffleR(out, rng);
}

/** An item's hand-made exercises, each with `ex`: its place in practice.js (so a mistake can be traced to it). */
export function authoredExercises(item, rng) {
  return (item.extra?.exercises || []).map((ex, i) => ({ ...resolve(ex, rng), item: item.id, ex: i }));
}

/** Where the student does it: drags, types, presses the keys, orders steps or taps the real thing (best first). */
export const HANDS_ON = ["gridMove", "gridRange", "gridMulti", "rangeName", "gridName", "formula", "lockRef", "keys", "order", "hotspot", "gridClick"];
const isHandsOn = (e) => !!e && HANDS_ON.includes(e.type);
/** Production: typing, pressing keys, dragging or ordering (not picking from options or tapping). */
export const PRODUCTION = new Set(["gridMove", "gridRange", "gridMulti", "rangeName", "gridName", "formula", "lockRef", "keys", "order"]);
/** The best hands-on exercise in a list (drags and typing before taps), or undefined. */
const bestHandsOn = (list) => list.filter(isHandsOn).sort((a, b) => HANDS_ON.indexOf(a.type) - HANDS_ON.indexOf(b.type))[0];

/** What a step practises, saved with a wrong answer so Review can come back to that exact thing. */
export function skillOf(step) {
  if (step.type === "match") return { type: "match", gen: "match" };
  return { type: step.type, ...(step.ex != null ? { ex: step.ex, fact: step.fact } : {}), ...(step.gen ? { gen: step.gen } : {}) };
}

/** True when a step practises the same thing as a recorded miss. */
export function sameSkill(miss, s) {
  if (!miss || !s) return false;
  if (miss.gen === "match") return ["match", "termToDef", "defToTerm"].includes(s.gen);
  if (miss.gen) return miss.gen === s.gen;
  return s.ex === miss.ex || (!!s.fact && s.fact === miss.fact && s.type === miss.type);
}

/**
 * One exercise for an item in a review or "From earlier". A recorded miss brings back that
 * exercise (a new version of it) or a sibling testing the same fact; otherwise a hands-on one
 * half the time.
 */
export function pickExercise(item, pool, rng, { met, miss } = {}) {
  const authored = authoredExercises(item, rng);
  const generic = genericExercises(item, pool, rng, { met });
  if (miss) {
    const same = miss.gen === "match" ? generic.filter((e) => e.gen === "termToDef" || e.gen === "defToTerm")
      : miss.gen ? generic.filter((e) => e.gen === miss.gen)
      : authored.filter((e) => sameSkill(miss, e));
    const sameType = miss.ex != null ? authored.filter((e) => e.type === miss.type) : [];
    const pick = same.length ? pickR(same, rng) : sameType.length ? pickR(sameType, rng) : null;
    if (pick) return { ...pick, targeted: true };
  }
  const prod = authored.filter((e) => PRODUCTION.has(e.type));
  if (prod.length && rng() < 0.5) return pickR(prod, rng);
  return pickR([...authored, ...generic], rng);
}

/**
 * The step that comes back after a wrong answer (at the end of the session): a different version
 * of the same thing where there is one. The same exercise with another cell or range; else a
 * sibling testing the same fact (other numbers); else another of the item's exercises of the same
 * type; a term question asked the other way round; else the same step again.
 */
export function retryStep(model, step, rng = Math.random) {
  const item = step.item && model.byId.get(step.item);
  const was = { ex: step.ex, gen: step.gen, target: step.target ?? step.from ?? null, versions: 1 };
  if (!item) return { ...step, retryOf: was };
  if (step.ex != null) {
    const list = item.extra?.exercises || [];
    const orig = list[step.ex];
    if (!orig) return { ...step, retryOf: was };
    was.versions = versions(orig);
    const key = (s) => JSON.stringify(s.target ?? s.from ?? null);
    if (was.versions > 1) {
      for (let t = 0; t < 20; t++) {
        const r = { ...resolve(orig, rng), item: item.id, ex: step.ex };
        if (key(r) !== key(step)) return { ...r, retryOf: was };
      }
    }
    const others = list.map((e, i) => [e, i]).filter(([, i]) => i !== step.ex);
    const sibs = others.filter(([e]) => e.fact === orig.fact && e.type === orig.type);
    const sameType = others.filter(([e]) => e.type === orig.type);
    const from = sibs.length ? sibs : sameType;
    if (from.length) { const [e, i] = pickR(from, rng); return { ...resolve(e, rng), item: item.id, ex: i, retryOf: was }; }
    return { ...step, retryOf: was };
  }
  const others = Object.values(step.others || {});
  if (step.gen === "defToTerm") {
    // Asked the other way round: the term, and its meaning among the meanings of the same wrong terms.
    const defs = others.filter((o) => o.def.length <= 150).slice(0, 2);
    const w = termWordIn(item.term, item.defPlain);
    if (defs.length === 2 && item.defPlain.length <= 170 && (!w || defs.some((d) => termWordIn(w, d.def)))) {
      return { type: "choice", gen: "termToDef", item: item.id, term: item.term, prompt: "What does this mean?", correct: item.defPlain, wrong: defs.map((d) => d.def), long: true,
        others: Object.fromEntries(defs.map((d) => [d.def, d])), retryOf: was };
    }
  }
  if (step.gen === "termToDef") {
    const quote = termPrompt(item);
    const w = quote && termWordIn(item.term, quote);
    if (quote && others.length >= 2 && (!w || others.some((o) => termWordIn(w, o.term)))) {
      return { type: "choice", gen: "defToTerm", item: item.id, quote, prompt: "Which term matches?", correct: item.term, wrong: others.map((o) => o.term), termOptions: true,
        others: Object.fromEntries(others.map((o) => [o.term, o])), retryOf: was };
    }
  }
  if (step.gen === "gaps") return { ...step, chips: shuffleR(step.chips, rng), retryOf: was };
  return { ...step, retryOf: was };
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
export function levelSession(model, level, { seed, need = () => -1, miss = () => null } = {}) {
  const rng = makeRng(seed);
  const lesson = model.lessons.find((l) => l.n === level.lesson);
  const met = metItems(model, level);
  const metHere = met.filter((x) => x.lesson === level.lesson);
  // Term questions only use terms the student has met: this level's, else this lesson's so far.
  const pool = metHere.length >= 4 ? metHere : met;
  const steps = [];
  const rest = [];
  const firstBlock = [];
  const spare = new Map();
  level.items.forEach((item, i) => {
    const authored = shuffleR(authoredExercises(item, rng), rng);
    const generic = genericExercises(item, level.items.length >= 4 ? level.items : pool, rng, { met });
    // Alternate which term question comes first, so a level has both kinds.
    if (generic.length > 1 && (i % 2 === 1) !== (rng() < 0.2)) generic.reverse();
    const take = (e) => { authored.splice(authored.indexOf(e), 1); return e; };
    // First question: the term's core question (practice.js `core`: the slides' key Predict-It),
    // else a hands-on one, else any. It is never dropped.
    const core = authored.find((e) => e.core);
    const hands = bestHandsOn(authored);
    const first = core ? take(core) : hands ? take(hands) : authored.shift() || generic.shift();
    // Second: a skill always gets a hands-on task too (move a cell, merge, freeze…), also never
    // dropped. Otherwise a term question for every other item, another hands-on one for the rest.
    let second, keep = false;
    const more = bestHandsOn(authored);
    if (item.kind === "action" && !isHandsOn(first) && more) { second = take(more); keep = true; }
    else if (more && PRODUCTION.has(more.type) && !PRODUCTION.has(first.type)) second = take(more); // type, drag, press or order it
    else second = i % 2 === 0 ? generic.shift() || authored.shift() : (more ? take(more) : authored.shift()) || generic.shift();
    firstBlock.push({ type: "learn", item: item.id }, first);
    if (second) rest.push(keep ? { ...second, keep: true } : second);
    spare.set(item, [...generic, ...authored]);
  });
  // A matching game when the level has enough short definitions.
  const m = matchExercise(level.items, rng);
  if (m) rest.push(m);
  // Too many? Drop "which term matches?" questions first (the matching game covers them), then
  // the last one that isn't a skill's hands-on task.
  while (level.items.length + rest.length > LEVEL_MAX) {
    let k = rest.findIndex((x) => x.gen === "defToTerm");
    if (k < 0) k = rest.findLastIndex((x) => !x.keep);
    if (k < 0) break;
    rest.splice(k, 1);
  }
  let count = level.items.length + rest.length;
  // Retrieval from earlier levels of this lesson (weakest first).
  const idx = lesson.levels.indexOf(level);
  const earlier = lesson.levels.slice(0, Math.max(0, idx)).flatMap((l) => l.items);
  const review = earlier.map((it) => [need(it.id) + rng(), it]).sort((a, b) => b[0] - a[0]).map((p) => p[1]);
  for (const it of review.slice(0, 2)) {
    if (count >= LEVEL_MAX) break;
    const ex = pickExercise(it, pool, rng, { met, miss: miss(it.id) });
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

/** Every item a student has met by the end of `level`: earlier lessons, then this lesson's levels up to it. */
export function metItems(model, level) {
  const out = model.items.filter((it) => it.lesson < level.lesson);
  const lesson = model.lessons.find((l) => l.n === level.lesson);
  for (const lv of lesson.levels) { out.push(...lv.items); if (lv.id === level.id) break; }
  return out;
}

/** A review: questions only, weakest/least-seen items first, plus one matching game. */
export function reviewSession(model, items, { seed, count = 12, need = () => -1, miss = () => null, match = true, met = null } = {}) {
  const rng = makeRng(seed);
  // Gap chips come from these items and earlier lessons (the sidebar Review passes the items seen so far).
  const first = Math.min(...items.map((x) => x.lesson));
  met = met || [...model.items.filter((x) => x.lesson < first), ...items];
  const ranked = items.map((it) => [(need(it.id) < 0 ? 4 : need(it.id)) + rng() * 4, it]).sort((a, b) => b[0] - a[0]).map((p) => p[1]);
  const chosen = ranked.slice(0, Math.min(count, ranked.length));
  const pool = items.length >= 4 ? items : model.items;
  const steps = chosen.map((it) => pickExercise(it, pool, rng, { met, miss: miss(it.id) })).filter(Boolean);
  // Every review has the student type a cell reference and a range, where its terms have them:
  // they swap in for a pick-an-answer question, so the review stays the same length.
  for (const type of ["gridName", "rangeName"]) {
    if (steps.some((s) => s.type === type)) continue;
    const it = shuffleR(items, rng).find((x) => (x.extra?.exercises || []).some((e) => e.type === type));
    if (!it) continue;
    const typed = pickR(authoredExercises(it, rng).filter((e) => e.type === type), rng);
    const k = steps.findIndex((s) => s.type === "choice" && !s.targeted && s.item !== it.id);
    if (k >= 0) steps[k] = typed; else if (steps.length < count) steps.push(typed);
  }
  // Short sessions get a second question on the weakest items.
  for (let i = 0; steps.length < Math.min(count, 8) && i < chosen.length; i++) {
    const ex = pickR(genericExercises(chosen[i], pool, rng, { met }), rng);
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
