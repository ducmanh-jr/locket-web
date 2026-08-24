// ─── Global Singleton Audio Controller for Locket Web ───
// Only ONE audio can ever play at a time across the entire app.
// Every component must import from here to guarantee no orphaned audio.

let _globalAudio: HTMLAudioElement | null = null;
let _globalSynthStop: (() => void) | null = null;

/**
 * Immediately kills any audio currently playing anywhere in the app.
 * Safe to call multiple times — always a no-op if nothing is playing.
 */
export function killGlobalAudio(): void {
  if (_globalAudio) {
    try {
      _globalAudio.pause();
      _globalAudio.onended = null;
      _globalAudio.onerror = null;
      _globalAudio.onloadedmetadata = null;
      _globalAudio.ontimeupdate = null;
      _globalAudio.src = '';
      _globalAudio.load(); // Force abort any buffered playback
    } catch (e) {}
    _globalAudio = null;
  }
  if (_globalSynthStop) {
    try {
      _globalSynthStop();
    } catch (e) {}
    _globalSynthStop = null;
  }
}

/**
 * Play audio from a URL starting at a specific timestamp offset. Automatically kills any previous audio first.
 * @param url         - The audio URL to play
 * @param onEnd       - Callback when playback finishes naturally
 * @param startTime   - Optional start time offset in seconds
 */
export function playGlobalAudio(url: string, onEnd: () => void, startTime?: number): void {
  // Always kill previous audio first
  killGlobalAudio();

  if (!url || !url.startsWith('http')) return;

  const audio = new Audio();
  audio.src = url;
  audio.volume = 0.85;
  audio.onended = () => onEnd();

  audio.onloadedmetadata = () => {
    if (startTime && startTime > 0 && startTime < (audio.duration || 120)) {
      audio.currentTime = startTime;
    }
  };

  audio.onerror = () => {
    // Fallback: Web Audio API synth capped at 16 steps
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const melody = [523.25, 659.25, 783.99, 1046.50, 880.00, 659.25, 698.46, 783.99];
      let stopped = false;
      let step = 0;
      const MAX_SYNTH_STEPS = 16;

      const playStep = () => {
        if (stopped) return;
        if (step >= MAX_SYNTH_STEPS) {
          stopped = true;
          try { ctx.close(); } catch (e) {}
          _globalSynthStop = null;
          onEnd();
          return;
        }

        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(melody[step % melody.length], ctx.currentTime);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
          step++;
          if (!stopped) setTimeout(playStep, 260);
        } catch (e) {
          stopped = true;
        }
      };
      playStep();
      _globalSynthStop = () => {
        stopped = true;
        try { ctx.close(); } catch (e) {}
      };
    } catch (e) {}
  };

  _globalAudio = audio;

  if (startTime && startTime > 0) {
    try {
      audio.currentTime = startTime;
    } catch (e) {}
  }

  const playPromise = audio.play();
  if (playPromise) {
    playPromise.catch(() => {
      if (audio.onerror) (audio.onerror as any)();
    });
  }
}

/**
 * Returns true if any audio is currently playing.
 */
export function isGlobalAudioPlaying(): boolean {
  return _globalAudio !== null && !_globalAudio.paused;
}
