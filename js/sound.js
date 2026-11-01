// Alle Geräusche werden vom Browser selbst erzeugt – es gibt keine Sound-Dateien.
const Sound = {
  ctx: null,
  an: true,

  // Browser erlauben Ton erst nach dem ersten Klick.
  aufwecken() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  ton(freq, endFreq, dauer, lautstaerke, typ = 'sine', start = 0) {
    const c = this.ctx, t = c.currentTime + start;
    const o = c.createOscillator(), g = c.createGain();
    o.type = typ;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 20), t + dauer);
    g.gain.setValueAtTime(lautstaerke, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dauer);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dauer);
  },

  rauschen(dauer, lautstaerke, filterStart, filterEnde, start = 0) {
    const c = this.ctx, t = c.currentTime + start;
    const buf = c.createBuffer(1, Math.max(1, c.sampleRate * dauer), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf;
    f.type = 'bandpass';
    f.frequency.setValueAtTime(filterStart, t);
    f.frequency.exponentialRampToValueAtTime(filterEnde, t + dauer);
    g.gain.setValueAtTime(lautstaerke, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dauer);
    s.connect(f).connect(g).connect(c.destination);
    s.start(t);
  },

  spiele(name) {
    if (!this.an || !this.ctx) return;
    const sounds = {
      klick: () => this.ton(520, 760, 0.08, 0.15, 'triangle'),
      tick: () => this.ton(900, 1000, 0.03, 0.04, 'triangle'),
      spucken: () => {
        this.rauschen(0.2, 0.45, 2600, 700);
        this.ton(700, 170, 0.18, 0.2, 'sawtooth');
      },
      platsch: () => {
        this.rauschen(0.3, 0.55, 900, 160);
        this.ton(240, 60, 0.25, 0.3, 'sine');
      },
      treffer: () => {
        this.rauschen(0.35, 0.5, 1200, 200);
        [660, 520, 400, 300].forEach((f, i) => this.ton(f, f * 0.8, 0.16, 0.22, 'square', 0.05 + i * 0.11));
      },
      rumms: () => this.ton(140, 45, 0.25, 0.4, 'sine'),
      muh: () => {
        this.ton(170, 120, 0.9, 0.25, 'sawtooth');
        this.ton(172, 122, 0.9, 0.15, 'triangle');
      },
      runde: () => [523, 659, 784].forEach((f, i) => this.ton(f, f, 0.14, 0.14, 'triangle', i * 0.11)),
      sieg: () =>
        [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) =>
          this.ton(f, f, 0.2, 0.17, 'triangle', i * 0.13)
        ),
    };
    if (sounds[name]) sounds[name]();
  },
};
