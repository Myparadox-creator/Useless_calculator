// Sound Effects Engine using Web Audio API (Zero external audio asset latency)
class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playClick(type = 'number') {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    let freq = 600;
    let decay = 0.04;
    let typeWave = 'sine';

    if (type === 'operator') {
      freq = 900;
      decay = 0.05;
    } else if (type === 'function') {
      freq = 1100;
      decay = 0.06;
    } else if (type === 'action') {
      freq = 450;
      decay = 0.08;
      typeWave = 'triangle';
    } else if (type === 'equals') {
      freq = 780;
      decay = 0.09;
    }

    osc.type = typeWave;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + decay);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + decay);
  }

  playPaywallAlert() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Buzz sound (two detuned square waves)
    [160, 168].forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.35);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    });
  }

  playUpgradeFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Arpeggiated cheerful chords (C5, E5, G5, C6) + Ka-ching effect
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });

    // Cash register bell high ping
    const bellOsc = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    const bellStart = now + 0.35;

    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(2093.00, bellStart); // C7
    bellGain.gain.setValueAtTime(0.25, bellStart);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, bellStart + 0.8);

    bellOsc.connect(bellGain);
    bellGain.connect(this.ctx.destination);

    bellOsc.start(bellStart);
    bellOsc.stop(bellStart + 0.8);
  }
}

window.soundFX = new SoundFX();
