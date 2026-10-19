// Content checker:  node tools/check_content.mjs
// Reads content/knowledge_lessonN.js exactly as the app does and checks that:
//  - every knowledge item of every ready lesson is in a level (and so gets a learn card),
//  - every term named in content/course.js and content/practice.js exists,
//  - every extra exercise names a `fact` that appears in its item's definition,
//    so no exercise can contradict (or drift from) the definition,
//  - answers are well formed (the right answer isn't also a wrong one, grid
//    references fit the grid, hotspot targets exist, steps, keys, fills),
//  - automatic revision prompts don't give away their own term, "Which term matches?"
//    never shows [[gaps]], and "Fill the gaps" has 2–3 wrong chips that are never right answers,
//  - every level builds 8–12 questions (tried with 30 different shuffles).
// Exits 1 on errors; warnings are printed but don't fail.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const C = await import(path.join(ROOT, "js/course.js"));
const { screens } = await import(path.join(ROOT, "content/screens.js"));
const { TAB_MENU, fillValues, isDay, dataMenuHits, sortWindowHits, drawnHits } = await import(path.join(ROOT, "js/visuals.js"));
const { chartHits } = await import(path.join(ROOT, "js/charts.js"));
const { sortOptions, sortTies, rowsText } = await import(path.join(ROOT, "js/sort.js"));
const { parseSel } = await import(path.join(ROOT, "js/grid.js"));
// js/exercises.js needs a browser to load, so the fill-formula helpers are read straight from it.
const exSrc = readFileSync(path.join(ROOT, "js/exercises.js"), "utf8");
const fillHelpers = exSrc.slice(exSrc.indexOf("const FREF_RE"), exSrc.indexOf("function fillFormula("));
const { fillFormulaOptions } = Function("colLetter", "colIndex", fillHelpers.replace(/export /g, "") + "\nreturn { fillFormulaOptions };")(
  (c) => String.fromCharCode(65 + c), (L) => L.toUpperCase().charCodeAt(0) - 65);

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
const TYPES = new Set(["choice", "chartChoice", "gridMulti", "fill", "fillFormula", "sortPredict", "keys", "hotspot", "order", "formula", "lockRef", ...GRID_TYPES]);
/** A drawn chart must be drawable and say what it shows. */
function checkChart(c, where) {
  if (!["pie", "column", "bar"].includes(c.type)) return err(`${where}: chart type must be pie, column or bar`);
  if (!Array.isArray(c.labels) || !Array.isArray(c.series) || !c.series.length) return err(`${where}: a chart needs labels and series`);
  if (c.type === "pie" && c.series.length !== 1) err(`${where}: a pie chart shows one set of numbers`);
  for (const sr of c.series) if (!Array.isArray(sr.values) || sr.values.length !== c.labels.length || sr.values.some((v) => typeof v !== "number" || v < 0)) err(`${where}: series ${sr.name} needs one number per label`);
  if (c.labels.length > 6 || c.series.length > 6) err(`${where}: 6 labels and 6 series at most (6 colours and patterns)`);
}
const COMBOS = new Set(["ctrl+z", "ctrl+y", "delete", "enter", "ctrl+`"]);
const isRef = (r) => /^[A-Z][1-9]\d?$/.test(r);
for (const it of model.items) {
  const ex = it.extra;
  if (!ex) continue;
  for (const t of [...(ex.confusable || []), ...Object.keys(ex.contrast || {})]) if (!model.items.some((x) => x.term === t)) err(`"${it.term}": confusable/contrast names "${t}", which isn't a term`);
  const answers = C.blanksOf(it.def).map((a) => a.toLowerCase());
  if (ex.gapChips && (!answers.length || ex.gapChips.some((c) => answers.includes(c.toLowerCase())))) err(`"${it.term}": gapChips need [[gaps]] and must never be a right answer`);
  const lv = ex.learn?.visual;
  for (const [id] of lv?.icons || []) if (!existsSync(path.join(ROOT, `assets/screens/${id}.webp`))) err(`"${it.term}" learn card: missing assets/screens/${id}.webp`);
  if (lv?.image && !screens[lv.image]) err(`"${it.term}" learn card: unknown screenshot ${lv.image}`);
  else if (lv?.highlight && !(screens[lv.image]?.drawn ? drawnHits(screens[lv.image].drawn).includes(lv.highlight) : screens[lv.image]?.regions[lv.highlight])) err(`"${it.term}" learn card: unknown highlight ${lv.highlight}`);
  for (const c of [lv?.chart, ...(lv?.charts || [])].filter(Boolean)) checkChart(c, `"${it.term}" learn card`);
  (ex.exercises || []).forEach((e, i) => {
    const where = `"${it.term}" exercise ${i + 1} (${e.type})`;
    if (!TYPES.has(e.type)) return err(`${where}: unknown type`);
    if (!e.fact) err(`${where}: needs a fact from the definition`);
    else if (!C.factIn(e.fact, it.def)) err(`${where}: fact “${e.fact}” is not in the definition “${it.defPlain}”`);
    const targets = [].concat(e.target ?? []);
    for (const c of [e.visual?.chart, ...(e.visual?.charts || []), e.ui?.chart].filter(Boolean)) checkChart(c, where);
    if (e.visual?.image && !screens[e.visual.image]) err(`${where}: unknown picture ${e.visual.image}`);
    if (e.type === "chartChoice") {
      const all = [e.correct, ...(e.wrong || [])];
      if (!e.prompt || !e.correct || !Array.isArray(e.wrong) || e.wrong.length < 2) err(`${where}: needs prompt, a correct chart and 2+ wrong charts`);
      all.forEach((c, k) => { if (c) { checkChart(c, `${where} option ${k + 1}`); if (!c.desc) err(`${where}: option ${k + 1} needs a desc`); } });
      if (new Set(all.map((c) => c?.desc)).size !== all.length) err(`${where}: every option needs a different desc`);
      if (new Set(all.map((c) => JSON.stringify({ ...c, desc: 0, caption: 0 }))).size !== all.length) err(`${where}: two options draw the same chart`);
    }
    if (e.type === "gridMulti") {
      const t = e.target || [];
      const boxes = t.map((r) => parseSel(r));
      if (t.length !== 2 || boxes.some((b) => !b || b.kind !== "range")) err(`${where}: target must be two ranges`);
      else {
        const [a, b] = boxes;
        const touch = a.c1 <= b.c2 + 1 && b.c1 <= a.c2 + 1 && a.r1 <= b.r2 + 1 && b.r1 <= a.r2 + 1;
        if (touch) err(`${where}: the two ranges touch, so one drag would do: no Ctrl needed`);
        if (!e.grid || boxes.some((x) => x.c2 >= (e.grid.cols || 0) || x.r2 > (e.grid.rows || 0))) err(`${where}: the grid must include both ranges`);
      }
      if (!e.prompt) err(`${where}: needs a prompt`);
    }
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
      if (e.start.length === 1 && isDay(e.start[0]) && it.term === "fill to copy") err(`${where}: a day name carries on (Monday, Tuesday…): it isn't a copy`);
      if (e.start.length === 1 && typeof e.start[0] === "string" && !isDay(e.start[0]) && /\d|^(mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(e.start[0])) err(`${where}: Google Sheets turns “${e.start[0]}” into a series, not a copy: use a plain word`);
      if (e.start.length === 2 && fillValues(e.start, 1)[0] === e.start[1]) warn(`${where}: the pattern doesn't change`);
    }
    if (e.type === "keys") {
      if (!COMBOS.has(e.combo)) err(`${where}: combo must be one of ${[...COMBOS].join(", ")} (never browser shortcuts)`);
      if (!e.label || !Array.isArray(e.wrong) || e.wrong.length < 2 || e.wrong.includes(e.label)) err(`${where}: needs a label and 2+ different wrong answers (for touch screens)`);
    }
    if (e.type === "hotspot") {
      if (e.screen && screens[e.screen]?.drawn) {
        if (!drawnHits(screens[e.screen].drawn).includes(e.target)) err(`${where}: ${e.target} isn't something you can tap in the drawn ${e.screen}`);
      } else if (e.screen) {
        const s = screens[e.screen];
        if (!s) err(`${where}: unknown screen ${e.screen}`);
        else if (!s.regions[e.target]) err(`${where}: ${e.screen} has no region ${e.target}`);
        else if (Object.keys(s.regions).length < 3) err(`${where}: ${e.screen} needs 3+ regions to choose from`);
      } else if (e.ui) {
        const heads = (n, col) => Array.from({ length: n }, (_, i) => (col ? String.fromCharCode(65 + i) : String(i + 1)));
        const lines = (h) => [...h, ...h.slice(1).map((x, i) => `${h[i]}|${x}`)];
        const ok = e.ui.chart ? chartHits(e.ui.chart).includes(e.target) : e.ui.dataMenu ? dataMenuHits(e.ui.dataMenu).includes(e.target) : e.ui.sortWindow ? sortWindowHits(e.ui.sortWindow).includes(e.target)
          : e.ui.tabmenu ? TAB_MENU.includes(e.target) : e.ui.tabs ? ["+", "All sheets", ...e.ui.tabs.tabs].includes(e.target)
          : e.ui.colheads ? lines(heads(e.ui.colheads.n || 4, true)).includes(e.target) : e.ui.rowheads ? lines(heads(e.ui.rowheads.n || 4, false)).includes(e.target) : false;
        if (!ok) err(`${where}: ${e.target} isn't something you can tap in that picture`);
      } else err(`${where}: needs screen or ui`);
      if (!e.prompt) err(`${where}: needs a prompt`);
    }
    if (e.type === "formula") {
      if (!e.prompt || !Array.isArray(e.accept) || !e.accept.length) err(`${where}: needs a prompt and accepted answers`);
      (e.accept || []).forEach((a) => { if (!/^=[A-Z0-9:()+\-*/.$]+$/.test(a)) err(`${where}: accepted answer ${a} must start with = and use + - * / only`); });
    }
    if (e.type === "lockRef") {
      const refs = (e.formula || "").match(/[A-Z]\d+/g) || [];
      if (!e.prompt || !/^=/.test(e.formula || "") || /\$/.test(e.formula)) err(`${where}: needs a prompt and a formula starting with =, without $`);
      if (refs.length < 2 || new Set(refs).size !== refs.length) err(`${where}: the formula needs 2+ different references`);
      if (!Array.isArray(e.lock) || !e.lock.length || e.lock.some((r) => !refs.includes(r))) err(`${where}: lock must list references from the formula`);
      if (e.lock?.length === refs.length) err(`${where}: at least one reference must stay relative`);
    }
    if (e.type === "fillFormula") {
      const sameLine = isRef(e.from || "") && isRef(e.to || "") && (e.from[0] === e.to[0]) !== (e.from.slice(1) === e.to.slice(1));
      if (!sameLine) err(`${where}: from and to must be two cells in the same row or the same column`);
      else if (e.to[0] < e.from[0] || +e.to.slice(1) < +e.from.slice(1)) err(`${where}: fill right or down only (from ${e.from} to ${e.to})`);
      else if (!/^=[A-Z0-9:()+\-*/.$]+$/.test(e.formula || "") || !/[A-Z]\d/.test(e.formula)) err(`${where}: formula must start with = and hold a reference`);
      else {
        const o = fillFormulaOptions(e.formula, e.from, e.to);
        if (!o.correct) err(`${where}: the filled formula goes off the sheet`);
        if (o.wrong.length < 3) err(`${where}: only ${o.wrong.length} wrong options can be worked out`);
        if (o.wrong.includes(o.correct)) err(`${where}: a wrong option equals the right one`);
        const cols = e.grid?.cols || 0, rows = e.grid?.rows || 0, last = parseSel(e.to);
        if (!e.grid || last.c1 >= cols || last.r1 > rows) err(`${where}: the grid must include ${e.to}`);
        if (e.grid?.cells?.[e.from] != null) err(`${where}: leave ${e.from} out of the grid cells (the formula goes there)`);
      }
    }
    if (e.type === "sortPredict") {
      const n = e.head?.length || 0;
      const dirOk = (d) => d === "az" || d === "za";
      if (!Array.isArray(e.head) || n < 2 || n > 3 || new Set(e.head).size !== n) err(`${where}: head must be 2–3 different headings`);
      else if (!Array.isArray(e.rows) || e.rows.length < 3 || e.rows.length > 5 || e.rows.some((r) => !Array.isArray(r) || r.length !== n)) err(`${where}: rows must be 3–5 rows of ${n} values`);
      else if (!e.head.includes(e.by) || !dirOk(e.dir)) err(`${where}: by must be a heading and dir "az" or "za"`);
      else if (e.then && (!e.head.includes(e.then.by) || e.then.by === e.by || !dirOk(e.then.dir))) err(`${where}: then must name another heading and a dir`);
      else {
        for (const c of [e.by, e.then?.by].filter(Boolean)) {
          const kinds = new Set(e.rows.map((r) => typeof r[e.head.indexOf(c)]));
          if (kinds.size > 1) err(`${where}: column ${c} mixes numbers and text`);
        }
        const ties = sortTies(e);
        if (ties.length) err(`${where}: rows tie on the sort ${e.then ? "columns" : "column"} (${ties.join("; ")}), so the order isn't certain`);
        if (!e.then && new Set(e.rows.map((r) => String(r[e.head.indexOf(e.by)]).toLowerCase())).size !== e.rows.length) err(`${where}: values in ${e.by} must all differ`);
        const o = sortOptions(e);
        if (o.wrong.length < 3) err(`${where}: only ${o.wrong.length} wrong options can be worked out`);
        // The start must look clearly unsorted: not already in order, and not one swap away from it.
        const moved = o.correct.filter((r, i) => rowsText([r]) !== rowsText([e.rows[i]])).length;
        if (moved === 0) err(`${where}: the rows are already in the sorted order: mix them up`);
        else if (moved === 2) err(`${where}: the sorted order is just one swap away from the start: mix the rows up more`);
      }
    }
    if (e.why != null && (typeof e.why !== "string" || e.why.length < 10)) err(`${where}: why must be a sentence`);
    if (e.tips && (e.type !== "hotspot" || Object.keys(e.tips).some((k) => k === e.target))) err(`${where}: tips are for the wrong areas of a hotspot`);
    if (e.type === "order" && (!Array.isArray(e.steps) || e.steps.length < 2 || new Set(e.steps).size !== e.steps.length)) err(`${where}: needs 2+ different steps`);
  });
}
for (const [id, s] of Object.entries(screens)) {
  if (s.drawn) {
    // Drawn stand-ins that are tapped (hotspots) need 3+ parts; ones only shown need none.
    const tapped = model.items.some((it) => (it.extra?.exercises || []).some((e) => e.type === "hotspot" && e.screen === id));
    if (tapped && drawnHits(s.drawn).length < 3) err(`screen ${id}: the drawn picture needs 3+ parts to tap`);
    if (!s.alt) err(`screen ${id}: needs alt text`);
    continue;
  }
  for (const [rid, r] of Object.entries(s.regions)) {
    const [x, y, w, h] = r.r;
    if (x < 0 || y < 0 || x + w > s.w || y + h > s.h) err(`screen ${id}: region ${rid} is outside the picture`);
  }
  if (!existsSync(path.join(ROOT, s.src))) err(`screen ${id}: missing ${s.src}`);
}

// ------------------------------------------------------------ automatic questions
for (const l of model.lessons.filter((x) => !x.comingSoon)) {
  for (const it of l.items) {
    for (let seed = 1; seed <= 10; seed++) {
      for (const g of C.genericExercises(it, l.items, C.makeRng(seed))) {
        if (g.gen === "defToTerm") {
          if (/\[\[|\]\]|_{3,}/.test(g.quote)) err(`"${it.term}": "Which term matches?" would show gaps: “${g.quote}”`);
          if (!it.review && C.blanksGiveAway(it)) err(`"${it.term}": "Which term matches?" would give the term away`);
        }
        if (g.gen === "gaps") {
          const blanks = C.blanksOf(it.def);
          if (g.answers.length !== blanks.length) err(`"${it.term}": fill-the-gaps has the wrong number of answers`);
          const wrong = g.chips.filter((c) => !g.answers.map((a) => a.toLowerCase()).includes(c.toLowerCase()));
          if (wrong.length < 2 || wrong.length > 3) err(`"${it.term}": fill-the-gaps needs 2–3 wrong chips (has ${wrong.length})`);
          if (new Set(wrong.map((w) => w.toLowerCase())).size !== wrong.length) err(`"${it.term}": fill-the-gaps has the same wrong chip twice`);
          if (g.chips.length > 9) err(`"${it.term}": fill-the-gaps has more than 9 chips (keys 1–9)`);
          if (g.chips.length !== g.answers.length + wrong.length) err(`"${it.term}": a wrong chip equals a right answer`);
        }
      }
    }
    if (!C.blanksOf(it.def).length && !C.termPrompt(it)) warn(`"${it.term}": no "Which term matches?" (its definition names the term) and no gaps to fill`);
  }
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
      for (const s of steps) if (s.gen === "defToTerm" && /\[\[|_{3,}/.test(s.quote)) err(`level ${lv.id}: "Which term matches?" with gaps`);
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
