// Subtle spatial Web Audio synthesizer calibrated for precision hardware/editorial interaction cues.
// Zero external audio assets required; all voices use Web Audio primitives with StereoPannerNode
// and a lightweight algorithmic studio micro-room impulse response.

const AUDIO_STORAGE_KEY = 'aadesh-portfolio-audio';

type PanSource = HTMLElement | { clientX: number } | number | null | undefined;

interface AudioEngineState {
  ctx: AudioContext | null;
  masterGain: GainNode | null;
  compressor: DynamicsCompressorNode | null;
  reverbNode: ConvolverNode | null;
  reverbSend: GainNode | null;
  hasUserGesture: boolean;
  listenersAttached: boolean;
  lastPlayedAt: Record<string, number>;
}

const state: AudioEngineState = {
  ctx: null,
  masterGain: null,
  compressor: null,
  reverbNode: null,
  reverbSend: null,
  hasUserGesture: false,
  listenersAttached: false,
  lastPlayedAt: {},
};

let audioEnabledCache: boolean = (() => {
  if (typeof window === 'undefined') return true;
  try {
    const saved = window.localStorage.getItem(AUDIO_STORAGE_KEY);
    return saved === null ? true : saved === 'on';
  } catch {
    return true;
  }
})();

const subscribers = new Set<(enabled: boolean) => void>();

export function getAudioEnabled(): boolean {
  return audioEnabledCache;
}

export function setAudioEnabled(next: boolean): void {
  audioEnabledCache = next;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(AUDIO_STORAGE_KEY, next ? 'on' : 'off');
    } catch {
      // ignore storage errors
    }
  }
  if (state.masterGain && state.ctx) {
    const now = state.ctx.currentTime;
    state.masterGain.gain.cancelScheduledValues(now);
    state.masterGain.gain.setTargetAtTime(next ? 0.44 : 0, now, 0.02);
  }
  subscribers.forEach((cb) => cb(next));
}

export function subscribeAudioEnabled(cb: (enabled: boolean) => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

function createMicroRoomImpulse(ctx: AudioContext): AudioBuffer {
  const duration = 0.26;
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < length; i++) {
      const t = i / length;
      // Exponential decay with soft early-reflection fade-in
      const envelope = Math.min(1, i / 120) * Math.pow(1 - t, 3.2);
      const white = Math.random() * 2 - 1;
      // Gentle low-pass smoothing for warm architectural room tone
      lp = lp * 0.72 + white * 0.28;
      data[i] = lp * envelope * 0.55;
    }
  }
  return buffer;
}

function ensureGestureListeners(): void {
  if (typeof window === 'undefined' || state.listenersAttached) return;
  state.listenersAttached = true;

  const unlock = () => {
    state.hasUserGesture = true;
    const ctx = getOrCreateContext(true);
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {
        // ignore autoplay resume failures
      });
    }
  };

  window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
  window.addEventListener('keydown', unlock, { capture: true, passive: true });
  window.addEventListener('touchstart', unlock, { capture: true, passive: true });
}

if (typeof window !== 'undefined') {
  ensureGestureListeners();
}

function getOrCreateContext(allowCreateFromGesture = false): AudioContext | null {
  if (typeof window === 'undefined') return null;
  ensureGestureListeners();

  if (allowCreateFromGesture) {
    state.hasUserGesture = true;
  }

  if (!state.ctx) {
    if (!allowCreateFromGesture && !state.hasUserGesture) {
      return null;
    }
    const AudioCtx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    try {
      const ctx = new AudioCtx();
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 12;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.14;

      const masterGain = ctx.createGain();
      masterGain.gain.value = audioEnabledCache ? 0.44 : 0;

      const reverbNode = ctx.createConvolver();
      reverbNode.buffer = createMicroRoomImpulse(ctx);

      const reverbSend = ctx.createGain();
      reverbSend.gain.value = 0.18;

      masterGain.connect(compressor);
      reverbSend.connect(reverbNode);
      reverbNode.connect(compressor);
      compressor.connect(ctx.destination);

      state.ctx = ctx;
      state.compressor = compressor;
      state.masterGain = masterGain;
      state.reverbNode = reverbNode;
      state.reverbSend = reverbSend;
    } catch {
      return null;
    }
  }

  return state.ctx;
}

function getReadyContext(fromGesture: boolean): AudioContext | null {
  if (!audioEnabledCache) return null;
  const ctx = getOrCreateContext(fromGesture);
  if (!ctx) return null;

  if (ctx.state === 'suspended') {
    if (fromGesture || state.hasUserGesture) {
      ctx.resume().catch(() => {
        // ignore
      });
    } else {
      return null;
    }
  }

  return ctx.state === 'running' || fromGesture ? ctx : null;
}

function canPlayThrottle(key: string, minIntervalMs: number): boolean {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const prev = state.lastPlayedAt[key] ?? 0;
  if (now - prev < minIntervalMs) return false;
  state.lastPlayedAt[key] = now;
  return true;
}

function resolvePan(source: PanSource): number {
  if (typeof source === 'number' && Number.isFinite(source)) {
    return Math.max(-0.85, Math.min(0.85, source));
  }
  if (typeof window === 'undefined' || !source) return 0;

  const vw = Math.max(320, window.innerWidth || 1280);
  let x = vw / 2;

  if (typeof HTMLElement !== 'undefined' && source instanceof HTMLElement) {
    const rect = source.getBoundingClientRect();
    if (rect.width > 0) {
      x = rect.left + rect.width / 2;
    }
  } else if (typeof source === 'object' && 'clientX' in source && typeof source.clientX === 'number') {
    x = source.clientX;
  }

  const normalized = (x / vw) * 2 - 1;
  return Math.max(-0.82, Math.min(0.82, normalized * 0.85));
}

function createSpatialDestination(
  ctx: AudioContext,
  panValue: number,
  airWarmthHz = 4800
): { input: AudioNode; panner: StereoPannerNode | null } {
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  // Subtle pinna/air rolloff as objects sit farther toward stereo periphery
  const edgeDamping = 1 - Math.abs(panValue) * 0.24;
  filter.frequency.value = Math.max(1200, airWarmthHz * edgeDamping);
  filter.Q.value = 0.65;

  let panner: StereoPannerNode | null = null;
  if (typeof ctx.createStereoPanner === 'function') {
    panner = ctx.createStereoPanner();
    panner.pan.value = panValue;
    filter.connect(panner);
    if (state.masterGain) panner.connect(state.masterGain);
    if (state.reverbSend) panner.connect(state.reverbSend);
  } else {
    if (state.masterGain) filter.connect(state.masterGain);
    if (state.reverbSend) filter.connect(state.reverbSend);
  }

  return { input: filter, panner };
}

function playSoftClickTransient(
  ctx: AudioContext,
  dest: AudioNode,
  now: number,
  centerFreq: number,
  gainPeak: number,
  duration = 0.014
): void {
  const length = Math.max(32, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const env = Math.pow(1 - i / length, 2.4);
    data[i] = (Math.random() * 2 - 1) * env;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(centerFreq, now);
  bp.Q.setValueAtTime(2.6, now);

  const g = ctx.createGain();
  g.gain.setValueAtTime(gainPeak, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  noise.connect(bp);
  bp.connect(g);
  g.connect(dest);
  noise.start(now);
}

/**
 * Tactile glass/wood harmonic micro-tick when hovering or focusing a project card.
 */
export function playCardHover(source?: PanSource, cardIndex = 0): void {
  const ctx = getReadyContext(false);
  if (!ctx || !canPlayThrottle('card-hover', 85)) return;

  const pan = resolvePan(source);
  const { input } = createSpatialDestination(ctx, pan, 4200);
  const now = ctx.currentTime + 0.003;

  // Pentatonic-spaced warm pitch step across cards
  const baseFreqs = [587.33, 659.25, 739.99, 880.0];
  const f0 = baseFreqs[cardIndex % baseFreqs.length] ?? 659.25;

  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(f0, now);
  osc1.frequency.exponentialRampToValueAtTime(f0 * 1.03, now + 0.065);

  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(f0 * 2.0, now);

  const g1 = ctx.createGain();
  g1.gain.setValueAtTime(0.0001, now);
  g1.gain.linearRampToValueAtTime(0.048, now + 0.005);
  g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);

  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.0001, now);
  g2.gain.linearRampToValueAtTime(0.014, now + 0.004);
  g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

  osc1.connect(g1);
  g1.connect(input);
  osc2.connect(g2);
  g2.connect(input);

  playSoftClickTransient(ctx, input, now, 1750, 0.025, 0.012);

  osc1.start(now);
  osc1.stop(now + 0.095);
  osc2.start(now);
  osc2.stop(now + 0.06);
}

/**
 * Spatial harmonic aperture bloom when opening a Case Study modal.
 * Sweeps stereo pan from trigger origin cleanly into center stage.
 */
export function playModalOpen(source?: PanSource): void {
  const ctx = getReadyContext(true);
  if (!ctx || !canPlayThrottle('modal-open', 140)) return;

  const startPan = resolvePan(source);
  const { input, panner } = createSpatialDestination(ctx, startPan, 3800);
  const now = ctx.currentTime + 0.005;

  if (panner) {
    panner.pan.setValueAtTime(startPan, now);
    panner.pan.linearRampToValueAtTime(0, now + 0.24);
  }

  // Warm open fifth + octave bloom (D4 - A4 - D5)
  const voices: { freq: number; delay: number; gain: number; decay: number; type: OscillatorType }[] = [
    { freq: 293.66, delay: 0, gain: 0.065, decay: 0.34, type: 'sine' },
    { freq: 440.0, delay: 0.022, gain: 0.048, decay: 0.3, type: 'triangle' },
    { freq: 587.33, delay: 0.045, gain: 0.036, decay: 0.28, type: 'sine' },
  ];

  for (const v of voices) {
    const t0 = now + v.delay;
    const osc = ctx.createOscillator();
    osc.type = v.type;
    osc.frequency.setValueAtTime(v.freq * 0.98, t0);
    osc.frequency.exponentialRampToValueAtTime(v.freq, t0 + 0.08);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(v.gain, t0 + 0.018);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + v.decay);

    osc.connect(g);
    g.connect(input);
    osc.start(t0);
    osc.stop(t0 + v.decay + 0.02);
  }

  playSoftClickTransient(ctx, input, now, 1300, 0.028, 0.016);
}

/**
 * Gentle downward warm exhale when closing the Case Study modal.
 */
export function playModalClose(): void {
  const ctx = getReadyContext(true);
  if (!ctx || !canPlayThrottle('modal-close', 120)) return;

  const { input } = createSpatialDestination(ctx, 0, 2600);
  const now = ctx.currentTime + 0.004;

  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(440, now);
  osc1.frequency.exponentialRampToValueAtTime(261.63, now + 0.16);

  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(293.66, now);
  osc2.frequency.exponentialRampToValueAtTime(196.0, now + 0.16);

  const g1 = ctx.createGain();
  g1.gain.setValueAtTime(0.0001, now);
  g1.gain.linearRampToValueAtTime(0.052, now + 0.01);
  g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.0001, now);
  g2.gain.linearRampToValueAtTime(0.024, now + 0.01);
  g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

  osc1.connect(g1);
  g1.connect(input);
  osc2.connect(g2);
  g2.connect(input);

  osc1.start(now);
  osc1.stop(now + 0.19);
  osc2.start(now);
  osc2.stop(now + 0.18);
}

/**
 * Directional spatial relay when cycling Prev / Next monographs.
 */
export function playMonographSwitch(
  direction: 'prev' | 'next',
  source?: PanSource
): void {
  const ctx = getReadyContext(true);
  if (!ctx || !canPlayThrottle('monograph-switch', 80)) return;

  const fallbackPan = direction === 'prev' ? -0.45 : 0.45;
  const pan = source !== undefined ? resolvePan(source) : fallbackPan;
  const { input } = createSpatialDestination(ctx, pan, 4000);
  const now = ctx.currentTime + 0.004;

  const fStart = direction === 'next' ? 493.88 : 659.25;
  const fEnd = direction === 'next' ? 659.25 : 493.88;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(fStart, now);
  osc.frequency.exponentialRampToValueAtTime(fEnd, now + 0.07);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(0.055, now + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

  osc.connect(g);
  g.connect(input);
  playSoftClickTransient(ctx, input, now, 1600, 0.025, 0.012);

  osc.start(now);
  osc.stop(now + 0.13);
}

/**
 * Tactile precision latch when expanding or collapsing project technical specs.
 */
export function playSpecsToggle(expanded: boolean, source?: PanSource): void {
  const ctx = getReadyContext(true);
  if (!ctx || !canPlayThrottle('specs-toggle', 70)) return;

  const pan = resolvePan(source);
  const { input } = createSpatialDestination(ctx, pan, 4200);
  const now = ctx.currentTime + 0.003;

  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(expanded ? 392 : 587.33, now);
  osc.frequency.exponentialRampToValueAtTime(expanded ? 587.33 : 349.23, now + 0.075);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(0.042, now + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);

  osc.connect(g);
  g.connect(input);
  playSoftClickTransient(ctx, input, now, expanded ? 2200 : 1450, 0.026, 0.012);

  osc.start(now);
  osc.stop(now + 0.105);
}

/**
 * Segmented detent cue for filter tabs, discipline cards, and sort toggles.
 */
export function playFilterTab(
  tabIndex = 0,
  totalTabs = 4,
  source?: PanSource
): void {
  const ctx = getReadyContext(true);
  if (!ctx || !canPlayThrottle('filter-tab', 55)) return;

  const computedPan =
    source !== undefined
      ? resolvePan(source)
      : totalTabs > 1
        ? (tabIndex / (totalTabs - 1)) * 0.7 - 0.35
        : 0;

  const { input } = createSpatialDestination(ctx, computedPan, 4400);
  const now = ctx.currentTime + 0.002;

  const f = 540 + tabIndex * 52;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(f, now);
  osc.frequency.exponentialRampToValueAtTime(f * 1.06, now + 0.045);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(0.045, now + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.068);

  osc.connect(g);
  g.connect(input);
  playSoftClickTransient(ctx, input, now, 1950, 0.022, 0.01);

  osc.start(now);
  osc.stop(now + 0.075);
}

/**
 * Stepped rotary progression cue for the horizontal Project Timeline Stepper.
 */
export function playTimelineStep(
  stepIndex: number,
  totalSteps = 4,
  source?: PanSource
): void {
  const ctx = getReadyContext(true);
  if (!ctx || !canPlayThrottle('timeline-step', 55)) return;

  const fallbackPan =
    totalSteps > 1 ? (stepIndex / (totalSteps - 1)) * 1.1 - 0.55 : 0;
  const pan = source !== undefined ? resolvePan(source) : fallbackPan;
  const { input } = createSpatialDestination(ctx, pan, 4400);
  const now = ctx.currentTime + 0.003;

  const scale = [523.25, 587.33, 659.25, 783.99];
  const freq = scale[stepIndex % scale.length] ?? 587.33;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);

  const harmonic = ctx.createOscillator();
  harmonic.type = 'sine';
  harmonic.frequency.setValueAtTime(freq * 1.5, now);

  const g1 = ctx.createGain();
  g1.gain.setValueAtTime(0.0001, now);
  g1.gain.linearRampToValueAtTime(0.048, now + 0.005);
  g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.0001, now);
  g2.gain.linearRampToValueAtTime(0.014, now + 0.005);
  g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

  osc.connect(g1);
  g1.connect(input);
  harmonic.connect(g2);
  g2.connect(input);
  playSoftClickTransient(ctx, input, now, 1700, 0.018, 0.01);

  osc.start(now);
  osc.stop(now + 0.12);
  harmonic.start(now);
  harmonic.stop(now + 0.085);
}

/**
 * Calibrated rotary tick for interactive sliders (throttled cleanly).
 */
export function playSliderTick(normalizedValue: number, source?: PanSource): void {
  const ctx = getReadyContext(true);
  if (!ctx || !canPlayThrottle('slider-tick', 42)) return;

  const pan = resolvePan(source);
  const { input } = createSpatialDestination(ctx, pan, 3800);
  const now = ctx.currentTime + 0.002;

  const clamped = Math.max(0, Math.min(1, normalizedValue));
  const freq = 440 + clamped * 440;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(0.028, now + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);

  osc.connect(g);
  g.connect(input);

  osc.start(now);
  osc.stop(now + 0.032);
}

/**
 * Spatial 3D Technology Globe selection cue.
 */
export function playGlobeNodeSelect(
  polarity: 'attract' | 'repel',
  source?: PanSource
): void {
  const ctx = getReadyContext(true);
  if (!ctx || !canPlayThrottle('globe-node', 60)) return;

  const pan = resolvePan(source);
  const { input } = createSpatialDestination(ctx, pan, 4500);
  const now = ctx.currentTime + 0.003;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  if (polarity === 'attract') {
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.exponentialRampToValueAtTime(698.46, now + 0.09);
  } else {
    osc.frequency.setValueAtTime(659.25, now);
    osc.frequency.exponentialRampToValueAtTime(493.88, now + 0.09);
  }

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(0.045, now + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

  osc.connect(g);
  g.connect(input);
  playSoftClickTransient(ctx, input, now, 1850, 0.02, 0.01);

  osc.start(now);
  osc.stop(now + 0.12);
}

/**
 * Atmospheric polarity sweep for Light / Dark theme toggles.
 */
export function playThemeSwitch(
  nextTheme: 'light' | 'dark',
  source?: PanSource
): void {
  const ctx = getReadyContext(true);
  if (!ctx || !canPlayThrottle('theme-switch', 120)) return;

  const pan = resolvePan(source ?? 0.5);
  const { input } = createSpatialDestination(ctx, pan, 4000);
  const now = ctx.currentTime + 0.004;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  if (nextTheme === 'light') {
    osc.frequency.setValueAtTime(349.23, now);
    osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.15);
  } else {
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.exponentialRampToValueAtTime(311.13, now + 0.15);
  }

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(0.048, now + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);

  osc.connect(g);
  g.connect(input);
  osc.start(now);
  osc.stop(now + 0.18);
}

/**
 * Crisp two-note confirmation shimmer when copying contact details.
 */
export function playCopyConfirm(source?: PanSource): void {
  const ctx = getReadyContext(true);
  if (!ctx || !canPlayThrottle('copy-confirm', 140)) return;

  const pan = resolvePan(source);
  const { input } = createSpatialDestination(ctx, pan, 4800);
  const now = ctx.currentTime + 0.003;

  const notes = [
    { freq: 587.33, delay: 0, gain: 0.045 },
    { freq: 880.0, delay: 0.055, gain: 0.05 },
  ];

  for (const n of notes) {
    const t0 = now + n.delay;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(n.freq, t0);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(n.gain, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);

    osc.connect(g);
    g.connect(input);
    osc.start(t0);
    osc.stop(t0 + 0.15);
  }
}

/**
 * Whisper-soft navigation confirmation tick.
 */
export function playNavSelect(source?: PanSource): void {
  const ctx = getReadyContext(true);
  if (!ctx || !canPlayThrottle('nav-select', 60)) return;

  const pan = resolvePan(source);
  const { input } = createSpatialDestination(ctx, pan, 3600);
  const now = ctx.currentTime + 0.002;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(620, now);
  osc.frequency.exponentialRampToValueAtTime(520, now + 0.045);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(0.032, now + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

  osc.connect(g);
  g.connect(input);
  osc.start(now);
  osc.stop(now + 0.065);
}

/**
 * Playful low-left spatial micro-chirp for the bottom-left robotic companion.
 */
export function playCompanionCue(
  kind: 'tap' | 'spin' | 'overdrive' = 'tap',
  source?: PanSource
): void {
  const ctx = getReadyContext(true);
  if (!ctx || !canPlayThrottle('companion-cue', 65)) return;

  const pan = source !== undefined ? resolvePan(source) : -0.76;
  const { input } = createSpatialDestination(ctx, pan, 4500);
  const now = ctx.currentTime + 0.003;

  if (kind === 'overdrive') {
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((f, i) => {
      const t0 = now + i * 0.038;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t0);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.045, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.11);
      osc.connect(g);
      g.connect(input);
      osc.start(t0);
      osc.stop(t0 + 0.12);
    });
    return;
  }

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  if (kind === 'spin') {
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.11);
  } else {
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.06);
  }

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(0.04, now + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);

  osc.connect(g);
  g.connect(input);
  osc.start(now);
  osc.stop(now + 0.11);
}
