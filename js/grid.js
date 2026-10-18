// A small interactive spreadsheet that looks like Google Sheets: column
// letters, row numbers, a blue selection with the round fill handle, and an
// optional Name Box + formula bar. Used for demos and exercises.
//
//   const g = createGrid(spec, { mode, onChange })
//   spec: { cols, rows, cells: { A1: "Item", B2: 5 }, style: { A1: { b, bg, color } },
//           sel: "C5" | "C2:C7" | "C:C" | "3:3", nameBox: true | "text", formula: "=B2*C2",
//           handle: true }
//   spec.also: ["E3:E9"] more selected ranges (shown with Ctrl, as two separate ranges)
//   mode: "static" | "click" (cells, headers, fill handle) | "range" (drag to select)
//         | "multi" (drag a range; hold Ctrl, or ctrlHeld(), to add another) | "move" (drag a cell to a new place)
//   In multi mode, keyboard: Shift + arrows select; hold Ctrl and use the arrows (with Shift) for the next range.
//   Keyboard: arrows move, Shift+arrows extend (range), Space picks up / drops (move).
//   In click mode: Up from row 1 = the column letter, Left from column A = the row
//   number, Space = grab the fill handle of the selection.
import { esc, el, reducedMotion } from "./ui.js";
import { icon } from "./icons.js";

export const colLetter = (c) => String.fromCharCode(65 + c);
export const colIndex = (L) => L.toUpperCase().charCodeAt(0) - 65;

export function parseRef(ref) {
  const m = /^([A-Za-z])(\d+)$/.exec(String(ref).trim());
  return m ? { c: colIndex(m[1]), r: +m[2] } : null;
}

/** "C5" | "C2:C7" | "C:C" | "3:3" | {c1,r1,c2,r2} → normalised box, or null. */
export function parseSel(sel, spec = { cols: 26, rows: 99 }) {
  if (!sel) return null;
  if (typeof sel === "object") return { ...sel };
  const s = String(sel).trim().toUpperCase();
  let m;
  if ((m = /^([A-Z]):([A-Z])$/.exec(s))) {
    const a = colIndex(m[1]), b = colIndex(m[2]);
    return { c1: Math.min(a, b), c2: Math.max(a, b), r1: 1, r2: spec.rows, kind: "col" };
  }
  if ((m = /^(\d+):(\d+)$/.exec(s))) {
    const a = +m[1], b = +m[2];
    return { c1: 0, c2: spec.cols - 1, r1: Math.min(a, b), r2: Math.max(a, b), kind: "row" };
  }
  const [p, q] = s.split(":");
  const a = parseRef(p), b = q ? parseRef(q) : a;
  if (!a || !b) return null;
  return { c1: Math.min(a.c, b.c), c2: Math.max(a.c, b.c), r1: Math.min(a.r, b.r), r2: Math.max(a.r, b.r), kind: q && (a.c !== b.c || a.r !== b.r) ? "range" : "cell" };
}

export function selText(box) {
  if (!box) return "";
  if (box.kind === "col") return `${colLetter(box.c1)}:${colLetter(box.c2)}`;
  if (box.kind === "row") return `${box.r1}:${box.r2}`;
  const a = `${colLetter(box.c1)}${box.r1}`, b = `${colLetter(box.c2)}${box.r2}`;
  return a === b ? a : `${a}:${b}`;
}

const sameBox = (a, b) => a && b && a.c1 === b.c1 && a.c2 === b.c2 && a.r1 === b.r1 && a.r2 === b.r2;
export { sameBox };

export function createGrid(spec, { mode = "static", onChange, label = "Spreadsheet", ctrlHeld = () => false } = {}) {
  const cols = spec.cols || 5, rows = spec.rows || 6;
  const S = { cols, rows };
  let cells = { ...(spec.cells || {}) };
  const style = { ...(spec.style || {}) };
  let sel = parseSel(spec.sel, S);
  let also = (spec.also || []).map((x) => parseSel(x, S)); // the other selected ranges (Ctrl)
  const showBar = spec.nameBox != null && spec.nameBox !== false || spec.formula != null;

  // Column widths (relative) and row heights (px), as in Google Sheets.
  function tracks() {
    const w = Array.from({ length: cols }, (_, c) => `minmax(0, ${spec.widths?.[colLetter(c)] ?? 1}fr)`).join(" ");
    const h = Array.from({ length: rows }, (_, r) => (spec.heights?.[r + 1] === "auto" ? "minmax(var(--rh), auto)" : spec.heights?.[r + 1] ? `${spec.heights[r + 1]}px` : "var(--rh)")).join(" ");
    return `--col-tracks:${w};--row-tracks:${h}`;
  }
  const merges = (spec.merges || []).map((m) => parseSel(m, { cols, rows }));
  const coveredBy = (c, r) => merges.find((m) => c >= m.c1 && c <= m.c2 && r >= m.r1 && r <= m.r2);

  const root = el(`
    <div class="msheet msheet--${mode}" style="--cols:${cols};--rows:${rows};${tracks()}">
      ${showBar ? `<div class="sheet-bar" aria-hidden="true">
        <div class="sheet-namebox"><span class="sheet-namebox__text"></span>${icon("chevron-down", 14, 2.5)}</div>
        <div class="sheet-fx"><i>fx</i><span class="sheet-fx__text"></span></div>
      </div>` : ""}
      <div class="sheet-grid" ${mode === "static" ? 'aria-hidden="true"' : `tabindex="0" role="application" aria-label="${esc(label)}"`}>
        <div class="sh-corner" style="grid-area:1/1"></div>
        ${Array.from({ length: cols }, (_, c) => `<div class="sh-col" data-col="${c}" style="grid-area:1/${c + 2}">${colLetter(c)}</div>`).join("")}
        ${Array.from({ length: rows }, (_, r) => `<div class="sh-row ${spec.frozen === r + 1 ? "is-frozen" : ""}" data-row="${r + 1}" style="grid-area:${r + 2}/1">${spec.rowLabels?.[r] ?? r + 1}</div>`).join("")}
        ${Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => `<div class="sh-cell" data-ref="${colLetter(c)}${r + 1}" style="grid-area:${r + 2}/${c + 2}"></div>`).join("")).join("")}
        <div class="sh-sel" hidden><span class="sh-handle" data-handle></span></div>
      </div>
      <p class="sr-only sheet-live" aria-live="polite"></p>
    </div>`);
  const grid = root.querySelector(".sheet-grid");
  const selEl = root.querySelector(".sh-sel");
  const live = root.querySelector(".sheet-live");
  const cellEl = (ref) => grid.querySelector(`.sh-cell[data-ref="${ref}"]`);

  function paintCells() {
    grid.querySelectorAll(".sh-cell").forEach((d) => {
      const ref = d.dataset.ref;
      const v = cells[ref];
      const st = style[ref] || {};
      d.textContent = v == null ? "" : String(v);
      d.classList.toggle("is-num", typeof v === "number");
      d.style.background = st.bg || "";
      d.style.color = st.color || "";
      d.style.fontWeight = st.b ? "700" : "";
      d.style.textAlign = st.align || "";
      d.style.justifyContent = st.align === "center" ? "center" : st.align === "right" ? "flex-end" : st.align === "left" ? "flex-start" : "";
      d.style.alignItems = st.valign === "top" ? "flex-start" : st.valign === "middle" ? "center" : "";
      d.classList.toggle("is-wrap", st.wrap === "wrap");
      d.classList.toggle("is-clip", st.wrap === "clip");
      d.classList.toggle("is-frozen", spec.frozen === +ref.slice(1));
      // Text longer than its cell spills into an empty cell next door (the default).
      const p = parseRef(ref), next = `${colLetter(p.c + 1)}${p.r}`;
      d.classList.toggle("is-spill", typeof v === "string" && v !== "" && !st.wrap && (cells[next] == null || cells[next] === "") && p.c + 1 < cols);
      const m = coveredBy(p.c, p.r);
      d.hidden = !!m && !(m.c1 === p.c && m.r1 === p.r);
      if (m && m.c1 === p.c && m.r1 === p.r) place(d, m);
    });
  }

  function place(node, box) {
    node.style.gridArea = `${box.r1 + 1} / ${box.c1 + 2} / ${box.r2 + 2} / ${box.c2 + 3}`;
  }

  function paintSel() {
    grid.querySelectorAll(".sh-col, .sh-row").forEach((h) => h.classList.remove("is-sel", "is-full"));
    grid.querySelectorAll(".sh-sel--also").forEach((x) => x.remove());
    for (const b of also) {
      const d = el(`<div class="sh-sel sh-sel--also is-multi"></div>`);
      place(d, b);
      grid.insertBefore(d, selEl);
      for (let c = b.c1; c <= b.c2; c++) grid.querySelector(`.sh-col[data-col="${c}"]`)?.classList.add("is-sel");
      for (let r = b.r1; r <= b.r2; r++) grid.querySelector(`.sh-row[data-row="${r}"]`)?.classList.add("is-sel");
    }
    if (!sel) { selEl.hidden = true; }
    else {
      selEl.hidden = false;
      place(selEl, sel);
      selEl.classList.toggle("is-multi", sel.c1 !== sel.c2 || sel.r1 !== sel.r2);
      selEl.querySelector(".sh-handle").hidden = spec.handle === false;
      for (let c = sel.c1; c <= sel.c2; c++) grid.querySelector(`.sh-col[data-col="${c}"]`)?.classList.add("is-sel", ...(sel.kind === "col" ? ["is-full"] : []));
      for (let r = sel.r1; r <= sel.r2; r++) grid.querySelector(`.sh-row[data-row="${r}"]`)?.classList.add("is-sel", ...(sel.kind === "row" ? ["is-full"] : []));
    }
    if (showBar) {
      const nb = root.querySelector(".sheet-namebox__text");
      nb.textContent = typeof spec.nameBox === "string" ? spec.nameBox : selText(sel);
      const fx = root.querySelector(".sheet-fx__text");
      fx.textContent = spec.formula != null ? spec.formula : sel ? (cells[`${colLetter(sel.c1)}${sel.r1}`] ?? "") : "";
    }
  }

  paintCells();
  paintSel();

  // ------------------------------------------------------------ marks (feedback boxes)
  function mark(box, kind = "ok") {
    const b = typeof box === "string" ? parseSel(box, S) : box;
    if (!b) return;
    const m = el(`<div class="sh-mark sh-mark--${kind}"></div>`);
    place(m, b);
    grid.appendChild(m);
  }
  function markHeader(kind, which, cls = "ok") {
    const h = grid.querySelector(kind === "col" ? `.sh-col[data-col="${which}"]` : `.sh-row[data-row="${which}"]`);
    h?.classList.add(`is-mark-${cls}`);
  }

  // ------------------------------------------------------------ interaction
  let locked = false;
  const setSel = (box, { announce = true } = {}) => {
    sel = box; paintSel();
    if (announce && box) live.textContent = `Selected ${selText(box)}`;
  };
  const cellAt = (x, y) => {
    const t = document.elementFromPoint(x, y);
    return t && grid.contains(t) ? t.closest(".sh-cell") : null;
  };
  const refBox = (ref) => parseSel(ref, S);

  if (mode === "click") {
    grid.addEventListener("click", (e) => {
      if (locked) return;
      const h = e.target.closest("[data-handle]");
      if (h) { onChange?.({ kind: "handle" }); h.classList.add("is-grabbed"); return; }
      const col = e.target.closest(".sh-col"), row = e.target.closest(".sh-row"), cell = e.target.closest(".sh-cell");
      grid.querySelectorAll(".is-grabbed").forEach((x) => x.classList.remove("is-grabbed"));
      if (col) { setSel(parseSel(`${colLetter(+col.dataset.col)}:${colLetter(+col.dataset.col)}`, S)); onChange?.({ kind: "col", col: colLetter(+col.dataset.col) }); }
      else if (row) { setSel(parseSel(`${row.dataset.row}:${row.dataset.row}`, S)); onChange?.({ kind: "row", row: +row.dataset.row }); }
      else if (cell) { setSel(refBox(cell.dataset.ref)); onChange?.({ kind: "cell", ref: cell.dataset.ref }); }
    });
  }

  let anchor = null, dragging = false, adding = false;
  const allSel = () => [...also, sel].filter(Boolean).map(selText);
  const report = () => (mode === "multi" ? onChange?.({ kind: "multi", boxes: allSel() }) : onChange?.({ kind: "range", sel: selText(sel) }));
  if (mode === "range" || mode === "multi") {
    grid.addEventListener("pointerdown", (e) => {
      if (locked || e.button > 0) return;
      const cell = e.target.closest(".sh-cell");
      if (!cell) return;
      e.preventDefault();
      grid.focus({ preventScroll: true });
      if (mode === "multi") {
        // Ctrl held: keep what's selected and start another range. Otherwise start again.
        if ((e.ctrlKey || e.metaKey || ctrlHeld()) && sel) { if (!also.some((b) => sameBox(b, sel))) also = [...also, sel]; }
        else also = [];
        adding = false;
      }
      anchor = parseRef(cell.dataset.ref);
      dragging = true;
      setSel(refBox(cell.dataset.ref), { announce: false });
      grid.setPointerCapture?.(e.pointerId);
    });
    grid.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const cell = cellAt(e.clientX, e.clientY);
      if (!cell) return;
      const p = parseRef(cell.dataset.ref);
      const box = { c1: Math.min(anchor.c, p.c), c2: Math.max(anchor.c, p.c), r1: Math.min(anchor.r, p.r), r2: Math.max(anchor.r, p.r) };
      box.kind = box.c1 === box.c2 && box.r1 === box.r2 ? "cell" : "range";
      if (!sameBox(box, sel)) setSel(box, { announce: false });
    });
    const end = () => { if (!dragging) return; dragging = false; live.textContent = `Selected ${allSel().join(" and ")}`; report(); };
    grid.addEventListener("pointerup", end);
    grid.addEventListener("pointercancel", end);
  }

  // Move: drag a cell (with a value) to another cell.
  let holding = null, ghost = null, target = null;
  function setTarget(ref) {
    grid.querySelector(".sh-drop")?.remove();
    target = ref;
    if (!ref) return;
    const d = el(`<div class="sh-drop"></div>`);
    place(d, refBox(ref));
    grid.appendChild(d);
  }
  function drop() {
    const from = holding, to = target;
    holding = null;
    ghost?.remove(); ghost = null;
    grid.classList.remove("is-holding");
    setTarget(null);
    if (!from || !to || from === to) { if (from) cellEl(from).classList.remove("is-lifted"); return; }
    cellEl(from).classList.remove("is-lifted");
    cells = { ...cells, [to]: cells[from] };
    delete cells[from];
    style[to] = style[from]; delete style[from];
    paintCells();
    setSel(refBox(to));
    onChange?.({ kind: "move", from, to });
  }
  if (mode === "move") {
    grid.addEventListener("pointerdown", (e) => {
      if (locked || e.button > 0) return;
      const cell = e.target.closest(".sh-cell");
      if (!cell || cells[cell.dataset.ref] == null || cells[cell.dataset.ref] === "") return;
      e.preventDefault();
      grid.focus({ preventScroll: true });
      holding = cell.dataset.ref;
      setSel(refBox(holding), { announce: false });
      cell.classList.add("is-lifted");
      grid.classList.add("is-holding");
      const gr = grid.getBoundingClientRect(), cr = cell.getBoundingClientRect();
      ghost = el(`<div class="sh-ghost">${esc(cells[holding])}</div>`);
      ghost.style.width = `${cr.width}px`;
      ghost.style.height = `${cr.height}px`;
      ghost.dataset.dx = e.clientX - cr.left; ghost.dataset.dy = e.clientY - cr.top;
      ghost.style.transform = `translate(${cr.left - gr.left}px, ${cr.top - gr.top}px)`;
      grid.appendChild(ghost);
      grid.setPointerCapture?.(e.pointerId);
    });
    grid.addEventListener("pointermove", (e) => {
      if (!holding || !ghost) return;
      const gr = grid.getBoundingClientRect();
      ghost.style.transform = `translate(${e.clientX - gr.left - ghost.dataset.dx}px, ${e.clientY - gr.top - ghost.dataset.dy}px)`;
      const cell = cellAt(e.clientX, e.clientY);
      setTarget(cell && cell.dataset.ref !== holding ? cell.dataset.ref : null);
    });
    grid.addEventListener("pointerup", (e) => { if (holding && ghost) { const cell = cellAt(e.clientX, e.clientY); setTarget(cell ? cell.dataset.ref : null); drop(); } });
    grid.addEventListener("pointercancel", () => { target = null; drop(); });
  }

  // Keyboard (all interactive modes).
  if (mode !== "static") {
    grid.addEventListener("keydown", (e) => {
      if (locked) return;
      const d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
      if (mode === "move" && e.key === " ") {
        e.preventDefault();
        if (!holding) {
          const ref = sel ? `${colLetter(sel.c1)}${sel.r1}` : null;
          if (ref && cells[ref] != null && cells[ref] !== "") { holding = ref; cellEl(ref).classList.add("is-lifted"); grid.classList.add("is-holding"); setTarget(ref); live.textContent = `Picked up ${ref}. Use the arrows, then Space to drop.`; }
        } else drop();
        return;
      }
      if (mode === "click" && e.key === " ") {
        e.preventDefault();
        const h = grid.querySelector("[data-handle]");
        if (sel && !selEl.hidden) { h.classList.add("is-grabbed"); live.textContent = "Fill handle grabbed"; onChange?.({ kind: "handle" }); }
        return;
      }
      if (!d) return;
      e.preventDefault();
      if (mode === "click") {
        grid.querySelectorAll(".is-grabbed").forEach((x) => x.classList.remove("is-grabbed"));
        // Past the top row = the column letter; past column A = the row number (as with a mouse).
        if (sel?.kind === "col") {
          if (d[1] > 0) { const ref = `${colLetter(sel.c1)}1`; setSel(refBox(ref)); onChange?.({ kind: "cell", ref }); }
          else if (d[0]) { const c = Math.min(cols - 1, Math.max(0, sel.c1 + d[0])); setSel(parseSel(`${colLetter(c)}:${colLetter(c)}`, S)); onChange?.({ kind: "col", col: colLetter(c) }); }
          return;
        }
        if (sel?.kind === "row") {
          if (d[0] > 0) { const ref = `A${sel.r1}`; setSel(refBox(ref)); onChange?.({ kind: "cell", ref }); }
          else if (d[1]) { const r = Math.min(rows, Math.max(1, sel.r1 + d[1])); setSel(parseSel(`${r}:${r}`, S)); onChange?.({ kind: "row", row: r }); }
          return;
        }
        if (sel && d[1] < 0 && sel.r1 === 1) { setSel(parseSel(`${colLetter(sel.c1)}:${colLetter(sel.c1)}`, S)); onChange?.({ kind: "col", col: colLetter(sel.c1) }); return; }
        if (sel && d[0] < 0 && sel.c1 === 0) { setSel(parseSel(`${sel.r1}:${sel.r1}`, S)); onChange?.({ kind: "row", row: sel.r1 }); return; }
      }
      if (mode === "move" && holding) {
        const p = parseRef(target || holding);
        const n = { c: Math.min(cols - 1, Math.max(0, p.c + d[0])), r: Math.min(rows, Math.max(1, p.r + d[1])) };
        setTarget(`${colLetter(n.c)}${n.r}`);
        live.textContent = `Over ${target}`;
        return;
      }
      const cur = sel && sel.kind !== "col" && sel.kind !== "row" ? sel : { c1: 0, c2: 0, r1: 1, r2: 1 };
      if (mode === "multi") {
        const ctrl = e.ctrlKey || e.metaKey || ctrlHeld();
        if (ctrl && !adding && sel) { if (!also.some((b) => sameBox(b, sel))) also = [...also, sel]; adding = true; if (!e.shiftKey) { anchor = null; } }
        else if (!ctrl && !e.shiftKey) { also = []; adding = false; }
      }
      if ((mode === "range" || mode === "multi") && e.shiftKey) {
        if (!anchor) anchor = { c: cur.c1, r: cur.r1 };
        const head = { c: anchor.c === cur.c1 ? cur.c2 : cur.c1, r: anchor.r === cur.r1 ? cur.r2 : cur.r1 };
        const p = { c: Math.min(cols - 1, Math.max(0, head.c + d[0])), r: Math.min(rows, Math.max(1, head.r + d[1])) };
        const box = { c1: Math.min(anchor.c, p.c), c2: Math.max(anchor.c, p.c), r1: Math.min(anchor.r, p.r), r2: Math.max(anchor.r, p.r) };
        box.kind = box.c1 === box.c2 && box.r1 === box.r2 ? "cell" : "range";
        setSel(box);
        report();
        return;
      }
      const p = { c: Math.min(cols - 1, Math.max(0, cur.c1 + d[0])), r: Math.min(rows, Math.max(1, cur.r1 + d[1])) };
      anchor = { ...p };
      const ref = `${colLetter(p.c)}${p.r}`;
      setSel(refBox(ref));
      if (mode === "click") onChange?.({ kind: "cell", ref });
      if (mode === "range" || mode === "multi") report();
    });
  }

  // ------------------------------------------------------------ animations
  const wait = (ms) => new Promise((r) => setTimeout(r, reducedMotion() ? 0 : ms));

  /** Fill handle animation: start cells selected, then the selection grows down
   *  one row at a time and each new value appears. */
  async function animateFill(col, startRow, start, values, { stepMs = 260 } = {}) {
    const C = colIndex(col);
    const patch = {};
    start.forEach((v, i) => { patch[`${col}${startRow + i}`] = v; });
    for (let r = startRow + start.length; r <= rows; r++) patch[`${col}${r}`] = "";
    cells = { ...cells, ...patch };
    paintCells();
    setSel({ c1: C, c2: C, r1: startRow, r2: startRow + start.length - 1, kind: start.length > 1 ? "range" : "cell" }, { announce: false });
    selEl.classList.add("is-filling");
    await wait(450);
    for (let i = 0; i < values.length; i++) {
      const r = startRow + start.length + i;
      cells[`${col}${r}`] = values[i];
      paintCells();
      setSel({ c1: C, c2: C, r1: startRow, r2: r, kind: "range" }, { announce: false });
      cellEl(`${col}${r}`)?.classList.add("is-new");
      await wait(stepMs);
    }
    selEl.classList.remove("is-filling");
    live.textContent = `Filled ${col}${startRow} to ${col}${startRow + start.length + values.length - 1}`;
  }

  /** A value glides from one cell to another (the move demo). */
  async function animateMove(from, to) {
    const a = cellEl(from), b = cellEl(to);
    if (!a || !b) return;
    const gr = grid.getBoundingClientRect(), ar = a.getBoundingClientRect(), br = b.getBoundingClientRect();
    setSel(refBox(from), { announce: false });
    await wait(500);
    const g = el(`<div class="sh-ghost">${esc(cells[from] ?? "")}<span class="sh-ghost__hand">${icon("hand", 18, 2.25)}</span></div>`);
    g.style.width = `${ar.width}px`; g.style.height = `${ar.height}px`;
    g.style.transform = `translate(${ar.left - gr.left}px, ${ar.top - gr.top}px)`;
    grid.appendChild(g);
    a.classList.add("is-lifted");
    if (!reducedMotion()) {
      await g.animate([{ transform: `translate(${ar.left - gr.left}px, ${ar.top - gr.top}px)` }, { transform: `translate(${br.left - gr.left}px, ${br.top - gr.top}px)` }],
        { duration: 900, easing: "cubic-bezier(0.45, 0, 0.25, 1)", fill: "forwards" }).finished;
    }
    g.remove();
    a.classList.remove("is-lifted");
    cells = { ...cells, [to]: cells[from] };
    delete cells[from];
    paintCells();
    setSel(refBox(to), { announce: false });
  }

  return {
    el: root,
    grid,
    get sel() { return sel; },
    get boxes() { return allSel(); },
    get cells() { return cells; },
    setSel: (s) => setSel(typeof s === "string" ? parseSel(s, S) : s),
    setCells(patch) { cells = { ...cells, ...patch }; paintCells(); paintSel(); },
    reset(newCells) { cells = { ...newCells }; paintCells(); },
    mark,
    markHeader,
    lock() { locked = true; root.classList.add("is-locked"); grid.querySelectorAll(".is-grabbed").forEach((x) => x.classList.remove("is-grabbed")); },
    focus() { grid.focus({ preventScroll: true }); },
    animateFill,
    animateMove,
    clearMarks() { grid.querySelectorAll(".sh-mark").forEach((m) => m.remove()); grid.querySelectorAll("[class*=is-mark-]").forEach((h) => h.classList.remove("is-mark-ok", "is-mark-bad")); },
  };
}
