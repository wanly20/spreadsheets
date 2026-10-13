// Screens: the path (with the desktop sidebar and progress panel), a practice
// session, the "complete" screen and settings.
// Routes: #/  path · #/play/<nodeId>  a level or review node · #/review  "Review" (spaced repetition)
import { APP_NAME, APP_SHORT, MASCOT, mascotSrc } from "./brand.js";
import { course, loadKnowledge, buildModel, levelSession, reviewSession, pathNodes, genericExercises, authoredExercises } from "./course.js";
import { icon } from "./icons.js";
import { $, $$, esc, el, button, footBar, toast, openModal, countUp, reducedMotion, restartAnim, mascotImg } from "./ui.js";
import { store, starsFor, readProgressFile, dayKey } from "./store.js";
import { rich } from "./ui.js";
import { runLesson } from "./lesson.js";
import { sfx } from "./sound.js";

const app = document.getElementById("app");
const OFFSETS = [0, -60, -88, -60, 0, 60, 88, 60];
const REVIEW_COUNT = 10;
let model = null;
let nodes = [];
let justCompleted = null;
let active = null;

// =================================================================== start
(async function start() {
  document.title = APP_NAME;
  try {
    model = buildModel(await loadKnowledge());
  } catch (e) {
    app.innerHTML = `<div class="load-error"><h1>${esc(APP_NAME)}</h1><p>Sorry, the practice questions didn't load. Check your internet connection and reload the page.</p></div>`;
    console.warn(e);
    return;
  }
  if (model.warnings.length) console.info("Content notes:\n" + model.warnings.join("\n"));
  nodes = pathNodes(model);
  window.addEventListener("hashchange", route);
  route();
})();

// =================================================================== router
function route() {
  active?.dispose();
  active = null;
  app.querySelectorAll(".screen, .sheet, .scrim").forEach((n) => n.remove());
  const h = location.hash;
  if (h.startsWith("#/play/")) return play(decodeURIComponent(h.slice(7)));
  if (h === "#/review") return play("review");
  showPath(h === "#/knowledge" ? "knowledge" : "path");
}
const go = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };

// =================================================================== helpers
const levelState = (id) => store.get().levels[id];
const lessonOf = (n) => model.lessons.find((l) => l.n === n);
function finalReviewReady() {
  return course.finalReview && course.finalReview.needs.every((n) => lessonOf(n) && !lessonOf(n).comingSoon);
}
function allNodes() {
  const list = [...nodes];
  if (finalReviewReady()) list.push({ id: course.finalReview.id, kind: "final", title: course.finalReview.title, icon: "crown", items: model.items.filter((it) => course.finalReview.needs.includes(it.lesson)) });
  return list;
}
const currentNode = () => allNodes().find((n) => !levelState(n.id));
const seenItems = () => model.items.filter((it) => store.need(it.id) >= 0);
const dueItems = () => model.items.filter((it) => { const s = store.get().items[it.id]; return s && s.due <= Date.now(); });

function stars(n, cls = "") {
  return `<span class="stars ${cls}" aria-label="${n} of 3 stars">${[1, 2, 3].map((k) => `<span class="star ${k <= n ? "is-on" : ""}">${icon("star", 16, 2.25)}</span>`).join("")}</span>`;
}

// =================================================================== path
function showPath(view = "path") {
  const s = store.get();
  const streak = store.liveStreak();
  const cur = currentNode();
  let g = 0;
  const nodeHtml = (n, { soon = false, theme }) => {
    const x = OFFSETS[g++ % OFFSETS.length];
    const st = levelState(n.id);
    const isCur = !soon && cur?.id === n.id;
    const cls = ["press", "node", `node--${theme}`, n.kind !== "level" ? "node--review" : "", st ? "is-done" : "", isCur ? "is-current" : "", soon ? "is-soon" : "", justCompleted === n.id ? "just-done" : ""].join(" ");
    const label = `${n.title}${st ? `, done, ${st.stars} stars` : isCur ? ", start here" : soon ? ", coming soon" : ""}`;
    return `
      <div class="node-wrap ${isCur ? "is-current" : ""}" style="--x:${x}px">
        ${isCur ? `<div class="start-bubble" aria-hidden="true">${st ? "Again" : "Start"}</div>` : ""}
        <button class="${cls}" data-node="${n.id}" aria-label="${esc(label)}" ${soon ? 'data-soon="1"' : ""}>
          <span class="face">${icon(soon ? "lock" : st && n.kind === "level" ? "check" : n.icon, 34, 3)}</span>
        </button>
        <span class="node-label">${n.kind === "level" && !soon ? `<b>${n.index}</b> ` : ""}${esc(n.title)}</span>
        ${st ? stars(st.stars, "node-stars") : ""}
      </div>`;
  };
  const unitHtml = model.lessons.map((l) => {
    const soon = l.comingSoon;
    const ns = soon ? [{ id: `soon-${l.n}-1`, title: "Coming soon", icon: "lock", kind: "level", index: 1 }, { id: `soon-${l.n}-2`, title: "", icon: "lock", kind: "level", index: 2 }] : nodes.filter((n) => n.lesson === l.n);
    const done = ns.filter((n) => levelState(n.id)).length;
    return `
      <section class="unit unit--${l.theme} ${soon ? "is-soon" : ""}" aria-labelledby="u-${l.n}">
        <div class="unit-banner">
          <div class="unit-banner__text">
            <span class="unit-kicker">${soon ? "Coming soon" : `${done} of ${ns.length} done`}</span>
            <h2 id="u-${l.n}" class="unit-title">${esc(l.title)}</h2>
            <p class="unit-sub">${esc(l.subtitle)}</p>
          </div>
          <span class="unit-icon" aria-hidden="true">${icon(soon ? "lock" : "grid", 26, 2.5)}</span>
        </div>
        <div class="unit-nodes">${soon
          ? ns.map((n) => nodeHtml({ ...n, title: n.index === 1 ? "Coming soon" : "" }, { soon: true, theme: l.theme })).join("")
          : ns.map((n) => nodeHtml(n, { theme: l.theme })).join("")}</div>
      </section>`;
  }).join("");
  const fr = course.finalReview;
  const finalHtml = fr ? `
    <section class="unit unit--ink ${finalReviewReady() ? "" : "is-soon"}" aria-labelledby="u-final">
      <div class="unit-banner">
        <div class="unit-banner__text">
          <span class="unit-kicker">${finalReviewReady() ? "The big one" : "Unlocks when every lesson is ready"}</span>
          <h2 id="u-final" class="unit-title">${esc(fr.title)}</h2>
          <p class="unit-sub">Everything from every lesson, mixed up.</p>
        </div>
        <span class="unit-icon" aria-hidden="true">${icon("crown", 26, 2.5)}</span>
      </div>
      <div class="unit-nodes">${finalReviewReady() ? nodeHtml(allNodes().at(-1), { theme: "ink" }) : nodeHtml({ id: "final-soon", title: fr.title, icon: "crown", kind: "final" }, { soon: true, theme: "ink" })}</div>
    </section>` : "";

  const due = dueItems().length;
  const screen = el(`
    <section class="screen path" aria-label="Practice path">
      ${sideNav(view)}
      <div class="path-bg" aria-hidden="true"></div>
      <header class="path-top">
        <div class="brand">
          <span class="brand__avatar">${mascotImg("explain", "brand__img")}</span>
          <span class="brand__name">${esc(APP_SHORT)}</span>
        </div>
        <div class="path-stats">
          <span class="chip chip--streak ${streak ? "" : "is-zero"}" title="Day streak" aria-label="${streak} day streak">${icon("flame", 24, 2.25)}<span>${streak}</span></span>
          <span class="chip chip--xp" title="Total XP" aria-label="${s.xp} XP">${icon("zap", 22, 2.25)}<span>${s.xp}</span></span>
          <button class="bar-btn bar-btn--kb" data-act="knowledge" aria-label="My knowledge">${icon("book-open", 25, 2.5)}</button>
          <button class="bar-btn bar-btn--review ${due ? "has-dot" : ""}" data-act="review" aria-label="Review${due ? `: ${due} ready` : ""}">${icon("repeat", 26, 2.5)}</button>
          <button class="bar-btn" data-act="settings" aria-label="Settings">${icon("settings", 26, 2.5)}</button>
        </div>
      </header>
      <main class="path-scroll">
        <div class="path-inner" ${view === "path" ? "" : "hidden"}>
          <p class="path-intro">${mascotImg("explain", "path-intro__mascot")}<span>Practise what you learned in class: a few minutes a day. Wrong answers come back until you've got them.</span></p>
          ${unitHtml}${finalHtml}
        </div>
        ${view === "knowledge" ? knowledgeHtml() : ""}
      </main>
      ${pathPanel()}
    </section>`);
  app.appendChild(screen);
  const scroller = $(".path-scroll", screen);

  const focusNode = view === "path" && ($(".just-done", screen) || $(".node.is-current", screen));
  if (focusNode) requestAnimationFrame(() => {
    const r = focusNode.getBoundingClientRect(), sr = scroller.getBoundingClientRect();
    if (r.top > sr.top + sr.height * 0.6) scroller.scrollTop += r.top - sr.top - sr.height * 0.4;
  });
  if (justCompleted) {
    const n = $(".just-done", screen);
    setTimeout(() => { n && restartAnim(n, "pop"); sfx.pair(); }, 450);
    $$(".chip--xp, .chip--streak, .pstat", screen).forEach((c) => restartAnim(c, "bump"));
    justCompleted = null;
  }

  screen.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest('[data-act="settings"]')) return openSettings();
    if (t.closest('[data-act="review"]')) return startReview();
    if (t.closest('[data-act="knowledge"]')) { sfx.tap(); go("#/knowledge"); return; }
    if (t.closest('[data-act="back"]')) { sfx.tap(); go("#/"); return; }
    const st = t.closest("[data-start]");
    if (st) { sfx.tap(); go(`#/play/${st.dataset.start}`); return; }
    const node = t.closest("[data-node]");
    closePop();
    if (node) {
      if (node.dataset.soon) { sfx.tap(); toast("This part is coming soon.", "lock"); return; }
      sfx.select();
      openPop(node, e.detail === 0);
    }
  });
  let popAt = 0; // our own scroll-into-view must not close the popover it just opened
  scroller.addEventListener("scroll", () => { if (Date.now() - popAt > 900) closePop(); }, { passive: true });
  screen.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $(".node-pop", screen)) {
      const node = $(".node-pop", screen).closest(".node-wrap").querySelector(".node");
      closePop();
      node.focus({ preventScroll: true });
    }
  });

  function closePop() {
    $$(".node-pop", screen).forEach((p) => { p.classList.remove("is-open"); setTimeout(() => p.remove(), 200); });
  }

  function openPop(nodeEl, viaKeyboard = false) {
    const n = allNodes().find((x) => x.id === nodeEl.dataset.node);
    if (!n) return;
    const st = levelState(n.id);
    const wrap = nodeEl.closest(".node-wrap");
    const x = parseFloat(wrap.style.getPropertyValue("--x")) || 0;
    const theme = n.lesson ? lessonOf(n.lesson).theme : "ink";
    const meta = n.kind === "level"
      ? `Level ${n.index} of ${lessonOf(n.lesson).levels.length} · ${n.level.items.length} new terms`
      : n.kind === "review" ? `${lessonOf(n.lesson).title} · every term, mixed up` : "Every lesson · every term, mixed up";
    const terms = n.kind === "level" ? `<p class="node-pop__terms">${n.level.items.map((it) => esc(it.term)).join(" · ")}</p>` : "";
    const pop = el(`
      <div class="node-pop node-pop--${theme}" style="--shift:${-x}px" role="dialog" aria-label="${esc(n.title)}">
        <span class="node-pop__arrow" style="--ax:${x}px"></span>
        <h3 class="node-pop__title">${esc(n.title)}</h3>
        <p class="node-pop__meta">${esc(meta)}</p>
        ${terms}
        ${st ? `<p class="node-pop__best">${stars(st.stars)} <span>Best: ${st.best}%</span></p>` : ""}
        ${button(st ? "Practise again" : "Start", { variant: "on-color", attrs: `data-start="${n.id}"` })}
      </div>`);
    wrap.appendChild(pop);
    popAt = Date.now();
    requestAnimationFrame(() => pop.classList.add("is-open"));
    if (viaKeyboard) setTimeout(() => pop.querySelector("button")?.focus({ preventScroll: true }), 80);
    setTimeout(() => {
      const r = pop.getBoundingClientRect(), sr = scroller.getBoundingClientRect();
      if (r.bottom > sr.bottom - 12) scroller.scrollBy({ top: r.bottom - sr.bottom + 24, behavior: reducedMotion() ? "auto" : "smooth" });
    }, 60);
  }
}

// =================================================================== My knowledge
const STRENGTH = {
  learnt: { label: "Learnt", icon: "check" },
  getting: { label: "Getting there", icon: "target" },
  review: { label: "Needs review", icon: "repeat" },
};
function knowledgeHtml() {
  const ready = model.lessons.filter((l) => !l.comingSoon);
  const counts = { learnt: 0, getting: 0, review: 0 };
  model.items.forEach((it) => { const s = store.strength(it.id); if (s) counts[s]++; });
  const met = counts.learnt + counts.getting + counts.review;
  const row = (it) => {
    const s = store.strength(it.id);
    if (!s) return `<li class="kb-item is-locked"><span class="kb-term">${icon("lock", 16, 2.75)} ${esc(it.term)}</span><span class="kb-def">Coming up: you'll meet this in ${esc(levelTitle(it))}.</span><span class="kb-strength kb-strength--locked">Coming up</span></li>`;
    return `<li class="kb-item"><span class="kb-term">${esc(it.term)}</span><span class="kb-def">${rich(it.def)}</span><span class="kb-strength kb-strength--${s}">${icon(STRENGTH[s].icon, 14, 3)} ${STRENGTH[s].label}</span></li>`;
  };
  return `
    <div class="kb">
      <button class="btn-text kb-back" data-act="back">${icon("arrow-left", 18, 2.75)} Path</button>
      <header class="kb-head">
        <h1 class="h-title">My knowledge</h1>
        <p class="kb-sub">Every term you've met, like the Knowledge Bank in class. Practice makes each one stronger.</p>
        <div class="kb-counts">
          <span class="kb-count kb-strength--learnt">${icon("check", 14, 3)} ${counts.learnt} learnt</span>
          <span class="kb-count kb-strength--getting">${icon("target", 14, 3)} ${counts.getting} getting there</span>
          <span class="kb-count kb-strength--review">${icon("repeat", 14, 3)} ${counts.review} need review</span>
        </div>
        ${met ? button(counts.review + counts.getting ? "Practise these" : "Practise anyway", { variant: "blue", block: false, attrs: 'data-act="review"', ico: "repeat" }) : `<p class="kb-empty">Finish your first level and your terms will appear here.</p>`}
      </header>
      ${ready.map((l) => `
        <section class="kb-lesson kb-lesson--${l.theme}" aria-labelledby="kb-${l.n}">
          <h2 class="kb-lesson__title" id="kb-${l.n}">${esc(l.title)}</h2>
          ${[["identify", "Know", "know", "Words and things to recognise"], ["action", "Do", "do", "Skills to carry out"]].map(([kind, title, cls, sub]) => {
            const list = l.items.filter((it) => it.kind === kind);
            return list.length ? `<div class="kb-group kb-group--${cls}"><h3 class="kb-group__title"><span>${title}</span> ${sub}</h3><ul class="kb-list">${list.map(row).join("")}</ul></div>` : "";
          }).join("")}
        </section>`).join("")}
      ${model.lessons.filter((l) => l.comingSoon).map((l) => `<p class="kb-soon">${icon("lock", 16, 2.75)} ${esc(l.title)} is coming soon.</p>`).join("")}
    </div>`;
}
function levelTitle(it) {
  const lv = model.lessons.find((l) => l.n === it.lesson)?.levels.find((x) => x.items.includes(it));
  return lv ? `level “${lv.title}”` : "a later level";
}

function sideNav(view) {
  const cur = (v) => (v === view ? 'aria-current="page"' : "");
  return `
    <nav class="side-nav" aria-label="Main">
      <a class="side-brand" href="#/" aria-label="${esc(APP_NAME)}: the path">
        <span class="brand__avatar side-brand__avatar">${mascotImg("explain", "brand__img")}</span>
        <span class="side-brand__name" aria-hidden="true">${esc(APP_NAME).replace(" ", "<br>")}</span>
      </a>
      <ul class="side-list">
        <li><a class="side-item side-item--path" href="#/" ${cur("path")} title="Path"><span class="side-item__icon">${icon("map", 24, 2.5)}</span><span class="side-item__label">Path</span></a></li>
        <li><a class="side-item side-item--kb" href="#/knowledge" ${cur("knowledge")} title="My knowledge"><span class="side-item__icon">${icon("book-open", 24, 2.5)}</span><span class="side-item__label">My knowledge</span></a></li>
        <li><button class="side-item side-item--review" data-act="review" title="Review"><span class="side-item__icon">${icon("repeat", 24, 2.5)}</span><span class="side-item__label">Review</span></button></li>
        <li><button class="side-item side-item--settings" data-act="settings" title="Settings"><span class="side-item__icon">${icon("settings", 24, 2.5)}</span><span class="side-item__label">Settings</span></button></li>
      </ul>
    </nav>`;
}

function pathPanel() {
  const s = store.get();
  const streak = store.liveStreak();
  const ready = model.lessons.filter((l) => !l.comingSoon);
  const due = dueItems().length, seen = seenItems().length;
  return `
    <aside class="path-panel" aria-label="Your progress">
      <div class="panel-card panel-stats">
        <div class="pstat pstat--streak ${streak ? "" : "is-zero"}">${icon("flame", 30, 2.25)}<span><b>${streak}</b><small>day streak</small></span></div>
        <div class="pstat pstat--xp">${icon("zap", 28, 2.25)}<span><b>${s.xp}</b><small>total XP</small></span></div>
      </div>
      <section class="panel-card panel-lessons" aria-labelledby="prog-h">
        <h2 class="panel-title" id="prog-h">Your progress</h2>
        ${ready.map((l) => {
          const ns = nodes.filter((n) => n.lesson === l.n);
          const got = ns.reduce((a, n) => a + (levelState(n.id)?.stars || 0), 0);
          const done = ns.filter((n) => levelState(n.id)).length;
          return `<div class="lesson-prog lesson-prog--${l.theme}">
            <div class="lesson-prog__row"><b>${esc(l.title)}</b><span>${icon("star", 15, 2.5)} ${got} / ${ns.length * 3}</span></div>
            <div class="mini-bar" role="img" aria-label="${done} of ${ns.length} done"><span style="--p:${done / ns.length}"></span></div>
          </div>`;
        }).join("")}
      </section>
      <section class="panel-card panel-review" aria-labelledby="rev-h">
        <span class="panel-kicker">${icon("repeat", 16, 2.75)} Review</span>
        <h2 class="panel-title" id="rev-h">${seen ? (due ? `${due} term${due === 1 ? "" : "s"} to refresh` : "All fresh for now") : "Nothing to review yet"}</h2>
        <p class="panel-small">${seen ? "Review picks the terms you got wrong or haven't seen for a while." : "Finish a level, then Review brings back the terms you find tricky."}</p>
        ${seen ? button("Review", { variant: "blue", attrs: 'data-act="review"', ico: "repeat" }) : ""}
      </section>
      <section class="panel-card panel-tip" aria-labelledby="tip-h">
        ${mascotImg("explain", "panel-tip__owl")}
        <div>
          <h2 class="panel-kicker" id="tip-h">${icon("lightbulb", 16, 2.75)} ${esc(MASCOT.name)}'s tip</h2>
          <p class="panel-tip__text">A few minutes every day beats an hour once a week. Your progress is saved in this browser.</p>
        </div>
      </section>
    </aside>`;
}

function startReview() {
  if (!seenItems().length) { sfx.tap(); toast("Finish a level first. Then Review brings back the tricky terms.", "repeat", 3200); return; }
  sfx.tap();
  go("#/review");
}

// =================================================================== play
function play(id) {
  let session;
  const need = (itemId) => store.need(itemId);
  const seed = undefined;
  if (id === "sampler") {
    // Not linked anywhere: one of every exercise type, for previews and screenshots (#/play/sampler).
    session = { id: null, kind: "review", title: "Every exercise type", xpBase: 0, steps: samplerSteps() };
  } else if (id === "review") {
    const items = seenItems();
    if (!items.length) { location.replace("#/"); return; }
    session = { id: null, kind: "review", title: "Review", xpBase: 5, steps: reviewSession(model, items, { count: REVIEW_COUNT, need, seed }) };
  } else {
    const n = allNodes().find((x) => x.id === id);
    if (!n) { location.replace("#/"); return; }
    if (n.kind === "level") session = { id, kind: "level", title: n.title, xpBase: 10, steps: levelSession(model, n.level, { need, seed }) };
    else session = { id, kind: n.kind, title: n.title, xpBase: n.kind === "final" ? 20 : 15, steps: reviewSession(model, n.items, { count: n.kind === "final" ? 15 : 12, need, seed }) };
  }
  active = runLesson(app, session, {
    item: (itemId) => model.byId.get(itemId),
    onGraded(step, result) {
      if (step.items) step.items.forEach((itemId) => store.grade(itemId, !(result.itemsWrong || []).includes(itemId), { firstTry: !step.retry }));
      else if (step.item) store.grade(step.item, !!result.ok, { firstTry: !step.retry });
    },
    onExit: () => go("#/"),
    onComplete: (r) => showComplete(session, r),
    openSettings,
  });
}

function samplerSteps() {
  const out = [];
  const want = ["learn", "choice", "gaps", "defToTerm", "termToDef", "gridClick", "gridName", "gridRange", "rangeName", "fill", "gridMove", "keys", "hotspot", "hotspot-ui", "order", "formula", "lockRef", "match"];
  const items = model.items;
  for (const kind of want) {
    let step = null;
    if (kind === "learn") step = { type: "learn", item: items.find((it) => it.term === "range")?.id || items[0].id };
    else if (kind === "match") step = reviewSession(model, items.slice(0, 6), { seed: 3, count: 1 }).find((s) => s.type === "match");
    else if (kind === "defToTerm" || kind === "termToDef" || kind === "gaps") {
      for (const it of items) { step = genericExercises(it, items, Math.random).find((e) => e.gen === kind); if (step) break; }
    } else {
      for (const it of items) {
        step = authoredExercises(it, Math.random).find((e) => (kind === "hotspot-ui" ? e.type === "hotspot" && e.ui : e.type === kind && !(kind === "hotspot" && e.ui)) && (kind !== "keys" || e.combo === "ctrl+z"));
        if (step) break;
      }
    }
    if (step) out.push(step);
  }
  // Every shortcut that isn't Ctrl+Z too (e.g. Ctrl + ` to show formulas).
  for (const it of items) for (const e of authoredExercises(it, Math.random)) if (e.type === "keys" && e.combo === "ctrl+`") out.push(e);
  // And a formula with $ (an absolute reference).
  for (const it of items) { const e = authoredExercises(it, Math.random).find((x) => x.type === "formula" && x.accept[0].includes("$")); if (e) { out.push(e); break; } }
  return out;
}

// =================================================================== complete
async function showComplete(session, { xp, accuracy, practised }) {
  const { state, stars: got } = store.finishLevel(session.id, xp, accuracy);
  justCompleted = session.id;
  const title = session.kind === "level" ? "Level complete!" : session.kind === "review" ? "Review done!" : "Review complete!";
  const terms = [...new Set(practised.map((id) => model.byId.get(id)?.term).filter(Boolean))];
  const screen = el(`
    <section class="screen complete" aria-label="${esc(title)}">
      <canvas class="confetti" aria-hidden="true"></canvas>
      <div class="complete-hero">
        <div class="complete-scene" aria-hidden="true"></div>
        ${stars(starsFor(accuracy), "complete-stars")}
        <img class="complete-owl" src="${mascotSrc("happy")}" alt="${esc(MASCOT.name)} the ${esc(MASCOT.species)}, celebrating">
      </div>
      <div class="complete-body">
        <h1 class="complete-title">${title}</h1>
        <p class="complete-sub">${esc(session.title)}${got === 3 ? ": three stars!" : got === 2 ? ": two stars. Play again for three!" : ". Play it again to earn more stars."}</p>
        <div class="stat-cards">
          <div class="stat stat--xp"><span class="stat__label">XP</span><span class="stat__value">${icon("zap", 22, 2.5)}<b data-count="${xp}">0</b></span></div>
          <div class="stat stat--acc"><span class="stat__label">${accuracy >= 90 ? "Amazing" : "First try"}</span><span class="stat__value">${icon("target", 22, 2.5)}<span class="stat__num"><b data-count="${accuracy}">0</b>%</span></span></div>
          <div class="stat stat--streak"><span class="stat__label">Streak</span><span class="stat__value">${icon("flame", 22, 2.5)}<b data-count="${state.streak}">0</b>&nbsp;day${state.streak === 1 ? "" : "s"}</span></div>
        </div>
        ${terms.length ? `<div class="learned"><span class="learned__label">You practised</span><div class="learned__chips">${terms.map((t) => `<span class="learned__chip">${esc(t)}</span>`).join("")}</div></div>` : ""}
      </div>
      ${footBar(button("Continue", { attrs: "data-done" }), state.sessions % 3 === 0 ? `<p class="backup-tip">${icon("lightbulb", 18, 2.5)} Tip: download your progress in Settings to keep it safe.</p>` : "")}
    </section>`);
  app.appendChild(screen);
  if (state.sessions % 3 === 0) $(".complete-body", screen).insertAdjacentHTML("beforeend", `<p class="backup-tip backup-tip--phone">${icon("lightbulb", 18, 2.5)} Tip: download your progress in Settings to keep it safe.</p>`);
  sfx.complete();
  $$("[data-count]", screen).forEach((b, i) => setTimeout(() => countUp(b, +b.dataset.count, 900), 500 + i * 180));
  $$(".complete-stars .star", screen).forEach((s, i) => { s.style.animationDelay = `${0.35 + i * 0.18}s`; });
  const done = () => { document.removeEventListener("keydown", onKey); sfx.tap(); go("#/"); };
  $("[data-done]", screen).addEventListener("click", done);
  setTimeout(() => $("[data-done]", screen)?.focus({ preventScroll: true }), 600);
  const onKey = (e) => { if (e.key === "Enter" && !e.repeat) { e.preventDefault(); done(); } };
  setTimeout(() => document.addEventListener("keydown", onKey), 400);

  if (!reducedMotion()) {
    try {
      const { default: confetti } = await import("https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/+esm");
      if (!screen.isConnected) return;
      const fire = confetti.create($(".confetti", screen), { resize: true, useWorker: true });
      const colors = ["#1f9a4f", "#1a73e8", "#fbbc04", "#3fb36a", "#ffffff"];
      fire({ particleCount: 90, spread: 75, startVelocity: 42, origin: { y: 0.35 }, colors, scalar: 1.1 });
      setTimeout(() => fire({ particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.5 }, colors }), 250);
      setTimeout(() => fire({ particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.5 }, colors }), 400);
    } catch { /* offline: no confetti, still a happy screen */ }
  }
}

/** "Lesson 1: 5 of 6 levels done, 120 XP." for a progress file. */
function summarise(p, saved) {
  const parts = model.lessons.filter((l) => !l.comingSoon).map((l) => {
    const ns = nodes.filter((n) => n.lesson === l.n);
    return `${l.title}: ${ns.filter((n) => p.levels[n.id]).length} of ${ns.length} levels done`;
  });
  const when = saved ? ` (saved ${new Date(saved).toLocaleDateString(undefined, { day: "numeric", month: "short" })})` : "";
  return `This file${when} has ${parts.join(", ")}, ${p.xp} XP.`;
}

// =================================================================== settings
export function openSettings() {
  const s = store.get();
  const node = el(`
    <div class="settings">
      <div class="modal__head">
        <h2 class="h-title">Settings</h2>
        <button class="bar-btn" data-close aria-label="Close settings">${icon("x", 26, 3)}</button>
      </div>
      <div class="setting"><span class="setting__icon">${icon("volume-2", 22, 2.5)}</span>
        <span class="setting__text"><span class="setting__title" id="set-sfx">Sound effects</span><span class="setting__sub">Little sounds for right and wrong answers</span></span>
        <button class="switch" role="switch" aria-checked="${s.sfx}" aria-labelledby="set-sfx" data-switch="sfx"></button></div>
      <p class="modal__section">Your progress</p>
      <p class="settings-note">${icon("info", 18, 2.5)}<span>Your progress lives only in this browser on this device. There are no accounts, and nothing is sent anywhere. To keep it safe or move it to another device, download it and load it there.</span></p>
      <div class="progress-file">
        ${button("Download my progress", { variant: "secondary", block: false, attrs: "data-download", ico: "arrow-down" })}
        <label class="press btn btn--secondary progress-file__load"><span class="face">${icon("rotate-ccw", 22, 2.75)}<span>Load my progress</span></span>
          <input type="file" accept=".txt,.json,text/plain,application/json" data-load class="sr-only"></label>
      </div>
      <div class="load-msg" role="status" aria-live="polite" hidden></div>
      <button class="btn-text settings-reset" data-reset>${icon("rotate-ccw", 18, 2.75)} Reset progress</button>
      <p class="settings-foot">${esc(APP_NAME)} · Year 7 ICT</p>
    </div>`);
  const m = openModal(node, { label: "Settings" });
  const msg = $(".load-msg", node);
  let pending = null;
  $("[data-load]", node).addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const r = readProgressFile(f.size > 2e6 ? "" : await f.text());
    msg.hidden = false;
    if (r.error) {
      pending = null;
      msg.className = "load-msg is-error";
      msg.innerHTML = `${icon("info", 20, 2.5)}<span>${esc(r.error)}</span>`;
      sfx.wrong();
      return;
    }
    pending = r.progress;
    msg.className = "load-msg is-ok";
    msg.innerHTML = `<p>${esc(summarise(r.progress, r.saved))} Replace your current progress with it?</p>
      <div class="load-msg__actions">${button("Replace my progress", { attrs: "data-load-yes", block: false })}<button class="btn-text" data-load-no>Cancel</button></div>`;
    sfx.select();
  });
  node.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-close]")) return m.close();
    if (t.closest("[data-download]")) {
      const blob = new Blob([store.progressFileText(APP_NAME)], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `spreadsheets-progress-${dayKey(new Date())}.txt`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      toast("Progress downloaded. Keep the file somewhere safe.", "arrow-down");
      return;
    }
    if (t.closest("[data-load-no]")) { pending = null; msg.hidden = true; return; }
    if (t.closest("[data-load-yes]") && pending) {
      store.replace(pending);
      pending = null;
      m.close();
      toast("Progress loaded. Welcome back!", "check");
      if (!location.hash.startsWith("#/play") && location.hash !== "#/review") route();
      return;
    }
    const sw = t.closest("[data-switch]");
    if (sw) {
      const on = sw.getAttribute("aria-checked") !== "true";
      sw.setAttribute("aria-checked", String(on));
      store.set({ sfx: on });
      sfx.tap();
      return;
    }
    if (t.closest("[data-reset]")) {
      const r = t.closest("[data-reset]");
      if (r.dataset.confirm) {
        store.reset();
        m.close();
        toast("Progress reset.", "rotate-ccw");
        if (!location.hash.startsWith("#/play") && location.hash !== "#/review") route();
      } else {
        r.dataset.confirm = "1";
        r.innerHTML = `${icon("rotate-ccw", 18, 2.75)} Tap again to reset everything`;
        r.classList.add("is-confirm");
      }
    }
  });
}
