// Small DOM helpers shared by every screen.
import { icon } from "./icons.js";
import { MASCOT, mascotSrc } from "./brand.js";

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/** Definition text: [[words]] (the words blanked in revision prompts) are
 *  shown highlighted, never as brackets. */
export function rich(text) {
  return esc(text).replace(/\[\[(.+?)\]\]/g, (_, w) => `<b class="hl">${w}</b>`);
}

/** Plain text of a definition: the [[ ]] marks removed. */
export function plain(text) {
  return String(text).replace(/\[\[(.+?)\]\]/g, "$1");
}

export function html(strings, ...vals) {
  return strings.reduce((a, s, i) => a + s + (i < vals.length ? vals[i] : ""), "");
}

export function el(markup) {
  const t = document.createElement("template");
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

/** A 3D press button. variant: primary | secondary | correct | wrong | blue | yellow | on-color */
export function button(label, { variant = "primary", block = true, attrs = "", ico = "" } = {}) {
  return `<button class="press btn btn--${variant} ${block ? "btn--block" : ""}" ${attrs}><span class="face">${ico ? icon(ico, 22, 2.75) : ""}<span>${label}</span></span></button>`;
}

/** The bottom button bar. On phones only `main` shows (full width); from 700px
 *  it becomes a full-width bar with `aside` (secondary actions) on the left. */
export function footBar(main, aside = "") {
  return `<footer class="lesson-foot"><div class="lesson-foot__inner"><div class="lesson-foot__aside">${aside}</div><div class="lesson-foot__main">${main}</div></div></footer>`;
}

export function mascotImg(pose = "explain", cls = "char") {
  return `<img class="${cls}" src="${mascotSrc(pose)}" alt="${esc(MASCOT.name)} the ${MASCOT.species}" draggable="false">`;
}

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

export function restartAnim(node, cls) {
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
  node.addEventListener("animationend", () => node.classList.remove(cls), { once: true });
}

export function countUp(node, to, ms = 900) {
  if (reducedMotion() || to === 0) { node.textContent = to; return; }
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / ms);
    node.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---------------------------------------------------------------- toast
export function toast(message, ico = "sparkles", ms = 2600) {
  const app = document.getElementById("app");
  let wrap = app.querySelector(".toast-wrap");
  if (!wrap) { wrap = el(`<div class="toast-wrap" role="status" aria-live="polite"></div>`); app.appendChild(wrap); }
  wrap.innerHTML = "";
  const t = el(`<div class="toast">${icon(ico, 20)}<span>${message}</span></div>`);
  wrap.appendChild(t);
  setTimeout(() => { t.classList.add("is-leaving"); t.addEventListener("animationend", () => t.remove(), { once: true }); }, ms);
}

// ---------------------------------------------------------------- modal sheet
export function openModal(content, { label = "Dialog", onClose } = {}) {
  const app = document.getElementById("app");
  const scrim = el(`<div class="scrim"></div>`);
  const sheet = el(`<div class="sheet modal" role="dialog" aria-modal="true" aria-label="${esc(label)}"><div class="modal__grip"></div></div>`);
  sheet.appendChild(typeof content === "string" ? el(`<div>${content}</div>`) : content);
  app.append(scrim, sheet);
  const prevFocus = document.activeElement;
  requestAnimationFrame(() => requestAnimationFrame(() => { scrim.classList.add("is-open"); sheet.classList.add("is-open"); }));
  const close = () => {
    scrim.classList.remove("is-open");
    sheet.classList.remove("is-open");
    document.removeEventListener("keydown", onKey, true);
    setTimeout(() => { scrim.remove(); sheet.remove(); }, 320);
    prevFocus?.focus?.({ preventScroll: true });
    onClose?.();
  };
  const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
  document.addEventListener("keydown", onKey, true);
  scrim.addEventListener("click", close);
  setTimeout(() => sheet.querySelector("button")?.focus({ preventScroll: true }), 60);
  return { sheet, close };
}
