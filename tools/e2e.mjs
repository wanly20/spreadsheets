// End-to-end test in headless Chromium (playwright-core), at Chromebook size
// (1366×768, mouse + real key presses) and phone size (390×844, touch).
//
// Setup (outside the repo):  mkdir -p /tmp/pw && cd /tmp/pw && npm i playwright-core@1.48.2
// Serve:  python3 -m http.server 8765 --bind 127.0.0.1      (in the repo root)
// Run:    NODE_PATH=/tmp/pw/node_modules node tools/e2e.mjs [screenshotDir]
//
// Plays every level and review of every ready lesson with right AND wrong
// answers (grid clicks, drags, typed references, a real Ctrl+Z, hotspots,
// steps in order, matching), checks retries, stars, XP, reload persistence,
// the Review button, My knowledge, Settings (sound, download + load progress,
// a broken file, reset) and that there are no console errors.
// Screenshots of every exercise type go to screenshotDir (default: screenshots/).
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");
const OUT = process.argv[2] || "screenshots";
mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE || "http://127.0.0.1:8765/";
const errors = [];
let passed = 0;
let dragRetries = 0, checkRetries = 0; // emulated touch drags occasionally don't start; a second drag is allowed
const log = (...a) => console.log(...a);
const ok = (c, msg) => { if (c) { passed++; log("  ✓", msg); } else { errors.push(msg); log("  ✗", msg); } };

// Software rendering only: never touch the GPU (it may be busy, and tests don't need it).
// Fully headless with software rendering: never the GPU, never a window on the desktop.
const SAFE_ARGS = ["--headless=new", "--ozone-platform=headless", "--disable-gpu", "--use-gl=swiftshader"];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/bin/chromium", headless: true, args: SAFE_ARGS });

const VIEWPORTS = [
  { name: "chromebook", width: 1366, height: 768, touch: false },
  { name: "phone", width: 390, height: 844, touch: true },
];

for (const vp of VIEWPORTS) if (!process.env.ONLY || process.env.ONLY === vp.name) await runViewport(vp);

log(`\n${passed} checks passed, ${errors.length} problems${dragRetries + checkRetries ? ` (emulated touch: ${dragRetries} drag(s) and ${checkRetries} CHECK tap(s) needed a second try)` : ""}`);
if (errors.length) { log("PROBLEMS:\n- " + errors.join("\n- ")); }
else log("E2E PASSED, no console errors");
await browser.close();
process.exit(errors.length ? 1 : 0);

// =====================================================================
async function runViewport(vp) {
  log(`\n=== ${vp.name} ${vp.width}×${vp.height}`);
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.touch, isMobile: vp.touch, acceptDownloads: true });
  const page = await ctx.newPage();
  const cdp = vp.touch ? await ctx.newCDPSession(page) : null;
  page.on("console", (m) => { if (m.type() === "error") errors.push(`[${vp.name}] console.error: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`[${vp.name}] pageerror: ${e.message}`));
  page.on("requestfailed", (r) => { if (!/fonts\.g|jsdelivr/.test(r.url())) errors.push(`[${vp.name}] requestfailed: ${r.url()}`); });
  const shotTaken = new Set();
  let shotN = 0;
  const shot = async (name, force = false) => {
    if (!force && shotTaken.has(name)) return;
    shotTaken.add(name);
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${OUT}/${vp.name}-${String(++shotN).padStart(2, "0")}-${name}.png` });
  };
  const wait = (ms) => page.waitForTimeout(ms);
  const tap = async (sel) => { const l = page.locator(sel).first(); if (vp.touch) await l.tap(); else await l.click(); };
  const EX = ".lesson-body .ex:not(.step-leave) "; // the current exercise only

  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await wait(1200);
  await shot("path-start");
  ok(await page.locator(".node.is-current").count() === 1, "path shows one current level");
  const soonCount = await page.evaluate(async () => (await import("./content/course.js")).course.lessons.filter((l) => l.comingSoon).length);
  ok(await page.locator(".unit.is-soon").count() >= soonCount, `lessons that aren't ready show as coming soon (${soonCount})`);

  // Settings: sound off (quiet tests) and the Esc key closes the dialog.
  await tap(vp.width >= 1024 ? '.side-nav [data-act="settings"]' : '.path-top [data-act="settings"]');
  await wait(500);
  await shot("settings");
  await tap('[data-switch="sfx"]');
  ok(await page.evaluate(() => JSON.parse(localStorage.getItem("spreadsheets-practice.v1")).sfx === false), "sound can be switched off and is saved");
  await page.keyboard.press("Escape");
  await wait(400);
  ok(await page.locator(".modal").count() === 0, "Esc closes Settings");

  // Review before anything is done: a kind toast, no session.
  await tap(vp.width >= 1024 ? '.side-nav [data-act="review"]' : '.path-top [data-act="review"]');
  await wait(300);
  ok(await page.locator(".toast").count() === 1, "Review with nothing practised shows a friendly note");

  // ------------------------------------------------------------ every level, in path order
  const nodeIds = await page.evaluate(() => [...document.querySelectorAll(".node[data-node]:not([data-soon])")].map((n) => n.dataset.node));
  ok(nodeIds.length >= 6, `path has ${nodeIds.length} playable nodes`);
  const wrongDone = new Set();
  for (const [k, id] of nodeIds.entries()) {
    await tap(`.node[data-node="${id}"]`);
    await wait(450);
    if (k === 0) await shot("path-popover");
    await tap(`[data-start="${id}"]`);
    await wait(900);
    const res = await playSession(id, wrongDone);
    ok(res.done, `${id}: finished (${res.steps} steps, ${res.wrong} wrong on purpose, ${res.retries} retries)`);
    if (res.wrong) ok(res.retries >= 1, `${id}: wrong answers came back later`);
    ok(res.questions >= 8 && res.questions <= (id.endsWith("-r") ? 16 : 12), `${id}: ${res.questions} questions (8–12 per level)`);
    await shot(`complete-${k === 0 ? "first" : "level"}`);
    ok(await page.locator(".complete-stars .star.is-on").count() >= 1, `${id}: stars on the complete screen`);
    await tap("[data-done]");
    await wait(1000);
    ok(await page.locator(`.node[data-node="${id}"].is-done`).count() === 1, `${id}: marked done on the path`);
  }
  await shot("path-after", true);

  // ------------------------------------------------------------ reload persistence
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem("spreadsheets-practice.v1")));
  await page.reload();
  await wait(1200);
  ok(await page.locator(".node.is-done").count() === nodeIds.length, "after reload every finished node is still done");
  ok(before.xp > 0 && (await page.locator(vp.width >= 1024 ? ".pstat--xp b" : ".chip--xp span").first().innerText()) === String(before.xp), `XP (${before.xp}) survives a reload`);
  ok(Object.keys(before.items).length >= 20, `spaced-repetition scores saved for ${Object.keys(before.items).length} items`);
  const l6Saved = Object.keys(before.items).filter((k) => k.startsWith("6:"));
  ok(l6Saved.length === 5, `Lesson 6's 5 terms have review scores, so Review can bring them back (${l6Saved.length})`);
  const l7Saved = Object.keys(before.items).filter((k) => k.startsWith("7:"));
  ok(l7Saved.length === 13, `Lesson 7's 13 terms have review scores, so Review can bring them back (${l7Saved.length})`);

  // ------------------------------------------------------------ Review button
  await tap(vp.width >= 1024 ? '.side-nav [data-act="review"]' : '.path-top [data-act="review"]');
  await wait(900);
  const rev = await playSession("review", new Set(["*"]));
  ok(rev.done && rev.questions >= 8, `Review session finished (${rev.questions} questions)`);
  await tap("[data-done]");
  await wait(900);

  // ------------------------------------------------------------ My knowledge
  if (await page.locator('[data-act="knowledge"]').count()) {
    await tap(vp.width >= 1024 ? '.side-nav .side-item--kb' : '.path-top [data-act="knowledge"]');
    await wait(700);
    await shot("knowledge");
    const rows = await page.locator(".kb-item").count();
    ok(rows >= 20, `My knowledge lists ${rows} items`);
    const kb6 = page.locator(".kb-lesson").filter({ has: page.locator("h2", { hasText: "Lesson 6" }) });
    ok(await kb6.locator(".kb-item").count() === 5 && await kb6.locator(".kb-group--know .kb-item").count() === 1 && await kb6.locator(".kb-group--do .kb-item").count() === 4,
      "My knowledge lists Lesson 6: sort under Know, four skills under Do");
    const kb7 = page.locator(".kb-lesson").filter({ has: page.locator("h2", { hasText: "Lesson 7" }) });
    ok(await kb7.locator(".kb-item").count() === 13 && await kb7.locator(".kb-group--know .kb-item").count() === 5 && await kb7.locator(".kb-group--do .kb-item").count() === 8,
      "My knowledge lists Lesson 7: five words under Know, eight skills under Do");
    ok(await page.locator(".kb-item .kb-strength").count() >= 20, "every met item shows a strength label");
    ok(await page.locator(".kb-group--know").count() >= 1 && await page.locator(".kb-group--do").count() >= 1, "items are split into Know and Do");
    await tap('[data-act="back"]');
    await wait(600);
  }

  // ------------------------------------------------------------ Download + load progress
  if (await page.evaluate(() => !!document.querySelector('[data-act="settings"]'))) {
    await tap(vp.width >= 1024 ? '.side-nav [data-act="settings"]' : '.path-top [data-act="settings"]');
    await wait(500);
    if (await page.locator("[data-download]").count()) {
      const [dl] = await Promise.all([page.waitForEvent("download"), tap("[data-download]")]);
      const file = path.join(tmpdir(), `e2e-${vp.name}-${dl.suggestedFilename()}`);
      await dl.saveAs(file);
      const text = readFileSync(file, "utf8");
      ok(/^Spreadsheets practice: progress file/.test(text) && /\.txt$/.test(dl.suggestedFilename()), `downloads ${dl.suggestedFilename()} with a friendly first line`);
      const saved = await page.evaluate(() => localStorage.getItem("spreadsheets-practice.v1"));
      // reset
      await tap("[data-reset]");
      await tap("[data-reset]");
      await wait(600);
      ok(await page.locator(".node.is-done").count() === 0, "Reset progress clears every level");
      // a broken file → kind error
      await tap(vp.width >= 1024 ? '.side-nav [data-act="settings"]' : '.path-top [data-act="settings"]');
      await wait(500);
      const bad = path.join(tmpdir(), "e2e-broken.txt");
      writeFileSync(bad, "this is my homework, not a progress file");
      await page.setInputFiles("[data-load]", bad);
      await wait(400);
      await shot("load-broken");
      ok(await page.locator(".load-msg.is-error").count() === 1, "a broken file shows a friendly error");
      // the real file → summary → replace
      await page.setInputFiles("[data-load]", file);
      await wait(400);
      await shot("load-confirm");
      const summary = await page.locator(".load-msg").innerText();
      ok(/Lesson 1/.test(summary) && /XP/.test(summary), `loading shows a summary first: “${summary.replace(/\s+/g, " ").slice(0, 90)}…”`);
      await tap("[data-load-yes]");
      await wait(900);
      ok(await page.locator(".node.is-done").count() === nodeIds.length, "loading the file brings every level back");
      ok(await page.evaluate((s) => localStorage.getItem("spreadsheets-practice.v1") === s, saved), "restored progress is identical to the download");
    } else await page.keyboard.press("Escape");
  }

  // ------------------------------------------------------------ every exercise type (the hidden sampler)
  await page.goto(BASE + "#/play/sampler");
  await wait(1000);
  // Types not yet answered wrong in a level (e.g. a formula with $) get a wrong answer here.
  const sam = await playSession("sampler", wrongDone);
  ok(sam.done && sam.steps >= 25, `the sampler plays one of every exercise type (${sam.steps} steps)`);
  await page.goto(BASE);
  await wait(1000);

  // ------------------------------------------------------------ Part B rules (Chromebook only)
  if (!vp.touch) {
    const r = await page.evaluate(async () => {
      const C = await import("./js/course.js");
      // The knowledge scripts are already loaded by the app (loading them again would declare them twice).
      const kn = {};
      for (const l of C.course.lessons.filter((x) => !x.comingSoon)) kn[l.n] = Function(`return lesson${l.n}Knowledge`)();
      const m = C.buildModel(kn);
      const out = { coreMissing: [], handsMissing: [], levels: 0 };
      for (const l of m.lessons.filter((x) => !x.comingSoon)) for (const lv of l.levels) for (let seed = 1; seed <= 15; seed++) {
        out.levels++;
        const steps = C.levelSession(m, lv, { seed });
        for (const it of lv.items) {
          const list = it.extra?.exercises || [];
          const mine = steps.filter((x) => x.item === it.id && x.ex != null && !x.retrieval);
          const c = list.findIndex((e) => e.core);
          if (c >= 0 && !mine.some((x) => x.ex === c)) out.coreMissing.push(`${lv.id} ${it.term}`);
          if (it.kind === "action" && list.some((e) => C.HANDS_ON.includes(e.type)) && !mine.some((x) => C.HANDS_ON.includes(x.type))) out.handsMissing.push(`${lv.id} ${it.term}`);
        }
      }
      // Retries: another cell, other numbers, the question the other way round.
      const by = (t) => m.items.find((x) => x.term === t);
      const ref = by("cell reference"), pat = by("fill a pattern"), col = by("column");
      const gn = C.authoredExercises(ref, Math.random).find((e) => e.type === "gridName");
      const cells = Array.from({ length: 20 }, () => C.retryStep(m, gn).target);
      const fill = C.authoredExercises(pat, Math.random).find((e) => e.type === "fill" && e.start[0] === 10);
      const fr = C.retryStep(m, fill);
      const d2t = C.genericExercises(col, m.lessons[0].levels[0].items, C.makeRng(2)).find((e) => e.gen === "defToTerm");
      const flip = d2t && C.retryStep(m, d2t);
      // Review aims at the recorded miss (here: Date vs Custom date and time).
      const df = by("date format");
      const k = (df.extra.exercises || []).findIndex((e) => /Custom date and time/.test(e.correct || ""));
      const missed = { type: "choice", ex: k, fact: df.extra.exercises[k].fact };
      const aimed = Array.from({ length: 10 }, (_, s) => C.reviewSession(m, m.items.filter((x) => x.lesson === 2), { seed: s + 1, count: 14, need: (id) => (id === df.id ? 99 : 1), miss: (id) => (id === df.id ? missed : null) }).find((x) => x.item === df.id));
      // Typed references and ranges in every Mixed review.
      const typed = [1, 2].map((n) => Array.from({ length: 10 }, (_, s) => C.reviewSession(m, m.items.filter((x) => x.lesson === n), { seed: s + 1 })).every((ss) => (n === 1 ? ss.some((x) => x.type === "gridName") : true) && ss.some((x) => x.type === "rangeName")));
      return { ...out, cells, gnTarget: gn.target, fr: fr.start, flip: flip?.gen, aimed: aimed.map((x) => x && x.ex === k), typed };
    });
    ok(!r.coreMissing.length, `every level always serves each term's core question (${r.levels} sessions${r.coreMissing.length ? `; missing: ${r.coreMissing.slice(0, 4).join(", ")}` : ""})`);
    ok(!r.handsMissing.length, `every skill always gets a hands-on task${r.handsMissing.length ? ` (missing: ${r.handsMissing.slice(0, 4).join(", ")})` : ""}`);
    ok(r.cells.every((c) => c !== r.gnTarget), `a missed "type the cell" comes back with a different cell (${r.gnTarget} → ${[...new Set(r.cells)].join(", ")})`);
    ok(JSON.stringify(r.fr) !== JSON.stringify([10, 20]), `a missed fill comes back with other numbers (10, 20 → ${r.fr})`);
    ok(r.flip === "termToDef", `a missed "Which term matches?" comes back the other way round (${r.flip})`);
    ok(r.aimed.every(Boolean), `Review brings back the exact miss (Date vs Custom date and time), not an easier question (${r.aimed.filter(Boolean).length}/10)`);
    ok(r.typed.every(Boolean), "every Mixed review has a typed cell reference and a typed range");
    // Leitner: at most one box up per term per calendar day (Date faked).
    const lt = await page.evaluate(async () => {
      const { store } = await import("./js/store.js");
      const realNow = Date.now;
      let t = new Date(2027, 1, 1, 10).getTime();
      Date.now = () => t;
      const id = "1:spreadsheet", seen = [];
      try {
        const st = store.get();
        store.set({ items: { ...st.items, [id]: undefined } });
        for (let i = 0; i < 4; i++) store.grade(id, true);
        seen.push(store.get().items[id].box, store.strength(id, t)); // same day: box 1 only
        for (let d = 1; d <= 2; d++) { t += 864e5; store.grade(id, true); store.grade(id, true); }
        seen.push(store.get().items[id].box, store.strength(id, t)); // three days: box 3, learnt
        store.grade(id, false, { skill: { type: "choice", ex: 0, fact: "calculates for you" } });
        seen.push(store.get().items[id].box, store.get().items[id].miss?.ex);
        store.grade(id, true, { skill: { type: "choice", ex: 0, fact: "calculates for you" } });
        seen.push(store.get().items[id].box, store.get().items[id].miss ?? null); // same day as the promotion: stays at 0
      } finally { Date.now = realNow; }
      return seen;
    });
    ok(lt[0] === 1 && lt[1] !== "learnt", `four right answers in one day move a term up one box only (box ${lt[0]}, ${lt[1]})`);
    ok(lt[2] === 3 && lt[3] === "learnt", `right answers on three different days make it “Learnt” (box ${lt[2]}, ${lt[3]})`);
    ok(lt[4] === 0 && lt[5] === 0, "a wrong answer sends it back to box 0 and remembers which exercise was missed");
    ok(lt[6] === 0 && lt[7] === null, "a right answer on that exercise clears the miss, but the box can't go up again the same day");
  }

  // ------------------------------------------------------------ Lesson 5: kind tips for functions and brackets
  if (!vp.touch) {
    const tips = await page.evaluate(async () => {
      const { formulaTip, normFormula } = await import("./js/exercises.js");
      const t = (got, accept) => formulaTip(normFormula(got), accept.map(normFormula));
      return {
        colon: t("=max(b4-b9)", ["=MAX(B4:B9)"]),
        name: t("=MAX(C2:C9)", ["=MIN(C2:C9)"]),
        brackets: t("=AVERAGE B2:B6", ["=AVERAGE(B2:B6)"]),
        sumAvg: t("=sum(b2:b6)/5", ["=AVERAGE(B2:B6)"]),
        order: t("=B2+C2/2", ["=(B2+C2)/2", "=(C2+B2)/2"]),
        lock: t("=D4/D9", ["=D4/$D$9"]),
      };
    });
    ok(/colon/.test(tips.colon.tip), `=MAX(B4-B9) gets the colon tip: “${tips.colon.tip}”`);
    ok(/MIN gives the lowest/.test(tips.name.tip), `=MAX for a MIN question gets the “which function” tip`);
    ok(/in brackets: =AVERAGE\(first:last\)/.test(tips.brackets.tip), `=AVERAGE B2:B6 gets the brackets tip`);
    ok(/use the AVERAGE function/.test(tips.sumAvg.tip), `=SUM(B2:B6)/5 for an AVERAGE question gets the “use AVERAGE” tip`);
    ok(tips.order.title === "Brackets!" && /× and ÷ go before/.test(tips.order.tip), `=B2+C2/2 gets the order-of-operations tip`);
    ok(tips.lock.title === "Lock it!" && /Chromebook/.test(tips.lock.tip), `a missing $ still gets the Chromebook-friendly “Lock it!” tip`);
    await page.goto(BASE);
    await wait(900);
    ok(await page.locator(".unit--ink").innerText().then((t) => /Lessons 1–7 review/.test(t)), "the big review is called “Lessons 1–7 review”");
    ok(await page.locator('.node[data-node="all-r"]').count() === 1, "the big review keeps its id (all-r), so saved progress still counts");
    ok(await page.evaluate(async () => { const { course } = await import("./content/course.js"); const t = course.lessons.map((l) => l.theme); return !t.includes("yellow") && new Set(t).size === t.length; }), "every lesson has its own colour, and none is yellow (yellow means done)");
    ok(await page.locator(".unit--teal").filter({ hasText: "Lesson 5" }).count() === 1, "Lesson 5 is on the path (teal)");
    ok(await page.locator(".unit--magenta").filter({ hasText: "Lesson 6" }).count() === 1, "Lesson 6 is on the path (magenta)");
    const l6 = await page.evaluate(async () => {
      const { course } = await import("./content/course.js");
      return { final: course.finalReview.needs, nodes: [...document.querySelectorAll(".node[data-node^='6-']")].map((n) => n.dataset.node) };
    });
    ok(l6.final.includes(6), "Lesson 6 is in the big review");
    ok(["6-1", "6-2", "6-r"].every((id) => l6.nodes.includes(id)), `Lesson 6 has its levels and mixed review (${l6.nodes.join(", ")})`);
    ok(await page.locator(".unit--navy").filter({ hasText: "Lesson 7" }).count() === 1, "Lesson 7 is on the path (navy)");
    const l7 = await page.evaluate(async () => {
      const { course } = await import("./content/course.js");
      return { final: course.finalReview.needs, nodes: [...document.querySelectorAll(".node[data-node^='7-']")].map((n) => n.dataset.node) };
    });
    ok(l7.final.includes(7), "Lesson 7 is in the big review");
    ok(["7-1", "7-2", "7-3", "7-r"].every((id) => l7.nodes.includes(id)), `Lesson 7 has its levels and mixed review (${l7.nodes.join(", ")})`);
    // Every real screenshot loads, and every region sits inside it.
    const shots = await page.evaluate(async () => {
      const { screens } = await import("./content/screens.js");
      const out = [];
      for (const [id, sc] of Object.entries(screens)) {
        if (sc.drawn) continue;
        const img = new Image(); img.src = sc.src;
        await img.decode().catch(() => {});
        out.push({ id, ok: img.naturalWidth === sc.w && img.naturalHeight === sc.h });
      }
      return out;
    });
    ok(shots.every((x) => x.ok), `every screenshot loads at its listed size (${shots.filter((x) => !x.ok).map((x) => x.id).join(", ") || shots.length + " pictures"})`);
  }

  // ------------------------------------------------------------ quit dialog
  await tap(".node.is-done");
  await wait(400);
  await tap("[data-start]");
  await wait(900);
  await page.keyboard.press("Escape");
  await wait(400);
  await shot("quit-dialog");
  ok(await page.locator(".modal .quit").count() === 1, "Esc in a level asks before leaving");
  await tap('[data-q="leave"]');
  await wait(700);
  ok(await page.locator(".screen.path").count() === 1, "Leave goes back to the path");
  await ctx.close();

  // =================================================================== session player
  async function playSession(id, wrongDone) {
    const res = { done: false, steps: 0, wrong: 0, retries: 0, questions: 0 };
    const seenIds = new Set();
    let sawRetry = false;
    for (let guard = 0; guard < 60; guard++) {
      if (await page.locator(".screen.complete").count()) { res.done = true; break; }
      const step = await page.evaluate(() => { const s = document.querySelector(".screen.lesson")?.__step; return s ? JSON.parse(JSON.stringify(s)) : null; });
      if (!step) { await wait(400); continue; }
      // Wait until the old step has gone and the new one has finished sliding in.
      await page.waitForFunction(() => {
        const ex = document.querySelector(".lesson-body .ex:not(.step-leave)");
        return !document.querySelector(".step-leave") && ex && !ex.getAnimations().some((an) => an.playState === "running");
      }, null, { timeout: 3000 }).catch(() => {});
      res.steps++;
      if (step.retry) res.retries++;
      // A wrong answer comes back at the end of the session (after every new question), not 1–2 screens on.
      if (step.retry) sawRetry = true;
      else if (sawRetry && step.type !== "learn") ok(false, `${id}: a new question came after a retry (retries belong at the end)`);
      if (step.retry && step.retryOf?.versions > 1 && step.ex === step.retryOf.ex) {
        ok(JSON.stringify(step.target ?? step.from) !== JSON.stringify(step.retryOf.target), `${id}: the retry of ${step.type} is a new version (${JSON.stringify(step.retryOf.target)} → ${JSON.stringify(step.target ?? step.from)})`);
      }
      if (step.type !== "learn" && !step.retry) res.questions++;
      let typeKey = step.type === "choice" && step.gen ? step.gen : step.type === "keys" && (await page.locator(".key-zone").count()) === 0 ? "keys-choice" : step.type === "hotspot" ? hotspotKey(step) : step.type === "formula" && step.accept[0].includes("$") ? "formula-lock" : step.type;
      if (step.type === "learn") typeKey = "learn-" + await page.evaluate(() => {
        const v = document.querySelector(".lesson-body .ex:not(.step-leave) .learn-visual");
        if (!v) return "text";
        return v.querySelector(".replay") ? "demo" : v.querySelector(".shot") ? "screenshot" : v.querySelector(".charts-row") ? "charts" : v.querySelector(".chart-sheet") ? "chart-on-sheet" : v.querySelector(".chart") ? "chart" : v.querySelector(".tab-menu") ? "menu" : v.querySelector(".tabs-bar") ? "tabs" : v.querySelector(".keycaps") ? "keys" : v.querySelector(".tool-icons") ? "icons" : v.querySelector(".step-chips") ? "steps" : "grid";
      });
      await shot(`ex-${typeKey}`);
      // Answer wrong once per exercise type (per viewport), never on a retry.
      // A hotspot with only one region (e.g. "Tap the legend") has nothing wrong to tap: answer it right.
      const oneRegion = step.type === "hotspot" && await page.evaluate((t) => ![...document.querySelectorAll(".lesson-body .ex:not(.step-leave) [data-region]")].some((b) => b.dataset.region !== t), step.target);
      const goWrong = !step.retry && step.type !== "learn" && !oneRegion && !wrongDone.has("*") && !wrongDone.has(typeKey);
      if (goWrong) { wrongDone.add(typeKey); res.wrong++; }
      await answer(step, !goWrong, typeKey);
      // feedback
      if (step.type === "learn") { await wait(500); continue; }
      await page.waitForSelector(".feedback.is-open", { timeout: 4000 }).catch(() => {});
      const state = await page.evaluate(() => { const s = document.querySelector(".feedback"); return s.classList.contains("is-open") ? (s.classList.contains("is-wrong") ? "wrong" : "correct") : "closed"; });
      ok(state === (goWrong ? "wrong" : "correct"), `${id} ${typeKey}${step.retry ? " (retry)" : ""}: ${goWrong ? "wrong" : "right"} answer → ${state}`);
      if (step.type === "fill") await wait(2600); // the fill animation plays under the sheet
      if (step.type === "fillFormula") await wait(450 * 4 + 600);
      if (step.type === "sortPredict") await wait(900);
      await shot(`fb-${goWrong ? "wrong" : "right"}-${typeKey}`);
      if (step.type === "fill" && !goWrong) {
        const filled = await page.evaluate(() => [...document.querySelectorAll(".ex-fill .sh-cell[data-ref^='B']")].map((c) => c.textContent).filter(Boolean).length);
        ok(filled >= step.end, `fill: the grid animates the fill (${filled} cells filled)`);
      }
      if (step.type === "fillFormula") {
        const want = await page.evaluate(async (s) => (await import("./js/exercises.js")).fillFormulaOptions(s.formula, s.from, s.to).correct, step);
        const shown = await page.locator(EX + `.sh-cell[data-ref="${step.to}"]`).innerText();
        ok(shown === want, `fillFormula: the fill plays out and ${step.to} shows ${want} (${shown})`);
        const across = step.from[0] !== step.to[0];
        ok((across ? /letters move/ : /numbers move/).test(await page.locator(".feedback__body").innerText()), `fillFormula: the feedback says the ${across ? "letters" : "numbers"} move`);
      }
      if (goWrong && ["hotspot-menu", "hotspot-sortwin", "hotspot-editor", "hotspot-chartmenu", "hotspot-chart"].includes(typeKey)) ok(/You tapped/.test(await page.locator(".feedback__body").innerText()), `${typeKey}: a wrong tap says what was tapped`);
      if (step.type === "gridMulti") {
        const fb = await page.locator(".feedback__body").innerText();
        ok(goWrong ? /Hold Ctrl|hold Ctrl/.test(fb) : new RegExp(`data range is ${step.target.join(",")}`).test(fb), `gridMulti: the feedback ${goWrong ? "says to hold Ctrl" : `gives the data range ${step.target.join(",")}`}`);
        if (goWrong) ok(await page.locator(EX + ".sh-mark--ok").count() === 2, "gridMulti: both right ranges are marked");
      }
      if (step.type === "chartChoice") ok(await page.locator(EX + ".option.is-correct").count() === 1, "chartChoice: the right chart is marked");
      if (step.type === "sortPredict") {
        const want = await page.evaluate(async (s) => (await import("./js/sort.js")).sortOptions(s).correct.map((r) => String(r[0])), step);
        const shown = await page.evaluate((n) => Array.from({ length: n }, (_, i) => document.querySelector(`.lesson-body .ex:not(.step-leave) .sh-cell[data-ref="A${i + 2}"]`)?.textContent), step.rows.length);
        ok(JSON.stringify(shown) === JSON.stringify(want), `sortPredict: the rows move into their sorted order (${shown.join(", ")})`);
        ok(await page.locator(EX + ".option.is-correct").count() === 1, "sortPredict: the right table is marked");
        ok(/Each whole row moves together/.test(await page.locator(".feedback__body").innerText()), "sortPredict: the feedback says each row moves together");
      }
      if (step.type === "formula" && goWrong && !step.accept[0].includes("$")) ok(/Start with =/.test(await page.locator(".feedback__body").innerText()), "a formula without = gets the kind “Start with =” tip");
      if (step.type === "gridName" && goWrong) ok(/Letter first/.test(await page.locator(".feedback__title").innerText()), "typing 5C-style gets the kind “Letter first!” explanation");
      if (step.type === "match" && goWrong) {
        // A mix-up in the matching game is a wrong answer for that term: said, and saved.
        ok(/mix-up/.test(await page.locator(".feedback__title").innerText()) && /You matched/.test(await page.locator(".feedback__body").innerText()), "match: a mix-up gets wrong-answer feedback that names it");
        const it = await page.evaluate((id) => JSON.parse(localStorage.getItem("spreadsheets-practice.v1")).items[id], step.items[0]);
        ok(it && it.wrong >= 1 && it.box === 0, `match: the mixed-up term is saved as a miss (${step.pairs[0].term}: wrong ${it?.wrong}, box ${it?.box})`);
      }
      await page.evaluate(() => { document.querySelector(".screen.lesson").__old = document.querySelector(".screen.lesson").__step; });
      if (vp.touch) {
        try { await page.locator('[data-act="continue"]').tap({ timeout: 4000 }); }
        catch (e) {
          const info = await page.evaluate(() => ({ sx: scrollX, sy: scrollY, vv: [visualViewport.offsetTop, visualViewport.height, visualViewport.scale], app: document.getElementById("app").scrollTop, scr: document.querySelector(".screen.lesson")?.scrollTop, r: document.querySelector('[data-act="continue"]').getBoundingClientRect().toJSON(), act: document.activeElement?.className }));
          await page.screenshot({ path: `${OUT}/DEBUG-continue-${Date.now()}.png` });
          ok(false, `${id} ${typeKey}: CONTINUE reachable ${JSON.stringify(info)}`);
          await page.locator('[data-act="continue"]').dispatchEvent("click");
        }
      } else await page.keyboard.press("Enter"); // Enter = CONTINUE
      const moved = await page.waitForFunction(() => { const s = document.querySelector(".screen.lesson"); return !s || s.__step !== s.__old; }, null, { timeout: 3000 }).then(() => true, () => false);
      ok(moved, `${id} ${typeKey}: CONTINUE moves on`);
      if (!moved) return res;
      await wait(450);
      seenIds.add(step.item);
    }
    return res;
  }

  async function answer(step, right, typeKey) {
    const check = async () => {
      if (!vp.touch) return page.keyboard.press("Enter"); // Enter = CHECK
      await page.locator('.lesson-foot [data-act="main"]').tap();
      const opened = await page.waitForSelector(".feedback.is-open", { timeout: 1500 }).then(() => true, () => false);
      if (!opened && !(await page.locator('.lesson-foot [data-act="main"]').isDisabled())) {
        checkRetries++;
        log(`  (CHECK tap after an emulated drag didn't register; tapping again)`);
        await page.locator('.lesson-foot [data-act="main"]').tap();
      }
    };
    switch (step.type) {
      case "learn": await tap('.lesson-foot [data-act="main"]'); return;
      case "choice": {
        await pickOption((t) => (right ? t === step.correct : t !== step.correct));
        return check();
      }
      case "fill": {
        const correct = await page.evaluate(async (s) => (await import("./js/exercises.js")).fillOptions(s.start, s.end).correct, step);
        await pickOption((t) => (right ? t === correct : t !== correct));
        return check();
      }
      case "fillFormula": {
        const fit = await page.evaluate(() => { const b = document.querySelector(".lesson-body"); return { v: b.scrollHeight - b.clientHeight, h: document.documentElement.scrollWidth - innerWidth }; });
        ok(fit.h <= 0, `fillFormula: no sideways scrolling (${fit.h}px)`);
        if (!vp.touch) ok(fit.v <= 1, `fillFormula: fits without scrolling at ${vp.width}×${vp.height} (${fit.v}px over)`);
        const o = await page.evaluate(async (s) => (await import("./js/exercises.js")).fillFormulaOptions(s.formula, s.from, s.to), step);
        ok(o.wrong.length === 3 && !o.wrong.includes(o.correct), `fillFormula: 1 right and 3 different wrong options for ${step.formula}`);
        await pickOption((t) => (right ? t === o.correct : t !== o.correct));
        return check();
      }
      case "sortPredict": {
        const fit = await page.evaluate(() => { const b = document.querySelector(".lesson-body"); return { v: b.scrollHeight - b.clientHeight, h: document.documentElement.scrollWidth - innerWidth }; });
        ok(fit.h <= 0, `sortPredict: no sideways scrolling (${fit.h}px)`);
        if (!vp.touch) ok(fit.v <= 1, `sortPredict: fits without scrolling at ${vp.width}×${vp.height} (${fit.v}px over)`);
        const o = await page.evaluate(async (s) => { const S = await import("./js/sort.js"); const r = S.sortOptions(s); return { correct: S.rowsText(r.correct), wrong: r.wrong.map(S.rowsText) }; }, step);
        ok(o.wrong.length === 3 && !o.wrong.includes(o.correct) && new Set(o.wrong).size === 3, `sortPredict: 1 right and 3 different wrong tables for ${step.by}, ${step.dir}${step.then ? ` then ${step.then.by}` : ""}`);
        const vals = await page.evaluate(() => [...document.querySelectorAll(".lesson-body .ex:not(.step-leave) .option")].map((b) => b.dataset.v));
        const i = vals.findIndex((v) => (right ? v === o.correct : v !== o.correct));
        if (vp.touch) await page.locator(EX + ".option").nth(i).tap(); else await page.keyboard.press(String(i + 1));
        return check();
      }
      case "chartChoice": {
        const fit = await page.evaluate(() => { const b = document.querySelector(".lesson-body"); return { v: b.scrollHeight - b.clientHeight, h: document.documentElement.scrollWidth - innerWidth }; });
        ok(fit.h <= 0, `chartChoice: no sideways scrolling (${fit.h}px)`);
        if (!vp.touch) ok(fit.v <= 1, `chartChoice: fits without scrolling at ${vp.width}×${vp.height} (${fit.v}px over)`);
        const vals = await page.evaluate(() => [...document.querySelectorAll(".lesson-body .ex:not(.step-leave) .option")].map((b) => b.dataset.v));
        ok(vals.length === 1 + step.wrong.length && vals.filter((v) => v === step.correct.desc).length === 1, `chartChoice: ${vals.length} drawn charts, one of them right`);
        const i = vals.findIndex((v) => (right ? v === step.correct.desc : v !== step.correct.desc));
        if (vp.touch) await page.locator(EX + ".option").nth(i).tap(); else await page.keyboard.press(String(i + 1));
        return check();
      }
      case "gridMulti": {
        const fit = await page.evaluate(() => { const b = document.querySelector(".lesson-body"); return { v: b.scrollHeight - b.clientHeight, h: document.documentElement.scrollWidth - innerWidth }; });
        ok(fit.h <= 0, `gridMulti: no sideways scrolling (${fit.h}px)`);
        if (!vp.touch) ok(fit.v <= 1, `gridMulti: fits without scrolling at ${vp.width}×${vp.height} (${fit.v}px over)`);
        const [r1, r2] = step.target;
        const dragRange = async (r) => { const [a, b] = r.split(":"); await drag(EX + `.sh-cell[data-ref="${a}"]`, EX + `.sh-cell[data-ref="${b}"]`); };
        await dragRange(r1);
        if (right) {
          // Hold Ctrl for the second range: the real key with a mouse, the on-screen Ctrl key on a touch screen.
          if (vp.touch) { await page.locator(EX + ".ctrl-latch").tap(); ok(await page.locator(EX + ".ctrl-latch.is-on").count() === 1, "gridMulti: the on-screen Ctrl key stays held"); }
          else await page.keyboard.down("Control");
          await dragRange(r2);
          if (!vp.touch) await page.keyboard.up("Control");
          let boxes = await page.evaluate(() => document.querySelectorAll(".lesson-body .ex:not(.step-leave) .sh-sel--also").length);
          if (boxes !== 1 && vp.touch) { dragRetries++; await dragRange(r2); boxes = await page.evaluate(() => document.querySelectorAll(".lesson-body .ex:not(.step-leave) .sh-sel--also").length); }
          ok(boxes === 1, `gridMulti: with Ctrl, the first range stays selected (${boxes} kept)`);
        } else await dragRange(r2); // no Ctrl: the first range is lost
        return check();
      }
      case "keys": {
        if (await page.locator(".key-zone").count()) {
          const k = { "ctrl+z": "Control+z", "ctrl+y": "Control+y", delete: "Delete", enter: "Enter", "ctrl+`": "Control+Backquote" }[step.combo];
          await page.keyboard.press(right ? k : "Control+x");
          return;
        }
        const want = step.label.replace(/\s/g, "");
        await pickOption((t) => (right ? t.replace(/\s/g, "") === want : t.replace(/\s/g, "") !== want), true);
        return check();
      }
      case "gridClick": {
        const t = String(step.target);
        let sel;
        if (!right) sel = '.sh-cell[data-ref="A1"]';
        else if (t === "handle") sel = "[data-handle]";
        else if (t.startsWith("col:")) sel = `.sh-col[data-col="${t.charCodeAt(4) - 65}"]`;
        else if (t.startsWith("row:")) sel = `.sh-row[data-row="${t.slice(4)}"]`;
        else sel = `.sh-cell[data-ref="${t}"]`;
        await tap(EX + sel);
        return check();
      }
      case "gridName": {
        const t = step.target;
        await page.locator(EX + ".type-input").fill(right ? t.toLowerCase() : `${t.slice(1)}${t[0]}`);
        return check();
      }
      case "formula": {
        // Wrong: no = (or, for a formula with $, no $ at all).
        const lock = step.accept[0].includes("$");
        await page.locator(EX + ".type-input").fill(right ? step.accept[0].toLowerCase() : lock ? step.accept[0].replace(/\$/g, "") : step.accept[0].slice(1));
        await check();
        if (!right && lock) {
          await page.waitForSelector(".feedback.is-open", { timeout: 4000 }).catch(() => {});
          ok(/Lock it/.test(await page.locator(".feedback__title").innerText()) && /F4/.test(await page.locator(".feedback__body").innerText()), "a formula missing its $ gets the kind “Lock it!” tip, with F4");
        }
        return;
      }
      case "lockRef": {
        const fit = await page.evaluate(() => { const b = document.querySelector(".lesson-body"); return { v: b.scrollHeight - b.clientHeight, h: document.documentElement.scrollWidth - innerWidth }; });
        ok(fit.h <= 0, `lockRef: no sideways scrolling (${fit.h}px)`);
        if (!vp.touch) ok(fit.v <= 1, `lockRef: fits without scrolling at ${vp.width}×${vp.height} (${fit.v}px over)`);
        const refs = await page.evaluate(() => [...document.querySelectorAll(".lesson-body .ex:not(.step-leave) .lock-ref")].map((b) => b.dataset.ref));
        const want = right ? step.lock : refs.filter((r) => !step.lock.includes(r)).slice(0, 1);
        for (const r of want) {
          const i = refs.indexOf(r);
          if (vp.touch) await page.locator(EX + ".lock-ref").nth(i).tap(); else await page.keyboard.press(String(i + 1));
          await wait(120);
        }
        ok(await page.locator(EX + '.lock-ref[aria-pressed="true"] .lock-ref__t').first().innerText().then((t) => t.startsWith("$")), "lockRef: a tapped reference gets its $ signs");
        await check();
        await page.waitForSelector(".feedback.is-open", { timeout: 4000 }).catch(() => {});
        if (!right) ok(/move with the row/.test(await page.locator(".feedback__body").innerText()), "lockRef: locking the wrong reference explains why it should move");
        return;
      }
      case "gaps": {
        const fit = await page.evaluate(() => { const b = document.querySelector(".lesson-body"); return { v: b.scrollHeight - b.clientHeight, h: document.documentElement.scrollWidth - innerWidth }; });
        ok(fit.h <= 0, `gaps: no sideways scrolling (${fit.h}px)`);
        if (!vp.touch) ok(fit.v <= 1, `gaps: fits without scrolling at ${vp.width}×${vp.height} (${fit.v}px over)`);
        // Wrong: a distractor chip in gap 1. Right: the answers in gap order.
        const lower = step.answers.map((a) => a.toLowerCase());
        const seq = right ? step.answers : [step.chips.find((c) => !lower.includes(c.toLowerCase())), ...step.answers.slice(1)];
        if (vp.touch && right && !step.retry) {
          // Tapping a filled gap gives its chip back, and that gap is active again.
          const w = step.chips.findIndex((c) => !lower.includes(c.toLowerCase()));
          await page.locator(EX + ".word-chip").nth(w).tap(); await wait(120);
          ok(await page.locator(EX + ".word-chip.is-used").count() === 1 && await page.locator(EX + '.gap[data-slot="0"].is-filled').count() === 1, "gaps: a tapped chip fills gap 1");
          await page.locator(EX + '.gap[data-slot="0"]').tap(); await wait(120);
          ok(await page.locator(EX + ".word-chip.is-used").count() === 0 && await page.locator(EX + '.gap[data-slot="0"].is-active').count() === 1, "gaps: tapping a filled gap gives its chip back");
        }
        for (const w of seq) {
          const i = await page.evaluate((w) => [...document.querySelectorAll(".lesson-body .ex:not(.step-leave) .word-chip")].findIndex((b) => !b.disabled && b.querySelector(".label").textContent.toLowerCase() === w.toLowerCase()), w);
          if (vp.touch) await page.locator(EX + ".word-chip").nth(i).tap(); else await page.keyboard.press(String(i + 1));
          await wait(120);
        }
        if (!right) ok(await page.locator(EX + ".gap.is-filled").count() === step.answers.length, "gaps: every slot filled in order");
        ok(!(await page.locator('.lesson-foot [data-act="main"]').isDisabled()), "gaps: CHECK is on once every gap is filled");
        await check();
        await page.waitForSelector(".feedback.is-open", { timeout: 4000 }).catch(() => {});
        ok(await page.locator(".feedback__def--full .hl").count() === step.answers.length, "gaps: feedback shows the definition with the answers highlighted");
        if (!right) ok(await page.locator(EX + ".gap.is-off").count() >= 1, "gaps: the wrong gap is marked");
        return;
      }
      case "rangeName": {
        const [a, b] = step.target.split(":");
        await page.locator(EX + ".type-input").fill(right ? step.target.toLowerCase() : `${b}:${a}`);
        return check();
      }
      case "gridRange": {
        const [a, b] = step.target.split(":");
        await drag(EX + `.sh-cell[data-ref="${a}"]`, EX + `.sh-cell[data-ref="${right ? b : a}"]`);
        if (await page.locator('.lesson-foot [data-act="main"]').isDisabled()) {
          dragRetries++;
          await page.evaluate(() => { window.__ev = []; const g = document.querySelector(".lesson-body .ex:not(.step-leave) .sheet-grid"); ["pointerdown", "pointermove", "pointerup", "pointercancel", "touchstart", "touchend", "touchcancel"].forEach((t) => g.addEventListener(t, (e) => window.__ev.push(t + ":" + (e.target.dataset?.ref || e.target.className)), true)); });
          await drag(EX + `.sh-cell[data-ref="${a}"]`, EX + `.sh-cell[data-ref="${right ? b : a}"]`);
          if (await page.locator('.lesson-foot [data-act="main"]').isDisabled()) log("  DRAG DEBUG", await page.evaluate((a) => { const c = document.querySelector(`.lesson-body .ex:not(.step-leave) .sh-cell[data-ref="${a}"]`); const r = c.getBoundingClientRect(); const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return JSON.stringify({ ev: window.__ev.slice(0, 5), n: window.__ev.length, hit: el?.className, r: [r.x, r.y], exs: document.querySelectorAll(".lesson-body .ex").length, modal: !!document.querySelector(".modal, .scrim"), toast: !!document.querySelector(".toast") }); }, a));
        }
        return check();
      }
      case "gridMove": {
        const wrongTo = step.to === "A1" ? "A2" : "A1";
        await drag(EX + `.sh-cell[data-ref="${step.from}"]`, EX + `.sh-cell[data-ref="${right ? step.to : wrongTo}"]`);
        if (await page.locator('.lesson-foot [data-act="main"]').isDisabled()) { dragRetries++; await drag(EX + `.sh-cell[data-ref="${step.from}"]`, EX + `.sh-cell[data-ref="${right ? step.to : wrongTo}"]`); }
        return check();
      }
      case "hotspot": {
        const other = await page.evaluate((t) => [...document.querySelectorAll(".lesson-body .ex:not(.step-leave) [data-region]")].map((b) => b.dataset.region).find((r) => r !== t), step.target);
        await tap(EX + `[data-region="${right || !other ? step.target : other}"]`); // no other region: answer right
        return check();
      }
      case "order": {
        const seq = right ? step.steps : [...step.steps].reverse();
        for (const s of seq) {
          const i = await page.evaluate((s) => [...document.querySelectorAll(".order-card")].findIndex((b) => b.querySelector(".label").textContent === s), s);
          await tap(EX + `.order-slotbg:nth-child(${i + 1}) .order-card`);
          await wait(120);
        }
        return check();
      }
      case "match": {
        if (!right) {
          // Wrong: the first term with the second meaning (it bounces back), then every pair right.
          const ti = await page.evaluate((t) => [...document.querySelectorAll('.lesson-body .ex:not(.step-leave) .match-card[data-side="t"]')].findIndex((b) => b.textContent.trim() === t), step.pairs[0].term);
          await tap(EX + `.match-card[data-side="t"] >> nth=${ti}`);
          const di = await page.evaluate((d) => [...document.querySelectorAll('.lesson-body .ex:not(.step-leave) .match-card[data-side="d"]')].findIndex((b) => b.textContent.trim() === d), step.pairs[1].def);
          await tap(EX + `.match-card[data-side="d"] >> nth=${di}`);
          await wait(700);
        }
        for (const p of step.pairs) {
          const ti = await page.evaluate((t) => [...document.querySelectorAll('.lesson-body .ex:not(.step-leave) .match-card[data-side="t"]')].findIndex((b) => b.textContent.trim() === t), p.term);
          await tap(EX + `.match-card[data-side="t"] >> nth=${ti}`);
          const i = await page.evaluate((d) => [...document.querySelectorAll('.lesson-body .ex:not(.step-leave) .match-card[data-side="d"]')].findIndex((b) => b.textContent.trim() === d), p.def);
          await tap(EX + `.match-card[data-side="d"] >> nth=${i}`);
          await wait(250);
        }
        return;
      }
      default: throw new Error("unknown step " + step.type);
    }
  }

  function hotspotKey(step) {
    if (step.ui?.chart) return "hotspot-chart";
    if (step.ui) return "hotspot-ui";
    const sc = step.screen;
    if (["menu-bar", "data-menu", "data-menu-sort-range", "insert-menu"].includes(sc)) return "hotspot-menu";
    if (sc === "sort-window") return "hotspot-sortwin";
    if (["chart-type", "setup-column", "setup-switched", "titles", "pie-slice", "series-colour", "legend"].includes(sc)) return "hotspot-editor";
    if (["chart-menu", "chart-selected"].includes(sc)) return "hotspot-chartmenu";
    return "hotspot";
  }

  async function pickOption(test, compact = false) {
    const texts = await page.evaluate((compact) => [...document.querySelectorAll(".lesson-body .ex:not(.step-leave) .option .label")].map((l) => (compact ? l.textContent.replace(/\s/g, "") : l.textContent.trim())), compact);
    const i = texts.findIndex(test);
    if (i < 0) throw new Error("no matching option in " + JSON.stringify(texts));
    if (vp.touch) await page.locator(".lesson-body .ex:not(.step-leave) .option").nth(i).tap();
    else await page.keyboard.press(String(i + 1)); // number keys pick options
  }

  async function drag(fromSel, toSel) {
    const a = await page.locator(fromSel).first().boundingBox();
    const b = await page.locator(toSel).first().boundingBox();
    const p1 = { x: a.x + a.width / 2, y: a.y + a.height / 2 }, p2 = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    if (!vp.touch) {
      await page.mouse.move(p1.x, p1.y);
      await page.mouse.down();
      for (let k = 1; k <= 8; k++) await page.mouse.move(p1.x + ((p2.x - p1.x) * k) / 8, p1.y + ((p2.y - p1.y) * k) / 8);
      await page.mouse.up();
    } else {
      // A real touch drag through the DevTools protocol (touch + pointer events).
      const pt = (p) => [{ x: p.x, y: p.y, id: 1 }];
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pt(p1) });
      for (let k = 1; k <= 8; k++) {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: pt({ x: p1.x + ((p2.x - p1.x) * k) / 8, y: p1.y + ((p2.y - p1.y) * k) / 8 }) });
        await wait(16);
      }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await wait(60);
      await cdp.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] }).catch(() => {});
    }
    await wait(250);
  }
}
