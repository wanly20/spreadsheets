// Short, pleasant UI sounds synthesised with WebAudio (no files), plus haptics.
import { store } from "./store.js";

let ctx = null;
function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, start, dur, { type = "sine", gain = 0.16, glideTo = null } = {}) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const on = () => store.get().sfx;

function vibrate(pattern) {
  try { if (on() && navigator.vibrate) navigator.vibrate(pattern); } catch { /* not allowed */ }
}

export const sfx = {
  tap() { if (on()) tone(720, 0, 0.05, { type: "triangle", gain: 0.05 }); },
  select() { if (on()) tone(540, 0, 0.07, { type: "triangle", gain: 0.07, glideTo: 640 }); },
  correct() {
    if (!on()) return;
    tone(784, 0, 0.16, { type: "triangle", gain: 0.14 });   // G5
    tone(1175, 0.09, 0.28, { type: "triangle", gain: 0.14 }); // D6
    tone(2349, 0.09, 0.22, { type: "sine", gain: 0.03 });    // sparkle
    vibrate(18);
  },
  wrong() {
    if (!on()) return;
    tone(330, 0, 0.18, { type: "triangle", gain: 0.12 });    // E4
    tone(262, 0.14, 0.3, { type: "triangle", gain: 0.11 });  // C4: soft, not a buzzer
    vibrate([30, 50, 30]);
  },
  pair() { if (on()) { tone(880, 0, 0.1, { type: "triangle", gain: 0.1 }); tone(1320, 0.06, 0.14, { type: "sine", gain: 0.06 }); } vibrate(10); },
  fix() { if (on()) tone(990, 0, 0.09, { type: "sine", gain: 0.09, glideTo: 1320 }); },
  complete() {
    if (!on()) return;
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.1, 0.35, { type: "triangle", gain: 0.12 }));
    tone(2093, 0.5, 0.6, { type: "sine", gain: 0.04 });
    vibrate([20, 40, 20, 40, 60]);
  },
};
