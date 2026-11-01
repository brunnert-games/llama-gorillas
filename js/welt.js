// Die Spielwelt: Himmel, Berge und alles, was darauf steht.
// Jede Welt wird bei jedem Spiel neu ausgewürfelt.

const SCHARF = 2;  // Berge werden doppelt so fein gemalt, wie die Kollision rechnet.

const BIOME = {
  anden: {
    name: 'Anden',
    fels: ['#c97b52', '#7a3f3a'],
    felsDunkel: '#5f2f33',
    gras: ['#c6ad45', '#9b9a3c'],
    grasFarbeBueschel: '#d8bd52',
    blumen: ['#ff5d8f', '#ffd23f', '#ff8c42'],
    felsbrocken: '#a9796a',
    schneeGrenze: 0.26,     // Oberhalb davon (Anteil der Höhe) liegt Schnee
    grasGrenze: 0.42,
    breiteBerge: 1.25,
    zackig: 0.55,
    terrassen: true,
    stimmungen: [
      { name: 'Goldene Stunde', himmel: ['#3f5fa8', '#f59e7a', '#ffd9a0'], sonne: ['#fff3c4', 0.76, 0.26, 52], ferne: ['#d98b8b', '#a65f77', '#7c4a6c'], wolke: '#fff0e0', tönung: 'rgba(255,150,70,0.10)' },
      { name: 'Hochland-Mittag', himmel: ['#1f6fc4', '#58b4e8', '#d4efee'], sonne: ['#fffbe0', 0.3, 0.17, 44], ferne: ['#a8c2d8', '#8a97b8', '#776f96'], wolke: '#ffffff', tönung: 'rgba(255,220,150,0.03)' },
      { name: 'Sonnenaufgang', himmel: ['#5a4b9a', '#e77fa0', '#ffc78f'], sonne: ['#fff0b0', 0.2, 0.3, 58], ferne: ['#c27aa4', '#945c92', '#6c477f'], wolke: '#ffe0e4', tönung: 'rgba(240,90,130,0.09)' },
    ],
  },
  alpen: {
    name: 'Alpen',
    fels: ['#8f99aa', '#4d5668'],
    felsDunkel: '#3c4356',
    gras: ['#74c850', '#3f9d4c'],
    grasFarbeBueschel: '#5bb749',
    blumen: ['#ffffff', '#5a6fe0', '#ffd23f', '#ff7ab8'],
    felsbrocken: '#979daa',
    schneeGrenze: 0.38,
    grasGrenze: 0.5,
    breiteBerge: 0.9,
    zackig: 1,
    terrassen: false,
    stimmungen: [
      { name: 'Klarer Tag', himmel: ['#2f86d8', '#7cc7f0', '#e4f6f8'], sonne: ['#fffbe0', 0.8, 0.18, 46], ferne: ['#b4cfe6', '#92b0d2', '#7393bb'], wolke: '#ffffff', tönung: 'rgba(255,255,255,0)' },
      { name: 'Alpenglühen', himmel: ['#40508f', '#f08f91', '#ffd2a8'], sonne: ['#fff0c0', 0.2, 0.3, 54], ferne: ['#eaa3b0', '#b47a9d', '#7f6393'], wolke: '#ffe4dc', tönung: 'rgba(255,110,90,0.09)' },
      { name: 'Morgenfrische', himmel: ['#5ca8d8', '#bfe2e8', '#fdf3d8'], sonne: ['#fff6c8', 0.68, 0.22, 48], ferne: ['#c5dde6', '#a2c0d4', '#809fbd'], wolke: '#ffffff', tönung: 'rgba(255,230,160,0.04)' },
    ],
  },
};

class Welt {
  constructor(biomName, saat = Math.floor(Math.random() * 1e9)) {
    this.biomName = biomName;
    this.biom = BIOME[biomName];
    this.saat = saat;
    this.rng = makeRng(saat);
    this.rausch = makeNoise(this.rng);
    this.stimmung = pick(this.biom.stimmungen, this.rng);
    this.kuehe = [];

    this.lx = 90 + this.rng() * 140;
    this.rx = W - 90 - this.rng() * 140;

    this.erzeugeHoehen();
    this.maleHintergrund();
    this.maleBerge();
    this.leseMaske();
    this.lageWolkenVogelAn();
    this.stapel = new Int32Array(W * H);
  }

  // ---------------- Wo ist der Boden? ----------------
  erzeugeHoehen() {
    const r = this.rng, b = this.biom, n = this.rausch;
    const yL = H * (0.52 + r() * 0.2);
    const yR = H * (0.52 + r() * 0.2);
    const tal = H * (0.76 + r() * 0.08);
    const von = this.lx + 170, bis = this.rx - 170;

    const gipfel = [];
    const anzahl = 1 + Math.floor(r() * 3);
    for (let i = 0; i < anzahl; i++) {
      gipfel.push({
        x: von + (bis - von) * ((i + 0.5) / anzahl + (r() - 0.5) * 0.25),
        y: H * (0.15 + r() * 0.25),
        bL: ((bis - von) / anzahl) * (0.65 + r() * 0.5) * b.breiteBerge,
        bR: ((bis - von) / anzahl) * (0.65 + r() * 0.5) * b.breiteBerge,
      });
    }
    this.gipfel = gipfel;

    // Randberge: Die Lamas stehen auf einem Felsvorsprung.
    const rand = [
      { x: -40, y: H * (0.25 + r() * 0.3), bL: 100, bR: this.lx + 20 },
      { x: W + 40, y: H * (0.25 + r() * 0.3), bL: W - this.rx + 20, bR: 100 },
    ];

    const form = (t) => (b.terrassen ? Math.pow(Math.cos((Math.min(t, 1) * Math.PI) / 2), 1.1) : Math.pow(1 - Math.min(t, 1), 1.2));

    const h = new Float32Array(W + 1);
    for (let x = 0; x <= W; x++) {
      let hoehe = 0;
      for (const g of [...gipfel, ...rand]) {
        const d = x - g.x;
        const t = Math.abs(d) / (d < 0 ? g.bL : g.bR);
        hoehe = Math.max(hoehe, (tal - g.y) * form(t));
      }
      let y = tal - hoehe;
      // Zacken: je höher, desto wilder.
      const anteil = clamp(hoehe / (tal - H * 0.2), 0, 1);
      y += n(x / 85, 4) * (10 + 42 * anteil) * b.zackig;
      y += Math.abs(n(x / 26 + 90, 3)) * 16 * anteil * b.zackig;

      // Inka-Terrassen an den unteren Hängen der Anden
      if (b.terrassen && y > H * 0.4 && y < tal - 8) {
        const stufe = 30;
        const gestuft = Math.round(y / stufe) * stufe;
        y = lerp(y, gestuft, 0.8);
      }

      // Flacher Standplatz für die Lamas
      const wL = 1 - smoothstep(62, 155, Math.abs(x - this.lx));
      const wR = 1 - smoothstep(62, 155, Math.abs(x - this.rx));
      y = lerp(y, yL, wL);
      y = lerp(y, yR, wR);
      h[x] = clamp(y, 45, H - 90);
    }
    this.hoehen = h;
    this.yL = yL;
    this.yR = yR;
  }

  // ---------------- Himmel und ferne Berge ----------------
  maleHintergrund() {
    const r = this.rng, st = this.stimmung;
    const skala = 1.5;
    this.hintergrund = makeCanvas(W * skala, H * skala);
    const c = this.hintergrund.getContext('2d');
    c.scale(skala, skala);

    const g = c.createLinearGradient(0, 0, 0, H * 0.8);
    g.addColorStop(0, st.himmel[0]);
    g.addColorStop(0.55, st.himmel[1]);
    g.addColorStop(1, st.himmel[2]);
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    // Sonne mit Glühen
    const [farbe, sx, sy, sr] = st.sonne;
    const sonneX = W * sx, sonneY = H * sy;
    const glut = c.createRadialGradient(sonneX, sonneY, sr * 0.6, sonneX, sonneY, sr * 5);
    glut.addColorStop(0, 'rgba(255,245,200,0.75)');
    glut.addColorStop(1, 'rgba(255,245,200,0)');
    c.fillStyle = glut;
    c.fillRect(0, 0, W, H);
    c.fillStyle = farbe;
    c.beginPath(); c.arc(sonneX, sonneY, sr, 0, Math.PI * 2); c.fill();

    // Vulkan in den Anden (qualmt später!)
    this.vulkan = null;
    if (this.biomName === 'anden') {
      const vx = W * (0.3 + r() * 0.4), vy = H * 0.26;
      this.vulkan = { x: vx, y: vy };
      c.fillStyle = st.ferne[0];
      c.beginPath();
      c.moveTo(vx - 260, H * 0.72);
      c.lineTo(vx - 22, vy);
      c.lineTo(vx + 22, vy);
      c.lineTo(vx + 260, H * 0.72);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.85)';
      c.beginPath();
      c.moveTo(vx - 22, vy);
      c.lineTo(vx + 22, vy);
      c.lineTo(vx + 62, vy + 78);
      c.lineTo(vx + 30, vy + 58);
      c.lineTo(vx + 8, vy + 86);
      c.lineTo(vx - 18, vy + 56);
      c.lineTo(vx - 62, vy + 80);
      c.closePath();
      c.fill();
    }

    // Drei Bergketten: je weiter weg, desto heller und blasser.
    const ebenen = [
      { basis: 0.5, hub: 0.2, farbe: st.ferne[0], welle: 150, schnee: true },
      { basis: 0.6, hub: 0.17, farbe: st.ferne[1], welle: 120, schnee: this.biomName === 'alpen' },
      { basis: 0.72, hub: 0.11, farbe: st.ferne[2], welle: 95, schnee: false },
    ];
    ebenen.forEach((e, i) => {
      if (i === 0 && this.vulkan) e.basis = 0.57;
      const ver = r() * 500;
      const yAn = (x) => {
        const zack = this.biomName === 'alpen' ? Math.abs(this.rausch(x / e.welle + ver, 4)) * 2.2 : (this.rausch(x / e.welle + ver, 3) + 1) * 0.8;
        return H * (e.basis - e.hub * zack);
      };
      c.beginPath();
      c.moveTo(0, H);
      for (let x = 0; x <= W; x += 4) c.lineTo(x, yAn(x));
      c.lineTo(W, H);
      c.closePath();
      c.fillStyle = e.farbe;
      c.fill();
      if (e.schnee) {
        c.save();
        c.clip();
        c.fillStyle = 'rgba(255,255,255,0.75)';
        c.beginPath();
        const linie = H * (e.basis - e.hub * 0.75);
        c.moveTo(0, 0);
        c.lineTo(W, 0);
        for (let x = W; x >= 0; x -= 14) c.lineTo(x, linie + (x % 28 ? 13 : -9));
        c.closePath();
        c.fill();
        c.restore();
      }
      // Dunst vor jeder Kette
      const dunst = c.createLinearGradient(0, H * (e.basis - 0.05), 0, H);
      dunst.addColorStop(0, 'rgba(255,255,255,0)');
      dunst.addColorStop(1, 'rgba(255,255,255,0.25)');
      c.fillStyle = dunst;
      c.fillRect(0, H * (e.basis - 0.05), W, H);
    });
  }

  // ---------------- Die festen Berge ----------------
  flaecheAbfahren(c) {
    const h = this.hoehen;
    c.moveTo(-2, h[0]);
    for (let x = 0; x <= W; x += 2) c.lineTo(x, h[x]);
    c.lineTo(W + 2, h[W]);
  }

  maleBerge() {
    this.gelaende = makeCanvas(W * SCHARF, H * SCHARF);
    const c = this.gelaende.getContext('2d');
    this.gctx = c;
    c.scale(SCHARF, SCHARF);
    const b = this.biom, r = this.rng, h = this.hoehen;

    const umriss = () => {
      c.beginPath();
      this.flaecheAbfahren(c);
      c.lineTo(W + 2, H + 5);
      c.lineTo(-2, H + 5);
      c.closePath();
    };

    umriss();
    const fels = c.createLinearGradient(0, H * 0.15, 0, H);
    fels.addColorStop(0, b.fels[0]);
    fels.addColorStop(1, b.fels[1]);
    c.fillStyle = fels;
    c.fill();

    c.save();
    umriss();
    c.clip();

    // Gesteinsschichten
    c.lineWidth = 2.5;
    for (let i = 0; i < 18; i++) {
      const y0 = H * (0.2 + (i / 18) * 0.85);
      const vers = r() * 300;
      c.strokeStyle = i % 2 ? 'rgba(255,255,255,0.08)' : 'rgba(30,15,40,0.1)';
      c.beginPath();
      for (let x = 0; x <= W; x += 16) {
        const y = y0 + this.rausch(x / 170 + vers, 2) * 34 + x * 0.015;
        x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.stroke();
    }
    // Facetten
    for (let i = 0; i < 90; i++) {
      const x = r() * W, y = H * (0.2 + r() * 0.8), s = 8 + r() * 26;
      const drehung = r() * Math.PI * 2, ecken = 5 + Math.floor(r() * 3);
      c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.045)' : 'rgba(30,15,40,0.06)';
      c.beginPath();
      for (let k = 0; k < ecken; k++) {
        const a = drehung + (k / ecken) * Math.PI * 2, q = s * (0.6 + r() * 0.6);
        c.lineTo(x + Math.cos(a) * q * 1.5, y + Math.sin(a) * q * 0.7);
      }
      c.closePath();
      c.fill();
    }

    // Schnee mit Zackenkante
    const schneeY = H * b.schneeGrenze;
    const zackenAn = (x) => {
      const p = x / 32;
      const dreieck = Math.abs((p % 1) * 2 - 1);
      return schneeY + dreieck * 30 + this.rausch(x / 60 + 500, 2) * 24 - 10;
    };
    c.fillStyle = '#f7fbff';
    let lauf = null;
    const schliesse = () => {
      if (!lauf) return;
      c.beginPath();
      lauf.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      for (let i = lauf.length - 1; i >= 0; i--) c.lineTo(lauf[i][0], zackenAn(lauf[i][0]));
      c.closePath();
      c.fill();
      lauf = null;
    };
    for (let x = 0; x <= W; x += 2) {
      if (h[x] < zackenAn(x)) {
        if (!lauf) lauf = [];
        lauf.push([x, h[x] - 3]);
      } else schliesse();
    }
    schliesse();

    // Grasdecke
    const grasY = H * b.grasGrenze;
    const dicke = (x) => {
      const hier = h[x];
      const q = smoothstep(grasY - 25, grasY + 70, hier);
      if (q <= 0) return 0;
      return q * (13 + (this.rausch(x / 42 + 200, 3) + 1) * 11 + Math.max(0, hier - grasY) * 0.28 + Math.sin(x / 7) * 2.5);
    };
    const gras = c.createLinearGradient(0, grasY - 30, 0, H);
    gras.addColorStop(0, b.gras[0]);
    gras.addColorStop(1, b.gras[1]);
    const grasPfad = (faktor) => {
      c.beginPath();
      c.moveTo(-2, h[0] - 3);
      for (let x = 0; x <= W; x += 2) c.lineTo(x, h[x] - (dicke(x) > 0 ? 3 : -3));
      for (let x = W; x >= 0; x -= 2) c.lineTo(x, h[x] + dicke(x) * faktor);
      c.closePath();
    };
    c.fillStyle = gras;
    grasPfad(1);
    c.fill();
    c.fillStyle = 'rgba(255,255,190,0.28)';
    grasPfad(0.28);
    c.fill();

    // Schatten auf der sonnenabgewandten Bergseite
    const sonneRechts = this.stimmung.sonne[1] > 0.5;
    const seite = sonneRechts ? -1 : 1;
    const sortiert = [...this.gipfel].sort((a, b2) => a.x - b2.x);
    sortiert.forEach((g, i) => {
      // Spitze finden
      let spitze = clamp(Math.round(g.x), 0, W);
      for (let x = Math.max(0, spitze - 70); x <= Math.min(W, spitze + 70); x++) if (h[x] < h[spitze]) spitze = x;
      const nachbar = sortiert[i + seite];
      let grenze = seite > 0 ? W : 0;
      if (nachbar) {
        let tief = spitze;
        const a = Math.min(spitze, Math.round(nachbar.x)), e = Math.max(spitze, Math.round(nachbar.x));
        for (let x = a; x <= e; x++) if (h[x] > h[tief]) tief = x;
        grenze = tief;
      }
      c.fillStyle = 'rgba(25,18,60,0.17)';
      c.beginPath();
      c.moveTo(spitze, h[spitze] - 2);
      let zx = spitze, zy = h[spitze];
      while (zy < H + 10) {
        zy += 26 + r() * 34;
        zx += seite * (r() * 34 - 8);
        c.lineTo(zx, zy);
      }
      c.lineTo(grenze, H + 10);
      c.lineTo(grenze, 0);
      c.lineTo(spitze, 0);
      c.closePath();
      c.fill();
    });

    // Sanfter Schatten unten
    const tiefe = c.createLinearGradient(0, H * 0.7, 0, H);
    tiefe.addColorStop(0, 'rgba(20,10,40,0)');
    tiefe.addColorStop(1, 'rgba(20,10,40,0.28)');
    c.fillStyle = tiefe;
    c.fillRect(0, H * 0.7, W, H * 0.3);

    c.restore();

    // Dicke Trickfilm-Kontur oben
    c.beginPath();
    this.flaecheAbfahren(c);
    c.strokeStyle = TINTE;
    c.lineWidth = 3.5;
    c.lineJoin = 'round';
    c.stroke();

    this.stelleHindernisseAuf(c);

    // Abendlicht legt sich über alles
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = this.stimmung.tönung;
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over';
  }

  stelleHindernisseAuf(c) {
    const r = this.rng, h = this.hoehen, b = this.biom;
    const liste = HINDERNIS_LISTEN[this.biomName];
    const summe = liste.reduce((s, a) => s + a.wieOft, 0);
    const belegt = [];
    const schneeY = H * b.schneeGrenze;
    const grasY = H * b.grasGrenze;
    const opt = (y) => ({
      schnee: y < H * (b.schneeGrenze + 0.13),
      felsFarbe: b.felsbrocken,
      grasFarbe: b.grasFarbeBueschel,
      blumen: b.blumen,
    });
    const frei = (x, breite) =>
      Math.abs(x - this.lx) > 94 + breite / 2 && Math.abs(x - this.rx) > 94 + breite / 2 &&
      x > 10 && x < W - 10 &&
      belegt.every((o) => Math.abs(o.x - x) > (o.breite + breite) / 2);

    // Etwas Besonderes auf dem höchsten Gipfel
    let spitze = 200;
    for (let x = this.lx + 130; x < this.rx - 130; x++) if (h[Math.round(x)] < h[spitze] || spitze === 200) spitze = Math.round(x);
    if (this.biomName === 'alpen') Hindernisse.gipfelkreuz(c, spitze, h[spitze] + 2);
    else Hindernisse.steinmaennchen(c, spitze, h[spitze] + 3, r);
    belegt.push({ x: spitze, breite: 50 });

    const ziel = 8 + Math.floor(r() * 6);
    const stehen = [];
    for (let versuch = 0; versuch < 220 && stehen.length < ziel; versuch++) {
      let wurf = r() * summe;
      const art = liste.find((a) => (wurf -= a.wieOft) <= 0) || liste[0];
      const x = Math.round(30 + r() * (W - 60));
      if (!frei(x, art.breite)) continue;
      const a = clamp(Math.round(x - art.breite / 2), 0, W), e = clamp(Math.round(x + art.breite / 2), 0, W);
      let oben = Infinity, unten = -Infinity;
      for (let i = a; i <= e; i += 3) { oben = Math.min(oben, h[i]); unten = Math.max(unten, h[i]); }
      if (unten - oben > art.hang) continue;
      if (art.nurWiese && unten < grasY) continue;
      if (h[x] < schneeY - 5 && art.art !== 'felsbrocken') continue;
      belegt.push({ x, breite: art.breite });
      stehen.push({ art, x, y: Math.max(h[x], unten - 8) + 3 });
    }
    // Von hinten nach vorne malen: oben zuerst
    stehen.sort((p, q) => p.y - q.y);
    for (const s of stehen) {
      Hindernisse[s.art.art](c, s.x, s.y, r, opt(s.y));
      if (s.art.art === 'kuh') this.kuehe.push({ x: s.x, y: s.y - 25 });
    }

    // Kleinkram: Grasbüschel und Blumen
    for (let i = 0; i < 40; i++) {
      const x = Math.round(10 + r() * (W - 20));
      if (Math.abs(x - this.lx) < 68 || Math.abs(x - this.rx) < 68) continue;
      if (h[x] < grasY - 10) continue;
      if (r() < 0.65) Hindernisse.grasbueschel(c, x, h[x] + 2, r, opt(h[x]));
      else Hindernisse.blume(c, x, h[x] + 2, r, opt(h[x]));
    }
  }

  // ---------------- Kollision ----------------
  leseMaske() {
    const daten = this.gctx.getImageData(0, 0, W * SCHARF, H * SCHARF).data;
    this.maske = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        this.maske[y * W + x] = daten[((y * SCHARF + 1) * W * SCHARF + x * SCHARF + 1) * 4 + 3] > 128 ? 1 : 0;
      }
    }
  }

  fest(x, y) {
    const xi = x | 0, yi = y | 0;
    if (x < 0 || xi >= W || y < 0) return false;
    if (yi >= H) return false;
    return this.maske[yi * W + xi] === 1;
  }

  // Spucke frisst ein Loch und hinterlässt grünen Schleim.
  krater(x, y, radius) {
    const c = this.gctx;
    c.save();
    c.globalCompositeOperation = 'destination-out';
    c.fillStyle = '#000'; // Muss deckend sein, sonst wird nichts gelöscht
    c.beginPath();
    c.arc(x, y, radius, 0, Math.PI * 2);
    c.fill();

    c.globalCompositeOperation = 'source-atop';
    c.strokeStyle = 'rgba(40,25,40,0.45)';
    c.lineWidth = 8;
    c.beginPath(); c.arc(x, y, radius + 2, 0, Math.PI * 2); c.stroke();
    c.fillStyle = EINSTELLUNGEN.spuckeFarbe;
    c.strokeStyle = EINSTELLUNGEN.spuckeFarbe;
    c.lineWidth = 6;
    c.beginPath(); c.arc(x, y, radius + 4, 0, Math.PI * 2); c.stroke();
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = radius + Math.random() * radius * 0.75;
      c.beginPath();
      c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 2 + Math.random() * 6, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    const r2 = radius * radius;
    for (let py = Math.max(0, Math.floor(y - radius)); py < Math.min(H, y + radius + 1); py++) {
      for (let px = Math.max(0, Math.floor(x - radius)); px < Math.min(W, x + radius + 1); px++) {
        if ((px - x) * (px - x) + (py - y) * (py - y) <= r2) this.maske[py * W + px] = 0;
      }
    }
    return this.loeseLoseTeile();
  }

  // Macht ohne Schleim Platz, zum Beispiel wenn ein Lama in einem engen Loch steckt.
  raeumeFrei(x, y, radius) {
    const c = this.gctx;
    c.save();
    c.globalCompositeOperation = 'destination-out';
    c.fillStyle = '#000';
    c.beginPath();
    c.arc(x, y, radius, 0, Math.PI * 2);
    c.fill();
    c.restore();
    const r2 = radius * radius;
    for (let py = Math.max(0, Math.floor(y - radius)); py < Math.min(H, y + radius + 1); py++) {
      for (let px = Math.max(0, Math.floor(x - radius)); px < Math.min(W, x + radius + 1); px++) {
        if ((px - x) * (px - x) + (py - y) * (py - y) <= r2) this.maske[py * W + px] = 0;
      }
    }
    return this.loeseLoseTeile();
  }

  // Was keine Verbindung mehr zum Boden hat, fällt herunter!
  // (Zum Beispiel ein Baum, dem die Spucke den Stamm weggeätzt hat.)
  loeseLoseTeile() {
    const m = this.maske, st = this.stapel;
    const besucht = new Uint8Array(W * H);
    let sp = 0;
    const fuelle = (sammeln) => {
      while (sp > 0) {
        const i = st[--sp];
        if (sammeln) sammeln.push(i);
        const x = i % W;
        if (x > 0 && m[i - 1] && !besucht[i - 1]) { besucht[i - 1] = 1; st[sp++] = i - 1; }
        if (x < W - 1 && m[i + 1] && !besucht[i + 1]) { besucht[i + 1] = 1; st[sp++] = i + 1; }
        if (i >= W && m[i - W] && !besucht[i - W]) { besucht[i - W] = 1; st[sp++] = i - W; }
        if (i < W * (H - 1) && m[i + W] && !besucht[i + W]) { besucht[i + W] = 1; st[sp++] = i + W; }
      }
    };
    for (let x = 0; x < W; x++) {
      const i = (H - 1) * W + x;
      if (m[i] && !besucht[i]) { besucht[i] = 1; st[sp++] = i; }
    }
    fuelle(null);

    const brocken = [];
    for (let i = 0; i < m.length; i++) {
      if (!m[i] || besucht[i]) continue;
      const teil = [];
      besucht[i] = 1;
      st[sp++] = i;
      fuelle(teil);
      const stueck = this.schneideAus(Int32Array.from(teil).sort());
      if (stueck) brocken.push(stueck);
    }
    return brocken;
  }

  schneideAus(zellen) {
    const c = this.gctx;
    let x0 = W, x1 = 0, y0 = H, y1 = 0;
    const streifen = [];
    let i = 0;
    while (i < zellen.length) {
      const start = zellen[i];
      const y = Math.floor(start / W), xa = start % W;
      let e = i;
      while (e + 1 < zellen.length && zellen[e + 1] === zellen[e] + 1 && Math.floor(zellen[e + 1] / W) === y) e++;
      const lang = e - i + 1;
      streifen.push([xa, y, lang]);
      x0 = Math.min(x0, xa); x1 = Math.max(x1, xa + lang);
      y0 = Math.min(y0, y); y1 = Math.max(y1, y + 1);
      i = e + 1;
    }
    for (let k = 0; k < zellen.length; k++) this.maske[zellen[k]] = 0;

    let bild = null;
    const rand = 2, bw = x1 - x0 + rand * 2, bh = y1 - y0 + rand * 2;
    if (zellen.length >= 40) {
      bild = makeCanvas(bw * SCHARF, bh * SCHARF);
      const b = bild.getContext('2d');
      b.scale(SCHARF, SCHARF);
      b.beginPath();
      for (const [sx, sy, l] of streifen) b.rect(sx - x0 + rand - 1, sy - y0 + rand - 1, l + 2, 3);
      b.clip();
      b.drawImage(this.gelaende, (x0 - rand) * SCHARF, (y0 - rand) * SCHARF, bw * SCHARF, bh * SCHARF, 0, 0, bw, bh);
    }
    // Aus dem Berg-Bild löschen (mit einem Pixel Rand, damit keine Spuren bleiben)
    c.save();
    for (const [sx, sy, l] of streifen) c.clearRect(sx - 1.5, sy - 1.5, l + 3, 4);
    c.restore();

    if (!bild) return null;
    return { bild, x: x0 - rand, y: y0 - rand, b: bw, h: bh, vx: (Math.random() - 0.5) * 30, vy: 0, dreh: 0, drehTempo: (Math.random() - 0.5) * 1.6, flaeche: zellen.length };
  }

  // ---------------- Lebendige Dinge im Hintergrund ----------------
  lageWolkenVogelAn() {
    const r = this.rng;
    this.wolken = [];
    const anzahl = 4 + Math.floor(r() * 3);
    for (let i = 0; i < anzahl; i++) {
      const hoehe = 26 + r() * 30;
      const teile = [];
      const n = 4 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) {
        teile.push([(k - (n - 1) / 2) * hoehe * 0.95, -r() * hoehe * 0.55, hoehe * (0.55 + r() * 0.45)]);
      }
      this.wolken.push({ x: r() * W, y: 40 + r() * 170, teile, tempo: 0.3 + r() * 0.6 });
    }
    this.voegel = [];
    const vogelZahl = this.biomName === 'anden' ? 1 + Math.floor(r() * 2) : 3 + Math.floor(r() * 3);
    const basisX = r() * W, basisY = 90 + r() * 90;
    for (let i = 0; i < vogelZahl; i++) {
      this.voegel.push({
        x: this.biomName === 'anden' ? r() * W : basisX + i * (24 + r() * 16),
        y: this.biomName === 'anden' ? 80 + r() * 130 : basisY + (i % 2) * 18,
        tempo: this.biomName === 'anden' ? 26 + r() * 16 : 50,
        spann: this.biomName === 'anden' ? 30 : 9,
        phase: r() * 6,
      });
    }
    this.flocken = [];
    for (let i = 0; i < 46; i++) {
      this.flocken.push({ x: r() * W, y: r() * H, tempo: 0.5 + r(), groesse: 1.3 + r() * 2.2, phase: r() * 6 });
    }
  }

  aktualisiere(dt, wind) {
    for (const w of this.wolken) {
      w.x += (wind * 0.25 + 3) * w.tempo * dt;
      if (w.x > W + 220) w.x = -220;
      if (w.x < -220) w.x = W + 220;
    }
    for (const v of this.voegel) {
      v.x += v.tempo * dt;
      if (v.x > W + 80) v.x = -80;
    }
    const schnee = this.biomName === 'alpen';
    for (const f of this.flocken) {
      f.x += (wind * 0.9 + Math.sin(f.phase) * 12) * dt * f.tempo;
      f.y += (schnee ? 30 : 6) * f.tempo * dt;
      f.phase += dt * 1.4;
      if (f.x > W + 10) f.x = -10;
      if (f.x < -10) f.x = W + 10;
      if (f.y > H) f.y = -5;
    }
  }

  maleHimmelLeben(c, zeit) {
    // Rauch aus dem Vulkan
    if (this.vulkan) {
      for (let i = 0; i < 8; i++) {
        const q = ((zeit * 0.08 + i / 8) % 1);
        c.fillStyle = `rgba(250,245,245,${0.42 * (1 - q)})`;
        c.beginPath();
        c.arc(this.vulkan.x + q * 90 + Math.sin(q * 8 + i) * 8, this.vulkan.y - q * 120, 7 + q * 24, 0, Math.PI * 2);
        c.fill();
      }
    }
    // Wolken
    const wolkenSchatten = mix(this.stimmung.wolke, '#8f9bd0', 0.4);
    for (const w of this.wolken) {
      // Erst der Schatten etwas tiefer, dann die helle Wolke darüber.
      for (const [farbe, tiefer] of [[wolkenSchatten, 7], [this.stimmung.wolke, 0]]) {
        c.fillStyle = farbe;
        c.beginPath();
        for (const [dx, dy, r] of w.teile) {
          c.moveTo(w.x + dx + r, w.y + dy + tiefer);
          c.arc(w.x + dx, w.y + dy + tiefer, r, 0, Math.PI * 2);
        }
        c.fill();
      }
    }
    // Vögel (in den Anden: große Kondore)
    c.strokeStyle = TINTE;
    c.lineCap = 'round';
    for (const v of this.voegel) {
      const schlag = Math.sin(zeit * (v.spann > 20 ? 1.5 : 7) + v.phase) * (v.spann > 20 ? 0.18 : 0.5);
      c.lineWidth = v.spann > 20 ? 5 : 2.5;
      c.beginPath();
      c.moveTo(v.x - v.spann, v.y - v.spann * (0.14 + schlag));
      c.quadraticCurveTo(v.x - v.spann * 0.4, v.y - v.spann * 0.12, v.x, v.y);
      c.quadraticCurveTo(v.x + v.spann * 0.4, v.y - v.spann * 0.12, v.x + v.spann, v.y - v.spann * (0.14 + schlag));
      c.stroke();
      if (v.spann > 20) {
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(v.x + 3, v.y - 1, 3, 0, Math.PI * 2); c.fill();
      }
    }
  }

  maleFlocken(c, zeit) {
    c.fillStyle = this.biomName === 'alpen' ? 'rgba(255,255,255,0.85)' : 'rgba(255,240,200,0.42)';
    for (const f of this.flocken) {
      c.beginPath();
      c.arc(f.x, f.y, f.groesse, 0, Math.PI * 2);
      c.fill();
    }
  }
}
