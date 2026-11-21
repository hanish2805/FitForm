class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private soundVolume = 0.7;
  private musicVolume = 0.35;
  private muted = false;
  private unlocked = false;
  private musicStep = 0;

  public unlock() {
    if (this.unlocked) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain.connect(this.ctx.destination);
      this.musicGain.connect(this.ctx.destination);
      this.syncGains();
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      this.unlocked = true;
      this.startAmbientLoop();
    } catch {
      // Audio unavailable
    }
  }

  public setSettings(soundVol: number, musicVol: number, muted: boolean) {
    this.soundVolume = soundVol;
    this.musicVolume = musicVol;
    this.muted = muted;
    this.syncGains();
  }

  private syncGains() {
    if (!this.ctx || !this.sfxGain || !this.musicGain) return;
    const now = this.ctx.currentTime;
    this.sfxGain.gain.setTargetAtTime(this.muted ? 0 : this.soundVolume, now, 0.04);
    this.musicGain.gain.setTargetAtTime(this.muted ? 0 : this.musicVolume * 0.18, now, 0.08);
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainVal = 0.25,
    delay = 0,
    slideTo?: number,
    bus: 'sfx' | 'music' = 'sfx',
  ) {
    if (!this.ctx || !this.sfxGain || !this.musicGain || this.muted) return;
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    }
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(gainVal, now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(g);
    g.connect(bus === 'sfx' ? this.sfxGain : this.musicGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playClick() {
    this.unlock();
    this.tone(520, 0.06, 'triangle', 0.16, 0, 660);
  }

  public playFootstep(sprint = false) {
    if (!this.unlocked || this.muted) return;
    this.tone(sprint ? 125 : 95, 0.055, 'triangle', sprint ? 0.1 : 0.07, 0, 48);
  }

  public playJump() {
    this.unlock();
    this.tone(190, 0.14, 'sine', 0.18, 0, 390);
  }

  public playRep(accuracy: number, repIndex: number) {
    this.unlock();
    const base = 360 + Math.min(repIndex, 15) * 18;
    const qualityBoost = accuracy > 0.8 ? 1.25 : 1.0;
    this.tone(base * qualityBoost, 0.12, 'triangle', 0.22, 0, base * qualityBoost * 1.15);
  }

  public playEquipmentClank() {
    this.unlock();
    this.tone(140, 0.12, 'sawtooth', 0.14, 0, 90);
    this.tone(420, 0.09, 'triangle', 0.12, 0.02, 260);
  }

  public playSetComplete() {
    this.unlock();
    this.tone(440, 0.15, 'triangle', 0.22, 0);
    this.tone(554.37, 0.16, 'triangle', 0.22, 0.09);
    this.tone(659.25, 0.26, 'triangle', 0.24, 0.18);
  }

  public playLevelUp() {
    this.unlock();
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((n, idx) => {
      this.tone(n, 0.28, 'triangle', 0.24, idx * 0.085);
    });
  }

  public playMissionComplete() {
    this.unlock();
    this.tone(523.25, 0.15, 'sine', 0.22, 0);
    this.tone(659.25, 0.15, 'sine', 0.22, 0.08);
    this.tone(783.99, 0.3, 'triangle', 0.24, 0.16);
  }

  public playMealBoost() {
    this.unlock();
    this.tone(392, 0.14, 'sine', 0.18, 0);
    this.tone(523.25, 0.22, 'sine', 0.18, 0.1);
  }

  private startAmbientLoop() {
    if (this.musicTimer !== null) return;
    // Calm energetic athletic synth pulse (120 BPM quarter-bar feel)
    const chord = [130.81, 164.81, 196.0, 246.94, 146.83, 174.61, 220.0, 261.63];
    this.musicTimer = window.setInterval(() => {
      if (!this.unlocked || this.muted || this.musicVolume <= 0.01) return;
      const note = chord[this.musicStep % chord.length];
      this.tone(note, 0.55, 'sine', 0.35, 0, undefined, 'music');
      if (this.musicStep % 2 === 0) {
        this.tone(note * 0.5, 0.45, 'triangle', 0.25, 0, undefined, 'music');
      }
      this.musicStep++;
    }, 650);
  }

  public dispose() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

export const soundEngine = new SoundEngine();
