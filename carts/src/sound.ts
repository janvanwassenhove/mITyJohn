// Geluid via WebAudio — geen externe assets (alles synthetisch), zodat de
// app volledig offline en zonder derde partijen werkt. Aan/uit persistent.

const STORAGE_KEY = 'carts.sound';
let enabled = true;
let ctx: AudioContext | null = null;

export function initSound(): void {
  try {
    enabled = localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    /* ignore */
  }
}

export function soundEnabled(): boolean {
  return enabled;
}

export function toggleSound(): boolean {
  enabled = !enabled;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    /* ignore */
  }
  return enabled;
}

function audioContext(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(frequency: number, start: number, duration: number, volume = 0.12): void {
  const audio = audioContext();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'triangle';
  osc.frequency.value = frequency;
  const t0 = audio.currentTime + start;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/** Kaart op tafel: kort tikje. */
export function sfxCard(): void {
  if (!enabled) return;
  tone(880, 0, 0.06, 0.06);
}

/** Slag binnen: twee tonen omhoog. */
export function sfxTrick(): void {
  if (!enabled) return;
  tone(523, 0, 0.1);
  tone(784, 0.09, 0.14);
}

/** Gift gescoord: klein akkoord. */
export function sfxScore(won: boolean): void {
  if (!enabled) return;
  if (won) {
    tone(523, 0, 0.16);
    tone(659, 0.1, 0.16);
    tone(784, 0.2, 0.24);
  } else {
    tone(392, 0, 0.2);
    tone(330, 0.14, 0.28);
  }
}
