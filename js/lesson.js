// Lesson runner: progress bar, CHECK / CONTINUE, the feedback sheet, wrong
// answers coming back a few steps later, keyboard (1–9, Enter, Backspace, Esc).
// Exercise types live in js/exercises.js.
import { icon } from "./icons.js";
import { $, esc, rich, el, button, footBar, pick, restartAnim, reducedMotion, openModal, mascotImg } from "./ui.js";
import { sfx } from "./sound.js";
import { mascotSrc } from "./brand.js";
import { EXERCISES } from "./exercises.js";

const MAX_RETRIES = 2;
const PRAISE = ["Nice!", "Great job!", "Spot on!", "Nailed it!", "You got it!", "Brilliant!", "Correct!"];
const ENCOURAGE = ["Not quite", "Almost!", "Good try!", "Not yet"];
const KIND = ["Mistakes help you learn.", "Every mistake is practice.", "Now you know for next time."];

/**
 * session: { id, title, steps, xpBase }
 * hooks: { item(id), onGraded(step, result), onExit(), onComplete({ xp, accuracy, practised }), openSettings() }
 */
export function runLesson(app, session, hooks) {
  const queue = session.steps.map((s) => ({ ...s, tries: 0 }));
  const total = queue.length;
  let done = 0;
  let idx = -1;
  let current = null;
  let mode = "answer"; // answer | feedback
  const stats = { graded: 0, correct: 0, firstTry: 0, firstGraded: 0, streak: 0, bestStreak: 0, practised: new Set() };
  let pendingCount = false;
  let afterTimer = 0;

  const screen = el(`
    <section class="screen lesson" aria-label="${esc(session.title)}">
      <header class="lesson-top">
        <button class="bar-btn" data-act="close" aria-label="Quit">${icon("x", 28, 3)}</button>
        <div class="progress" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <div class="progress__fill"></div>
        </div>
        <button class="bar-btn" data-act="settings" aria-label="Settings">${icon("sliders-horizontal", 26, 2.5)}</button>
        <div class="combo" aria-hidden="true">${icon("flame", 16, 2.5)}<span></span></div>
      </header>
      <main class="lesson-body" tabindex="-1"></main>
      ${footBar(button("Check", { attrs: 'data-act="main"' }))}
      <div class="sheet feedback" role="region" aria-live="polite" aria-label="Answer feedback" inert>
        <img class="feedback__owl" alt="" src="${mascotSrc("happy")}">
        <div class="feedback__head">
          <span class="feedback__icon"></span>
          <h2 class="feedback__title"></h2>
        </div>
        <div class="feedback__body"></div>
        ${button("Continue", { variant: "correct", attrs: 'data-act="continue"' })}
      </div>
    </section>`);
  app.appendChild(screen);

  const body = $(".lesson-body", screen);
  const mainBtn = $('[data-act="main"]', screen);
  const sheet = $(".feedback", screen);
  const contBtn = $('[data-act="continue"]', screen);
  const fill = $(".progress__fill", screen);
  const bar = $(".progress", screen);
  const combo = $(".combo", screen);
  const foot = $(".lesson-foot", screen);
  const aside = $(".lesson-foot__aside", screen);

  // Secondary actions on the left of the bottom bar (from 700px wide).
  const ASIDE = {
    skip: () => button("Skip", { variant: "secondary", block: false, attrs: 'data-act="skip"' }),
    "no-keyboard": () => `<button class="btn-text" data-act="no-keyboard">${icon("hand", 20, 2.5)} No keyboard?</button>`,
  };

  const api = {
    setFooter(label, { enabled = true, variant = "primary" } = {}) {
      mainBtn.querySelector(".face > span").textContent = label;
      mainBtn.className = `press btn btn--${variant} btn--block`;
      mainBtn.disabled = !enabled;
    },
    enableCheck(on) { mainBtn.disabled = !on; },
    setAside(keys = []) {
      aside.innerHTML = keys.map((k) => ASIDE[k]?.() || "").join("");
      // Phones have no bottom-bar aside: "No keyboard?" also sits in the exercise.
      current?.el?.querySelector(".ex-escape")?.remove();
      if (keys.includes("no-keyboard") && current?.el) current.el.appendChild(el(`<div class="ex-escape">${ASIDE["no-keyboard"]()}</div>`));
    },
    complete(result) { showFeedback(result); },
    next() { advance(true); },
    item: (id) => hooks.item(id),
    /** Swap the current exercise for another controller (e.g. keys → multiple choice). */
    replace(ctrl) {
      current?.destroy?.();
      const old = current.el;
      current = ctrl;
      old.replaceWith(ctrl.el);
      ctrl.el.classList.add("step-enter");
      const f = ctrl.footer || { label: "Check", enabled: false };
      api.setFooter(f.label, f);
      api.setAside(ctrl.aside);
      ctrl.mount?.();
    },
  };

  function setProgress() {
    const p = Math.min(1, done / Math.max(1, total));
    fill.style.setProperty("--p", p);
    bar.setAttribute("aria-valuenow", Math.round(p * 100));
  }

  // ------------------------------------------------------------ flow
  function advance(countIt) {
    clearTimeout(afterTimer);
    if (countIt) done++;
    setProgress();
    hideSheet();
    current?.destroy?.();
    idx++;
    if (idx >= queue.length) return finish();
    const step = queue[idx];
    mode = "answer";
    current = EXERCISES[step.type](step, api);
    const next = current.el;
    next.classList.add("step-enter");
    // Every older step leaves (two quick CONTINUEs can leave two behind).
    for (const prev of [...body.children]) {
      if (prev.classList.contains("step-leave")) continue;
      prev.classList.add("step-leave");
      prev.inert = true;
      prev.addEventListener("animationend", () => prev.remove(), { once: true });
      setTimeout(() => prev.remove(), 400);
    }
    body.appendChild(next);
    body.scrollTop = 0;
    screen.dataset.step = step.type;
    screen.__step = step; // read by tools/e2e.mjs
    const f = current.footer || { label: "Check", enabled: false };
    api.setFooter(f.label, f);
    api.setAside(current.aside);
    if (!screen.contains(document.activeElement) || sheet.contains(document.activeElement) || document.activeElement === document.body) body.focus({ preventScroll: true });
    current.mount?.();
  }

  function finish() {
    document.removeEventListener("keydown", onKey);
    const accuracy = stats.firstGraded ? Math.round((stats.firstTry / stats.firstGraded) * 100) : 100;
    const xp = (session.xpBase ?? 10) + stats.firstTry;
    screen.classList.add("is-leaving");
    setTimeout(() => { screen.remove(); hooks.onComplete({ xp, accuracy, bestStreak: stats.bestStreak, practised: [...stats.practised] }); }, reducedMotion() ? 0 : 220);
  }

  // "Skip": show the answer kindly; the question comes back later.
  function skipStep() {
    if (mode !== "answer" || !current) return;
    sfx.tap();
    if (current.onSkip) return current.onSkip();
    const r = current.check?.({ skipped: true });
    if (r) showFeedback({ ...r, ok: false, skipped: true });
  }

  function showFeedback(result) {
    if (mode === "feedback") return;
    mode = "feedback";
    const step = queue[idx];
    const item = step.item ? hooks.item(step.item) : null;
    stats.graded++;
    if (!step.retry) stats.firstGraded++;
    if (step.item) stats.practised.add(step.item);
    (step.items || []).forEach((id) => stats.practised.add(id));
    hooks.onGraded?.(step, result);
    if (result.ok) {
      stats.correct++;
      if (!step.retry) stats.firstTry++;
      stats.streak++;
      stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
      sfx.correct();
    } else {
      stats.streak = 0;
      sfx.wrong();
      if (step.tries < MAX_RETRIES) {
        // The same exercise comes back a few steps later.
        queue.splice(Math.min(queue.length, idx + 3), 0, { ...step, retry: true, tries: step.tries + 1 });
      }
    }
    updateCombo();

    const wrongAndRetry = !result.ok && step.tries < MAX_RETRIES;
    sheet.classList.toggle("is-wrong", !result.ok);
    $(".feedback__owl", sheet).src = mascotSrc(result.ok ? "happy" : "encourage");
    $(".feedback__icon", sheet).innerHTML = icon(result.ok ? "check" : "x", 28, 3.5);
    $(".feedback__title", sheet).textContent = result.title || (result.ok ? pick(PRAISE) : result.skipped ? "Here's the answer" : pick(ENCOURAGE));

    let html = "";
    if (!result.ok && result.answer) {
      html += `<span class="feedback__label">Correct answer:</span><span class="feedback__answer ${result.answerHtml ? "feedback__answer--list" : ""}">${result.answerHtml ? result.answer : esc(result.answer)}</span>`;
    }
    if (result.body) html += result.body;
    // A wrong answer shows the definition again: that's the learning moment.
    if (!result.ok && item && result.explain !== null) html += `<span class="feedback__def"><b>${esc(item.term)}:</b> ${rich(item.def)}</span>`;
    else if (!result.ok && !result.body && !result.skipped) html += `<span class="feedback__tip">${pick(KIND)}</span>`;
    if (wrongAndRetry) html += `<span class="feedback__later">${icon("rotate-ccw", 16, 2.75)} We'll come back to this one.</span>`;
    $(".feedback__body", sheet).innerHTML = html;
    $(".feedback__body", sheet).hidden = !html;
    sheet.classList.toggle("has-body", !!html);
    contBtn.className = `press btn btn--${result.ok ? "correct" : "wrong"} btn--block`;
    pendingCount = result.ok || !wrongAndRetry;
    sheet.inert = false;
    sheet.classList.add("is-open");
    foot.inert = true;
    mainBtn.setAttribute("aria-hidden", "true");
    mainBtn.tabIndex = -1;
    if (result.after) afterTimer = setTimeout(result.after, 250);
    setTimeout(() => contBtn.focus({ preventScroll: true }), 80);
  }

  function hideSheet() {
    sheet.classList.remove("is-open");
    sheet.inert = true;
    foot.inert = false;
    mainBtn.removeAttribute("aria-hidden");
    mainBtn.tabIndex = 0;
  }

  function updateCombo() {
    if (stats.streak >= 3) {
      combo.querySelector("span").textContent = `${stats.streak} in a row`;
      combo.classList.add("is-on");
      restartAnim(combo, "pop");
    } else combo.classList.remove("is-on");
  }

  // ------------------------------------------------------------ events
  screen.addEventListener("click", (e) => {
    const t = e.target.closest("[data-act]");
    if (!t) return;
    const act = t.dataset.act;
    if (act === "main" && !mainBtn.disabled && mode === "answer") {
      if (current.onMain) return current.onMain();
      const r = current.check?.();
      if (r) showFeedback(r);
    } else if (act === "continue") {
      if (mode === "feedback") advance(pendingCount);
    } else if (act === "close") confirmQuit();
    else if (act === "settings") hooks.openSettings?.();
    else if (act === "skip") skipStep();
    else if (act === "no-keyboard") { sfx.tap(); current?.noKeyboard?.(); }
  });

  // Keyboard: Enter = CHECK / CONTINUE, Esc = quit dialog, 1–9 pick an option,
  // area or step, Backspace takes the last step back.
  function onKey(e) {
    if (document.querySelector(".modal") || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target instanceof Element ? e.target : null;
    if (e.key === "Enter") {
      if (e.repeat) { e.preventDefault(); return; }
      if (mode === "feedback") { e.preventDefault(); contBtn.click(); return; }
      const isButton = t?.matches("button, a[href]") && t !== mainBtn;
      if (isButton && !(t.matches(".option, .hot, .hot-ui") && !mainBtn.disabled)) return;
      e.preventDefault();
      if (!mainBtn.disabled) mainBtn.click();
    } else if (e.key === "Escape") confirmQuit();
    else if (mode === "answer" && current?.onKey && !t?.matches("input, textarea")) {
      if (/^[1-9]$/.test(e.key)) { e.preventDefault(); current.onKey(+e.key); }
      else if (e.key === "Backspace") { e.preventDefault(); current.onKey("Backspace"); }
    }
  }
  document.addEventListener("keydown", onKey);

  function confirmQuit() {
    if (document.querySelector(".modal")) return;
    const m = openModal(`
      <div class="quit">
        ${mascotImg("encourage", "quit__owl")}
        <h2 class="h-title">Leave this practice?</h2>
        <p class="muted">You're doing well! If you leave now, this level won't be marked as done.</p>
        <div class="quit__actions">
          ${button("Keep practising", { attrs: 'data-q="stay"' })}
          <button class="btn-text quit__leave" data-q="leave">Leave</button>
        </div>
      </div>`, { label: "Leave this practice?" });
    m.sheet.addEventListener("click", (e) => {
      const q = e.target.closest("[data-q]")?.dataset.q;
      if (q === "stay") m.close();
      if (q === "leave") { m.close(); exit(); }
    });
  }

  function exit() {
    clearTimeout(afterTimer);
    current?.destroy?.();
    document.removeEventListener("keydown", onKey);
    screen.remove();
    hooks.onExit();
  }

  setProgress();
  advance(false);
  return { destroy: exit, screen, dispose() { clearTimeout(afterTimer); current?.destroy?.(); document.removeEventListener("keydown", onKey); } };
}
