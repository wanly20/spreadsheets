// Keyboard-only test at Chromebook size (1366×768): no mouse at all.
//   NODE_PATH=/tmp/pw/node_modules node tools/e2e-keyboard.mjs [screenshotDir]
// Tab to the first level, Enter to open and start it, then every exercise with
// keys only: number keys for options / areas / steps / pairs, arrows (+ Shift,
// Space) on the mini spreadsheet, typing references, the real shortcut keys,
// Enter for CHECK and CONTINUE, Esc for the quit dialog. Plays the whole
// sampler (one of every exercise type), Lesson 1's first level and Lesson 6's two levels.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");
const OUT = process.argv[2] || "screenshots";
mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE || "http://127.0.0.1:8765/";
const SAFE_ARGS = ["--headless=new", "--ozone-platform=headless", "--disable-gpu", "--use-gl=swiftshader"];
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/bin/chromium", headless: true, args: SAFE_ARGS });
const p = await (await b.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
const errors = [];
let passed = 0;
p.on("console", (m) => m.type() === "error" && errors.push("console.error: " + m.text()));
p.on("pageerror", (e) => errors.push("pageerror: " + e.message));
const ok = (c, m) => { console.log(c ? "  ✓" : "  ✗", m); if (c) passed++; else errors.push(m); };
const wait = (ms) => p.waitForTimeout(ms);
const key = (k) => p.keyboard.press(k);
const active = () => p.evaluate(() => { const a = document.activeElement; return a ? `${a.className?.baseVal ?? a.className}|${(a.textContent || "").trim().slice(0, 30)}` : ""; });

await p.goto(BASE);
await p.evaluate(() => localStorage.clear());
await p.reload();
await wait(1300);
let n = 0;
while (n++ < 40 && !(await active()).includes("is-current")) await key("Tab");
ok((await active()).includes("is-current"), `Tab reaches the current level (${n} presses)`);
const ring = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
ok(ring === "solid", "a focus ring shows on the level");
await p.screenshot({ path: `${OUT}/keyboard-01-path-focus.png` });
await key("Enter"); await wait(500);
ok((await active()).includes("btn"), "Enter opens the level and focuses START");
await key("Enter"); await wait(1200);
ok(await p.locator(".screen.lesson").count() === 1, "Enter starts the level");
await key("Escape"); await wait(500);
ok(await p.locator(".modal").count() === 1, "Esc opens the quit dialog");
await key("Escape"); await wait(500);
ok(await p.locator(".modal").count() === 0, "Esc closes it again");
await playAll("1-1");

await p.goto(BASE + "#/play/sampler");
await wait(1200);
await playAll("sampler");

// Lesson 6 (sorting): both levels, keyboard only.
for (const id of ["6-1", "6-2"]) {
  await p.goto(BASE + "#/play/" + id);
  await wait(1200);
  await playAll(id);
}

console.log(`\n${passed} checks passed, ${errors.length} problems`);
console.log(errors.length ? "PROBLEMS:\n- " + errors.join("\n- ") : "KEYBOARD RUN PASSED, no console errors");
await b.close();
process.exit(errors.length ? 1 : 0);

async function playAll(name) {
  const seen = {};
  for (let guard = 0; guard < 60; guard++) {
    if (await p.locator(".screen.complete").count()) break;
    await p.waitForFunction(() => { const ex = document.querySelector(".lesson-body .ex:not(.step-leave)"); return !document.querySelector(".step-leave") && ex && !ex.getAnimations().some((a) => a.playState === "running"); }, null, { timeout: 3000 }).catch(() => {});
    const step = await p.evaluate(() => JSON.parse(JSON.stringify(document.querySelector(".screen.lesson")?.__step || null)));
    if (!step) { await wait(300); continue; }
    seen[step.type] = (seen[step.type] || 0) + 1;
    if (step.type === "learn") { await key("Enter"); await wait(700); continue; }
    await answer(step);
    if (!["keys", "match"].includes(step.type)) await key("Enter"); // CHECK
    await p.waitForSelector(".feedback.is-open", { timeout: 4000 }).catch(() => {});
    const st = await p.evaluate(() => { const s = document.querySelector(".feedback"); return s.classList.contains("is-open") ? (s.classList.contains("is-wrong") ? "wrong" : "correct") : "closed"; });
    ok(st === "correct", `${name} ${step.type}${step.gen ? "/" + step.gen : ""}: keyboard answer → ${st}`);
    if (st === "closed") { await p.screenshot({ path: `${OUT}/keyboard-FAIL-${step.type}.png` }); return; }
    await key("Enter"); // CONTINUE
    await wait(700);
  }
  await wait(1500);
  ok(await p.locator(".screen.complete").count() === 1, `${name}: finished with the keyboard only (${Object.entries(seen).map(([k, v]) => `${k}×${v}`).join(", ")})`);
  await p.screenshot({ path: `${OUT}/keyboard-02-${name}-complete.png` });
  await key("Enter"); await wait(1200);
}

async function optionIndex(sel, text, compact = false) {
  return p.evaluate(([sel, text, compact]) => [...document.querySelectorAll(`.lesson-body .ex:not(.step-leave) ${sel}`)]
    .findIndex((e) => (compact ? e.textContent.replace(/\s/g, "") : e.textContent.trim()) === text), [sel, text, compact]);
}

async function arrowsTo(ref, { shift = false, from = null } = {}) {
  // From the current selection (or A1, the first arrow press starts there).
  const cur = from || await p.evaluate(() => { const t = document.querySelector(".lesson-body .ex:not(.step-leave) .sheet-live")?.textContent || ""; return (/Selected ([A-Z]\d+)/.exec(t) || [])[1] || null; });
  const c0 = cur ? cur.charCodeAt(0) - 65 : 0, r0 = cur ? +cur.slice(1) : 1;
  const c1 = ref.charCodeAt(0) - 65, r1 = +ref.slice(1);
  const presses = [];
  for (let i = 0; i < Math.abs(c1 - c0); i++) presses.push(c1 > c0 ? "ArrowRight" : "ArrowLeft");
  for (let i = 0; i < Math.abs(r1 - r0); i++) presses.push(r1 > r0 ? "ArrowDown" : "ArrowUp");
  if (!cur && !presses.length) presses.push("ArrowRight", "ArrowLeft");
  else if (!cur) { /* the first press starts from A1 */ }
  for (const k of presses) await key(shift ? `Shift+${k}` : k);
}

async function answer(step) {
  const t = String(step.target ?? "");
  switch (step.type) {
    case "choice": { const i = await optionIndex(".option .label", step.correct); await key(String(i + 1)); return; }
    case "fill": {
      const correct = await p.evaluate(async (s) => (await import("./js/exercises.js")).fillOptions(s.start, s.end).correct, step);
      const i = await optionIndex(".option .label", correct); await key(String(i + 1)); return;
    }
    case "fillFormula": {
      const correct = await p.evaluate(async (s) => (await import("./js/exercises.js")).fillFormulaOptions(s.formula, s.from, s.to).correct, step);
      const i = await optionIndex(".option .label", correct); await key(String(i + 1)); return;
    }
    case "sortPredict": {
      const correct = await p.evaluate(async (s) => { const S = await import("./js/sort.js"); return S.rowsText(S.sortOptions(s).correct); }, step);
      const i = await p.evaluate((v) => [...document.querySelectorAll(".lesson-body .ex:not(.step-leave) .option")].findIndex((b) => b.dataset.v === v), correct);
      await key(String(i + 1)); return;
    }
    case "keys": await key({ "ctrl+z": "Control+z", "ctrl+y": "Control+y", delete: "Delete", enter: "Enter", "ctrl+`": "Control+Backquote" }[step.combo]); return;
    case "formula": await p.keyboard.type(step.accept[0].toLowerCase()); return;
    case "lockRef": {
      const refs = await p.evaluate(() => [...document.querySelectorAll(".lesson-body .ex:not(.step-leave) .lock-ref")].map((b) => b.dataset.ref));
      // Lock a wrong one and unlock it again, then lock the right one(s).
      const other = refs.findIndex((r) => !step.lock.includes(r));
      await key(String(other + 1)); await key(String(other + 1));
      for (const r of step.lock) await key(String(refs.indexOf(r) + 1));
      return;
    }
    case "gaps": {
      // A wrong chip first, then Backspace takes it back, then the answers.
      const wrong = step.chips.findIndex((c) => !step.answers.map((a) => a.toLowerCase()).includes(c.toLowerCase()));
      await key(String(wrong + 1)); await key("Backspace");
      ok(await p.locator(".lesson-body .ex:not(.step-leave) .gap.is-filled").count() === 0, "Backspace takes the last chip back");
      for (const w of step.answers) {
        const i = await p.evaluate((w) => [...document.querySelectorAll(".lesson-body .ex:not(.step-leave) .word-chip")].findIndex((b) => !b.disabled && b.querySelector(".label").textContent.toLowerCase() === w.toLowerCase()), w);
        await key(String(i + 1)); await wait(100);
      }
      return;
    }
    case "gridClick": {
      ok((await active()).includes("sheet-grid"), "the mini spreadsheet has keyboard focus");
      if (t === "handle") { await arrowsTo("B2"); await key("Space"); return; }
      if (t.startsWith("col:")) { await arrowsTo(`${t[4]}1`); await key("ArrowUp"); return; }
      if (t.startsWith("row:")) { await arrowsTo(`A${t.slice(4)}`); await key("ArrowLeft"); return; }
      await arrowsTo(t); return;
    }
    case "gridName": case "rangeName": await p.keyboard.type(t.toLowerCase()); return;
    case "gridRange": { const [a, c] = t.split(":"); await arrowsTo(a); await arrowsTo(c, { shift: true, from: a }); return; }
    case "gridMove": { await arrowsTo(step.from, { from: step.from }); await key("Space"); await arrowsTo(step.to, { from: step.from }); await key("Space"); return; }
    case "hotspot": {
      const i = await p.evaluate((t) => [...document.querySelectorAll(".lesson-body .ex:not(.step-leave) [data-region]")].findIndex((b) => b.dataset.region === t), t);
      if (i < 9) { await key(String(i + 1)); return; }
      // Past 9 areas: Tab to the area, then Space (every area is a button).
      for (let k = 0; k < 40 && !(await p.evaluate((t) => document.activeElement?.dataset?.region === t, t)); k++) await key("Tab");
      ok(await p.evaluate((t) => document.activeElement?.dataset?.region === t, t), "Tab reaches a screenshot area past the number keys");
      await key("Space"); return;
    }
    case "order": for (const s of step.steps) { const i = await optionIndex(".order-card .label", s); await key(String(i + 1)); await wait(150); } return;
    case "match":
      for (const pr of step.pairs) {
        const a = await optionIndex('.match-card[data-side="t"]', pr.term);
        const d = await optionIndex('.match-card[data-side="d"]', pr.def);
        await key(String(a + 1)); await key(String(step.pairs.length + d + 1)); await wait(300);
      }
      return;
  }
}
