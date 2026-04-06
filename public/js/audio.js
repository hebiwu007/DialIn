/**
 * DialIn — Audio Engine (Web Audio API)
 */
class DialInAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  play(type) {
    if (!this.enabled || !this.ctx) return;
    switch(type) {
      case 'tick': this._playTone(600, 0.08, 0.15); break;
      case 'confirm': this._playConfirm(); break;
      case 'highScore': this._playHighScore(); break;
      case 'lowScore': this._playLowScore(); break;
      case 'warning': this._playTone(400, 0.15, 0.2, 'sawtooth'); break;
      case 'levelUp': this._playLevelUp(); break;
      case 'complete': this._playComplete(); break;
    }
  }

  _playTone(freq, duration, volume = 0.2, type = 'sine') {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  _playConfirm() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  _playHighScore() {
    [800, 1000, 1200, 1600].forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 0.12, 0.2), i * 80);
    });
  }

  _playLowScore() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  _playLevelUp() {
    [600, 800, 1000, 1200, 1500, 1800].forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 0.15, 0.2), i * 100);
    });
  }

  _playComplete() {
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 0.3, 0.2), i * 150);
    });
  }
}

const audio = new DialInAudio();
