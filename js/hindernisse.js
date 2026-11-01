// Alles, was in den Bergen herumsteht. Jede Funktion malt ein Hindernis,
// das mit seinem Fuß auf (x, y) steht. Gemalt = fest: Spucke prallt daran ab!
// Neue Idee? Schreibe eine neue Funktion und trage sie unten in HINDERNIS_LISTEN ein.

const Hindernisse = {
  fichte(c, x, y, r, opt) {
    const h = 75 + r() * 60;
    const b = h * 0.42;
    shape(c, '#6b4a33', (p) => p.rect(x - h * 0.05, y - h * 0.22, h * 0.1, h * 0.26), 3);
    const stufen = 4;
    const gruen = pick(['#2f8f5b', '#2a7f58', '#38996a'], r);
    for (let i = 0; i < stufen; i++) {
      const t = i / stufen;
      const unten = y - h * 0.15 - t * h * 0.62;
      const oben = unten - h * 0.36;
      const breite = b * (1 - t * 0.72);
      const zacken = (p) => {
        p.moveTo(x, oben);
        p.lineTo(x + breite, unten);
        p.quadraticCurveTo(x + breite / 2, unten + 8, x, unten + 2);
        p.quadraticCurveTo(x - breite / 2, unten + 8, x - breite, unten);
        p.closePath();
      };
      shape(c, gruen, zacken, 3);
      c.save();
      c.beginPath(); zacken(c); c.clip();
      c.fillStyle = 'rgba(15,40,50,0.22)';
      c.fillRect(x, oben - 2, breite + 2, unten - oben + 12);
      if (opt.schnee) {
        c.fillStyle = '#f4f9ff';
        c.beginPath();
        c.moveTo(x, oben - 1);
        c.lineTo(x + breite * 0.42, oben + (unten - oben) * 0.45);
        c.lineTo(x + breite * 0.1, oben + (unten - oben) * 0.33);
        c.lineTo(x - breite * 0.15, oben + (unten - oben) * 0.5);
        c.lineTo(x - breite * 0.42, oben + (unten - oben) * 0.42);
        c.closePath();
        c.fill();
      }
      c.restore();
    }
  },

  felsbrocken(c, x, y, r, opt) {
    const s = 22 + r() * 26;
    const farbe = opt.felsFarbe || '#8f8a94';
    const punkte = [];
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const a = Math.PI + (i / n) * Math.PI;
      const q = s * (0.82 + r() * 0.3);
      punkte.push([x + Math.cos(a) * q * 1.2, y + Math.sin(a) * q * 0.95]);
    }
    const form = (p) => {
      p.moveTo(punkte[0][0], y + 6);
      punkte.forEach(([a, b]) => p.lineTo(a, b));
      p.lineTo(punkte[n][0], y + 6);
      p.closePath();
    };
    shape(c, farbe, form, 3);
    c.save();
    c.beginPath(); form(c); c.clip();
    c.fillStyle = 'rgba(255,255,255,0.2)';
    c.beginPath();
    c.moveTo(x - s * 1.2, y - s * 0.2);
    c.lineTo(x - s * 0.1, y - s);
    c.lineTo(x + s * 0.2, y - s * 0.25);
    c.lineTo(x - s * 0.5, y + 3);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(20,15,40,0.2)';
    c.fillRect(x + s * 0.3, y - s * 1.2, s * 1.2, s * 1.4);
    c.restore();
  },

  almhuette(c, x, y, r) {
    const b = 88 + r() * 16, h = 46;
    // Steinsockel
    shape(c, '#a7a3a0', (p) => p.rect(x - b / 2, y - 16, b, 26), 3);
    c.fillStyle = 'rgba(40,30,50,0.25)';
    for (let i = 0; i < 6; i++) {
      c.fillRect(x - b / 2 + 5 + i * (b / 6), y - 12 + (i % 2) * 8, 9, 4);
    }
    // Holzwand
    shape(c, '#a9673a', (p) => p.rect(x - b / 2 + 4, y - 16 - h, b - 8, h), 3);
    c.strokeStyle = 'rgba(70,35,20,0.5)';
    c.lineWidth = 2;
    for (let i = 1; i < 5; i++) {
      c.beginPath();
      c.moveTo(x - b / 2 + 5, y - 16 - (i * h) / 5);
      c.lineTo(x + b / 2 - 5, y - 16 - (i * h) / 5);
      c.stroke();
    }
    // Schornstein
    shape(c, '#8c7f7b', (p) => p.rect(x + b * 0.22, y - h - 60, 13, 28), 3);
    // Dach
    shape(c, '#6a4432', (p) => {
      p.moveTo(x - b / 2 - 14, y - 12 - h);
      p.lineTo(x, y - 16 - h - 34);
      p.lineTo(x + b / 2 + 14, y - 12 - h);
      p.closePath();
    }, 3);
    c.strokeStyle = 'rgba(30,15,20,0.3)';
    c.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      const q = i / 4;
      c.beginPath();
      c.moveTo(x - (b / 2 + 14) * q, y - 12 - h - 34 * (1 - q));
      c.lineTo(x + (b / 2 + 14) * q, y - 12 - h - 34 * (1 - q));
      c.stroke();
    }
    // Fenster mit Läden und Blumenkasten
    const fx = x - 8, fy = y - 18 - h + 8;
    shape(c, '#ffe9a8', (p) => p.rect(fx, fy, 18, 18), 2.5);
    c.strokeStyle = TINTE; c.lineWidth = 2;
    c.beginPath(); c.moveTo(fx + 9, fy); c.lineTo(fx + 9, fy + 18); c.moveTo(fx, fy + 9); c.lineTo(fx + 18, fy + 9); c.stroke();
    shape(c, '#d8483f', (p) => p.rect(fx - 9, fy, 8, 18), 2);
    shape(c, '#d8483f', (p) => p.rect(fx + 19, fy, 8, 18), 2);
    shape(c, '#7a4a2a', (p) => p.rect(fx - 4, fy + 19, 26, 7), 2);
    ['#ff5d8f', '#ffd23f', '#ff5d8f', '#ffffff', '#ff5d8f'].forEach((farbe, i) => {
      c.fillStyle = farbe;
      c.beginPath(); c.arc(fx - 1 + i * 5, fy + 18, 3, 0, Math.PI * 2); c.fill();
    });
  },

  kuh(c, x, y, r) {
    const b = r() < 0.5 ? 1 : -1;
    c.save();
    c.translate(x, y);
    c.scale(b, 1);
    [[-17, '#e8e0d4'], [16, '#e8e0d4'], [-10, '#fff'], [9, '#fff']].forEach(([lx, farbe]) => {
      shape(c, farbe, (p) => p.rect(lx - 3, -17, 6, 19), 2.5);
    });
    const koerper = (p) => roundRectPath(p, -26, -42, 50, 28, 12);
    shape(c, '#fff8ee', koerper, 3);
    c.save();
    c.beginPath(); koerper(c); c.clip();
    c.fillStyle = '#8a5a3a';
    c.beginPath(); c.arc(-14, -38, 12, 0, 7); c.arc(9, -17, 10, 0, 7); c.fill();
    c.restore();
    // Euter
    shape(c, '#f7a8a0', (p) => p.arc(-9, -14, 5, 0, Math.PI), 2);
    // Kopf
    shape(c, '#fff8ee', (p) => roundRectPath(p, 20, -52, 22, 22, 9), 3);
    shape(c, '#f4c6b5', (p) => roundRectPath(p, 26, -41, 19, 13, 6), 2.5);
    shape(c, '#e7dcc4', (p) => { p.moveTo(23, -52); p.quadraticCurveTo(18, -62, 24, -63); p.lineTo(28, -52); p.closePath(); }, 2);
    shape(c, '#e7dcc4', (p) => { p.moveTo(35, -52); p.quadraticCurveTo(41, -62, 35, -63); p.lineTo(31, -52); p.closePath(); }, 2);
    c.fillStyle = TINTE;
    c.beginPath(); c.arc(31, -46, 2.5, 0, 7); c.arc(32, -36, 1.2, 0, 7); c.arc(39, -36, 1.2, 0, 7); c.fill();
    // Glocke
    shape(c, '#ffd23f', (p) => { p.moveTo(21, -29); p.lineTo(28, -29); p.lineTo(30, -19); p.lineTo(19, -19); p.closePath(); }, 2);
    c.restore();
  },

  gipfelkreuz(c, x, y) {
    shape(c, '#7a4f2d', (p) => p.rect(x - 3.5, y - 62, 7, 66), 2.5);
    shape(c, '#7a4f2d', (p) => p.rect(x - 17, y - 48, 34, 7), 2.5);
    c.fillStyle = '#ffd23f';
    c.beginPath(); c.arc(x, y - 44.5, 3, 0, 7); c.fill();
  },

  grasbueschel(c, x, y, r, opt) {
    const farbe = opt.grasFarbe || '#58a84a';
    c.strokeStyle = TINTE;
    c.lineCap = 'round';
    const halme = 5 + Math.floor(r() * 4);
    const winkel = [];
    for (let i = 0; i < halme; i++) winkel.push([(i - halme / 2) * 3.5 + r() * 2, 12 + r() * 11]);
    c.lineWidth = 5;
    winkel.forEach(([d, h]) => { c.beginPath(); c.moveTo(x + d * 0.3, y + 2); c.quadraticCurveTo(x + d * 0.5, y - h * 0.6, x + d, y - h); c.stroke(); });
    c.strokeStyle = farbe;
    c.lineWidth = 2.4;
    winkel.forEach(([d, h]) => { c.beginPath(); c.moveTo(x + d * 0.3, y + 2); c.quadraticCurveTo(x + d * 0.5, y - h * 0.6, x + d, y - h); c.stroke(); });
  },

  blume(c, x, y, r, opt) {
    const farbe = pick(opt.blumen || ['#fff', '#6a5acd', '#ffd23f'], r);
    const h = 10 + r() * 8;
    c.strokeStyle = TINTE; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y + 2); c.lineTo(x, y - h); c.stroke();
    c.strokeStyle = '#3f9a45'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x, y + 2); c.lineTo(x, y - h); c.stroke();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      shape(c, farbe, (p) => p.arc(x + Math.cos(a) * 4, y - h + Math.sin(a) * 4, 3, 0, 7), 1.5);
    }
    c.fillStyle = '#ffb703';
    c.beginPath(); c.arc(x, y - h, 2.5, 0, 7); c.fill();
  },

  // ---------- Anden ----------

  kaktus(c, x, y, r) {
    const h = 66 + r() * 60;
    const dick = 13 + r() * 5;
    const gruen = pick(['#5c9a5b', '#4f9068', '#6aa75f'], r);
    const saeule = (sx, sy, sh, breite) => {
      const form = (p) => roundRectPath(p, sx - breite / 2, sy - sh, breite, sh + 6, breite / 2);
      shape(c, gruen, form, 3);
      c.save();
      c.beginPath(); form(c); c.clip();
      c.fillStyle = 'rgba(15,40,50,0.2)';
      c.fillRect(sx + breite * 0.12, sy - sh, breite, sh + 6);
      c.restore();
      c.strokeStyle = 'rgba(25,60,50,0.45)';
      c.lineWidth = 1.5;
      for (const d of [-0.2, 0.2]) {
        c.beginPath(); c.moveTo(sx + d * breite, sy - sh + 6); c.lineTo(sx + d * breite, sy - 2); c.stroke();
      }
    };
    const arm = (seite, hoehe, armH) => {
      const ax = x + seite * (dick + 7);
      const ay = y - hoehe;
      c.strokeStyle = TINTE; c.lineWidth = dick * 0.62 + 6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, ay); c.lineTo(ax, ay); c.stroke();
      c.strokeStyle = gruen; c.lineWidth = dick * 0.62;
      c.beginPath(); c.moveTo(x, ay); c.lineTo(ax, ay); c.stroke();
      saeule(ax, ay, armH, dick * 0.72);
      return [ax, ay - armH];
    };
    const spitzen = [];
    if (r() < 0.9) spitzen.push(arm(-1, h * (0.38 + r() * 0.2), h * 0.3));
    if (r() < 0.7) spitzen.push(arm(1, h * (0.45 + r() * 0.2), h * 0.28));
    saeule(x, y, h, dick);
    spitzen.push([x, y - h]);
    spitzen.forEach(([sx, sy]) => {
      if (r() < 0.7) {
        shape(c, '#ff5d8f', (p) => p.arc(sx, sy, 5, 0, 7), 2);
        c.fillStyle = '#ffd23f';
        c.beginPath(); c.arc(sx, sy, 2, 0, 7); c.fill();
      }
    });
  },

  queuenal(c, x, y, r) {
    // Polylepis (Queñual): knorriger Baum mit rotbrauner Rinde – wächst höher als fast jeder andere Baum.
    const h = 70 + r() * 40;
    c.lineCap = 'round';
    const stamm = (w, farbe) => {
      c.strokeStyle = farbe;
      c.lineWidth = w;
      c.beginPath();
      c.moveTo(x, y + 3);
      c.bezierCurveTo(x - 10, y - h * 0.3, x + 10, y - h * 0.4, x + 2, y - h * 0.7);
      c.moveTo(x + 2, y - h * 0.42);
      c.quadraticCurveTo(x + 14, y - h * 0.5, x + 22, y - h * 0.68);
      c.moveTo(x - 2, y - h * 0.36);
      c.quadraticCurveTo(x - 14, y - h * 0.45, x - 22, y - h * 0.6);
      c.stroke();
    };
    stamm(15, TINTE);
    stamm(9, '#c0673a');
    const blaetter = [[-22, -0.66, 19], [24, -0.72, 18], [0, -0.86, 24], [-10, -0.72, 17], [13, -0.8, 17]];
    const gruen = pick(['#7f9c4a', '#6e9150', '#8ba24c'], r);
    c.fillStyle = TINTE;
    blaetter.forEach(([d, q, s]) => { c.beginPath(); c.arc(x + d, y + q * h, s + 3, 0, 7); c.fill(); });
    c.fillStyle = gruen;
    blaetter.forEach(([d, q, s]) => { c.beginPath(); c.arc(x + d, y + q * h, s, 0, 7); c.fill(); });
    c.fillStyle = 'rgba(255,255,200,0.25)';
    blaetter.forEach(([d, q, s]) => { c.beginPath(); c.arc(x + d - s * 0.3, y + q * h - s * 0.3, s * 0.5, 0, 7); c.fill(); });
  },

  inkamauer(c, x, y, r) {
    // Mauer aus perfekt aneinandergepassten Steinen, mit trapezförmiger Nische.
    const b = 88 + r() * 44, h = 54 + r() * 18;
    const links = x - b / 2, oben = y - h;
    const form = (p) => {
      p.moveTo(links - 4, y + 6);
      p.lineTo(links + 3, oben + 3);
      p.lineTo(links + b * 0.3, oben);
      p.lineTo(links + b * 0.6, oben + 5);
      p.lineTo(links + b - 3, oben + 1);
      p.lineTo(links + b + 4, y + 6);
      p.closePath();
    };
    shape(c, '#b5a58c', form, 3);
    c.save();
    c.beginPath(); form(c); c.clip();
    c.strokeStyle = 'rgba(55,40,50,0.55)';
    c.lineWidth = 2;
    for (let reihe = 0, ry = oben; ry < y + 6; reihe++) {
      const rh = 13 + r() * 6;
      c.beginPath(); c.moveTo(links - 5, ry + rh); c.lineTo(links + b + 5, ry + rh + r() * 3 - 1.5); c.stroke();
      let sx = links + r() * 18;
      while (sx < links + b) {
        c.beginPath(); c.moveTo(sx, ry); c.lineTo(sx + r() * 4 - 2, ry + rh); c.stroke();
        c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(40,20,40,0.08)';
        c.fillRect(sx + 1, ry + 1, 20, rh - 2);
        sx += 18 + r() * 18;
      }
      ry += rh;
    }
    c.restore();
    // Nische
    shape(c, '#4a3a44', (p) => {
      p.moveTo(x - 10, y - 6);
      p.lineTo(x - 7, y - h * 0.68);
      p.lineTo(x + 7, y - h * 0.68);
      p.lineTo(x + 10, y - 6);
      p.closePath();
    }, 2.5);
  },

  strohhuette(c, x, y) {
    const b = 62;
    shape(c, '#b08d6b', (p) => p.rect(x - b / 2, y - 36, b, 42), 3);
    c.strokeStyle = 'rgba(70,45,40,0.4)';
    c.lineWidth = 1.5;
    for (let i = 1; i < 4; i++) {
      c.beginPath(); c.moveTo(x - b / 2, y - 36 + i * 11); c.lineTo(x + b / 2, y - 36 + i * 11 + 1); c.stroke();
    }
    shape(c, '#4a3a44', (p) => { p.moveTo(x - 8, y + 4); p.lineTo(x - 6, y - 24); p.lineTo(x + 6, y - 24); p.lineTo(x + 8, y + 4); p.closePath(); }, 2.5);
    const dach = (p) => {
      p.moveTo(x - b / 2 - 13, y - 30);
      p.quadraticCurveTo(x - 10, y - 64, x, y - 74);
      p.quadraticCurveTo(x + 10, y - 64, x + b / 2 + 13, y - 30);
      p.quadraticCurveTo(x, y - 37, x - b / 2 - 13, y - 30);
      p.closePath();
    };
    shape(c, '#d9a93f', dach, 3);
    c.save();
    c.beginPath(); dach(c); c.clip();
    c.strokeStyle = 'rgba(120,75,20,0.55)';
    c.lineWidth = 2;
    for (let i = -6; i <= 6; i++) {
      c.beginPath(); c.moveTo(x + i * 1.5, y - 76); c.lineTo(x + i * 8, y - 28); c.stroke();
    }
    c.restore();
  },

  steinmaennchen(c, x, y, r) {
    // Apacheta: Reisende legen Steine als Glücksbringer aufeinander.
    let py = y + 3;
    let breite = 21;
    const farben = ['#9c8c88', '#b0a097', '#8a7c80', '#a9968d', '#c0b0a2'];
    const anzahl = 4 + Math.floor(r() * 2);
    for (let i = 0; i < anzahl; i++) {
      const hoehe = breite * 0.55;
      const d = (r() - 0.5) * 5;
      shape(c, farben[i], (p) => p.ellipse(x + d, py - hoehe, breite, hoehe, (r() - 0.5) * 0.15, 0, 7), 2.5);
      py -= hoehe * 1.75;
      breite *= 0.79;
    }
    // Bunte Fähnchen
    c.strokeStyle = TINTE; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(x, py + 6); c.lineTo(x, py - 22); c.stroke();
    shape(c, '#ff5d4a', (p) => { p.moveTo(x, py - 22); p.lineTo(x + 18, py - 17); p.lineTo(x, py - 12); p.closePath(); }, 2);
  },
};

// Welche Dinge gibt es in welcher Welt? "wie oft" = je größer, desto häufiger.
// breite = so viel Platz braucht es; hang = so steil darf der Boden sein.
const HINDERNIS_LISTEN = {
  alpen: [
    { art: 'fichte', wieOft: 10, breite: 42, hang: 60 },
    { art: 'felsbrocken', wieOft: 4, breite: 56, hang: 60 },
    { art: 'almhuette', wieOft: 1.4, breite: 130, hang: 22, nurWiese: true },
    { art: 'kuh', wieOft: 1.4, breite: 76, hang: 16, nurWiese: true },
  ],
  anden: [
    { art: 'kaktus', wieOft: 8, breite: 52, hang: 60 },
    { art: 'queuenal', wieOft: 5, breite: 62, hang: 40, nurWiese: true },
    { art: 'felsbrocken', wieOft: 4, breite: 56, hang: 60 },
    { art: 'inkamauer', wieOft: 2, breite: 140, hang: 20 },
    { art: 'strohhuette', wieOft: 1.2, breite: 110, hang: 18, nurWiese: true },
    { art: 'steinmaennchen', wieOft: 2, breite: 50, hang: 26 },
  ],
};
