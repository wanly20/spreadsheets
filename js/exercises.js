// Exercise types. Each takes (step, api) and returns a controller:
//   { el, footer?, aside?, mount?(), check?() -> result, onMain?(), onKey?(n), onSkip?(), destroy?() }
// Results: { ok, title?, answer?, body?, explain?, after?() }  (after runs once the feedback shows).
import { icon } from "./icons.js";
import { $, $$, esc, el, rich, plain, shuffle, restartAnim, mascotImg, reducedMotion } from "./ui.js";
import { sfx } from "./sound.js";
import { createGrid, parseSel, selText, sameBox, colLetter, colIndex } from "./grid.js";
import { renderVisual, fillValues, isDay, keycaps, SORT_WINDOW_LABEL, MENU_BAR, drawnLabel } from "./visuals.js";
import { chartEl, chartDesc, chartPartLabel } from "./charts.js";
import { screens } from "../content/screens.js";
import { sortOptions, rowsText, dirLabel } from "./sort.js";

export const EXERCISES = { learn, choice, chartChoice, gridClick, gridName, gridRange, gridMulti, rangeName, fill, fillFormula, sortPredict, gridMove, keys, hotspot, order, match, formula, gaps, lockRef };

const KICKER = {
  choice: ["check", "Choose the answer"],
  gridClick: ["pointer", "Click it"],
  gridName: ["type", "Name the cell"],
  gridRange: ["pointer", "Select the range"],
  gridMulti: ["pointer", "Select two ranges"],
  chartChoice: ["chart-column", "Choose the chart"],
  rangeName: ["type", "Name the range"],
  fill: ["arrow-down", "Predict the fill"],
  fillFormula: ["arrow-right", "Predict the fill"],
  sortPredict: ["arrow-down-up", "Predict the sort"],
  gridMove: ["hand", "Move it"],
  keys: ["keyboard", "Press the keys"],
  hotspot: ["target", "Find it on screen"],
  order: ["list-ordered", "Put the steps in order"],
  formula: ["type", "Write the formula"],
  gaps: ["list-ordered", "Fill the gaps"],
  lockRef: ["lock", "Lock the reference"],
  match: ["sparkles", "Match the pairs"],
};

function head(step, title, sub = "") {
  const [ico, label] = KICKER[step.type] || ["sparkles", ""];
  return `<div class="ex-head">
    <span class="ex-kicker">${icon(ico, 16, 2.75)} ${label}${step.retrieval ? `<span class="ex-kicker__tag">${icon("repeat", 14, 2.75)} From earlier</span>` : ""}${step.retry ? `<span class="ex-kicker__tag ex-kicker__tag--again">${icon("rotate-ccw", 14, 2.75)} Try again</span>` : ""}</span>
    <h1 class="h-title">${title}</h1>${sub ? `<p class="ex-sub">${sub}</p>` : ""}
  </div>`;
}

const isTouchOnly = () => matchMedia("(pointer: coarse)").matches && !matchMedia("(any-pointer: fine)").matches;
const normRef = (s) => String(s).toUpperCase().replace(/\s+/g, "");

// ================================================================ learn card
function learn(step, api) {
  const item = api.item(step.item);
  const extra = item.extra?.learn || {};
  const vis = extra.visual ? renderVisual(extra.visual) : null;
  const isSkill = item.kind === "action";
  const node = el(`
    <div class="ex ex-learn">
      <div class="learn-card">
        <div class="learn-card__top">
          <span class="badge ${isSkill ? "badge--blue" : ""}">${icon(isSkill ? "hand" : "sparkles", 16, 2.75)} ${isSkill ? "New skill" : "New word"}</span>
          ${mascotImg("explain", "learn-card__mascot")}
        </div>
        <h1 class="learn-term">${esc(item.term)}</h1>
        <p class="learn-def">${rich(item.def)}</p>
        <div class="learn-visual"></div>
        ${extra.note ? `<p class="note">${icon("lightbulb", 20, 2.5)}<span>${esc(extra.note)}</span></p>` : ""}
      </div>
    </div>`);
  if (vis) $(".learn-visual", node).appendChild(vis.el); else $(".learn-visual", node).remove();
  return {
    el: node,
    footer: { label: "Got it", enabled: true },
    mount() { setTimeout(() => vis?.play?.(), 450); },
    onMain() { sfx.tap(); api.next(); },
  };
}

// ================================================================ options (shared)
function optionsHtml(texts, { cls = "" } = {}) {
  return `<div class="options ${cls}" role="group" aria-label="Answers">${texts.map((t, k) => `
    <button class="press option" data-oi="${k}" aria-pressed="false">
      <span class="face"><span class="key" aria-hidden="true">${k + 1}</span><span class="label">${t}</span></span>
    </button>`).join("")}</div>`;
}

/** Wire up option buttons; returns helpers. `values[k]` is what option k means. */
function wireOptions(node, api, values, onPick) {
  const btns = $$(".option", node);
  let chosen = null;
  const choose = (b) => {
    if (b.disabled) return;
    btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    chosen = values[+b.dataset.oi];
    sfx.select();
    api.enableCheck(true);
    onPick?.(chosen);
  };
  btns.forEach((b) => b.addEventListener("click", () => choose(b)));
  return {
    get chosen() { return chosen; },
    onKey(n) { const b = btns[n - 1]; if (b) { choose(b); b.focus({ preventScroll: true }); } },
    reveal(correct) {
      btns.forEach((b) => {
        b.disabled = true;
        const v = values[+b.dataset.oi];
        if (v === correct) b.classList.add("is-correct");
        else if (v === chosen) b.classList.add("is-wrong");
      });
    },
  };
}

// ================================================================ multiple choice
function choice(step, api) {
  const item = api.item(step.item);
  const opts = shuffle([step.correct, ...step.wrong]);
  const vis = step.visual ? renderVisual(step.visual) : null;
  let promptHtml = "";
  if (step.quote) promptHtml = `<blockquote class="quote">${esc(step.quote).replace(/_{3,}/g, '<span class="blank" aria-label="blank">____</span>')}</blockquote>`;
  if (step.term) promptHtml = `<p class="term-chip">${esc(step.term)}</p>`;
  const node = el(`
    <div class="ex ex-choice ${step.long ? "is-long" : ""} ${step.termOptions ? "is-terms" : ""}">
      ${head(step, esc(step.prompt).replace(/\bNOT\b/g, '<strong class="not">NOT</strong>'))}
      ${promptHtml}
      <div class="ex-visual"></div>
      ${optionsHtml(opts.map((o) => esc(o)), { cls: step.long ? "options--long" : "" })}
    </div>`);
  if (vis) $(".ex-visual", node).appendChild(vis.el); else $(".ex-visual", node).remove();
  const o = wireOptions(node, api, opts);
  return {
    el: node,
    footer: { label: "Check", enabled: false },
    aside: ["skip"],
    mount() { vis?.play?.(); },
    onKey: (n) => o.onKey(n),
    check({ skipped } = {}) {
      o.reveal(step.correct);
      const ok = !skipped && o.chosen === step.correct;
      return { ok, answer: step.correct, explain: step.gen === "termToDef" ? null : undefined, item, body: ok || skipped ? "" : mixUp(item, step.others?.[o.chosen], step.gen) };
    },
  };
}

/** Why a wrong term or meaning isn't it: what the chosen one means, and the item's own contrast. */
function mixUp(item, other, gen) {
  if (!other) return "";
  const contrast = item?.extra?.contrast?.[other.term];
  const what = gen === "termToDef" ? `That's what <b>${esc(other.term)}</b> means.` : `<b>${esc(other.term)}</b> means: ${esc(other.def)}`;
  return `<span class="feedback__tip">${what}${contrast ? ` ${esc(contrast)}` : ""}</span>`;
}

// ================================================================ grid: click a cell / header / the fill handle
function gridClick(step, api) {
  const t = String(step.target);
  const kind = t === "handle" ? "handle" : t.startsWith("col:") ? "col" : t.startsWith("row:") ? "row" : "cell";
  const val = t.replace(/^(col|row):/, "");
  const spec = step.grid || { cols: Math.max(5, kind === "col" || kind === "cell" ? colIndex(val[0]) + 1 : 5), rows: Math.max(6, kind === "row" ? +val : kind === "cell" ? +val.slice(1) : 6) };
  const prompt = step.prompt || {
    cell: `Click cell <b class="ref">${val}</b>.`,
    col: `Click the letter of column <b class="ref">${val}</b>.`,
    row: `Click the number of row <b class="ref">${val}</b>.`,
    handle: "Grab the fill handle.",
  }[kind];
  let pick = null;
  const g = createGrid(spec, { mode: "click", label: "Spreadsheet. Arrow keys move; up from row 1 picks a column letter, left from column A picks a row number; Space grabs the fill handle.", onChange(p) { pick = p; sfx.select(); api.enableCheck(true); } });
  const node = el(`<div class="ex ex-grid">${head(step, prompt)}<div class="ex-sheet"></div></div>`);
  $(".ex-sheet", node).appendChild(g.el);
  const correct = (p) => p && p.kind === kind && (kind === "handle" || (kind === "cell" && p.ref === val) || (kind === "col" && p.col === val) || (kind === "row" && String(p.row) === val));
  return {
    el: node,
    footer: { label: "Check", enabled: false },
    aside: ["skip"],
    mount() { setTimeout(() => g.focus(), 300); },
    check({ skipped } = {}) {
      g.lock();
      const ok = !skipped && correct(pick);
      if (!ok) {
        if (kind === "cell") g.mark(val, "ok");
        if (kind === "col") g.markHeader("col", colIndex(val));
        if (kind === "row") g.markHeader("row", +val);
        if (kind === "handle") g.el.querySelector("[data-handle]")?.classList.add("is-mark-ok");
        if (pick?.kind === "cell") g.mark(pick.ref, "bad");
      }
      let body = "";
      if (!ok && kind === "cell" && pick?.kind === "cell") {
        const p = pick.ref;
        const flipped = `${colLetter(+p.slice(1) - 1)}${colIndex(p[0]) + 1}`;
        body = flipped === val
          ? `You clicked <b>${p}</b>: column ${p[0]}, row ${p.slice(1)}. For <b>${val}</b>, go across to column ${val[0]} first, then down to row ${val.slice(1)}.`
          : `<b>${val}</b> means column ${val[0]} (the letters along the top), row ${val.slice(1)} (the numbers down the side).`;
      }
      if (!ok && (kind === "col" || kind === "row")) body = kind === "col" ? "Column letters are along the top." : "Row numbers are down the left side.";
      return { ok, body: body ? `<span class="feedback__tip">${body}</span>` : "" };
    },
  };
}

// ================================================================ grid: type the highlighted cell's name
function gridName(step, api) {
  const target = step.target;
  const g = createGrid({ cols: Math.max(5, colIndex(target[0]) + 1), rows: Math.max(6, +target.slice(1)), sel: target });
  const node = el(`
    <div class="ex ex-grid ex-type-ref">
      ${head(step, "Which cell is highlighted?", "Type its cell reference.")}
      <div class="ex-sheet"></div>
      <div class="type-field">
        <input class="type-input type-input--ref" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="8"
          aria-label="Cell reference of the highlighted cell" placeholder="Type it here">
      </div>
    </div>`);
  $(".ex-sheet", node).appendChild(g.el);
  const input = $(".type-input", node);
  input.addEventListener("input", () => api.enableCheck(input.value.trim().length > 0));
  return {
    el: node,
    footer: { label: "Check", enabled: false },
    aside: ["skip"],
    mount() { setTimeout(() => input.focus({ preventScroll: true }), 320); },
    check({ skipped } = {}) {
      input.readOnly = true; input.blur();
      const got = normRef(input.value);
      const ok = !skipped && got === target;
      const field = $(".type-field", node);
      if (!skipped) { field.classList.add(ok ? "is-correct" : "is-wrong"); if (!ok) restartAnim(field, "shake"); }
      if (ok) return { ok };
      const m = /^(\d+)([A-Z]+)$/.exec(got);
      if (m && `${m[2]}${m[1]}` === target) {
        return { ok: false, title: "Letter first!", answer: target,
          body: `<span class="feedback__tip">You wrote <b>${esc(got)}</b>. A cell reference is the column letter first, then the row number: <b>${target}</b>. Never ${esc(got)}.</span>` };
      }
      return { ok: false, answer: target, body: `<span class="feedback__tip">Column ${target[0]} (along the top), row ${target.slice(1)} (down the side).</span>` };
    },
  };
}

// ================================================================ grid: drag to select a range
function gridRange(step, api) {
  const box = parseSel(step.target);
  const spec = step.grid || { cols: Math.max(5, box.c2 + 1), rows: Math.max(6, box.r2 + 1) };
  const touch = isTouchOnly();
  const first = step.target.split(":")[0], last = step.target.split(":")[1];
  const prompt = step.prompt || `Select the range <b class="ref">${step.target}</b>.`;
  let picked = null;
  const g = createGrid(spec, { mode: "range", label: "Spreadsheet: drag to select. Arrow keys move, Shift and arrows select.", onChange(p) { picked = p.sel; api.enableCheck(true); } });
  const node = el(`<div class="ex ex-grid">${head(step, prompt, `${touch ? "Put your finger" : "Click"} on ${first}, then drag to ${last}.`)}<div class="ex-sheet"></div></div>`);
  $(".ex-sheet", node).appendChild(g.el);
  return {
    el: node,
    footer: { label: "Check", enabled: false },
    aside: ["skip"],
    mount() { setTimeout(() => g.focus(), 300); },
    check({ skipped } = {}) {
      g.lock();
      const ok = !skipped && sameBox(parseSel(picked), box);
      if (!ok) g.mark(step.target, "ok");
      return { ok, answer: ok ? "" : step.target,
        body: ok ? "" : `<span class="feedback__tip">${picked ? `You selected <b>${esc(picked)}</b>. ` : ""}The range ${step.target} starts at ${first} and ends at ${last}.</span>` };
    },
  };
}

// ================================================================ grid: two separate ranges (hold Ctrl)
// The same on Windows and on a Chromebook: drag the first range, hold Ctrl, drag the second.
// Touch screens have no Ctrl key, so an on-screen Ctrl key can be tapped to hold it.
/** "a3:a9" → "A3:A9" (a single cell stays "B2"). */
const normRange = (r) => selText(parseSel(r));
export function multiTip(picked, target) {
  const want = target.map(normRange), got = (picked || []).map(normRange);
  const [a, b] = want;
  if (got.length === 1) {
    const box = parseSel(got[0]), A = parseSel(a), B = parseSel(b);
    const covers = box && [A, B].every((x) => x.c1 >= box.c1 && x.c2 <= box.c2 && x.r1 >= box.r1 && x.r2 <= box.r2);
    if (covers) return `You selected <b>${esc(got[0])}</b>: that takes in the columns in between too. Select ${a}, hold <b>Ctrl</b>, then select ${b}.`;
    if (want.includes(got[0])) return `Only <b>${esc(got[0])}</b> is selected. Hold <b>Ctrl</b> the whole time you select the second range, or the first one disappears.`;
  }
  return `Select ${a}, hold <b>Ctrl</b>, then select ${b}.`;
}
function gridMulti(step, api) {
  const touch = isTouchOnly();
  let latched = false, physical = false;
  let picked = [];
  const g = createGrid(step.grid, { mode: "multi", ctrlHeld: () => latched, label: "Spreadsheet: drag to select a range. Hold Ctrl to add a second range. Keyboard: Shift and arrows select; hold Ctrl with the arrows for the next range.",
    onChange(p) { picked = p.boxes; api.enableCheck(picked.length > 0); } });
  const node = el(`
    <div class="ex ex-grid ex-multi">
      ${head(step, step.prompt, `${touch ? "Drag" : "Click and drag"} the first range. Then hold <b>Ctrl</b> and ${touch ? "drag" : "click and drag"} the second.`)}
      <div class="ex-sheet"></div>
      <div class="ctrl-row">
        <button type="button" class="press ctrl-latch" aria-pressed="false" aria-label="Ctrl key: ${touch ? "tap to hold it down" : "hold it on your keyboard, or tap here"}">
          <span class="face"><kbd class="keycap keycap--wide">Ctrl</kbd><span class="ctrl-latch__text">${touch ? "Tap to hold Ctrl" : "Hold Ctrl on your keyboard"}</span></span>
        </button>
        <span class="ctrl-row__tip">Same on Windows and on a Chromebook: <b>Ctrl</b> + click.</span>
      </div>
    </div>`);
  $(".ex-sheet", node).appendChild(g.el);
  const btn = $(".ctrl-latch", node);
  const show = () => { const on = latched || physical; btn.classList.toggle("is-on", on); btn.setAttribute("aria-pressed", String(latched)); $(".ctrl-latch__text", node).textContent = latched ? "Ctrl is held (tap to let go)" : physical ? "Holding Ctrl" : touch ? "Tap to hold Ctrl" : "Hold Ctrl on your keyboard"; };
  btn.addEventListener("click", () => { if (node.classList.contains("is-locked")) return; latched = !latched; sfx.tap(); show(); });
  const down = (e) => { if (e.key === "Control" || e.key === "Meta") { physical = true; show(); } };
  const up = (e) => { if (e.key === "Control" || e.key === "Meta") { physical = false; show(); } };
  window.addEventListener("keydown", down, true);
  window.addEventListener("keyup", up, true);
  const off = () => { window.removeEventListener("keydown", down, true); window.removeEventListener("keyup", up, true); };
  const want = step.target.map(normRange);
  return {
    el: node,
    footer: { label: "Check", enabled: false },
    aside: ["skip"],
    mount() { setTimeout(() => g.focus(), 300); },
    destroy: off,
    check({ skipped } = {}) {
      g.lock(); node.classList.add("is-locked"); btn.disabled = true; off();
      const got = picked.map(normRange);
      const ok = !skipped && got.length === want.length && want.every((w) => got.includes(w));
      if (!ok) want.forEach((w) => g.mark(w, "ok"));
      return { ok, answer: ok ? "" : `${want[0]}, hold Ctrl, ${want[1]}`,
        body: `<span class="feedback__tip">${ok ? `Two separate ranges: ${esc(want.join(" and "))}. The chart's data range is ${esc(want.join(","))}: the columns in between are left out.` : skipped ? "" : multiTip(picked, step.target)}</span>` };
    },
  };
}

// ================================================================ choose the chart (the options are pictures)
function chartChoice(step, api) {
  const all = [step.correct, ...step.wrong];
  const order = shuffle(all.map((_, i) => i));
  const vis = step.visual ? renderVisual(step.visual) : null;
  const node = el(`
    <div class="ex ex-chartc">
      ${head(step, esc(step.prompt))}
      <div class="ex-visual"></div>
      <div class="options options--charts" role="group" aria-label="Answers">${order.map((i, k) => `
        <button class="press option" data-oi="${k}" data-v="${esc(all[i].desc)}" aria-pressed="false" aria-label="Option ${k + 1}: ${esc(all[i].caption || chartDesc(all[i]))}">
          <span class="face"><span class="key" aria-hidden="true">${k + 1}</span><span class="label"><span class="chart-slot"></span>${all[i].caption ? `<span class="chart-cap">${esc(all[i].caption)}</span>` : ""}</span></span>
        </button>`).join("")}</div>
    </div>`);
  if (vis) $(".ex-visual", node).appendChild(vis.el); else $(".ex-visual", node).remove();
  $$(".chart-slot", node).forEach((slot, k) => slot.appendChild(chartEl({ compact: true, ...all[order[k]] })));
  const values = order.map((i) => all[i].desc);
  const o = wireOptions(node, api, values);
  return {
    el: node,
    footer: { label: "Check", enabled: false },
    aside: ["skip"],
    onKey: (n) => o.onKey(n),
    check({ skipped } = {}) {
      o.reveal(step.correct.desc);
      const ok = !skipped && o.chosen === step.correct.desc;
      return { ok, answer: ok ? "" : step.correct.desc, body: step.why ? `<span class="feedback__tip">${esc(step.why)}</span>` : "" };
    },
  };
}

// ================================================================ grid: type the highlighted range
function rangeName(step, api) {
  const box = parseSel(step.target);
  const g = createGrid({ cols: Math.max(5, box.c2 + 1), rows: Math.max(6, box.r2 + 1), sel: step.target });
  const node = el(`
    <div class="ex ex-grid ex-type-ref">
      ${head(step, "Which range is selected?", "Type it the way a spreadsheet writes it.")}
      <div class="ex-sheet"></div>
      <div class="type-field">
        <input class="type-input type-input--ref" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="12"
          aria-label="The selected range" placeholder="Type it here">
      </div>
    </div>`);
  $(".ex-sheet", node).appendChild(g.el);
  const input = $(".type-input", node);
  input.addEventListener("input", () => api.enableCheck(input.value.trim().length > 0));
  return {
    el: node,
    footer: { label: "Check", enabled: false },
    aside: ["skip"],
    mount() { setTimeout(() => input.focus({ preventScroll: true }), 320); },
    check({ skipped } = {}) {
      input.readOnly = true; input.blur();
      const got = normRef(input.value);
      const ok = !skipped && got === step.target;
      const field = $(".type-field", node);
      if (!skipped) { field.classList.add(ok ? "is-correct" : "is-wrong"); if (!ok) restartAnim(field, "shake"); }
      if (ok) return { ok };
      const [a, b] = step.target.split(":");
      let tip = `First cell, a colon, then the last cell: <b>${step.target}</b>.`;
      if (got === `${b}:${a}`) tip = `Nearly! Write the first cell first: <b>${step.target}</b>, said “${a} to ${b}”.`;
      else if (/[-–]|TO|\.\./.test(got) && got.includes(a) && got.includes(b)) tip = `Use a colon ( : ) between the two cells. The colon means “to”: <b>${step.target}</b>.`;
      return { ok: false, title: tip.startsWith("Nearly") ? "So close!" : undefined, answer: step.target, body: `<span class="feedback__tip">${tip}</span>` };
    },
  };
}

// ================================================================ predict the fill
const seq = (a) => a.join(", ");
export function fillOptions(start, end) {
  const n = end - start.length;
  const correct = seq([...start, ...fillValues(start, n)]);
  const wrong = [];
  const add = (a) => { const s = seq(a); if (s !== correct && !wrong.includes(s)) wrong.push(s); };
  if (typeof start[0] !== "number") {
    if (isDay(start[0])) {
      add([start[0], ...Array(n).fill(start[0])]); // copied, as for a plain word
      const school = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], k = school.indexOf(start[0]);
      if (k >= 0) add([start[0], ...Array.from({ length: n }, (_, i) => school[(k + i + 1) % 5])]); // school days only
    } else add([start[0], ...Array.from({ length: n }, (_, i) => `${start[0]}${i + 2}`)]);
    add([start[0], ...Array(n).fill("(empty)")]);
  } else if (start.length === 1) {
    const v = start[0];
    add([v, ...Array.from({ length: n }, (_, i) => v + i + 1)]);
    add([v, ...Array.from({ length: n }, (_, i) => v * (i + 2))]);
    add([v, ...Array(n).fill(0)]);
  } else {
    const [a, b] = start;
    add([a, b, ...Array.from({ length: n }, (_, i) => b + i + 1)]);
    add([a, b, ...Array(n).fill(b)]);
    add([a, b, ...Array.from({ length: n }, (_, i) => (i % 2 ? b : a))]);
    add([a, b, ...Array.from({ length: n }, (_, i) => b * 2 ** (i + 1))]);
  }
  return { correct, wrong: wrong.slice(0, 3) };
}

function fill(step, api) {
  const { start, end } = step;
  const col = "B", r0 = 2, last = r0 + end - 1;
  const cells = {};
  start.forEach((v, i) => { cells[`${col}${r0 + i}`] = v; });
  const g = createGrid({ cols: 3, rows: last, cells, sel: `${col}${r0}:${col}${r0 + start.length - 1}` });
  g.mark(`${col}${r0}:${col}${last}`, "target");
  const fmt = (v) => (typeof v === "number" ? v : `“${v}”`);
  const prompt = start.length === 1
    ? `${col}${r0} holds <b>${esc(fmt(start[0]))}</b>. You drag its fill handle down to ${col}${last}.`
    : `${col}${r0} holds <b>${fmt(start[0])}</b> and ${col}${r0 + 1} holds <b>${fmt(start[1])}</b>. You select both and drag the fill handle down to ${col}${last}.`;
  const { correct, wrong } = fillOptions(start, end);
  const opts = shuffle([correct, ...wrong]);
  const node = el(`
    <div class="ex ex-fill">
      ${head(step, `What will ${col}${r0} to ${col}${last} show?`, prompt)}
      <div class="fill-layout">
        <div class="ex-sheet"></div>
        ${optionsHtml(opts.map(esc), { cls: "options--seq" })}
      </div>
    </div>`);
  $(".ex-sheet", node).appendChild(g.el);
  const o = wireOptions(node, api, opts);
  return {
    el: node,
    footer: { label: "Check", enabled: false },
    aside: ["skip"],
    onKey: (n) => o.onKey(n),
    check({ skipped } = {}) {
      o.reveal(correct);
      const ok = !skipped && o.chosen === correct;
      const why = isDay(start[0])
        ? "Google Sheets knows the days of the week, so one cell is enough: it carries on to the next day each time."
        : start.length === 1
        ? "One cell selected: the fill handle copies the same value."
        : `Two cells show the pattern (${start[1] - start[0] >= 0 ? "+" : ""}${start[1] - start[0]} each time), so the fill handle keeps it going.`;
      return { ok, answer: correct, body: `<span class="feedback__tip">${why}</span>`,
        after() { g.clearMarks(); g.animateFill(col, r0, start, fillValues(start, end - start.length)); } };
    },
  };
}

// ================================================================ predict a filled formula (down or across)
// The references move with the fill: across moves the letters, down moves the
// numbers, and a $ keeps that part where it is.
const FREF_RE = /(?<![A-Z$])(\$?)([A-Z])(\$?)(\d+)/g;
/** A formula moved dc columns and dr rows, as the fill handle does it ($ parts stay). */
export function shiftFormula(f, dc, dr, { ignoreLocks = false, onlyFirst = false } = {}) {
  let k = 0, bad = false;
  const out = f.replace(FREF_RE, (m, lc, c, lr, r) => {
    if (onlyFirst && k++ > 0) return m;
    const ci = lc && !ignoreLocks ? colIndex(c) : colIndex(c) + dc;
    const row = lr && !ignoreLocks ? +r : +r + dr;
    if (ci < 0 || ci > 25 || row < 1) bad = true;
    return `${lc}${colLetter(ci)}${lr}${row}`;
  });
  return bad ? null : out; // null: off the edge of the sheet
}
/** Where the fill goes, from one cell to another in the same row or column. */
export function fillMove(from, to) {
  const dc = colIndex(to[0]) - colIndex(from[0]), dr = +to.slice(1) - +from.slice(1);
  return { dc, dr, across: dc !== 0, n: Math.abs(dc || dr) };
}
/** The right formula and three likely mistakes. */
export function fillFormulaOptions(formula, from, to) {
  const { dc, dr, n } = fillMove(from, to);
  const sc = Math.sign(dc), sr = Math.sign(dr);
  const correct = shiftFormula(formula, dc, dr);
  const wrong = [];
  const add = (f) => { if (f && f !== correct && !wrong.includes(f)) wrong.push(f); };
  add(formula); // copied as it is
  add(shiftFormula(formula, dr, dc)); // the other part moved (numbers instead of letters)
  if (formula.includes("$")) add(shiftFormula(formula, dc, dr, { ignoreLocks: true })); // the $ ignored
  if (n > 1) add(shiftFormula(formula, sc, sr)); // only one step
  add(shiftFormula(formula, dc, dr, { onlyFirst: true })); // only the first reference moved
  add(shiftFormula(formula, sc * (n + 1), sr * (n + 1))); // one step too many
  return { correct, wrong: wrong.slice(0, 3) };
}

function fillFormula(step, api) {
  const { from, to, formula } = step;
  const { dc, dr, across, n } = fillMove(from, to);
  const g = createGrid({ ...step.grid, cells: { ...(step.grid?.cells || {}), [from]: formula }, sel: from });
  g.mark(`${from}:${to}`, "target");
  const { correct, wrong } = fillFormulaOptions(formula, from, to);
  const opts = shuffle([correct, ...wrong]);
  const node = el(`
    <div class="ex ex-fillf">
      ${head(step, `What's in ${to} now?`, `${from} holds <b class="ref">${esc(formula)}</b>. You drag its fill handle ${across ? "right" : "down"} to ${to}. (Formulas are showing.)`)}
      <div class="ex-sheet"></div>
      ${optionsHtml(opts.map(esc), { cls: "options--formulas" })}
    </div>`);
  $(".ex-sheet", node).appendChild(g.el);
  const o = wireOptions(node, api, opts);
  const pause = (ms) => new Promise((r) => setTimeout(r, reducedMotion() ? 0 : ms));
  // After CHECK: the fill plays out, one cell at a time, showing each formula.
  async function play() {
    g.clearMarks();
    const sc = Math.sign(dc), sr = Math.sign(dr);
    await pause(300);
    for (let i = 1; i <= n; i++) {
      const ref = `${colLetter(colIndex(from[0]) + sc * i)}${+from.slice(1) + sr * i}`;
      g.setCells({ [ref]: shiftFormula(formula, sc * i, sr * i) });
      g.setSel(`${from}:${ref}`);
      g.el.querySelector(`.sh-cell[data-ref="${ref}"]`)?.classList.add("is-new");
      await pause(450);
    }
  }
  return {
    el: node,
    footer: { label: "Check", enabled: false },
    aside: ["skip"],
    onKey: (k) => o.onKey(k),
    check({ skipped } = {}) {
      o.reveal(correct);
      const ok = !skipped && o.chosen === correct;
      const why = across
        ? "Fill across: the column letters move, one letter for each column. The row numbers stay the same."
        : "Fill down: the row numbers move, one for each row. The column letters stay the same.";
      const lock = formula.includes("$") ? " A reference with $ never moves, whichever way you fill." : "";
      return { ok, answer: correct, body: `<span class="feedback__tip">${esc(why + lock)}</span>`, after: play };
    },
  };
}

// ================================================================ predict the sort
// A small table (headings in row 1). The options are whole tables: the right
// sort and three likely mistakes (the wrong way, one column sorted alone, …).
// After CHECK the rows move into their new order.
function sortPredict(step, api) {
  const { head: heads, rows } = step;
  const nc = heads.length, last = rows.length + 1;
  const range = `A1:${colLetter(nc - 1)}${last}`;
  const toCells = (list) => {
    const cells = {};
    heads.forEach((h, c) => { cells[`${colLetter(c)}1`] = h; });
    list.forEach((r, i) => r.forEach((v, c) => { cells[`${colLetter(c)}${i + 2}`] = v; }));
    return cells;
  };
  const style = Object.fromEntries(heads.map((_, c) => [`${colLetter(c)}1`, { b: 1 }]));
  const g = createGrid({ cols: nc, rows: last, widths: step.widths, cells: toCells(rows), style, sel: range });
  const { correct, wrong } = sortOptions(step);
  const opts = shuffle([correct, ...wrong]);
  const how = `by <b>${esc(step.by)}</b>, ${dirLabel(step.dir)}${step.then ? `, then by <b>${esc(step.then.by)}</b>, ${dirLabel(step.then.dir)}` : ""}`;
  const optHtml = (list) => `<span class="sort-opt" style="--n:${nc}">${list.map((r) => r.map((v) => `<span class="sort-opt__c">${esc(v)}</span>`).join("")).join("")}</span>`;
  const node = el(`
    <div class="ex ex-sortp">
      ${head(step, "What will the table look like?", `You select ${range}, tick <b>Data has header row</b> and sort ${how}.`)}
      <div class="sortp-layout">
        <div class="ex-sheet"></div>
        ${optionsHtml(opts.map(optHtml), { cls: "options--tables" })}
      </div>
    </div>`);
  $(".ex-sheet", node).appendChild(g.el);
  $$(".option", node).forEach((b, k) => { b.dataset.v = rowsText(opts[k]); b.setAttribute("aria-label", `Option ${k + 1}: ${rowsText(opts[k])}`); });
  const values = opts.map(rowsText);
  const o = wireOptions(node, api, values);
  const pause = (ms) => new Promise((r) => setTimeout(r, reducedMotion() ? 0 : ms));
  async function play() {
    await pause(350);
    g.setSel(range);
    g.setCells(toCells(correct));
    correct.forEach((r, i) => { if (rowsText([r]) !== rowsText([rows[i]])) heads.forEach((_, c) => g.el.querySelector(`.sh-cell[data-ref="${colLetter(c)}${i + 2}"]`)?.classList.add("is-new")); });
  }
  return {
    el: node,
    footer: { label: "Check", enabled: false },
    aside: ["skip"],
    onKey: (k) => o.onKey(k),
    check({ skipped } = {}) {
      const right = rowsText(correct);
      o.reveal(right);
      const ok = !skipped && o.chosen === right;
      const numbers = typeof rows[0][heads.indexOf(step.by)] === "number";
      const first = step.dir === "az" ? (numbers ? "smallest number first" : "earliest letter first") : (numbers ? "largest number first" : "latest letter first");
      let why = `${step.by}, ${dirLabel(step.dir)}: ${first}. Each whole row moves together, so nothing gets mixed up.`;
      if (step.then) why += ` Rows that tie on ${step.by} are put in order by ${step.then.by}.`;
      return { ok, body: `<span class="feedback__tip">${esc(why)}</span>`, after: play };
    },
  };
}

// ================================================================ move a cell
function gridMove(step, api) {
  const { from, to, value } = step;
  const b1 = parseSel(from), b2 = parseSel(to);
  let moved = null;
  const g = createGrid({ cols: Math.max(5, b1.c2 + 1, b2.c2 + 1), rows: Math.max(5, b1.r2, b2.r2), cells: { [from]: value }, sel: from },
    { mode: "move", label: "Spreadsheet: drag a cell to move it. Keyboard: arrows to a cell, Space to pick it up, arrows, Space to drop.",
      onChange(p) { moved = p; sfx.select(); api.enableCheck(true); } });
  const node = el(`<div class="ex ex-grid">${head(step, `Move <b class="ref">${esc(value)}</b> from ${from} to <b class="ref">${to}</b>.`, "Grab the cell and drag it to its new place.")}<div class="ex-sheet"></div></div>`);
  $(".ex-sheet", node).appendChild(g.el);
  return {
    el: node,
    footer: { label: "Check", enabled: false },
    aside: ["skip"],
    mount() { setTimeout(() => g.focus(), 300); },
    check({ skipped } = {}) {
      g.lock();
      const ok = !skipped && moved?.to === to;
      if (!ok) g.mark(to, "ok");
      return { ok, answer: ok ? "" : `${value} in ${to}`,
        body: ok ? `<span class="feedback__tip">In Google Sheets you grab the cell's edge: the cursor turns into a hand.</span>` : "" };
    },
  };
}

// ================================================================ press the shortcut
const KEY_NAME = { ctrl: "Ctrl", shift: "Shift", alt: "Alt", enter: "Enter", delete: "Delete", backspace: "Backspace", space: "Space", escape: "Esc", tab: "Tab" };
const ACCEPT = { delete: ["delete", "backspace", "alt+backspace"], "ctrl+y": ["ctrl+y", "ctrl+shift+z"], enter: ["enter"] };
function comboOf(e) {
  let k = e.code?.startsWith("Key") ? e.code.slice(3).toLowerCase() : e.code?.startsWith("Digit") ? e.code.slice(5) : (e.key || "").toLowerCase();
  if (e.code === "NumpadEnter") k = "enter";
  if (e.code === "Backquote") k = "`";
  if (k === " ") k = "space";
  return [(e.ctrlKey || e.metaKey) && "ctrl", e.shiftKey && "shift", e.altKey && "alt", k].filter(Boolean).join("+");
}
const comboLabel = (c) => c.split("+").map((p) => KEY_NAME[p] || p.toUpperCase());

function keys(step, api, { forceChoice = false } = {}) {
  if (forceChoice || isTouchOnly()) return keysChoice(step, api);
  const vis = step.scene ? renderVisual(step.scene) : null;
  const node = el(`
    <div class="ex ex-keys">
      ${head(step, esc(step.prompt))}
      <div class="ex-visual"></div>
      <div class="key-zone" aria-live="polite">
        <span class="key-zone__icon">${icon("keyboard", 30, 2.25)}</span>
        <span class="key-zone__text">Press the keys on your keyboard</span>
        <span class="key-zone__pressed keycaps"></span>
      </div>
    </div>`);
  if (vis) $(".ex-visual", node).appendChild(vis.el); else $(".ex-visual", node).remove();
  const zone = $(".key-zone", node);
  const accept = ACCEPT[step.combo] || [step.combo];
  let done = false;
  const onKey = (e) => {
    if (done || document.querySelector(".modal")) return;
    if (["Control", "Shift", "Alt", "Meta", "OS", "CapsLock", "Fn"].includes(e.key)) {
      if (e.key === "Control" || e.key === "Meta") { $(".key-zone__pressed", node).innerHTML = keycaps(["Ctrl"]); zone.classList.add("is-holding"); }
      return;
    }
    if (e.key === "Escape" || e.key === "Tab") return; // quit dialog / focus still work
    const c = comboOf(e);
    if (c === "enter" && step.combo !== "enter") return; // Enter is CHECK elsewhere: never a wrong answer here
    e.preventDefault();
    e.stopPropagation();
    if (e.repeat) return;
    done = true;
    const ok = accept.includes(c);
    $(".key-zone__pressed", node).innerHTML = keycaps(comboLabel(c));
    zone.classList.remove("is-holding");
    zone.classList.add(ok ? "is-correct" : "is-wrong");
    $(".key-zone__text", node).textContent = ok ? "That's it!" : "You pressed";
    if (ok) {
      sfx.select();
      if (vis?.grid && step.scene.after) vis.grid.setCells(step.scene.after.cells);
      if (step.combo === "enter" && vis?.grid) vis.grid.setSel(step.scene.grid.nameBox || "A1");
    } else restartAnim(zone, "shake");
    const note = c === "backspace" || c === "alt+backspace" ? "Backspace works too, and on a Chromebook it's the key you'll use." :
      c === "ctrl+shift+z" ? "Ctrl + Shift + Z works too in Google Sheets." : "";
    setTimeout(() => api.complete({
      ok,
      answer: step.label,
      body: ok ? (note ? `<span class="feedback__tip">${note}</span>` : "") : `<span class="feedback__tip">You pressed <b>${comboLabel(c).join(" + ")}</b>.</span>`,
    }), ok ? 550 : 300);
  };
  const keyUp = (e) => { if ((e.key === "Control" || e.key === "Meta") && !done) { $(".key-zone__pressed", node).innerHTML = ""; zone.classList.remove("is-holding"); } };
  window.addEventListener("keydown", onKey, true);
  window.addEventListener("keyup", keyUp, true);
  const off = () => { window.removeEventListener("keydown", onKey, true); window.removeEventListener("keyup", keyUp, true); };
  return {
    el: node,
    footer: { label: "Press the keys", enabled: false },
    aside: ["skip", "no-keyboard"],
    onSkip() { done = true; off(); api.complete({ ok: false, skipped: true, answer: step.label }); },
    noKeyboard() { off(); api.replace(keysChoice(step, api)); },
    destroy: off,
  };
}

function keysChoice(step, api) {
  const opts = shuffle([step.label, ...step.wrong]);
  const vis = step.scene ? renderVisual(step.scene) : null;
  const node = el(`
    <div class="ex ex-keys ex-keys--choice">
      ${head({ ...step, type: "choice" }, esc(step.prompt), "Which would you press?")}
      <div class="ex-visual"></div>
      ${optionsHtml(opts.map((o) => `<span class="keycaps keycaps--sm">${keycaps(o.split(" + "))}</span>`), { cls: "options--keys" })}
    </div>`);
  if (vis) $(".ex-visual", node).appendChild(vis.el); else $(".ex-visual", node).remove();
  const o = wireOptions(node, api, opts);
  return {
    el: node,
    footer: { label: "Check", enabled: false },
    aside: ["skip"],
    onKey: (n) => o.onKey(n),
    check({ skipped } = {}) {
      o.reveal(step.label);
      const ok = !skipped && o.chosen === step.label;
      if (ok && vis?.grid && step.scene.after) vis.grid.setCells(step.scene.after.cells);
      return { ok, answer: step.label };
    },
  };
}

// ================================================================ find it on screen
function hotspot(step, api) {
  const node = el(`<div class="ex ex-hotspot">${head(step, esc(step.prompt))}<div class="hot-stage"></div></div>`);
  const stage = $(".hot-stage", node);
  let regions = [];
  const drawn = step.screen && screens[step.screen].drawn; // not photographed yet: drawn instead
  const hitsOf = (vis) => vis.hits.forEach((h) => { h.dataset.region = h.dataset.hit; if (!h.classList.contains("hot")) h.classList.add("hot-ui"); h.setAttribute("aria-pressed", "false"); regions.push(h.dataset.hit); });
  if (drawn) {
    const vis = renderVisual(drawn, { interactiveHits: true });
    stage.appendChild(vis.el);
    hitsOf(vis);
  } else if (step.screen) {
    const s = screens[step.screen];
    // On narrow screens show a window of the screenshot around the answer, so
    // small things (the fill handle) stay big enough to tap.
    const narrow = window.innerWidth < 700 && s.w > 700;
    const t = s.regions[step.target].r;
    let cx = 0, cw = s.w;
    if (narrow) {
      cw = 520;
      const want = t[0] + t[2] / 2 - cw * (0.3 + 0.4 * ((t[0] * 7) % 10) / 10);
      cx = Math.max(0, Math.min(s.w - cw, Math.round(want)));
    }
    const fig = el(`<figure class="shot shot--hot" style="--ar:${cw}/${s.h};--w:${s.w}px">
      <img src="${s.src}" alt="${esc(s.alt)}" draggable="false" style="width:${(s.w / cw) * 100}%;margin-left:${(-cx / cw) * 100}%">
    </figure>`);
    let k = 0;
    // Areas packed close together (menu rows) keep to their own box: a bigger invisible tap
    // area would reach into the next row on a small screen.
    const near = (a, b) => a[0] < b[0] + b[2] + 8 && b[0] < a[0] + a[2] + 8 && a[1] < b[1] + b[3] + 8 && b[1] < a[1] + a[3] + 8;
    const all = Object.values(s.regions).map((x) => x.r);
    for (const [id, reg] of Object.entries(s.regions)) {
      const [x, y, w, h] = reg.r;
      if (x < cx || x + w > cx + cw) continue;
      regions.push(id);
      const tight = all.some((o) => o !== reg.r && near(reg.r, o));
      fig.appendChild(el(`<button type="button" class="hot${tight ? " hot--tight" : ""}" data-region="${id}" aria-label="Area ${++k}" aria-pressed="false"
        style="left:${((x - cx) / cw) * 100}%;top:${(y / s.h) * 100}%;width:${(w / cw) * 100}%;height:${(h / s.h) * 100}%"><span class="hot__ring"></span></button>`));
    }
    stage.appendChild(fig);
  } else {
    const vis = renderVisual(step.ui, { interactiveHits: true });
    stage.appendChild(vis.el);
    hitsOf(vis);
  }
  const btns = $$("[data-region]", stage);
  let chosen = null;
  const choose = (b) => {
    btns.forEach((x) => { x.setAttribute("aria-pressed", String(x === b)); x.classList.toggle("is-chosen", x === b); });
    chosen = b.dataset.region;
    sfx.select();
    api.enableCheck(true);
  };
  btns.forEach((b) => b.addEventListener("click", () => { if (!node.classList.contains("is-locked")) choose(b); }));
  const label = (id) => {
    if (drawn) return drawnLabel(drawn, id);
    if (step.screen) return screens[step.screen].regions[id].label;
    if (step.ui?.chart) return chartPartLabel(id);
    if (step.ui?.colheads || step.ui?.rowheads) {
      const what = step.ui.colheads ? "column" : "row";
      return id.includes("|") ? `the line between ${what}s ${id.replace("|", " and ")}` : `${what} ${id}`;
    }
    if (step.ui?.sortWindow) return SORT_WINDOW_LABEL[id] || id;
    if (step.ui?.dataMenu) return MENU_BAR.includes(id) ? `the ${id} menu` : id;
    if (id === "+") return "the + button";
    if (id === "All sheets") return "the All sheets button";
    return step.ui?.tabs ? `the ${id} tab` : id;
  };
  return {
    el: node,
    footer: { label: "Check", enabled: false },
    aside: ["skip"],
    onKey(n) { const b = btns[n - 1]; if (b) { choose(b); b.focus({ preventScroll: true }); } },
    check({ skipped } = {}) {
      node.classList.add("is-locked");
      const ok = !skipped && chosen === step.target;
      btns.forEach((b) => {
        b.disabled = true;
        if (b.dataset.region === step.target) b.classList.add("is-correct");
        else if (b.dataset.region === chosen) b.classList.add("is-wrong");
      });
      const tip = !ok && chosen && step.tips?.[chosen] ? ` ${esc(step.tips[chosen])}` : "";
      return { ok, answer: ok ? "" : label(step.target),
        body: !ok && chosen ? `<span class="feedback__tip">You tapped ${esc(label(chosen))}.${tip}</span>` : "" };
    },
  };
}

// ================================================================ steps in order
function order(step, api) {
  const n = step.steps.length;
  let bankOrder = shuffle(step.steps.map((_, i) => i));
  if (bankOrder.every((v, i) => v === i)) bankOrder = [...bankOrder.slice(1), bankOrder[0]];
  const node = el(`
    <div class="ex ex-order">
      ${head(step, esc(step.prompt), "Tap the steps in the order you'd do them.")}
      <ol class="order-slots" aria-label="Your order">${step.steps.map((_, i) => `<li class="order-slot"><span class="order-slot__n">${i + 1}</span></li>`).join("")}</ol>
      <div class="order-bank" aria-label="Steps">
        ${bankOrder.map((si, k) => `<span class="order-slotbg"><button class="press order-card" data-si="${si}"><span class="face"><span class="key" aria-hidden="true">${k + 1}</span><span class="label">${esc(step.steps[si])}</span></span></button></span>`).join("")}
      </div>
    </div>`);
  const slots = $$(".order-slot", node);
  const placed = [];
  const render = () => {
    slots.forEach((s, i) => {
      s.querySelector(".order-chip")?.remove();
      s.classList.toggle("is-filled", i < placed.length);
      if (i < placed.length) s.appendChild(el(`<button class="order-chip" data-placed="${i}" aria-label="Remove: ${esc(step.steps[placed[i]])}">${esc(step.steps[placed[i]])}</button>`));
    });
    $$(".order-card", node).forEach((b) => { const used = placed.includes(+b.dataset.si); b.classList.toggle("is-used", used); b.disabled = used; });
    api.enableCheck(placed.length === n);
  };
  node.addEventListener("click", (e) => {
    if (node.classList.contains("is-locked")) return;
    const card = e.target.closest(".order-card");
    const chip = e.target.closest(".order-chip");
    if (card && !card.disabled) { placed.push(+card.dataset.si); sfx.tap(); render(); restartAnim(slots[placed.length - 1], "pop"); }
    if (chip) { placed.splice(+chip.dataset.placed, 1); sfx.tap(); render(); }
  });
  return {
    el: node,
    footer: { label: "Check", enabled: false },
    aside: ["skip"],
    onKey(k) {
      if (node.classList.contains("is-locked")) return;
      if (k === "Backspace") { if (placed.length) { placed.pop(); render(); } return; }
      const card = $$(".order-card", node)[k - 1];
      if (card && !card.disabled) card.click();
    },
    check({ skipped } = {}) {
      node.classList.add("is-locked");
      const ok = !skipped && placed.every((v, i) => v === i);
      slots.forEach((s, i) => s.classList.add(placed[i] === i ? "is-right" : "is-off"));
      return { ok, answer: ok ? "" : step.steps.map((s, i) => `${i + 1}. ${s}`).join("<br>"), answerHtml: true };
    },
  };
}

// ================================================================ match pairs (term ↔ definition)
function match(step, api) {
  const left = shuffle(step.pairs.map((p, i) => ({ i, text: p.term })));
  const right = shuffle(step.pairs.map((p, i) => ({ i, text: p.def })));
  const node = el(`
    <div class="ex ex-match">
      ${head(step, "Match each term to its meaning")}
      <div class="match-grid">
        <div class="match-col">${left.map((x, k) => `<button class="press option match-card match-card--term" data-side="t" data-i="${x.i}"><span class="face" data-key="${k + 1}"><span class="label">${esc(x.text)}</span></span></button>`).join("")}</div>
        <div class="match-col">${right.map((x, k) => `<button class="press option match-card" data-side="d" data-i="${x.i}"><span class="face" data-key="${left.length + k + 1}"><span class="label">${esc(x.text)}</span></span></button>`).join("")}</div>
      </div>
    </div>`);
  let sel = { t: null, d: null };
  let matched = 0;
  const missed = new Set();
  const mixups = []; // [term index, the meaning it was matched with]
  node.addEventListener("click", (e) => {
    const b = e.target.closest(".match-card");
    if (!b || b.disabled || b.classList.contains("is-busy")) return;
    const side = b.dataset.side;
    if (sel[side] === b) { b.setAttribute("aria-pressed", "false"); sel[side] = null; return; }
    sel[side]?.setAttribute("aria-pressed", "false");
    sel[side] = b;
    b.setAttribute("aria-pressed", "true");
    sfx.select();
    if (sel.t && sel.d) {
      const a = sel.t, c = sel.d;
      sel = { t: null, d: null };
      if (a.dataset.i === c.dataset.i) {
        matched++;
        sfx.pair();
        [a, c].forEach((x) => { x.setAttribute("aria-pressed", "false"); x.classList.add("is-correct"); restartAnim(x, "pop"); x.disabled = true; });
        setTimeout(() => [a, c].forEach((x) => x.classList.add("is-done")), 450);
        if (matched === step.pairs.length) {
          // A mix-up is a wrong answer for that term: it comes back later, and the stars count it.
          const seenT = new Set();
          const lines = mixups.filter(([i]) => !seenT.has(i) && seenT.add(i)).map(([i, d]) => {
            const p = step.pairs[i], other = step.pairs[d];
            const contrast = api.item(step.items[i])?.extra?.contrast?.[other.term];
            return `You matched <b>${esc(p.term)}</b> with “${esc(other.def)}”: that's <b>${esc(other.term)}</b>.${contrast ? ` ${esc(contrast)}` : ""}`;
          });
          setTimeout(() => api.complete(missed.size
            ? { ok: false, title: "All matched, with a mix-up", itemsWrong: [...missed].map((i) => step.items[i]), body: `<span class="feedback__tip">${lines.join("<br>")}</span>` }
            : { ok: true, body: `<span class="feedback__tip">All matched on the first go!</span>` }), 600);
        }
      } else {
        missed.add(+a.dataset.i);
        mixups.push([+a.dataset.i, +c.dataset.i]);
        sfx.wrong();
        [a, c].forEach((x) => { x.classList.add("is-wrong", "is-busy"); restartAnim(x, "shake"); });
        setTimeout(() => [a, c].forEach((x) => { x.classList.remove("is-wrong", "is-busy"); x.setAttribute("aria-pressed", "false"); }), 520);
      }
    }
  });
  const cards = [...$$('.match-card[data-side="t"]', node), ...$$('.match-card[data-side="d"]', node)];
  return {
    el: node,
    footer: { label: "Match them all", enabled: false },
    aside: ["skip"],
    onSkip() { api.next(); },
    onKey(k) { const b = cards[k - 1]; if (b && !b.disabled) { b.click(); b.focus({ preventScroll: true }); } },
  };
}

// ================================================================ write the formula
/** Tidy a typed formula: no spaces, capitals, the usual look-alike signs. */
export const normFormula = (s) => String(s).replace(/\s+/g, "").toUpperCase().replace(/[−–]/g, "-");

/** Kind feedback for a formula that isn't accepted. */
export function formulaTip(got, accept) {
  const want = accept[0];
  // Absolute references: a missing or half $.
  const bare = (f) => f.replace(/\$/g, "");
  if (want.includes("$") && accept.some((a) => bare(a) === bare(got))) {
    const ref = (/\$([A-Z])\$(\d+)/.exec(want) || []).slice(1).join("");
    if (!got.includes("$")) return { title: "Lock it!", tip: `Every row uses ${ref}, so it needs a $: $${ref[0]}$${ref.slice(1)}. On Windows: click the reference and press F4. On a Chromebook: type $ (Shift + 4).` };
    const over = (got.match(/\$[A-Z]\$\d+/g) || []).map(bare).filter((r) => r !== ref);
    if (over.length) return { title: "Too many $", tip: `Only ${ref} is shared by every row. ${over.join(" and ")} should move with the row, so leave it without $.` };
    return { title: "Almost!", tip: `Put a $ before the letter AND before the number: $${ref[0]}$${ref.slice(1)}. The other reference stays as it is, so it moves with the row.` };
  }
  if (!want.includes("$") && got.includes("$") && accept.includes(bare(got))) return { title: "No $ needed here", tip: "This one should move with the row when you fill it, so leave it relative (no $)." };
  if (got.includes("%")) return { tip: "Point at the cell that holds the percentage, so changing that one cell updates the answer." };
  if (!got.startsWith("=") && accept.includes(`=${got}`)) return { title: "Almost!", tip: `Start with = . Without it, ${got} is just text in the cell.` };
  if (/[A-Z]\d+X[A-Z]?\d+/.test(got) || got.includes("×")) return { tip: "Multiply with * (Shift + 8), never x." };
  if (got.includes("÷")) return { tip: "Divide with / , never ÷." };
  const m = /^=([A-Z]\d+)-([A-Z]\d+)$/.exec(want);
  if (m && got === `=${m[2]}-${m[1]}`) return { title: "Wrong way round", tip: `With − the order matters: what you have first (${m[1]}), then take away what you spend.` };
  if (/^=[\d+\-*/().]+$/.test(got)) return { tip: "Use the cell references, not the numbers in them, so the answer updates by itself." };
  // Functions: brackets, a colon, the right name.
  const fn = /^=([A-Z]+)\(([A-Z]\d+):([A-Z]\d+)\)$/.exec(want);
  if (fn) {
    const [, name, a, b] = fn;
    if (got.startsWith(`=${name}`) && got[name.length + 1] !== "(") return { tip: `A function's range goes in brackets: =${name}(first:last).` };
    if (got === `=${name}(${a}-${b})` || got === `=${name}(${a};${b})`) return { title: "Almost!", tip: `Put a colon (:) between the first and last cell: ${a}:${b} means ${a} to ${b}.` };
    const other = /^=(SUM|MAX|MIN|AVERAGE)\((.+)\)$/.exec(got);
    if (other && other[1] !== name && other[2] === `${a}:${b}`) return { title: "Another function", tip: "SUM adds up. MAX gives the highest. MIN gives the lowest. AVERAGE gives the mean." };
    if (name === "AVERAGE" && new RegExp(`^=SUM\\(${a}:${b}\\)/\\d+$`).test(got)) return { title: "Use AVERAGE", tip: "That works, but use the AVERAGE function here." };
  }
  // Order of operations: the same formula without its brackets.
  if (want.includes("(") && !/^=[A-Z]+\(/.test(want) && accept.some((a) => a.replace(/[()]/g, "") === got)) return { title: "Brackets!", tip: "× and ÷ go before + and −. Put brackets round the part that must go first." };
  return { tip: "" };
}

function formula(step, api) {
  const vis = step.visual ? renderVisual(step.visual) : null;
  const node = el(`
    <div class="ex ex-formula">
      ${head(step, esc(step.prompt), step.hint ? esc(step.hint) : "")}
      <div class="ex-visual"></div>
      <div class="type-field formula-field">
        <span class="formula-field__fx" aria-hidden="true">fx</span>
        <input class="type-input type-input--formula" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="40"
          aria-label="Your formula" placeholder="Type the formula">
      </div>
    </div>`);
  if (vis) $(".ex-visual", node).appendChild(vis.el); else $(".ex-visual", node).remove();
  const input = $(".type-input", node);
  input.addEventListener("input", () => api.enableCheck(input.value.trim().length > 0));
  const accept = step.accept.map(normFormula);
  return {
    el: node,
    footer: { label: "Check", enabled: false },
    aside: ["skip"],
    mount() { vis?.play?.(); setTimeout(() => input.focus({ preventScroll: true }), 320); },
    check({ skipped } = {}) {
      input.readOnly = true; input.blur();
      const got = normFormula(input.value);
      const ok = !skipped && accept.includes(got);
      const field = $(".type-field", node);
      if (!skipped) { field.classList.add(ok ? "is-correct" : "is-wrong"); if (!ok) restartAnim(field, "shake"); }
      if (ok) return { ok };
      const t = skipped ? { tip: "" } : formulaTip(got, accept);
      return { ok: false, title: t.title, answer: step.accept[0], body: t.tip ? `<span class="feedback__tip">${esc(t.tip)}</span>` : "" };
    },
  };
}

// ================================================================ fill the gaps (a definition's [[…]] words)
function gaps(step, api) {
  const item = api.item(step.item);
  const n = step.answers.length;
  let k = 0;
  const textHtml = esc(step.def).replace(/\[\[(.+?)\]\]/g, () => {
    const i = k++;
    return `<button type="button" class="gap" data-slot="${i}" aria-label="Gap ${i + 1}, empty"><span class="gap__n" aria-hidden="true">${i + 1}</span><span class="gap__text"></span></button>`;
  });
  const node = el(`
    <div class="ex ex-gaps">
      ${head(step, step.showTerm === false ? "Complete the definition" : `Complete the meaning of <span class="term-inline">${esc(item.term)}</span>`, n > 1 ? "Start with gap 1. Tap a filled gap to take its words back." : "Tap the words that fill the gap.")}
      <p class="gap-text">${textHtml}</p>
      <div class="chip-bank" role="group" aria-label="Words">
        ${step.chips.map((c, i) => `<span class="chip-slot"><button type="button" class="press word-chip" data-chip="${i}"><span class="face"><span class="key" aria-hidden="true">${i + 1}</span><span class="label">${esc(c)}</span></span></button></span>`).join("")}
      </div>
    </div>`);
  const slots = $$(".gap", node), chips = $$(".word-chip", node);
  const filled = Array(n).fill(null); // chip index per slot
  const order = [];                   // slots in the order they were filled (for Backspace)
  let active = 0;
  const firstEmpty = (from = 0) => { for (let j = 0; j < n; j++) { const i = (from + j) % n; if (filled[i] == null) return i; } return -1; };
  const render = () => {
    slots.forEach((s, i) => {
      const c = filled[i];
      s.querySelector(".gap__text").textContent = c == null ? "" : step.chips[c];
      s.classList.toggle("is-filled", c != null);
      s.classList.toggle("is-active", i === active && c == null && !node.classList.contains("is-locked"));
      s.setAttribute("aria-label", `Gap ${i + 1}, ${c == null ? "empty" : step.chips[c]}`);
    });
    chips.forEach((b, i) => { const used = filled.includes(i); b.classList.toggle("is-used", used); b.disabled = used; });
    api.enableCheck(filled.every((c) => c != null));
  };
  const place = (ci) => {
    if (node.classList.contains("is-locked") || filled.includes(ci)) return;
    const slot = filled[active] == null ? active : firstEmpty(active);
    if (slot < 0) return;
    filled[slot] = ci; order.push(slot);
    sfx.tap();
    restartAnim(slots[slot], "pop");
    active = firstEmpty(slot + 1);
    if (active < 0) active = slot;
    render();
  };
  const unplace = (slot) => {
    if (node.classList.contains("is-locked") || filled[slot] == null) return;
    filled[slot] = null; order.splice(order.lastIndexOf(slot), 1);
    active = slot;
    sfx.tap();
    render();
  };
  node.addEventListener("click", (e) => {
    const ch = e.target.closest(".word-chip"), gp = e.target.closest(".gap");
    if (ch) place(+ch.dataset.chip);
    else if (gp) { const i = +gp.dataset.slot; if (filled[i] != null) unplace(i); else { active = i; render(); } }
  });
  render();
  return {
    el: node,
    footer: { label: "Check", enabled: false },
    aside: ["skip"],
    onKey(key) {
      if (key === "Backspace") { if (order.length) unplace(order[order.length - 1]); return; }
      const b = chips[key - 1];
      if (b && !b.disabled) place(+b.dataset.chip);
    },
    check({ skipped } = {}) {
      node.classList.add("is-locked");
      const right = (i) => filled[i] != null && step.chips[filled[i]].toLowerCase() === step.answers[i].toLowerCase();
      const ok = !skipped && step.answers.every((_, i) => right(i));
      slots.forEach((s, i) => { s.classList.remove("is-active"); s.classList.add(right(i) ? "is-right" : "is-off"); });
      chips.forEach((b) => (b.disabled = true));
      return { ok, explain: null, body: `<span class="feedback__def feedback__def--full"><b>${esc(item.term)}:</b> ${rich(item.def)}</span>` };
    },
  };
}

// ================================================================ lock the reference (tap a reference to add $, like F4)
const REF_RE = /\$?[A-Z]\$?\d+/g;
const lockedRef = (r) => `$${r[0]}$${r.slice(1)}`;
function lockRef(step, api) {
  const vis = step.visual ? renderVisual(step.visual) : null;
  // The formula as text pieces and reference buttons.
  const parts = [];
  let last = 0;
  for (const m of step.formula.matchAll(REF_RE)) {
    if (m.index > last) parts.push({ text: step.formula.slice(last, m.index) });
    parts.push({ ref: m[0].replace(/\$/g, "") });
    last = m.index + m[0].length;
  }
  if (last < step.formula.length) parts.push({ text: step.formula.slice(last) });
  const refs = parts.filter((p) => p.ref).map((p) => p.ref);
  const locked = new Set();
  let k = 0;
  const node = el(`
    <div class="ex ex-lock">
      ${head(step, esc(step.prompt), "Tap a reference to lock it with $. Tap again to unlock it.")}
      <div class="ex-visual"></div>
      <div class="lock-bar" role="group" aria-label="The formula">
        <span class="lock-bar__fx" aria-hidden="true">fx</span>
        <span class="lock-bar__f">${parts.map((p) => p.text != null ? `<span class="lock-op">${esc(p.text)}</span>` : `<button type="button" class="press lock-ref" data-ref="${p.ref}" aria-pressed="false"><span class="face"><span class="key" aria-hidden="true">${++k}</span><span class="lock-ref__t">${p.ref}</span></span></button>`).join("")}</span>
      </div>
      <p class="lock-hint">${icon("lightbulb", 18, 2.5)}<span>On Windows: click the reference in the formula and press <b>F4</b>. On a Chromebook: type <b>$</b> (Shift + 4).</span></p>
    </div>`);
  if (vis) $(".ex-visual", node).appendChild(vis.el); else $(".ex-visual", node).remove();
  const btns = $$(".lock-ref", node);
  const render = () => btns.forEach((b) => {
    const on = locked.has(b.dataset.ref);
    b.setAttribute("aria-pressed", String(on));
    b.querySelector(".lock-ref__t").textContent = on ? lockedRef(b.dataset.ref) : b.dataset.ref;
    b.setAttribute("aria-label", `${b.dataset.ref}, ${on ? "locked" : "not locked"}`);
  });
  const toggle = (b) => {
    if (b.disabled) return;
    const r = b.dataset.ref;
    if (locked.has(r)) locked.delete(r); else locked.add(r);
    sfx.select();
    restartAnim(b, "pop");
    render();
    api.enableCheck(true);
  };
  btns.forEach((b) => b.addEventListener("click", () => toggle(b)));
  render();
  const text = (lockSet) => parts.map((p) => (p.text != null ? p.text : lockSet.has(p.ref) ? lockedRef(p.ref) : p.ref)).join("");
  return {
    el: node,
    footer: { label: "Check", enabled: false },
    aside: ["skip"],
    mount() { vis?.play?.(); },
    onKey(n) { const b = btns[n - 1]; if (b) { toggle(b); b.focus({ preventScroll: true }); } },
    check({ skipped } = {}) {
      btns.forEach((b) => (b.disabled = true));
      const want = new Set(step.lock);
      const ok = !skipped && refs.every((r) => want.has(r) === locked.has(r));
      btns.forEach((b) => { const r = b.dataset.ref; if (want.has(r) === locked.has(r)) { if (want.has(r)) b.classList.add("is-correct"); } else b.classList.add("is-wrong"); });
      if (ok) return { ok, body: `<span class="feedback__tip">${esc(text(want))}: ${esc(step.lock.map(lockedRef).join(", "))} stays put, the rest moves with the row.</span>` };
      const shared = step.lock.filter((r) => !locked.has(r)), extra = [...locked].filter((r) => !want.has(r));
      let tip = "";
      if (skipped) tip = "";
      else if (shared.length && !extra.length) tip = `Every row uses ${shared.join(" and ")}, so lock it.`;
      else if (extra.length && !shared.length) tip = `${extra.join(" and ")} should move with the row: each row uses its own. Leave it without $.`;
      else tip = `Lock the one cell every row shares (${step.lock.join(", ")}). Leave the others to move with the row.`;
      return { ok: false, answer: text(want), body: tip ? `<span class="feedback__tip">${esc(tip)}</span>` : "" };
    },
  };
}
