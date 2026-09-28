// An original cartoon cue: plucked melody, round bass and wooden taps.
// Enabled on entry; a page gesture unlocks playback when autoplay is restricted.
export const music = (() => {
  let context;
  let master;
  let timer;
  let enabled = true;
  let step = 0;
  let nextNote = 0;
  const voices = new Set();
  const beat = 60 / 108;
  const melody = [
    [76, null, 79, 76, 74, null, 72, null],
    [74, 76, 79, null, 76, null, null, null],
    [76, null, 81, 79, 76, null, 72, 74],
    [76, null, 74, null, 72, null, null, null],
    [77, null, 81, 77, 76, null, 74, null],
    [76, 79, 81, null, 79, 76, null, null],
    [74, null, 79, 74, 71, null, 74, null],
    [72, 76, 79, null, 72, null, null, null]
  ];
  const harmony = [[48, 52, 55], [43, 47, 50], [45, 48, 52], [48, 52, 55], [41, 45, 48], [48, 52, 55], [43, 47, 50], [48, 52, 55]];
  const frequency = note => 440 * 2 ** ((note - 69) / 12);
  const notify = () => document.dispatchEvent(new Event('musicstatechange'));

  function tone(note, time, duration, volume, type = 'sine') {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency(note);
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(volume, time + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(envelope);
    envelope.connect(master);
    voices.add(oscillator);
    oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
    oscillator.start(time);
    oscillator.stop(time + duration + 0.025);
  }

  function tap(time, strong) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.frequency.setValueAtTime(strong ? 150 : 620, time);
    oscillator.frequency.exponentialRampToValueAtTime(strong ? 58 : 260, time + 0.06);
    envelope.gain.setValueAtTime(strong ? 0.18 : 0.065, time);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.075);
    oscillator.connect(envelope); envelope.connect(master);
    voices.add(oscillator);
    oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
    oscillator.start(time); oscillator.stop(time + 0.09);
  }

  function schedule() {
    if (!enabled || context.state !== 'running') return;
    if (nextNote < context.currentTime) nextNote = context.currentTime + 0.04;
    while (nextNote < context.currentTime + 0.16) {
      const bar = Math.floor(step / 8) % melody.length;
      const eighth = step % 8;
      const chord = harmony[bar];
      const note = melody[bar][eighth];
      if (note !== null) {
        tone(note, nextNote, 0.24, 0.2, 'triangle');
        tone(note + 12, nextNote, 0.095, 0.025);
      }
      if (eighth === 0 || eighth === 4) tone(chord[eighth === 0 ? 0 : 2], nextNote, 0.29, 0.26);
      if (eighth === 2 || eighth === 6) {
        tone(chord[1] + 12, nextNote, 0.14, 0.065, 'triangle');
        tone(chord[2] + 12, nextNote, 0.14, 0.055, 'triangle');
      }
      if (eighth % 2 === 0) tap(nextNote, eighth % 4 === 0);
      nextNote += beat * (eighth % 2 === 0 ? 0.54 : 0.46);
      step = (step + 1) % 64;
    }
  }

  async function start() {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error('Audio is unavailable');
      context = new AudioContext();
      context.addEventListener('statechange', notify);
      master = context.createGain();
      master.gain.value = 0.7;
      master.connect(context.destination);
    }
    await context.resume();
    // A blocked resume can resolve after the visitor has already turned music off.
    if (!enabled || document.hidden) { await context.suspend(); return; }
    if (context.state !== 'running' || timer !== undefined) return;
    nextNote = context.currentTime + 0.05;
    step = 0;
    schedule();
    timer = setInterval(schedule, 40);
    notify();
  }

  function requestStart() {
    if (!enabled || document.hidden) return;
    // Do not await an autoplay request: some browsers leave it pending until a gesture.
    void start().catch(notify);
  }

  function stop() {
    enabled = false;
    clearInterval(timer);
    timer = undefined;
    for (const voice of voices) { try { voice.stop(); } catch { /* Already ended. */ } }
    voices.clear();
    if (context) void context.suspend().catch(() => {});
    notify();
  }

  function toggle() {
    if (enabled) stop();
    else { enabled = true; requestStart(); notify(); }
    return enabled;
  }

  function react(kind) {
    if (!enabled || document.hidden || context?.state !== 'running') return;
    const time = context.currentTime + 0.01;
    if (kind === 'ending') [79, 76, 72].forEach((note, i) => tone(note, time + i * 0.095, 0.18, 0.18, 'triangle'));
    else tone(79, time, 0.085, 0.08);
  }

  document.addEventListener('visibilitychange', () => {
    if (!enabled) return;
    if (document.hidden) { if (context) void context.suspend().catch(() => {}); }
    else requestStart();
  });
  const unlock = event => {
    if (!event.isTrusted || event.target?.closest?.('[data-action="music"]')) return;
    if (context?.state !== 'running') requestStart();
  };
  for (const type of ['pointerdown', 'touchend', 'click', 'keydown']) document.addEventListener(type, unlock, { capture: true, passive: true });
  window.addEventListener('pagehide', () => { if (context) void context.suspend().catch(() => {}); });
  window.addEventListener('pageshow', requestStart);
  requestStart();
  return { get enabled() { return enabled; }, get playing() { return enabled && context?.state === 'running'; }, toggle, react };
})();
