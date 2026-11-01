// Kleine Helfer, die überall im Spiel gebraucht werden.

// Das Spielfeld ist immer 1280 x 720 "Spiel-Pixel" groß.
// Auf dem Bildschirm wird es passend gestreckt.
const W = 1280;
const H = 720;
const TINTE = '#2e2233'; // Die dunkle Trickfilm-Umrandung

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];

// Zufallsgenerator, der mit einer "Saat" immer dieselbe Welt erzeugt.
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Weiches Rauschen: gibt für jedes x eine Zahl zwischen -1 und 1.
function makeNoise(rng) {
  const values = Array.from({ length: 512 }, () => rng() * 2 - 1);
  const at = (x) => {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    return lerp(values[((i % 512) + 512) % 512], values[(((i + 1) % 512) + 512) % 512], u);
  };
  return (x, octaves = 3) => {
    let sum = 0, amp = 1, freq = 1, total = 0;
    for (let o = 0; o < octaves; o++) {
      sum += at(x * freq + o * 37) * amp;
      total += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return sum / total;
  };
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Mischt zwei Farben: t=0 ist Farbe a, t=1 ist Farbe b.
function mix(a, b, t) {
  const ca = hexToRgb(a), cb = hexToRgb(b);
  const c = ca.map((v, i) => Math.round(lerp(v, cb[i], t)));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

function makeCanvas(width, height) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(width);
  c.height = Math.ceil(height);
  return c;
}

// Zeichnet eine Form mit Füllung und dunkler Umrandung.
function shape(ctx, fill, build, lineWidth = 3) {
  ctx.beginPath();
  build(ctx);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = TINTE;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
