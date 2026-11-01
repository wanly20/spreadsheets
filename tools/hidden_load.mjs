// Hidden load: what a level's learn cards and questions use, compared with what
// the level (and the levels before it) teach. A level claims to teach its listed
// terms; everything else it names should already be taught, or be something a
// Year 7 student knows before the unit starts (ASSUMED_KNOWN below).
//
// Used by tools/check_content.mjs (always; `--load` prints every level in full).
//
// How it works
//  - THINGS is a catalogue of what can be named: every Knowledge Bank term (with
//    the words that point to it), Google Sheets menus, menu items and buttons,
//    function names (SUM…), syntax (=formula, A1:B3, $A$1, 10%, brackets) and
//    keyboard shortcuts. Each has `by`: the term that teaches it, or null.
//  - A thing is TAUGHT at the level of its `by` term. A thing with no term of its
//    own (a menu, a shortcut, a gesture) is taught at the first level whose
//    Knowledge Bank text (term + definition + review) names it: "File → Settings"
//    is taught where the locale definition says it.
//  - A level's ITEMS are scanned: its terms' learn cards (note, captions, keys,
//    steps, formulas shown), every exercise (prompt, hint, options, steps, why,
//    tips, the hotspot answer's label, the formula it shows or wants), contrast
//    texts, gap chips, and the automatic questions actually built for the level
//    (30 shuffles: their wrong terms, definitions and chips). A hotspot tip is
//    shown only after the student taps that very area, so naming what is on that
//    area of the real screenshot ("That's Text rotation…") is fine.
//  - A FLAG is an item that names a thing taught in a later level, or never.
//    Flags in content/practice.js, screens.js or course.js are errors (fix the
//    wording, or add it to ALLOW with a reason). Flags in a Knowledge Bank
//    definition, in the automatic questions or in what js/exercises.js always
//    shows are warnings: the fix is in the xlsx or the code.
//  - NEW THINGS per level = its terms + the things it uses for the first time
//    that none of its terms teaches (hidden extras). Over 6 is a warning.

/**
 * Known before the unit starts, so never flagged (and not in THINGS at all):
 *  - mouse, touch and keyboard basics: click, double-click, tap, drag, hover, scroll, select,
 *    type, press; the keys Enter, Shift, Space, Esc, Backspace, the letter and number keys,
 *    and Shift + a key to type a sign (Shift + 8 types *): typing, not a shortcut;
 *  - computer words: screen, button, menu (in general), toolbar, window, box, tick box, list,
 *    file, tab (of a window), icon, cursor, Windows, Chromebook, Google Sheets;
 *  - maths: numbers and decimals, + − × ÷, total, add up, average/mean, highest/lowest,
 *    percentages as maths (26.6% of the players), money ($2, $7.50), decimal places;
 *  - data words: data, table, heading, value, text, word, name, list, grid, box, line;
 *  - everyday words for where and how things look: top, bottom, left, right, middle, centre,
 *    background, colour, bigger, smaller, wider, taller.
 * cell, row, column and spreadsheet are NOT assumed: they are taught in level 1-1, the first level.
 */
export const ASSUMED_KNOWN = [
  "click", "double-click", "tap", "drag", "hover", "scroll", "select", "type", "press",
  "Enter", "Shift", "Space", "Esc", "Backspace", "Shift + a key (typing a sign)",
  "screen", "button", "menu", "toolbar", "window", "box", "tick box", "list", "file", "icon", "cursor",
  "Windows", "Chromebook", "Google Sheets",
  "numbers", "decimals", "+ − × ÷", "total", "average (maths)", "highest", "lowest", "% (maths)", "money ($)", "decimal places",
  "data", "table", "heading", "value", "text", "grid",
  "top, bottom, left, right, middle, centre", "background", "colour",
];

/**
 * Accepted on purpose: a level may name these early. Keep this short, with the reason.
 * { level, thing, why }
 */
export const ALLOW = [
  { level: "1-5", thing: "Copy to, Protect, Hide sheet (tab menu)", why: "Copy to sits right under Duplicate in the real tab menu, and is the one students mix it up with; the Duplicate hotspot and its learn card say what it does." },
  { level: "2-2", thing: "the bar above the grid", why: "Format vs value needs a way to see what a cell really holds; the card says where the bar is. Lesson 3 names it with formula." },
];

// [id, regex, taught by (term) or null, kind, exact option texts that also mean it]
// Order matters: the more specific ones first, and each match is removed from the
// text, so "conditional formatting" isn't also read as "formatting".
const T = (id, re, by, kind, exact = []) => ({ id, re: new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"), by, kind, exact });
export const THINGS = [
  // ---------------------------------------------------------------- syntax (scanned in formulas)
  T("a function name other than SUM, MAX, MIN, AVERAGE", /=(?!SUM\(|MAX\(|MIN\(|AVERAGE\()[A-Z]{2,}\(/, null, "function"),
  T("brackets in a formula", /=[^\s]*?(?<![A-Z])\(/, "order of operations", "syntax"),
  T("$ in a reference ($B$1)", /\$[A-Z]{1,2}\$?\d+|\b[A-Z]{1,2}\$\d+/, "absolute reference", "syntax"),
  T("* or / in a formula", /=[A-Z0-9:().$+\-]*[*/]/, "operators", "syntax"),
  T("a formula (=…)", /(?:^|[\s(“"'‘:,])=(?=[A-Z(0-9$])|starts with =|\bthe =/, "formula", "syntax"),
  T("a range (A1:B3)", /\b[A-Z]{1,2}\d+:[A-Z]{1,2}\d+\b|\bfirst:last\b/, "range", "syntax"),
  T("a % value in a cell (10%)", /(?<![.\d])\d{1,3}%(?! of the| of all| share)/, "percentage in a cell", "syntax"),
  // ---------------------------------------------------------------- keys
  T("hold Ctrl (a second range)", /\bhold(?:ing)? (?:<b>)?Ctrl\b|\bCtrl\b(?! ?\+)/, "select two separate ranges", "key"),
  T("press F4", /press (?:<b>)?F4\b/, null, "key"),
  T("the Delete key", /\b(?:press(?:es|ed)?|the) Delete\b(?! row| column)|\bDelete key\b|\bDelete alone\b/, "clear cell contents", "key", ["Delete", "Press Delete", "press Delete"]),
  // Ctrl/Alt + key: each combo is its own thing (COMBO_RE, COMBO_BY below).
  // ---------------------------------------------------------------- menus and the menu bar
  T("the File menu", /\bFile(?: →| menu)/, null, "menu", ["File"]),
  T("the Edit menu", /\bEdit(?: →| menu)/, null, "menu", ["Edit"]),
  T("the View menu", /\bView(?: →| menu)/, null, "menu", ["View"]),
  T("the Insert menu", /\bInsert(?: →| menu)/, null, "menu", ["Insert"]),
  T("the Format menu", /\bFormat(?: →| menu)/, null, "menu", ["Format"]),
  T("the Data menu", /\bData(?: →| menu)/, null, "menu", ["Data"]),
  T("the Tools, Extensions or Help menu", /\b(?:Tools|Extensions|Help)(?: →| menu)/, null, "menu"),
  T("File → Settings", /\bSettings\b/, null, "ui"),
  T("the Time zone setting", /\bTime zone\b/, null, "ui"),
  T("Format → Number", /→ Number\b|\bNumber →|Point to Number|\bNumber \(in the Format menu\)/, null, "ui"),
  T("Custom date and time", /Custom date and time/, "date format", "ui"),
  T("Date time, Time, Duration (Number formats)", /\bDate time\b|\bDuration\b/, null, "ui", ["Time", "Date time", "Duration"]),
  T("Currency rounded, Accounting, Plain text (Number formats)", /Currency rounded|\bAccounting\b|Plain text/, null, "ui", ["Plain text"]),
  T("Percent (Format → Number)", /\bPercent\b|Format as percent/, "percentage format", "ui"),
  T("Insert 1 row/column (row or column menu)", /Insert 1 (?:row|column)|\binsert(?:s|ed|ing)? (?:a |an empty |1 |one )?(?:new )?(?:row|column)s?\b/i, "insert row/column", "ui"),
  T("Delete row / Delete column", /\bDelete (?:row|column)\b|\bdelet(?:e|es|ed|ing) (?:a |the |the whole |row \d+|column [A-Z])?\s?(?:row|column)s?\b/i, "delete a row or column", "ui", ["Delete row, or Delete column"]),
  T("Clear row, Hide row, Resize row (row menu)", /\b(?:Clear|Hide|Resize(?: the)?) (?:row|column)s?\b/i, null, "ui"),
  T("Zoom, Group, Show, Full screen (View menu)", /\bFull screen\b/, null, "ui", ["Zoom", "Group", "Show", "Full screen", "Comments"]),
  T("Alternating colours, Clear formatting (Format menu)", /Alternating colou?rs|Clear formatting/, null, "ui"),
  T("Copy to, Protect, Hide sheet (tab menu)", /\bCopy to\b|Protect the sheet|Hide sheet/, null, "ui"),
  T("Tab colour", /\bTab colou?r\b/, null, "ui"),
  T("Text rotation, Insert link, Print (toolbar)", /Text rotation|Insert link|\bPrint\b/, null, "ui"),
  T("Sort range, Advanced range sorting options", /Sort range|Advanced range sorting|sort window/i, "sort range", "ui"),
  T("Sort sheet, filters (Data menu)", /Sort sheet|Create a filter|filter view|\bslicer\b/i, null, "ui"),
  T("Add another sort column, then by", /Add another sort column|\bthen by\b|\bsort column\b/i, "sort by two columns", "ui"),
  T("Data has header row", /header row/i, "data has header row", "ui"),
  T("Insert chart (toolbar)", /Insert chart/, "chart", "ui"),
  T("⋮ (the chart's menu)", /⋮/, null, "ui"),
  T("Edit the chart", /Edit the chart/, "chart editor", "ui"),
  T("Move to own sheet", /own sheet/i, "move to own sheet", "ui"),
  T("Setup / Customise (chart editor tabs)", /\bSetup\b|\bCustomi[sz]e\b/, "chart editor", "ui"),
  T("Chart type", /Chart type/i, "chart editor", "ui"),
  T("Data range (chart editor)", /Data range/, "chart editor", "ui"),
  T("Chart and axis titles, Title text", /Chart and axis titles|Title text/i, "chart title", "ui"),
  T("Pie slice / Series (Customise)", /Pie slice|\bseries\b/i, "change a slice or series colour", "ui"),
  T("Switch rows/columns", /Switch rows ?\/ ?columns/i, "switch rows / columns", "ui"),
  T("Legend position and font size", /Legend font|\bPosition\b/, "legend", "ui"),
  T("Merge all", /Merge all/, "merge cells", "ui"),
  T("Duplicate (tab menu)", /\bDuplicate\b/, "duplicate a sheet", "ui"),
  T("Change colour (tab menu)", /Change colou?r/, "colour a sheet tab", "ui"),
  T("Move right / Move left (tab menu)", /Move (?:right|left)/, "move a sheet", "ui"),
  T("the + (add a sheet)", /\bthe \+(?!\w)|\+ at the bottom|\+ button|Add (?:a )?new sheet|Add a sheet/i, "insert a sheet", "ui", ["Click the +"]),
  T("the formula bar (by that name)", /formula bar/i, "formula", "ui"),
  T("the bar above the grid", /bar above the grid|\bnext to fx\b/i, null, "ui"),
  T("the Name Box", /Name Box/, "Name Box", "ui"),
  T("paint format (the paint roller)", /paint format|paint roller/i, "paint format", "ui"),
  T("the decimal places buttons", /(?:fewer|more) decimals|decimal places? buttons?|(?:Decrease|Increase) decimal/i, "decimal places buttons", "ui"),
  T("the % button", /% button|click(?:ed|s)? %|Click %/, "percentage format", "ui"),
  T("Currency format", /[Cc]urrency format|\bCurrency\b|Format as currency|currency button/, "currency format", "ui", ["Currency"]),
  T("Date format", /Format → Number → Date|\bDate format\b/i, "date format", "ui", ["Date"]),
  // ---------------------------------------------------------------- terms (and the words that point to them)
  T("conditional formatting", /conditional formatting|\brule\b(?=[^.]*\b(?:green|true|→))|“3 or more → green”/i, "conditional formatting", "term"),
  T("cell reference", /\bcell references?\b/i, "cell reference", "term"),
  T("fill handle", /fill handle/i, "fill handle", "term"),
  T("fill colour", /fill colou?r|paint bucket/i, "fill colour", "term"),
  T("fill a formula (down)", /\bfill(?:ed|s|ing)? (?:it |them |the formula |a formula )?down\b|fill a formula|filling down/i, "fill a formula", "term"),
  T("fill across (right)", /\bfill(?:ed|s|ing)? (?:it |a formula |the formula )?(?:across|right|to the right)\b/i, "fill across", "term"),
  T("show formulas", /show(?:ing)? (?:every )?formulas?|formulas (?:are )?showing|Formulas are showing|with the formulas showing/i, "show formulas", "term"),
  T("formula", /\bformulas?\b/i, "formula", "term"),
  T("function", /\bfunctions?\b/i, "function", "term"),
  T("SUM", /\bSUM\b/, "SUM", "term"),
  T("MAX", /\bMAX\b/, "MAX", "term"),
  T("MIN", /\bMIN\b/, "MIN", "term"),
  T("AVERAGE", /\bAVERAGE\b/, "AVERAGE", "term"),
  T("operators", /\boperators?\b/i, "operators", "term"),
  T("relative reference", /\brelative\b/i, "relative reference", "term"),
  T("absolute (locked) reference", /\babsolute\b|\block(?:ed|s|ing)?\b|\bunlock/i, "absolute reference", "term"),
  T("order of operations", /order of operations/i, "order of operations", "term"),
  T("Name Box", /\bName Box\b/, "Name Box", "term"),
  T("range", /\branges?\b/i, "range", "term"),
  T("undo", /\bundo\b/i, "undo", "term"),
  T("redo", /\bredo\b/i, "redo", "term"),
  T("move cells", /hover (?:over )?the edge|\bthe edge\b/i, "move cells", "term"),
  T("text formatting (font, size, bold)", /\bbold\b|\bfonts?\b|font size|font colou?r/i, "text formatting", "term"),
  T("borders", /\bborders?\b/i, "borders", "term"),
  T("formatting", /\bformat(?:ting|s|ted)?\b/i, "select, then apply", "term"),
  T("sheet / tab / workbook", /\b(?:work)?sheets?\b|\bworkbook\b|(?<!(?:Setup|Customise|General|Calculation|Settings) )\btabs?\b/i, "sheet", "term"),
  T("rename", /\brenam(?:e|ed|es|ing)\b/i, "rename a sheet", "term"),
  T("two-finger tap / right-click", /two-finger tap|right-click/i, null, "term"),
  T("column width", /column width|line between (?:two )?column letters|line between columns/i, "column width", "term"),
  T("row height", /\brow height\b|line between (?:two )?row numbers|line under (?:its|a row's) (?:row )?number/i, "row height", "term"),
  T("default", /\bdefaults?\b/i, "default", "term"),
  T("vertical alignment", /vertical(?:ly)? align/i, "vertical alignment", "term"),
  T("horizontal alignment", /horizontal(?:ly)? align/i, "horizontal alignment", "term"),
  T("alignment", /\balign(?:ment|ed)?\b/i, "vertical alignment", "term"),
  T("text wrapping (Overflow, Wrap, Clip)", /\bwrap(?:s|ping|ped)?\b|\bClip\b|\bOverflow\b/i, "text wrapping", "term"),
  T("merge cells", /\bmerg(?:e|ed|es|ing)\b/i, "merge cells", "term"),
  T("locale", /\blocale\b/i, "locale", "term"),
  T("freeze", /\bfr(?:eeze|ozen|eezing|eezes)\b/i, "freeze", "term"),
  T("sort (A to Z, Z to A)", /\bsort(?:s|ed|ing)?\b|A to Z|Z to A|\bascending\b|\bdescending\b/i, "sort", "term"),
  T("column chart / bar chart", /column charts?|bar charts?/i, "column chart vs bar chart", "term"),
  T("pie chart (slices)", /\bpie\b|\bslices?\b/i, "pie chart", "term"),
  T("chart editor", /chart editor/i, "chart editor", "term"),
  T("chart title", /chart title/i, "chart title", "term"),
  T("legend", /\blegend\b/i, "legend", "term"),
  T("axis titles (x-axis, y-axis)", /\baxis\b|\baxes\b|x-axis|y-axis/i, "axis titles", "term"),
  T("titles (of a chart or its axes)", /\btitles?\b/i, "chart title", "term"),
  T("move and resize a chart", /\bresiz/i, "move and resize a chart", "term"),
  T("chart", /\bcharts?\b/i, "chart", "term"),
];

/** Ctrl / Alt + a key: "Ctrl + Z". Each combo is a thing of its own: taught by its term, or where the Knowledge Bank first says it. */
const COMBO_RE = /\b(Ctrl|Alt) ?\+ ?(`|[A-Za-z0-9]+)/g;
const COMBO_BY = { "Ctrl + Z": "undo", "Ctrl + Y": "redo", "Ctrl + `": "show formulas" };
const comboId = (mod, key) => `${mod} + ${key.length === 1 ? key.toUpperCase() : key}`;
const KEY_COMBO = { "ctrl+z": "Ctrl + Z", "ctrl+y": "Ctrl + Y", "ctrl+`": "Ctrl + `", delete: "the Delete key", enter: null };

/** Text as a student reads it: no HTML, no [[ ]], no product name. */
const clean = (s) => String(s ?? "")
  .replace(/<[^>]+>/g, "").replace(/\[\[(.+?)\]\]/g, "$1")
  .replace(/[‘’]/g, "'").replace(/\bGoogle Sheets\b|\bSheets\b(?= (?:says|starts|knows|turns))/g, "GS");

/** The things named in a piece of text (and, for an option or chip, its exact wording). */
export function thingsIn(text, { exact = false } = {}) {
  let s = clean(text);
  const out = new Set();
  if (exact) for (const t of THINGS) if (t.exact.includes(s.trim())) { out.add(t.id); return out; }
  for (const m of s.matchAll(COMBO_RE)) out.add(comboId(m[1], m[2]));
  s = s.replace(COMBO_RE, " ");
  for (const t of THINGS) {
    t.re.lastIndex = 0;
    // Syntax is read without removing it (=B2*C2 is a formula AND uses *); words are removed once read.
    if (t.re.test(s)) { out.add(t.id); t.re.lastIndex = 0; if (t.kind !== "syntax") s = s.replace(t.re, " "); }
  }
  return out;
}

const thingById = new Map(THINGS.map((t) => [t.id, t]));

/** Every piece of text an item shows, as [where, text, { exact, part }]. part: shown | option | feedback. */
function itemTexts(item, screens) {
  const out = [];
  const ex = item.extra;
  if (!ex) return out;
  const P = `practice.js "${item.term}"`;
  const add = (where, text, part = "shown", exact = false) => { if (text != null && text !== "") out.push([where, String(text), { part, exact }]); };
  const gridTexts = (where, g) => {
    if (!g) return;
    for (const v of Object.values(g.cells || {})) if (typeof v === "string" && /^=/.test(v)) add(where, v);
    if (typeof g.formula === "string") add(where, g.formula);
    if (typeof g.nameBox === "string" && g.nameBox !== "?") add(where, g.nameBox);
  };
  const visual = (where, v) => {
    if (!v) return;
    (v.icons || []).forEach(([, label]) => add(`${where} caption`, label));
    if (v.keys) add(`${where} keys`, v.keys.join(" + "));
    (v.steps || []).forEach((st) => add(`${where} steps`, st));
    gridTexts(`${where} grid`, v.grid);
    if (v.image && v.highlight && screens[v.image]?.regions?.[v.highlight]) add(`${where} highlight (screens.js ${v.image})`, screens[v.image].regions[v.highlight].label);
    for (const c of [v.chart, ...(v.charts || [])].filter(Boolean)) add(`${where} chart caption`, c.caption);
  };
  if (ex.learn) { add(`${P} learn note`, ex.learn.note); visual(`${P} learn`, ex.learn.visual); }
  for (const [k, v] of Object.entries(ex.contrast || {})) add(`${P} contrast (${k})`, v, "feedback");
  (ex.gapChips || []).forEach((c) => add(`${P} gapChips`, c, "option", true));
  (ex.exercises || []).forEach((e, i) => {
    const W = `${P} ex ${i + 1} (${e.type})`;
    add(`${W} prompt`, e.prompt); add(`${W} hint`, e.hint);
    if (e.correct != null && typeof e.correct === "string") add(`${W} correct`, e.correct, "option", true);
    (e.wrong || []).forEach((w) => typeof w === "string" ? add(`${W} wrong`, w, "option", true) : add(`${W} wrong chart`, w.caption || w.desc, "option"));
    if (e.correct && typeof e.correct === "object") add(`${W} correct chart`, e.correct.caption || e.correct.desc, "option");
    (e.steps || []).forEach((st) => add(`${W} steps`, st, "shown", true));
    add(`${W} why`, e.why, "feedback");
    // A tip is shown after tapping that area: what is written on it there isn't hidden load.
    for (const [k, v] of Object.entries(e.tips || {})) out.push([`${W} tip (${k})`, String(v), { part: "feedback", tapped: `${k} ${screens[e.screen]?.regions?.[k]?.label || ""}` }]);
    if (e.type === "keys") { add(`${W} label`, e.label, "option", true); if (KEY_COMBO[e.combo]) add(`${W} keys`, KEY_COMBO[e.combo] === "the Delete key" ? "press Delete" : KEY_COMBO[e.combo]); }
    if (e.type === "hotspot" && e.screen && screens[e.screen]?.regions?.[e.target]) add(`${W} answer label (screens.js ${e.screen})`, screens[e.screen].regions[e.target].label, "feedback");
    if (e.type === "formula") add(`${W} answer`, e.accept?.[0], "feedback");
    if (e.type === "fillFormula" || e.type === "lockRef") add(`${W} formula`, e.formula);
    visual(`${W} visual`, e.visual); visual(`${W} scene`, e.scene);
    gridTexts(`${W} grid`, e.grid);
    if (e.ui?.chart) add(`${W} chart`, "chart");
    // What the exercise type itself shows (js/exercises.js), whatever the content says.
    const implied = { gridRange: ["A1:B2"], rangeName: ["A1:B2"], gridMulti: ["A1:B2", "hold Ctrl"], fill: ["fill handle"], fillFormula: ["=A1", e.from && e.to && e.from[0] !== e.to[0] ? "fill across" : "fill down"], sortPredict: ["sort"], chartChoice: ["chart"], lockRef: ["$A$1", "press F4"], formula: ["=A1"] }[e.type];
    (implied || []).forEach((x) => out.push([`${W} (what the ${e.type} screen always shows${x === "press F4" ? ": the hint in js/exercises.js" : ""})`, x, { part: "shown", js: x === "press F4" }]));
  });
  return out;
}

/**
 * Per level, in path order:
 * { level, title, lesson, terms, taughtHere: [things its terms teach],
 *   extras: [{ thing, where }] (first used here, taught by none of its terms),
 *   count (terms + extras), flags: [{ where, thing, taught, source, part, allowed? }] }.
 * `source` is "app" (practice.js / screens.js), "kb" (a definition) or "auto" (an automatic question).
 */
export function hiddenLoad(model, C, screens) {
  const levels = model.lessons.filter((l) => !l.comingSoon).flatMap((l) => l.levels);
  const index = new Map(levels.map((lv, i) => [lv.id, i]));
  const levelOfItem = new Map();
  levels.forEach((lv) => lv.items.forEach((it) => levelOfItem.set(it.id, lv)));
  const termLevel = new Map();
  for (const it of model.items) if (!termLevel.has(it.term)) termLevel.set(it.term, levelOfItem.get(it.id));
  const kbText = (it) => `${it.term}. ${it.defPlain}${it.review ? ` ${it.review}` : ""}`;

  // Where each thing is taught: its term's level, or the first definition that names it.
  const taught = new Map(); // id -> { level, by }
  const teach = (id, lv, by) => { const cur = taught.get(id); if (lv && (!cur || index.get(lv.id) < index.get(cur.level.id))) taught.set(id, { level: lv, by }); };
  const byOf = (id) => thingById.get(id)?.by || COMBO_BY[id] || null;
  for (const t of THINGS) if (t.by && termLevel.get(t.by)) teach(t.id, termLevel.get(t.by), `"${t.by}"`);
  for (const [id, by] of Object.entries(COMBO_BY)) if (termLevel.get(by)) teach(id, termLevel.get(by), `"${by}"`);
  // No term of its own: taught where a definition first names it.
  for (const lv of levels) for (const it of lv.items) for (const id of thingsIn(kbText(it))) if (!byOf(id)) teach(id, lv, `the definition of "${it.term}"`);
  // The things each level's own terms stand for (their name, or a thing whose `by` is one of them).
  const ownThings = (lv) => new Set([...THINGS.filter((t) => lv.items.some((it) => it.term === t.by)).map((t) => t.id),
    ...Object.keys(COMBO_BY).filter((id) => lv.items.some((it) => it.term === COMBO_BY[id])),
    ...lv.items.flatMap((it) => [...thingsIn(it.term)])]);

  const allowed = (lv, id) => ALLOW.find((a) => a.level === lv.id && a.thing === id);
  const seen = new Set();
  const out = [];
  for (const lv of levels) {
    const here = index.get(lv.id);
    const own = ownThings(lv);
    const flags = [], uses = new Map(); // id -> first where
    const use = (where, text, opts, source) => {
      const skip = opts.tapped ? thingsIn(opts.tapped) : new Set();
      if (opts.js) source = "js";
      for (const id of thingsIn(text, opts)) {
        if (skip.has(id)) continue;
        if (!uses.has(id)) uses.set(id, where);
        const t = taught.get(id);
        const late = !t || index.get(t.level.id) > here;
        if (late && !own.has(id)) flags.push({ where, thing: id, taught: t ? `${t.level.id} (${t.by})` : "never", source, part: opts.part, text: clean(text), allowed: source !== "kb" ? allowed(lv, id) : undefined });
      }
    };
    use(`course.js level ${lv.id} title`, lv.title, { part: "shown" }, "app");
    for (const it of lv.items) {
      use(`knowledge_lesson${it.lesson}.js "${it.term}" definition`, `${it.defPlain}${it.review ? ` ${it.review}` : ""}`, { part: "shown" }, "kb");
      for (const [where, text, opts] of itemTexts(it, screens)) use(where, text, opts, "app");
    }
    // The automatic questions this level really builds (their wrong options come from other terms).
    const autoSeen = new Set();
    for (let seed = 1; seed <= 30; seed++) {
      for (const s of C.levelSession(model, lv, { seed })) {
        if (!s.gen || s.retrieval) continue;
        const texts = s.gen === "gaps" ? s.chips.filter((c) => !s.answers.includes(c) && !(model.byId.get(s.item)?.extra?.gapChips || []).includes(c)).map((c) => [c, true])
          : s.gen === "defToTerm" ? s.wrong.map((w) => [w, false]) : s.wrong.map((w) => [w, false]);
        for (const [x, exact] of texts) {
          const k = `${s.gen}|${x}`;
          if (autoSeen.has(k)) continue;
          autoSeen.add(k);
          use(`automatic "${s.gen}" for "${model.byId.get(s.item)?.term}": wrong option`, x, { part: "option", exact }, "auto");
        }
      }
    }
    const extras = [...uses].filter(([id]) => !seen.has(id) && !own.has(id) && !(taught.get(id) && index.get(taught.get(id).level.id) < here)).map(([id, where]) => ({ thing: id, where }));
    for (const id of uses.keys()) seen.add(id);
    for (const id of own) seen.add(id);
    // One flag per thing per place.
    const uniq = [...new Map(flags.map((f) => [`${f.where}|${f.thing}`, f])).values()];
    out.push({ level: lv.id, title: lv.title, lesson: lv.lesson, terms: lv.items.map((it) => it.term), extras, count: lv.items.length + extras.length, flags: uniq });
  }
  return out;
}

/** Plain-text report for `node tools/check_content.mjs --load`. */
export function loadReport(rows) {
  const lines = ["", "Hidden load: per level, what is new (terms + things used for the first time that no term of the level teaches)", ""];
  for (const r of rows) {
    lines.push(`${r.level}  ${r.title}: ${r.terms.length} terms + ${r.extras.length} hidden extras = ${r.count} new things${r.count > 6 ? "  (OVER 6)" : ""}`);
    lines.push(`      terms: ${r.terms.join(", ")}`);
    for (const e of r.extras) lines.push(`      + ${e.thing}  (first: ${e.where})`);
    for (const f of r.flags) lines.push(`      ${f.allowed ? "ok" : f.source === "app" ? "!!" : f.source.toUpperCase()} ${f.thing}: taught ${f.taught}; used in ${f.where}${f.part !== "shown" ? ` [${f.part}]` : ""}: “${f.text.slice(0, 110)}”${f.allowed ? `  (allowed: ${f.allowed.why})` : ""}`);
  }
  return lines.join("\n");
}
