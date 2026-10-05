/**
 * Atari TIA & MS-DOS PC Speaker Audio Emulation using Web Audio API
 */

class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private gain1: GainNode | null = null;
  private gain2: GainNode | null = null;
  private masterGain: GainNode | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Channel 0 (Player / Effects)
      this.gain1 = this.ctx.createGain();
      this.gain1.gain.setValueAtTime(0, this.ctx.currentTime);
      this.gain1.connect(this.masterGain);

      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'square';
      this.osc1.frequency.setValueAtTime(220, this.ctx.currentTime);
      this.osc1.connect(this.gain1);
      this.osc1.start();

      // Channel 1 (Noise / Explosions / Engine)
      this.gain2 = this.ctx.createGain();
      this.gain2.gain.setValueAtTime(0, this.ctx.currentTime);
      this.gain2.connect(this.masterGain);

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'sawtooth';
      this.osc2.frequency.setValueAtTime(110, this.ctx.currentTime);
      this.osc2.connect(this.gain2);
      this.osc2.start();
    } catch {
      // AudioContext not allowed or unsupported
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.2, this.ctx.currentTime);
    }
  }

  public playBeeperSound(freqHz = 880, durationMs = 60) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.gain1 || !this.osc1) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    this.osc1.type = 'square';
    this.osc1.frequency.setValueAtTime(freqHz, t);
    this.gain1.gain.cancelScheduledValues(t);
    this.gain1.gain.setValueAtTime(0.25, t);
    this.gain1.gain.exponentialRampToValueAtTime(0.001, t + durationMs / 1000);
  }

  public playAtariTone(channel: 0 | 1, audc: number, audf: number, audv: number) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const targetGain = channel === 0 ? this.gain1 : this.gain2;
    const targetOsc = channel === 0 ? this.osc1 : this.osc2;
    if (!targetGain || !targetOsc) return;

    const t = this.ctx.currentTime;
    if (audv === 0) {
      targetGain.gain.setValueAtTime(0, t);
      return;
    }

    // TIA clock is 30 kHz (colorburst 3.58MHz / 119)
    // Frequency divisor: audf is 0..31 -> divisor is audf + 1
    const baseFreq = 31400 / ((audf & 0x1f) + 1);

    // Audio Control wave shape
    if (audc === 8 || audc === 3) {
      // Noise / White noise
      targetOsc.type = 'sawtooth';
      targetOsc.frequency.setValueAtTime(Math.min(1200, Math.max(50, baseFreq * 0.4)), t);
    } else {
      // Square wave tone
      targetOsc.type = 'square';
      targetOsc.frequency.setValueAtTime(Math.min(4000, Math.max(40, baseFreq)), t);
    }

    const vol = (audv / 15) * 0.25;
    targetGain.gain.cancelScheduledValues(t);
    targetGain.gain.setValueAtTime(vol, t);
    targetGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  }

  public playFireLaser() {
    this.playBeeperSound(1200, 45);
    setTimeout(() => this.playBeeperSound(800, 40), 25);
  }

  public playExplosion() {
    this.playAtariTone(1, 8, 28, 14);
  }

  public playChomp() {
    this.playBeeperSound(440, 35);
  }
}

export const retroAudio = new RetroAudioEngine();
