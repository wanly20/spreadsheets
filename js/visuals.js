// Pictures for learn cards and questions. Each visual spec is an object with
// one (or two) of these keys, rendered in this order:
//   grid      a mini spreadsheet (js/grid.js spec)
//   image     a real screenshot from content/screens.js (+ highlight: region)
//   icons     [[screenId, label], …] toolbar buttons from the screenshots
//   keys      ["Ctrl", "Z"] keycaps
//   tabs      { tabs, active, highlight, editing, dragging, colours } the sheet tabs bar
//   tabmenu   { tab, highlight } a tab with its two-finger-tap menu open
//   steps     ["Select the cells", "Choose a tool"]
//   fillDemo  { start, end } the fill handle, animated (with a replay button)
//   moveDemo  { from, to, value } moving a cell, animated
// renderVisual() returns { el, play?(), grid?, hits? } (hits: clickable parts for hotspot questions).
import { esc, el } from "./ui.js";
import { icon } from "./icons.js";
import { createGrid } from "./grid.js";
import { screens } from "../content/screens.js";

export const TAB_MENU = ["Delete", "Duplicate", "Copy to", "Rename", "Change colour", "Protect sheet", "Hide sheet", "View comments", "Move right", "Move left"];
const SUBMENU = new Set(["Copy to", "Change colour"]);

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

  if (spec.image) {
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
