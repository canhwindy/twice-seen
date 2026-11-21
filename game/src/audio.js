// Synthesised sound effects (Web Audio, no sound files): a rising chime per find that climbs with
// the combo, a dull buzz for a miss, a shimmer for a hint, clock ticks and level fanfares.

export function createAudio() {
  let ac = null;
  let muted = false;
  const ensure = () => {
    if (!ac) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      ac = new Ctor();
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  };
  const tone = (freq, start, dur, type = 'sine', gain = 0.18, slide = 0) => {
    const a = ensure();
    if (!a || muted) return;
    const t = a.currentTime + start;
    const osc = a.createOscillator();
    const amp = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp).connect(a.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  };
  const sounds = {
    find(combo = 1) {
      const lift = Math.pow(2, Math.min(combo - 1, 6) / 12);
      [659, 880, 1319].forEach((f, i) => tone(f * lift, i * 0.06, 0.32, 'triangle', 0.16));
    },
    miss: () => {
      tone(180, 0, 0.22, 'square', 0.07, -90);
      tone(120, 0.05, 0.25, 'sawtooth', 0.05, -50);
    },
    hint: () => [523, 784, 1047, 1568].forEach((f, i) => tone(f, i * 0.05, 0.4, 'sine', 0.07)),
    tick: () => tone(1500, 0, 0.05, 'square', 0.03),
    already: () => tone(440, 0, 0.1, 'sine', 0.06),
    start: () => [392, 523, 659].forEach((f, i) => tone(f, i * 0.09, 0.3, 'triangle', 0.12)),
    clear: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.5, 'triangle', 0.14)),
    timeup: () => [523, 440, 349, 262].forEach((f, i) => tone(f, i * 0.14, 0.4, 'sawtooth', 0.06)),
  };
  return {
    unlock: ensure,
    play(name, arg) {
      if (sounds[name]) sounds[name](arg);
    },
    toggle() {
      muted = !muted;
      return muted;
    },
  };
}
