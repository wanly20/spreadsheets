// Pictures for learn cards and questions. Each visual spec is an object with
// one (or two) of these keys, rendered in this order:
//   grid      a mini spreadsheet (js/grid.js spec)
//   image     a real screenshot from content/screens.js (+ highlight: region)
//   icons     [[screenId, label], …] toolbar buttons from the screenshots
//   keys      ["Ctrl", "Z"] keycaps
//   tabs      { tabs, active, highlight, editing, dragging, colours } the sheet tabs bar
//   tabmenu   { tab, highlight } a tab with its two-finger-tap menu open
//   colheads  { n, highlight } column letters with the lines between them ("B|C") to tap
//   rowheads  { n, highlight } row numbers with the lines between them ("2|3")
//   steps     ["Select the cells", "Choose a tool"]
//   fillDemo  { start, end } the fill handle, animated (with a replay button)
//   moveDemo  { from, to, value } moving a cell, animated
//   menu      { open: "Data" | "Insert", sub, highlight } the menu bar, with one menu open (sub: Data's Sort range menu)
//   dataMenu  { open, sub, highlight } the same, with the Data menu (Lesson 6)
//   sortWindow { range, header, by, col, dir, then: { by, col, dir }, highlight } the sort window (simplified)
//   chart     a drawn chart (js/charts.js); charts: [chart + caption, …] side by side
//   chartOnSheet { grid, chart, at: "over" | "beside" } a chart over (or beside) a table (js/charts.js)
//
// A drawn picture of Sheets usually comes through content/screens.js (`drawn:`), so a real
// screenshot can replace it later without touching the exercises: see drawnHits().
// renderVisual() returns { el, play?(), grid?, hits? } (hits: clickable parts for hotspot questions).
import { esc, el } from "./ui.js";
import { icon } from "./icons.js";
import { createGrid } from "./grid.js";
import { screens } from "../content/screens.js";
import { chartEl, chartsRow, chartOnSheet, chartHits, chartPartLabel } from "./charts.js";

export const TAB_MENU = ["Delete", "Duplicate", "Copy to", "Rename", "Change colour", "Protect sheet", "Hide sheet", "View comments", "Move right", "Move left"];
const SUBMENU = new Set(["Copy to", "Change colour"]);

// Data → Sort range → Advanced range sorting options (a few of the Data menu's items).
export const MENU_BAR = ["File", "Edit", "View", "Insert", "Format", "Data", "Tools", "Extensions", "Help"];
export const DATA_MENU = ["Sort sheet", "Sort range", "Create a filter", "Named ranges", "Data validation"];
export const DATA_SUB = ["Sort range by column A (A to Z)", "Sort range by column A (Z to A)", "Advanced range sorting options"];
// Insert → Chart (a few of the Insert menu's items).
export const INSERT_MENU = ["Rows", "Columns", "Sheet", "Chart", "Image", "Function", "Checkbox"];
const MENUS = { Data: DATA_MENU, Insert: INSERT_MENU };
const menuSpec = (spec = {}) => ({ ...spec, open: spec.open === true ? "Data" : spec.open || null });
/** What you can tap in a menu picture. */
export const menuHits = (spec = {}) => { const m = menuSpec(spec); return m.open ? [...MENUS[m.open], ...(m.sub && m.open === "Data" ? DATA_SUB : [])] : MENU_BAR; };
export const dataMenuHits = menuHits;
export const SORT_WINDOW_LABEL = {
  "Data has header row": "the Data has header row box",
  "Sort by": "the Sort by list",
  "A to Z": "A to Z",
  "Z to A": "Z to A",
  "Add another sort column": "Add another sort column",
  Cancel: "the Cancel button",
  Sort: "the Sort button",
};
export const sortWindowHits = () => Object.keys(SORT_WINDOW_LABEL);

/** The one kind of drawn picture in a visual spec (menu, sortWindow, chart). */
const DRAWN = ["menu", "dataMenu", "sortWindow", "chart"];
export const drawnKind = (spec = {}) => DRAWN.find((k) => spec[k]);
/** What you can tap in a drawn picture (also what a real screenshot's regions must be called). */
export function drawnHits(spec = {}) {
  const k = drawnKind(spec), v = spec[k];
  if (k === "menu" || k === "dataMenu") return menuHits(v);
  if (k === "sortWindow") return sortWindowHits(v);
  if (k === "chart") return chartHits(v);
  return [];
}
/** How feedback names a part of a drawn picture ("You tapped …"). */
export function drawnLabel(spec = {}, id) {
  const k = drawnKind(spec);
  if (k === "menu" || k === "dataMenu") return MENU_BAR.includes(id) ? `the ${id} menu` : id;
  if (k === "sortWindow") return SORT_WINDOW_LABEL[id] || id;
  if (k === "chart") return chartPartLabel(id);
  return id;
}
/** A drawn picture with one of its parts ringed. */
const withHighlight = (spec, highlight) => { const k = drawnKind(spec); return highlight && k ? { ...spec, [k]: { ...spec[k], highlight } } : spec; };

/** Worked out like Google Sheets: one cell copies; two numbers continue the step. */
export function fillValues(start, count) {
  if (start.length === 1 || typeof start[0] !== "number" || typeof start[1] !== "number") {
    return Array.from({ length: count }, (_, i) => start.length === 1 ? start[0] : start[i % start.length]);
  }
  const step = start[1] - start[0];
  return Array.from({ length: count }, (_, i) => start[start.length - 1] + step * (i + 1));
}

export function renderVisual(spec = {}, { interactiveHits = false } = {}) {
  const wrap = el(`<div class="visual"></div>`);
  const out = { el: wrap, hits: [] };
  const plays = [];

  if (spec.image && screens[spec.image]?.drawn) {
    // Not photographed yet: draw it (see content/screens.js).
    wrap.appendChild(renderVisual(withHighlight(screens[spec.image].drawn, spec.highlight), { interactiveHits }).el);
  } else if (spec.image) {
    const s = screens[spec.image];
    const box = el(`<figure class="shot" style="--ar:${s.w}/${s.h};--w:${s.w}px">
      <img src="${s.src}" alt="${esc(s.alt)}" width="${s.w}" height="${s.h}" draggable="false">
    </figure>`);
    if (spec.highlight) {
      const [x, y, w, h] = s.regions[spec.highlight].r;
      box.appendChild(el(`<span class="shot-ring" style="left:${(x / s.w) * 100}%;top:${(y / s.h) * 100}%;width:${(w / s.w) * 100}%;height:${(h / s.h) * 100}%"></span>`));
    }
    wrap.appendChild(box);
  }
  if (spec.icons) {
    wrap.appendChild(el(`<div class="tool-icons">${spec.icons.map(([id, label]) =>
      `<figure class="tool-icon"><img src="assets/screens/${id}.webp" alt="" draggable="false"><figcaption>${esc(label)}</figcaption></figure>`).join("")}</div>`));
  }
  if (spec.grid) {
    const g = createGrid(spec.grid);
    out.grid = g;
    wrap.appendChild(g.el);
  }
  if (spec.keys) wrap.appendChild(el(`<div class="keycaps" aria-label="${esc(spec.keys.join(" + "))}">${keycaps(spec.keys)}</div>`));
  if (spec.tabs) wrap.appendChild(tabsBar(spec.tabs));
  if (spec.tabmenu) wrap.appendChild(tabMenu(spec.tabmenu));
  if (spec.colheads) wrap.appendChild(headStrip("col", spec.colheads));
  if (spec.rowheads) wrap.appendChild(headStrip("row", spec.rowheads));
  if (spec.steps) {
    wrap.appendChild(el(`<ol class="step-chips">${spec.steps.map((s, i) => `${i ? `<li class="step-chips__arrow" aria-hidden="true">${icon("arrow-right", 22, 2.75)}</li>` : ""}<li class="step-chip"><b>${i + 1}</b>${esc(s)}</li>`).join("")}</ol>`));
  }
  if (spec.fillDemo) {
    const { start, end } = spec.fillDemo;
    const g = createGrid({ cols: 3, rows: end, cells: {} });
    out.grid = g;
    const run = () => g.animateFill("B", 1, start, fillValues(start, end - start.length));
    plays.push(run);
    wrap.appendChild(g.el);
    wrap.appendChild(replayButton(run));
  }
  if (spec.moveDemo) {
    const { from, to, value } = spec.moveDemo;
    const g = createGrid({ cols: 5, rows: 5, cells: { [from]: value } });
    out.grid = g;
    const run = async () => { g.reset({ [from]: value }); await g.animateMove(from, to); };
    plays.push(run);
    wrap.appendChild(g.el);
    wrap.appendChild(replayButton(run));
  }
  if (spec.dataMenu) wrap.appendChild(dataMenu(spec.dataMenu));
  if (spec.menu) wrap.appendChild(dataMenu(spec.menu));
  if (spec.sortWindow) wrap.appendChild(sortWindow(spec.sortWindow));
  if (spec.chart) wrap.appendChild(chartEl(spec.chart, { hits: interactiveHits }));
  if (spec.charts) wrap.appendChild(chartsRow(spec.charts));
  if (spec.chartOnSheet) {
    const g = createGrid(spec.chartOnSheet.grid);
    wrap.appendChild(chartOnSheet({ ...spec.chartOnSheet, gridEl: g.el }));
  }
  out.hits = [...wrap.querySelectorAll("[data-hit]")];
  if (!interactiveHits) out.hits.forEach((h) => h.setAttribute("tabindex", "-1"));
  out.play = () => plays.forEach((p) => p());
  return out;
}

function replayButton(run) {
  const b = el(`<button class="btn-text replay" type="button">${icon("rotate-ccw", 18, 2.75)} Watch again</button>`);
  let busy = false;
  b.addEventListener("click", async () => { if (busy) return; busy = true; await run(); busy = false; });
  return b;
}

export function keycaps(keys) {
  return keys.map((k, i) => `${i ? `<span class="keycap-plus" aria-hidden="true">+</span>` : ""}<kbd class="keycap ${k.length > 2 ? "keycap--wide" : ""}">${esc(k)}</kbd>`).join("");
}

/** The sheet tabs bar at the bottom of Google Sheets. */
export function tabsBar({ tabs, active = 0, highlight, editing = -1, dragging = -1, colours = [] }) {
  return el(`
    <div class="tabs-bar" role="group" aria-label="Sheet tabs">
      <button type="button" class="tabs-bar__btn ${highlight === "+" ? "is-ring" : ""}" data-hit="+" aria-label="Add sheet">${icon("plus", 20, 2.5)}</button>
      <button type="button" class="tabs-bar__btn tabs-bar__btn--menu" data-hit="All sheets" aria-label="All sheets">${icon("menu", 20, 2.5)}</button>
      ${tabs.map((t, i) => `
        <button type="button" class="sheet-tab ${i === active ? "is-active" : ""} ${i === editing ? "is-editing" : ""} ${i === dragging ? "is-dragging" : ""}" data-hit="${esc(t)}" ${colours[i] ? `style="--tab-c:${colours[i]}"` : ""}>
          <span class="sheet-tab__name">${esc(t)}</span>${i === editing ? "" : icon("chevron-down", 14, 2.5)}
        </button>`).join("")}
    </div>`);
}

/** A tab with its menu open (two-finger tap on a Chromebook = right-click). */
export function tabMenu({ tab, highlight }) {
  return el(`
    <div class="tab-menu-scene">
      <div class="tab-menu" role="menu" aria-label="Menu for the ${esc(tab)} tab">
        ${TAB_MENU.map((m) => `<button type="button" role="menuitem" class="tab-menu__item ${m === highlight ? "is-ring" : ""}" data-hit="${esc(m)}">
          <span>${esc(m)}</span>${SUBMENU.has(m) ? icon("chevron-right", 16, 2.5) : ""}</button>`).join("")}
      </div>
      <div class="tabs-bar tabs-bar--mini">
        <span class="tabs-bar__btn" aria-hidden="true">${icon("plus", 20, 2.5)}</span>
        <span class="sheet-tab is-active is-pressed"><span class="sheet-tab__name">${esc(tab)}</span>${icon("chevron-down", 14, 2.5)}</span>
      </div>
    </div>`);
}

/** Column letters (or row numbers) with the dividing lines you drag to resize. */
export function headStrip(kind, { n = 4, highlight } = {}) {
  const names = Array.from({ length: n }, (_, i) => (kind === "col" ? String.fromCharCode(65 + i) : String(i + 1)));
  const parts = [];
  names.forEach((x, i) => {
    parts.push(`<button type="button" class="head-cell" data-hit="${x}" aria-label="${kind === "col" ? "Column" : "Row"} ${x}">${x}</button>`);
    if (i < n - 1) {
      const line = `${x}|${names[i + 1]}`;
      parts.push(`<button type="button" class="head-line ${highlight === line ? "is-ring" : ""}" data-hit="${line}" aria-label="The line between ${x} and ${names[i + 1]}"><span></span></button>`);
    }
  });
  return el(`<div class="head-strip head-strip--${kind}" role="group" aria-label="${kind === "col" ? "Column letters" : "Row numbers"}">${parts.join("")}</div>`);
}

/** The menu bar, with the Data or Insert menu open (and Data's Sort range menu). */
export function dataMenu(spec = {}) {
  const { open, sub = false, highlight } = menuSpec(spec);
  const items = MENUS[open] || [];
  const ring = (x) => (x === highlight ? "is-ring" : "");
  const bar = MENU_BAR.map((m) => open
    ? `<span class="menu-bar__item ${m === open ? "is-open" : ""}">${esc(m)}</span>`
    : `<button type="button" class="menu-bar__item ${ring(m)}" data-hit="${esc(m)}">${esc(m)}</button>`).join("");
  const item = (m, more) => `<button type="button" role="menuitem" class="tab-menu__item ${ring(m)} ${sub && m === "Sort range" ? "is-open" : ""}" data-hit="${esc(m)}"><span>${esc(m)}</span>${more ? icon("chevron-right", 16, 2.5) : ""}</button>`;
  return el(`
    <div class="data-menu-scene">
      <div class="menu-bar" role="group" aria-label="Menu bar">${bar}</div>
      ${open ? `<div class="data-menus data-menus--${open.toLowerCase()}">
        <div class="tab-menu data-menu data-menu--${open.toLowerCase()}" role="menu" aria-label="${open} menu">${items.map((m) => item(m, open === "Data" ? m.startsWith("Sort") : ["Rows", "Columns"].includes(m))).join("")}</div>
        ${sub ? `<div class="tab-menu data-menu data-menu--sub" role="menu" aria-label="Sort range menu">${DATA_SUB.map((m) => item(m)).join("")}</div>` : ""}
      </div>` : ""}
    </div>`);
}

/** The sort window (simplified, like the slide): header tick, Sort by, A to Z / Z to A, Sort. */
export function sortWindow({ range = "A1 to B7", header = true, by = "Hours", col = "B", dir = "az", then, highlight } = {}) {
  const ring = (x) => (x === highlight ? "is-ring" : "");
  const radios = (d, hits) => ["az", "za"].map((x) => {
    const label = x === "az" ? "A to Z" : "Z to A";
    const dot = `<span class="sortwin__dot ${x === d ? "is-on" : ""}" aria-hidden="true"></span>`;
    return hits ? `<button type="button" class="sortwin__radio ${ring(label)}" data-hit="${label}" aria-label="${label}${x === d ? ", chosen" : ""}">${dot}${label}</button>`
      : `<span class="sortwin__radio">${dot}${label}</span>`;
  }).join("");
  return el(`
    <div class="sortwin" role="group" aria-label="Sort range window">
      <p class="sortwin__title">Sort range from ${esc(range)}</p>
      <button type="button" class="sortwin__tick ${ring("Data has header row")}" data-hit="Data has header row" aria-label="Data has header row, ${header ? "ticked" : "not ticked"}">
        <span class="sortwin__box ${header ? "is-on" : ""}" aria-hidden="true">${header ? icon("check", 14, 3.5) : ""}</span>Data has header row</button>
      <div class="sortwin__row">
        <span class="sortwin__label">Sort by</span>
        <button type="button" class="sortwin__select ${ring("Sort by")}" data-hit="Sort by">${esc(header ? by : `Column ${col}`)}${icon("chevron-down", 14, 2.5)}</button>
        <span class="sortwin__dirs">${radios(dir, true)}</span>
      </div>
      ${then ? `<div class="sortwin__row">
        <span class="sortwin__label">then by</span>
        <span class="sortwin__select">${esc(header ? then.by : `Column ${then.col}`)}${icon("chevron-down", 14, 2.5)}</span>
        <span class="sortwin__dirs">${radios(then.dir, false)}</span>
      </div>` : ""}
      <button type="button" class="sortwin__add ${ring("Add another sort column")}" data-hit="Add another sort column">${icon("plus", 16, 2.75)} Add another sort column</button>
      <div class="sortwin__foot">
        <button type="button" class="sortwin__btn ${ring("Cancel")}" data-hit="Cancel">Cancel</button>
        <button type="button" class="sortwin__btn sortwin__btn--sort ${ring("Sort")}" data-hit="Sort">Sort</button>
      </div>
    </div>`);
}
