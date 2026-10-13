// Content checker:  node tools/check_content.mjs
// Reads content/knowledge_lessonN.js exactly as the app does and checks that:
//  - every knowledge item of every ready lesson is in a level (and so gets a learn card),
//  - every term named in content/course.js and content/practice.js exists,
//  - every extra exercise names a `fact` that appears in its item's definition,
//    so no exercise can contradict (or drift from) the definition,
//  - answers are well formed (the right answer isn't also a wrong one, grid
//    references fit the grid, hotspot targets exist, steps, keys, fills),
//  - automatic revision prompts don't give away their own term,
//  - every level builds 8–12 questions (tried with 30 different shuffles).
// Exits 1 on errors; warnings are printed but don't fail.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const C = await import(path.join(ROOT, "js/course.js"));
const { screens } = await import(path.join(ROOT, "content/screens.js"));
const { TAB_MENU, fillValues } = await import(path.join(ROOT, "js/visuals.js"));
const { parseSel } = await import(path.join(ROOT, "js/grid.js"));

const errors = [], warnings = [];
const err = (m) => errors.push(m), warn = (m) => warnings.push(m);

// ------------------------------------------------------------ load knowledge
const knowledge = {};
for (const l of C.course.lessons.filter((x) => !x.comingSoon)) {
  const f = path.join(ROOT, `content/knowledge_lesson${l.n}.js`);
  if (!existsSync(f)) { err(`missing ${path.relative(ROOT, f)}: run tools/sync_content.sh`); continue; }
  try {
    knowledge[l.n] = Function(readFileSync(f, "utf8") + `\nreturn lesson${l.n}Knowledge;`)();
  } catch (e) { err(`can't read knowledge_lesson${l.n}.js: ${e.message}`); }
  const src = path.join(ROOT, `../spreadsheets/knowledge_lesson${l.n}.js`);
  if (existsSync(src) && readFileSync(src, "utf8") !== readFileSync(f, "utf8")) warn(`content/knowledge_lesson${l.n}.js differs from ../spreadsheets/: run tools/sync_content.sh`);
}
const model = C.buildModel(knowledge);
model.warnings.forEach((w) => (/isn't in knowledge|isn't listed/.test(w) ? err(w) : warn(w)));

// ------------------------------------------------------------ items
for (const l of model.lessons.filter((x) => !x.comingSoon)) {
  const seen = new Set();
  for (const it of l.items) {
    if (seen.has(it.term)) err(`lesson ${l.n}: "${it.term}" appears twice`);
    seen.add(it.term);
    if (!["identify", "action"].includes(it.kind)) err(`"${it.term}": kind must be identify or action`);
    if (!it.def || it.def.length < 8) err(`"${it.term}": definition is missing`);
    if (!it.extra) warn(`"${it.term}" has no extra practice (it still gets term/definition questions)`);
    const re = new RegExp(`\\b${it.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(it.prompt)) warn(`"${it.term}": its revision prompt contains the term itself: “${it.prompt}”`);
  }
  for (const lv of l.levels) if (lv.items.length < 2 || lv.items.length > 7) warn(`level ${lv.id} has ${lv.items.length} items (aim for 4–6)`);
}

// ------------------------------------------------------------ extra practice
const GRID_TYPES = new Set(["gridClick", "gridName", "gridRange", "rangeName", "gridMove"]);
const TYPES = new Set(["choice", "fill", "keys", "hotspot", "order", ...GRID_TYPES]);
const COMBOS = new Set(["ctrl+z", "ctrl+y", "delete", "enter"]);
const isRef = (r) => /^[A-Z][1-9]\d?$/.test(r);
for (const it of model.items) {
  const ex = it.extra;
  if (!ex) continue;
  if (ex.learn?.visual?.image && !screens[ex.learn.visual.image]) err(`"${it.term}" learn card: unknown screenshot ${ex.learn.visual.image}`);
  if (ex.learn?.visual?.highlight && !screens[ex.learn.visual.image]?.regions[ex.learn.visual.highlight]) err(`"${it.term}" learn card: unknown highlight ${ex.learn.visual.highlight}`);
  (ex.exercises || []).forEach((e, i) => {
    const where = `"${it.term}" exercise ${i + 1} (${e.type})`;
    if (!TYPES.has(e.type)) return err(`${where}: unknown type`);
    if (!e.fact) err(`${where}: needs a fact from the definition`);
    else if (!C.factIn(e.fact, it.def)) err(`${where}: fact “${e.fact}” is not in the definition “${it.defPlain}”`);
    const targets = [].concat(e.target ?? []);
    if (e.type === "choice") {
      if (!e.prompt || !e.correct || !Array.isArray(e.wrong) || e.wrong.length < 2) err(`${where}: needs prompt, correct and 2+ wrong answers`);
      if (e.wrong?.includes(e.correct)) err(`${where}: the right answer is also listed as wrong`);
      if (new Set(e.wrong).size !== e.wrong?.length) err(`${where}: duplicate wrong answers`);
    }
    if (e.type === "gridClick") targets.forEach((t) => { if (!(t === "handle" || /^col:[A-Z]$/.test(t) || /^row:\d+$/.test(t) || isRef(t))) err(`${where}: bad target ${t}`); });
    if (e.type === "gridName") targets.forEach((t) => { if (!isRef(t)) err(`${where}: bad cell ${t}`); });
    if (e.type === "gridRange" || e.type === "rangeName") targets.forEach((t) => { const b = parseSel(t); if (!b || b.kind !== "range" || !/^[A-Z]\d+:[A-Z]\d+$/.test(t) || t !== `${t.split(":")[0]}:${t.split(":")[1]}`) err(`${where}: bad range ${t}`); else if (t.split(":")[0] !== `${String.fromCharCode(65 + b.c1)}${b.r1}`) err(`${where}: write ranges first cell first (${t})`); });
    if (e.type === "gridMove") [...[].concat(e.from), ...[].concat(e.to)].forEach((t) => { if (!isRef(t)) err(`${where}: bad cell ${t}`); });
    if (e.type === "fill") {
      if (!Array.isArray(e.start) || e.start.length < 1 || e.start.length > 2 || !(e.end > e.start.length + 1)) err(`${where}: start must be 1 or 2 values and end bigger`);
      if (e.start.length === 1 && typeof e.start[0] === "string" && /\d|^(mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(e.start[0])) err(`${where}: Google Sheets turns “${e.start[0]}” into a series, not a copy: use a plain word`);
      if (e.start.length === 2 && fillValues(e.start, 1)[0] === e.start[1]) warn(`${where}: the pattern doesn't change`);
    }
    if (e.type === "keys") {
      if (!COMBOS.has(e.combo)) err(`${where}: combo must be one of ${[...COMBOS].join(", ")} (never browser shortcuts)`);
      if (!e.label || !Array.isArray(e.wrong) || e.wrong.length < 2 || e.wrong.includes(e.label)) err(`${where}: needs a label and 2+ different wrong answers (for touch screens)`);
    }
    if (e.type === "hotspot") {
      if (e.screen) {
        const s = screens[e.screen];
        if (!s) err(`${where}: unknown screen ${e.screen}`);
        else if (!s.regions[e.target]) err(`${where}: ${e.screen} has no region ${e.target}`);
        else if (Object.keys(s.regions).length < 3) err(`${where}: ${e.screen} needs 3+ regions to choose from`);
      } else if (e.ui) {
        const ok = e.ui.tabmenu ? TAB_MENU.includes(e.target) : e.ui.tabs ? ["+", "All sheets", ...e.ui.tabs.tabs].includes(e.target) : false;
        if (!ok) err(`${where}: ${e.target} isn't something you can tap in that picture`);
      } else err(`${where}: needs screen or ui`);
      if (!e.prompt) err(`${where}: needs a prompt`);
    }
    if (e.type === "order" && (!Array.isArray(e.steps) || e.steps.length < 2 || new Set(e.steps).size !== e.steps.length)) err(`${where}: needs 2+ different steps`);
  });
}
for (const [id, s] of Object.entries(screens)) {
  for (const [rid, r] of Object.entries(s.regions)) {
    const [x, y, w, h] = r.r;
    if (x < 0 || y < 0 || x + w > s.w || y + h > s.h) err(`screen ${id}: region ${rid} is outside the picture`);
  }
  if (!existsSync(path.join(ROOT, s.src))) err(`screen ${id}: missing ${s.src}`);
}

// ------------------------------------------------------------ sessions
const covered = new Set();
for (const l of model.lessons.filter((x) => !x.comingSoon)) {
  for (const lv of l.levels) {
    let min = 99, max = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const steps = C.levelSession(model, lv, { seed });
      const q = steps.filter((s) => s.type !== "learn").length;
      min = Math.min(min, q); max = Math.max(max, q);
      steps.filter((s) => s.type === "learn").forEach((s) => covered.add(s.item));
      for (const s of steps) if (!s.type) err(`level ${lv.id}: an empty step (seed ${seed})`);
    }
    if (min < C.LEVEL_MIN || max > C.LEVEL_MAX) err(`level ${lv.id}: ${min}–${max} questions (want ${C.LEVEL_MIN}–${C.LEVEL_MAX})`);
    console.log(`  ${lv.id.padEnd(5)} ${lv.title.padEnd(28)} ${String(lv.items.length).padStart(2)} new items · ${min === max ? min : `${min}–${max}`} questions`);
  }
  const rs = C.reviewSession(model, l.items, { seed: 1, count: 12 });
  console.log(`  ${l.review?.id.padEnd(5)} ${(l.review?.title || "").padEnd(28)} ${String(l.items.length).padStart(2)} items     · ${rs.length} questions`);
}
for (const it of model.items) if (!covered.has(it.id)) err(`"${it.term}" (lesson ${it.lesson}) never gets a learn card in any level`);

console.log(`\n${model.items.length} knowledge items in ${model.lessons.filter((x) => !x.comingSoon).length} ready lesson(s); ` +
  `${model.items.reduce((a, it) => a + (it.extra?.exercises?.length || 0), 0)} extra exercises.`);
if (warnings.length) console.log("\nWarnings:\n- " + warnings.join("\n- "));
if (errors.length) { console.log("\nERRORS:\n- " + errors.join("\n- ")); process.exit(1); }
console.log("\nContent OK.");
