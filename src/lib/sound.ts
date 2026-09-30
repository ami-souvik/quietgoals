'use client';

export type SoundName =
  | 'create'
  | 'keyTick'
  | 'save'
  | 'priority'
  | 'complete'
  | 'kill'
  | 'restore';

const STORAGE_KEY = 'quiet-goals-sound';
const COOKIE_NAME = 'settings';
const MASTER_VOLUME = 0.3;

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let soundEnabled = false;
let lastKeyTickTime = 0;

/**
 * Lazily initialize AudioContext only when needed on a user gesture.
 * Avoids browser autoplay policy warnings.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return null;

    try {
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(MASTER_VOLUME, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    } catch {
      return null;
    }
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

/**
 * Pre-generate a 0.5s white noise buffer for procedural noise effects
 * (complete crackle, kill low thud).
 */
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * 0.5);
    noiseBuffer = ctx.createBuffer(1, length, sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return noiseBuffer;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  if (enabled) {
    getAudioContext();
  }
}

export function persistSoundPreference(enabled: boolean): void {
  setSoundEnabled(enabled);

  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch {}

  try {
    let settingsObj: Record<string, unknown> = {};
    const match = document.cookie.match(
      new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]*)')
    );
    if (match) {
      try {
        settingsObj = JSON.parse(decodeURIComponent(match[1]));
      } catch {}
    }
    settingsObj.sound = enabled;
    const cookieVal = encodeURIComponent(JSON.stringify(settingsObj));
    document.cookie = `${COOKIE_NAME}=${cookieVal}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {}
}

export function getStoredSoundPreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val !== null) return val === '1' || val === 'true';
  } catch {}
  return false;
}

/**
 * Procedurally generate and play sound effects using Web Audio API.
 * Never plays if:
 * 1. Sound is disabled
 * 2. Document / tab is hidden
 * 3. AudioContext unavailable
 */
export function play(name: SoundName): void {
  if (!soundEnabled) return;
  if (typeof document !== 'undefined' && document.hidden) return;

  const ctx = getAudioContext();
  const master = masterGain;
  if (!ctx || !master) return;

  const now = ctx.currentTime;

  switch (name) {
    case 'create': {
      // Crisp, warm two-tone pop (520Hz -> 820Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(520, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc1.connect(gain1);
      gain1.connect(master);
      osc1.start(now);
      osc1.stop(now + 0.07);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(820, now + 0.035);
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.3, now + 0.035);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc2.connect(gain2);
      gain2.connect(master);
      osc2.start(now + 0.035);
      osc2.stop(now + 0.11);
      break;
    }

    case 'keyTick': {
      // Throttled subtle wooden mechanical key tick (~45ms)
      const pNow = performance.now();
      if (pNow - lastKeyTickTime < 45) return;
      lastKeyTickTime = pNow;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.016);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.018);
      break;
    }

    case 'save': {
      // Gentle harmonic ding (~80ms)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.085);
      break;
    }

    case 'priority': {
      // Stepped crisp tonal click (720Hz with slight overtone)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(740, now);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.055);
      break;
    }

    case 'complete': {
      // Rising chime (C5 -> E5 -> C6) + soft crackle burst
      const chord = [
        { freq: 523.25, delay: 0, dur: 0.22 }, // C5
        { freq: 659.25, delay: 0.045, dur: 0.24 }, // E5
        { freq: 1046.5, delay: 0.09, dur: 0.32 }, // C6
      ];

      chord.forEach(({ freq, delay, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.setValueAtTime(0.22, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now + delay);
        osc.stop(now + delay + dur);
      });

      // Soft sparkling crackle envelope for particles/fuse
      const buffer = getNoiseBuffer(ctx);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3600, now + 0.1);
      filter.Q.setValueAtTime(3, now + 0.1);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.setValueAtTime(0.12, now + 0.1);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(master);
      noiseSource.start(now + 0.1);
      noiseSource.stop(now + 0.24);
      break;
    }

    case 'kill': {
      // Low thud (120Hz -> 38Hz) + low-pass noise burst
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(115, now);
      osc.frequency.exponentialRampToValueAtTime(36, now + 0.14);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.15);

      // Low-passed muffled noise burst
      const buffer = getNoiseBuffer(ctx);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(master);
      noiseSource.start(now);
      noiseSource.stop(now + 0.09);
      break;
    }

    case 'restore': {
      // Soft reverse chime / upward frequency sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.12);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.13);
      break;
    }
  }
}
