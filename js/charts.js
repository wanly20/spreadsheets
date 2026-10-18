// Drawn charts for Lesson 7, as inline SVG, with no libraries.
//
//   chart        { type: "pie" | "column" | "bar", labels: [...], series: [{ name, values }],
//                  title?, legend? (default true), xTitle?, yTitle?, colours?: { index: paletteSlot },
//                  compact? (bigger text, for small pictures), highlight?: a part }
//                Parts you can tap (hotspot `ui: { chart }`): title, legend, xTitle, yTitle, plot.
//                Colour-blind friendly: every series (or slice) has its own colour AND pattern,
//                and the legend shows both; pies also print each slice's percentage.
//   chartOnSheet { grid, chart, at: "over" | "beside" } a chart over (or beside) a table
//
// The chart editor, the chart's ⋮ menu and a selected chart are real screenshots (content/screens.js).
import { esc, el } from "./ui.js";
import { icon } from "./icons.js";

const SLOTS = 6;
const colourOf = (slot) => `var(--chart-${(slot % SLOTS) + 1})`;
let uid = 0;

/** Pattern i (0 = solid) drawn over colour slot i, so no two series rely on colour alone. */
function patternDefs(id, slots) {
  const marks = [
    "",
    '<rect width="2.6" height="7" fill="#fff" fill-opacity=".55"/>',
    '<circle cx="3.5" cy="3.5" r="1.4" fill="#fff" fill-opacity=".7"/>',
    '<path d="M0 0h7M0 0v7" stroke="#fff" stroke-opacity=".6" stroke-width="2.4"/>',
    '<rect width="7" height="2.4" fill="#fff" fill-opacity=".55"/>',
    '<path d="M0 7 7 0" stroke="#fff" stroke-opacity=".65" stroke-width="2"/><path d="M0 0 7 7" stroke="#fff" stroke-opacity=".65" stroke-width="2"/>',
  ];
  return [...new Set(slots)].map((s) => {
    const m = marks[s % SLOTS];
    if (!m) return "";
    const rot = s % SLOTS === 1 ? ' patternTransform="rotate(45)"' : "";
    return `<pattern id="${id}-${s}" patternUnits="userSpaceOnUse" width="7" height="7"${rot}><rect width="7" height="7" style="fill:${colourOf(s)}"/>${m}</pattern>`;
  }).join("");
}
const paint = (id, slot) => (slot % SLOTS === 0 ? `style="fill:${colourOf(slot)}"` : `fill="url(#${id}-${slot})"`);

const textW = (s, fs) => String(s).length * fs * 0.56;
/** Split a long label into two lines at a space. */
function lines(label, max = 9) {
  const s = String(label);
  if (s.length <= max || !s.includes(" ")) return [s];
  const i = s.indexOf(" ");
  return [s.slice(0, i), s.slice(i + 1)];
}
/** Round axis maximum and step, e.g. 245 → 0, 50, … 250. */
function niceAxis(max) {
  const steps = [5, 10, 20, 25, 40, 50, 100, 200, 250, 500];
  for (const st of steps) if (max / st <= 6) return { step: st, top: Math.ceil(max / st) * st };
  return { step: 1000, top: Math.ceil(max / 1000) * 1000 };
}
export const pct = (v, total) => `${(Math.round((v / total) * 1000) / 10).toFixed(1)}%`;

const PART_LABEL = { title: "the chart title", legend: "the legend", xTitle: "the horizontal axis title", yTitle: "the vertical axis title", plot: "the chart itself (the bars or slices)" };
/** What you can tap in a chart picture. */
export function chartHits(spec = {}) {
  const out = [];
  if (spec.title) out.push("title");
  if (spec.legend !== false) out.push("legend");
  if (spec.xTitle) out.push("xTitle");
  if (spec.yTitle) out.push("yTitle");
  out.push("plot");
  return out;
}
export const chartPartLabel = (id) => PART_LABEL[id] || id;

/** A sentence describing the chart, for screen readers. */
export function chartDesc(spec) {
  const kind = { pie: "Pie chart", column: "Column chart", bar: "Bar chart" }[spec.type];
  const head = `${kind}${spec.title ? ` titled “${spec.title}”` : ", no title"}.`;
  if (spec.type === "pie") {
    const v = spec.series[0].values, total = v.reduce((a, b) => a + b, 0);
    return `${head} Slices: ${spec.labels.map((l, i) => `${l} ${pct(v[i], total)}`).join(", ")}.${spec.legend === false ? " No legend." : ""}`;
  }
  const along = spec.type === "column" ? "Along the bottom" : "Down the side";
  return `${head} ${along}: ${spec.labels.join(", ")}. ${spec.series.length > 1 || spec.legend !== false ? `Series: ${spec.series.map((s) => s.name).join(", ")}.` : ""}` +
    `${spec.xTitle ? ` Horizontal axis title: ${spec.xTitle}.` : ""}${spec.yTitle ? ` Vertical axis title: ${spec.yTitle}.` : ""}${spec.legend === false ? " No legend." : ""}`;
}

/**
 * Draw a chart. Returns the wrapper element (an SVG plus, with { hits: true },
 * one invisible button per part, positioned over it).
 */
export function chartEl(spec, { hits = false } = {}) {
  const id = `ch${++uid}`;
  const compact = !!spec.compact;
  const W = spec.w || (compact ? 300 : 400);
  const fs = compact ? 13 : 11;          // labels
  const tfs = compact ? 15 : 14;         // title
  const isPie = spec.type === "pie";
  const series = spec.series;
  const slotOf = (i) => spec.colours?.[i] ?? i;
  const legendItems = isPie ? spec.labels : series.map((s) => s.name);
  const showLegend = spec.legend !== false;
  const boxes = {};
  const svg = [];
  let y = 8;
  if (spec.title) {
    y += tfs + 2;
    svg.push(`<text x="${W / 2}" y="${y}" text-anchor="middle" class="chart-title" font-size="${tfs}">${esc(spec.title)}</text>`);
    const tw = textW(spec.title, tfs) * 1.05;
    boxes.title = [W / 2 - tw / 2 - 4, y - tfs - 1, tw + 8, tfs + 8];
    y += 6;
  }
  const swatch = (x, yy, i) => `<rect x="${x}" y="${yy}" width="${fs}" height="${fs}" rx="2" ${paint(id, slotOf(i))} stroke="#fff" stroke-width=".8"/>`;
  let H;
  if (isPie) {
    // Pie on the left, legend down the right (as Google Sheets does it).
    const v = series[0].values, total = v.reduce((a, b) => a + b, 0);
    const legW = showLegend ? Math.min(W * 0.42, Math.max(...legendItems.map((l) => textW(l, fs))) + fs + 14) : 0;
    const r = Math.min((W - legW - 24) / 2, compact ? 74 : 84);
    const cx = showLegend ? 12 + (W - legW - 12) / 2 : W / 2, cy = y + 6 + r;
    let a = -Math.PI / 2;
    v.forEach((val, i) => {
      const da = (val / total) * Math.PI * 2;
      const b = a + da;
      const p = (t, rr = r) => `${(cx + rr * Math.cos(t)).toFixed(2)} ${(cy + rr * Math.sin(t)).toFixed(2)}`;
      svg.push(`<path d="M${cx} ${cy}L${p(a)}A${r} ${r} 0 ${da > Math.PI ? 1 : 0} 1 ${p(b)}Z" ${paint(id, slotOf(i))} stroke="#fff" stroke-width="2"/>`);
      const m = (a + b) / 2;
      svg.push(`<text x="${(cx + r * 0.66 * Math.cos(m)).toFixed(1)}" y="${(cy + r * 0.66 * Math.sin(m) + fs * 0.35).toFixed(1)}" text-anchor="middle" class="chart-num" font-size="${fs}">${pct(val, total)}</text>`);
      a = b;
    });
    boxes.plot = [cx - r, cy - r, 2 * r, 2 * r];
    if (showLegend) {
      const lx = W - legW, gap = fs + 9, ly0 = cy - (legendItems.length * gap) / 2;
      legendItems.forEach((l, i) => {
        svg.push(swatch(lx, ly0 + i * gap, i));
        svg.push(`<text x="${lx + fs + 6}" y="${ly0 + i * gap + fs - 1.5}" class="chart-lbl" font-size="${fs}">${esc(l)}</text>`);
      });
      boxes.legend = [lx - 4, ly0 - 5, legW, legendItems.length * gap + 6];
    }
    H = cy + r + 10;
  } else {
    // Legend in a row along the top.
    if (showLegend) {
      const items = legendItems.map((l) => ({ l, w: fs + 6 + textW(l, fs) + 14 }));
      const total = items.reduce((s, x) => s + x.w, 0);
      let x = W / 2 - total / 2;
      y += 4;
      items.forEach((it, i) => {
        svg.push(swatch(x, y, i));
        svg.push(`<text x="${x + fs + 6}" y="${y + fs - 1.5}" class="chart-lbl" font-size="${fs}">${esc(it.l)}</text>`);
        x += it.w;
      });
      boxes.legend = [W / 2 - total / 2 - 6, y - 5, total + 4, fs + 10];
      y += fs + 10;
    }
    const isCol = spec.type === "column";
    const max = Math.max(...series.flatMap((s) => s.values));
    const { step, top } = niceAxis(max);
    const tickW = textW(String(top), fs) + 6;
    const yTitleW = spec.yTitle ? fs + 10 : 0;
    const catW = isCol ? 0 : Math.max(...spec.labels.map((l) => textW(l, fs))) + 8;
    const left = 8 + yTitleW + (isCol ? tickW : catW);
    const right = W - 12;
    // Column labels go on two lines only when they don't fit under their column; bar labels never wrap.
    const colBand = (right - left) / spec.labels.length;
    const labLines = (l) => (isCol && textW(l, fs) > colBand - 4 ? lines(l, 0) : [String(l)]);
    const catLines = isCol ? Math.max(...spec.labels.map((l) => labLines(l).length)) : 1;
    const plotTop = y + 8;
    const plotH = isCol ? (compact ? 120 : 150) : Math.max(compact ? 120 : 150, spec.labels.length * (fs + 16));
    const plotBottom = plotTop + plotH;
    const plotW = right - left;
    const n = spec.labels.length, k = series.length;
    // Gridlines and value labels.
    for (let t = 0; t <= top; t += step) {
      if (isCol) {
        const yy = plotBottom - (t / top) * plotH;
        svg.push(`<line x1="${left}" x2="${right}" y1="${yy}" y2="${yy}" class="chart-grid${t === 0 ? " chart-axis" : ""}"/>`);
        svg.push(`<text x="${left - 5}" y="${yy + fs * 0.35}" text-anchor="end" class="chart-tick" font-size="${fs}">${t}</text>`);
      } else {
        const xx = left + (t / top) * plotW;
        svg.push(`<line y1="${plotTop}" y2="${plotBottom}" x1="${xx}" x2="${xx}" class="chart-grid${t === 0 ? " chart-axis" : ""}"/>`);
        svg.push(`<text x="${xx}" y="${plotBottom + fs + 4}" text-anchor="middle" class="chart-tick" font-size="${fs}">${t}</text>`);
      }
    }
    // Bars: one group per label, one bar per series, a 2px gap between bars.
    const band = (isCol ? plotW : plotH) / n;
    const inner = band * (k > 1 ? 0.78 : 0.6);
    const bw = inner / k;
    spec.labels.forEach((lab, c) => {
      const g0 = (isCol ? left : plotTop) + c * band + (band - inner) / 2;
      series.forEach((s, j) => {
        const len = (s.values[c] / top) * (isCol ? plotH : plotW);
        const pos = g0 + j * bw;
        const slot = slotOf(j);
        if (isCol) svg.push(`<rect x="${(pos + 1).toFixed(2)}" y="${(plotBottom - len).toFixed(2)}" width="${(bw - 2).toFixed(2)}" height="${len.toFixed(2)}" ${paint(id, slot)}/>`);
        else svg.push(`<rect y="${(pos + 1).toFixed(2)}" x="${left}" height="${(bw - 2).toFixed(2)}" width="${len.toFixed(2)}" ${paint(id, slot)}/>`);
      });
      const ls = labLines(lab);
      if (isCol) ls.forEach((t, li) => svg.push(`<text x="${(left + c * band + band / 2).toFixed(1)}" y="${plotBottom + fs + 4 + li * (fs + 1)}" text-anchor="middle" class="chart-lbl" font-size="${fs}">${esc(t)}</text>`));
      else ls.forEach((t, li) => svg.push(`<text x="${left - 5}" y="${(plotTop + c * band + band / 2 + fs * 0.35 + (li - (ls.length - 1) / 2) * (fs + 1)).toFixed(1)}" text-anchor="end" class="chart-lbl" font-size="${fs}">${esc(t)}</text>`));
    });
    boxes.plot = [left, plotTop, plotW, plotH];
    let bottom = plotBottom + 6 + (isCol ? catLines * (fs + 1) + 2 : fs + 4);
    if (spec.xTitle) {
      bottom += fs + 5;
      svg.push(`<text x="${left + plotW / 2}" y="${bottom}" text-anchor="middle" class="chart-axis-title" font-size="${fs + 1}">${esc(spec.xTitle)}</text>`);
      const tw = textW(spec.xTitle, fs + 1);
      boxes.xTitle = [left + plotW / 2 - tw / 2 - 6, bottom - fs - 4, tw + 12, fs + 10];
    }
    if (spec.yTitle) {
      const cy = plotTop + plotH / 2, x = 8 + fs;
      svg.push(`<text x="${x}" y="${cy}" text-anchor="middle" transform="rotate(-90 ${x} ${cy})" class="chart-axis-title" font-size="${fs + 1}">${esc(spec.yTitle)}</text>`);
      const tw = textW(spec.yTitle, fs + 1);
      boxes.yTitle = [x - fs - 3, cy - tw / 2 - 6, fs + 10, tw + 12];
    }
    H = bottom + 10;
  }
  const slots = (isPie ? spec.labels : series).map((_, i) => slotOf(i));
  const wrap = el(`<div class="chart ${compact ? "chart--compact" : ""}" style="--cw:${W}px">
    <svg class="chart-svg" viewBox="0 0 ${W} ${H.toFixed(0)}" role="img" aria-label="${esc(chartDesc(spec))}">
      <defs>${patternDefs(id, slots)}</defs>
      <rect width="${W}" height="${H.toFixed(0)}" fill="#fff"/>
      ${svg.join("")}
    </svg>
  </div>`);
  const place = (node, [x, yy, w, h]) => {
    node.style.left = `${(x / W) * 100}%`; node.style.top = `${(yy / H) * 100}%`;
    node.style.width = `${(w / W) * 100}%`; node.style.height = `${(h / H) * 100}%`;
  };
  if (spec.highlight && boxes[spec.highlight]) { const r = el(`<span class="shot-ring"></span>`); place(r, boxes[spec.highlight]); wrap.appendChild(r); }
  if (hits) {
    // The plot first, so the smaller parts sit on top of it.
    for (const part of ["plot", ...chartHits(spec).filter((x) => x !== "plot")]) {
      if (!boxes[part]) continue;
      const b = el(`<button type="button" class="hot chart-hot" data-hit="${part}" aria-label="${esc(chartPartLabel(part))}"><span class="hot__ring"></span></button>`);
      place(b, boxes[part]);
      wrap.appendChild(b);
    }
  }
  return wrap;
}

/** Two or more charts side by side, each with a caption (learn cards). */
export function chartsRow(list) {
  const row = el(`<div class="charts-row"></div>`);
  for (const c of list) {
    const f = el(`<figure class="charts-row__fig"></figure>`);
    f.appendChild(chartEl({ compact: true, ...c }));
    if (c.caption) f.appendChild(el(`<figcaption>${esc(c.caption)}</figcaption>`));
    row.appendChild(f);
  }
  return row;
}

// ------------------------------------------------------------------ a chart on the sheet
const SMALL_PIE = { type: "pie", compact: true, title: "Fair Takings by Stall", labels: ["Book swap", "Cake stall", "Face painting", "Lemonade", "Plant stall", "Raffle"], series: [{ name: "Total", values: [65, 245, 120, 210, 50, 165] }], legend: false };

/** A chart sitting over the table (wrong) or beside it (right). */
export function chartOnSheet({ gridEl, chart = SMALL_PIE, at = "beside" }) {
  const scene = el(`<div class="chart-sheet chart-sheet--${at}"></div>`);
  scene.appendChild(gridEl);
  const card = el(`<div class="chart-card"></div>`);
  card.appendChild(chartEl(chart));
  scene.appendChild(card);
  return scene;
}
