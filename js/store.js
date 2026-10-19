// Progress, kept in this browser's localStorage only (no accounts, no
// personal data, no analytics). Every access is wrapped: storage may be blocked.
const KEY = "spreadsheets-practice.v1";
const DAY = 864e5;
// Spaced repetition (Leitner boxes): a right answer moves an item up a box and
// it comes back after this many days; a wrong answer sends it back to box 0.
const INTERVAL_DAYS = [0, 1, 2, 4, 8, 16];

const defaults = () => ({
  xp: 0,
  streak: 0,
  lastPracticeDay: null, // "YYYY-MM-DD" (local)
  levels: {},            // levelId -> { stars, best, xp, at, plays }
  items: {},             // itemId -> { box, due, seen, right, wrong }
  sfx: true,
  sessions: 0,           // finished sessions (for the occasional "download your progress" tip)
});

export const PROGRESS_FILE = { app: "spreadsheets-practice", version: 1 };

// Terms renamed to match Google Sheets' own words: saved progress follows them.
const RENAMED = { "2:text wrap": "2:text wrapping", "2:freeze panes": "2:freeze" };
function renameItems(items) {
  const out = { ...items };
  for (const [from, to] of Object.entries(RENAMED)) if (out[from] && !out[to]) { out[to] = out[from]; delete out[from]; }
  return out;
}

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const s = raw ? { ...defaults(), ...JSON.parse(raw) } : defaults();
    return { ...s, items: renameItems(s.items || {}) };
  } catch {
    return defaults();
  }
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: keep in memory */ }
}

export function starsFor(accuracy) {
  return accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;
}

export const store = {
  get: () => state,
  set(patch) { state = { ...state, ...patch }; save(); return state; },
  reset() { state = { ...defaults(), sfx: state.sfx }; save(); return state; },

  /** One graded answer for a knowledge item (first try in a lesson counts most). */
  grade(itemId, ok, { firstTry = true } = {}) {
    const now = Date.now();
    const it = { box: 0, due: now, seen: now, right: 0, wrong: 0, ...state.items[itemId] };
    it.seen = now;
    if (ok) {
      it.right++;
      if (firstTry) it.box = Math.min(INTERVAL_DAYS.length - 1, it.box + 1);
    } else {
      it.wrong++;
      it.box = 0;
    }
    it.due = now + INTERVAL_DAYS[it.box] * DAY;
    state = { ...state, items: { ...state.items, [itemId]: it } };
    save();
  },

  /** How much an item needs practice: higher = sooner. Unseen items return -1. */
  need(itemId, now = Date.now()) {
    const it = state.items[itemId];
    if (!it) return -1;
    const overdue = Math.max(0, now - it.due) / DAY;
    return (it.due <= now ? 10 : 0) + (5 - it.box) * 2 + Math.min(it.wrong, 5) + Math.min(overdue, 5);
  },

  /** Record a finished level: XP, streak (days in a row), stars (best kept). */
  finishLevel(levelId, xp, accuracy) {
    const today = dayKey(new Date());
    const yesterday = dayKey(new Date(Date.now() - DAY));
    let streak = state.streak;
    if (state.lastPracticeDay === today) streak = Math.max(streak, 1);
    else if (state.lastPracticeDay === yesterday) streak += 1;
    else streak = 1;
    const prev = state.levels[levelId];
    const stars = starsFor(accuracy);
    const levels = levelId ? { ...state.levels, [levelId]: {
      stars: Math.max(stars, prev?.stars || 0),
      best: Math.max(accuracy, prev?.best || 0),
      xp: (prev?.xp || 0) + xp,
      plays: (prev?.plays || 0) + 1,
      at: Date.now(),
    } } : state.levels;
    state = { ...state, xp: state.xp + xp, streak, lastPracticeDay: today, levels, sessions: (state.sessions || 0) + 1 };
    save();
    return { state, stars, newBest: !prev || stars > prev.stars };
  },

  /** Strength of one item for "My knowledge": null (not met yet), "learnt", "getting", "review". */
  strength(itemId, now = Date.now()) {
    const it = state.items[itemId];
    if (!it) return null;
    if (it.box >= 3 && it.due > now - 3 * DAY) return "learnt";
    if (it.box >= 1 && it.due > now - DAY) return "getting";
    return "review";
  },

  /** Replace everything with progress from a file (already checked by readProgressFile). */
  replace(progress) { state = { ...defaults(), ...progress }; save(); return state; },

  /** The text of a progress file: a friendly first line, then the data. */
  progressFileText(appName) {
    return `${appName}: progress file. Keep it safe and load it on another device.\n\n` +
      JSON.stringify({ ...PROGRESS_FILE, saved: new Date().toISOString(), progress: state }, null, 1) + "\n";
  },

  /** The streak shown today: 0 if the last practice was before yesterday. */
  liveStreak() {
    const today = dayKey(new Date()), yesterday = dayKey(new Date(Date.now() - DAY));
    return state.lastPracticeDay === today || state.lastPracticeDay === yesterday ? state.streak : 0;
  },
};

/** Check a progress file. Returns { progress } or { error } (a kind sentence). */
export function readProgressFile(text) {
  const bad = { error: "That file isn't a progress file from this app. Choose the file you downloaded from Settings: its name starts with “spreadsheets-progress”." };
  if (typeof text !== "string" || text.length > 2e6) return bad;
  const start = text.indexOf("{");
  if (start < 0) return bad;
  let data;
  try { data = JSON.parse(text.slice(start)); } catch { return { error: "That progress file is damaged, so it can't be loaded. Try downloading it again from the device where you practised." }; }
  if (!data || data.app !== PROGRESS_FILE.app) return bad;
  if (data.version > PROGRESS_FILE.version) return { error: "That progress file comes from a newer version of this app. Reload the page and try again." };
  const p = data.progress;
  const isObj = (o) => o && typeof o === "object" && !Array.isArray(o);
  if (!isObj(p) || typeof p.xp !== "number" || p.xp < 0 || !isObj(p.levels) || !isObj(p.items)) {
    return { error: "That progress file is damaged, so it can't be loaded. Try downloading it again from the device where you practised." };
  }
  const clean = {
    xp: Math.round(p.xp), streak: Math.max(0, +p.streak || 0), lastPracticeDay: typeof p.lastPracticeDay === "string" ? p.lastPracticeDay : null,
    levels: {}, items: {}, sfx: p.sfx !== false, sessions: Math.max(0, +p.sessions || 0),
  };
  for (const [k, v] of Object.entries(p.levels)) if (isObj(v) && v.stars >= 1 && v.stars <= 3) clean.levels[k] = { stars: v.stars, best: +v.best || 0, xp: +v.xp || 0, plays: +v.plays || 1, at: +v.at || 0 };
  for (const [k, v] of Object.entries(p.items)) if (isObj(v) && Number.isFinite(v.box)) clean.items[k] = { box: Math.min(5, Math.max(0, v.box)), due: +v.due || 0, seen: +v.seen || 0, right: +v.right || 0, wrong: +v.wrong || 0 };
  clean.items = renameItems(clean.items);
  return { progress: clean, saved: data.saved };
}

export function dayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
