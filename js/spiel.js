// Das Herz des Spiels: Wer ist dran? Was fliegt gerade? Was wird gemalt?

const WINKEL_MIN = -20, WINKEL_MAX = 120;
const KRAFT_MIN = 5, KRAFT_MAX = 100;

const Spiel = {
  canvas: null, ctx: null,
  welt: null,
  lamas: [],
  phase: 'menue', // menue, runde, zielen, denken, ausholen, flug, warten, rundenEnde, ende
  pausiert: false,
  zeit: 0,
  timer: 0,
  dran: 0,
  wind: 0,
  punkte: [0, 0],
  rundenNummer: 0,
  optionen: null,
  schuss: null,
  spur: [],
  letzteSpur: [null, null],
  teilchen: [],
  brocken: [],
  blasen: [],
  wackeln: 0,
  blende: 0,
  rundenStarter: 0,
  computerPlan: null,
  schussNummer: 0,
  takt: 0,
  gehalten: {},
  tropfenUhr: 0,
  sicht: 2,

  // Wird von menue.js gesetzt: Bescheid sagen, wenn sich etwas ändert
  bei: { zugStart() {}, zugEnde() {}, punkte() {}, banner() {}, spielEnde() {}, werte() {} },

  start() {
    this.canvas = document.getElementById('spielfeld');
    this.ctx = this.canvas.getContext('2d');
    this.groesseAnpassen();
    let zuletzt = performance.now();
    const schleife = (jetzt) => {
      const dt = Math.min((jetzt - zuletzt) / 1000, 0.05);
      zuletzt = jetzt;
      if (!this.pausiert) this.aktualisiere(dt);
      this.male();
      requestAnimationFrame(schleife);
    };
    requestAnimationFrame(schleife);
  },

  groesseAnpassen() {
    const breite = this.canvas.getBoundingClientRect().width || W;
    const dpr = window.devicePixelRatio || 1;
    this.sicht = clamp((breite * dpr) / W, 1, 2);
    this.canvas.width = Math.round(W * this.sicht);
    this.canvas.height = Math.round(H * this.sicht);
  },

  neuesLama(index, x, y, blick, name, istComputer, farben) {
    return {
      index, x, y, blick, name, istComputer, farben,
      winkel: 45, kraft: 60, pose: 'still', ausholen: 0, rueckstoss: 0,
      schleim: false, vy: 0, faellt: false, draussen: false,
      phase: index * 2.3,
    };
  },

  platziereLamas(welt) {
    const o = this.optionen || {};
    const a = this.neuesLama(0, welt.lx, welt.yL, 1, o.namen ? o.namen[0] : '', false, LAMA_FARBEN[0]);
    const b = this.neuesLama(1, welt.rx, welt.yR, -1, o.namen ? o.namen[1] : '', o.modus === 'computer', LAMA_FARBEN[1]);
    return [a, b];
  },

  // Der Hintergrund im Hauptmenü
  zeigeMenuewelt(biomName) {
    this.phase = 'menue';
    this.optionen = null;
    this.welt = new Welt(biomName);
    this.wind = 12;
    this.lamas = this.platziereLamas(this.welt);
    this.schuss = null;
    this.teilchen = [];
    this.brocken = [];
    this.blasen = [];
    this.letzteSpur = [null, null];
  },

  // ---------- Ein neues Spiel ----------
  neuesSpiel(optionen) {
    this.optionen = optionen;
    this.punkte = [0, 0];
    this.rundenNummer = 0;
    this.rundenStarter = optionen.modus === 'computer' ? 0 : Math.floor(Math.random() * 2);
    this.pausiert = false;
    this.neueRunde();
    this.bei.punkte();
  },

  neueRunde() {
    this.rundenNummer++;
    this.teilchen = [];
    this.brocken = [];
    this.blasen = [];
    this.schuss = null;
    this.spur = [];
    this.letzteSpur = [null, null];
    this.schussNummer = 0;

    const o = this.optionen;
    const staerke = EINSTELLUNGEN.maxWind;
    // Jede neue Welt muss von beiden Seiten aus lösbar sein.
    let welt = null, lamas = null, wind = 0;
    for (let versuch = 0; versuch < 12; versuch++) {
      wind = o.wind ? Math.round((Math.random() * 2 - 1) * staerke) : 0;
      welt = new Welt(o.biom, o.saat ? o.saat + this.rundenNummer * 1000 + versuch : undefined);
      lamas = this.platziereLamas(welt);
      const hin = besterSchuss(welt, lamas, 0, 1, wind);
      const her = besterSchuss(welt, lamas, 1, 0, wind);
      if (hin && hin.trifft && her && her.trifft) break;
    }
    this.welt = welt;
    this.lamas = lamas;
    this.wind = wind;
    this.dran = this.rundenStarter;
    this.phase = 'runde';
    this.timer = 1.2;
    this.blende = 1;
    Sound.spiele('runde');
    this.bei.punkte();
    this.bei.banner(`${welt.biom.name}: Runde ${this.rundenNummer}`, 'runde');
    this.bei.zugEnde();
  },

  beginneZug() {
    const l = this.lamas[this.dran];
    this.schuss = null;
    // Steckt das Lama in einem engen Loch? Dann bekommt der Kopf erst mal Luft.
    const maul = maulPosition(l);
    this.neueBrocken(this.welt.raeumeFrei(maul.x, maul.y, 24));
    this.neueBrocken(this.welt.raeumeFrei(l.x + 26 * l.blick, l.y - 100, 34));
    if (l.istComputer) {
      this.phase = 'denken';
      const gegner = 1 - this.dran;
      const plan = Computer.ueberlege(this.welt, this.lamas, this.dran, gegner, this.wind, this.optionen.stufe, this.schussNummer);
      this.schussNummer++;
      this.computerPlan = { ...plan, startWinkel: l.winkel, startKraft: l.kraft };
      this.timer = 0;
      this.sage(l, pick(EINSTELLUNGEN.sprueche.computerDenkt), 1.3);
      this.bei.zugEnde();
    } else {
      this.phase = 'zielen';
      this.bei.zugStart(l);
      this.bei.werte(l);
    }
  },

  spucken() {
    if (this.phase !== 'zielen' && this.phase !== 'denken') return;
    this.phase = 'ausholen';
    this.timer = 0;
    this.bei.zugEnde();
  },

  // ---------- Zielen per Tastatur, Knopf oder Finger ----------
  aendere(wert, menge) {
    if (this.phase !== 'zielen') return;
    const l = this.lamas[this.dran];
    if (wert === 'winkel') l.winkel = clamp(l.winkel + menge, WINKEL_MIN, WINKEL_MAX);
    else l.kraft = clamp(l.kraft + menge, KRAFT_MIN, KRAFT_MAX);
    this.bei.werte(l);
  },

  setze(wert, zahl) {
    if (this.phase !== 'zielen') return;
    const l = this.lamas[this.dran];
    if (wert === 'winkel') l.winkel = clamp(zahl, WINKEL_MIN, WINKEL_MAX);
    else l.kraft = clamp(zahl, KRAFT_MIN, KRAFT_MAX);
    this.bei.werte(l);
  },

  halte(wert, richtung) {
    this.gehalten[wert] = { richtung, zeit: 0, rest: 0 };
    this.aendere(wert, richtung);
    if (this.phase === 'zielen') Sound.spiele('tick');
  },

  lasseLos(wert) { delete this.gehalten[wert]; },

  zieleMitFinger(px, py) {
    if (this.phase !== 'zielen') return;
    const r = this.canvas.getBoundingClientRect();
    const x = ((px - r.left) / r.width) * W, y = ((py - r.top) / r.height) * H;
    const l = this.lamas[this.dran];
    const m = maulPosition(l);
    const dx = (x - m.x) * l.blick, dy = m.y - y;
    let w = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (w > WINKEL_MAX || w < -100) w = WINKEL_MAX;
    else if (w < WINKEL_MIN) w = WINKEL_MIN;
    l.winkel = Math.round(w);
    l.kraft = clamp(Math.round(Math.hypot(dx, dy) / 3.4), KRAFT_MIN, KRAFT_MAX);
    this.bei.werte(l);
  },

  // ---------- Was in jedem Moment passiert ----------
  aktualisiere(dt) {
    this.zeit += dt;
    if (this.welt) this.welt.aktualisiere(dt, this.wind);
    this.aktualisiereLamas(dt);
    this.aktualisiereTeilchen(dt);
    this.aktualisiereBrocken(dt);
    this.blasen = this.blasen.filter((b) => (b.rest -= dt) > 0);
    this.wackeln = Math.max(0, this.wackeln - dt * 30);
    this.blende = Math.max(0, this.blende - dt * 2.5);

    for (const wert in this.gehalten) {
      const h = this.gehalten[wert];
      h.zeit += dt;
      if (h.zeit > 0.28) {
        h.rest += dt * 34;
        const ganze = Math.floor(h.rest);
        if (ganze > 0) {
          h.rest -= ganze;
          this.aendere(wert, ganze * h.richtung);
        }
      }
    }

    switch (this.phase) {
      case 'runde':
        this.timer -= dt;
        if (this.timer <= 0) this.beginneZug();
        break;
      case 'denken':
        this.computerZielt(dt);
        break;
      case 'ausholen':
        this.schrittAusholen(dt);
        break;
      case 'flug':
        this.schrittFlug(dt);
        break;
      case 'warten':
        this.timer -= dt;
        if (this.timer <= 0 && !this.lamas.some((l) => l.faellt) && this.brocken.length === 0) {
          this.dran = 1 - this.dran;
          this.beginneZug();
        }
        break;
      case 'rundenEnde':
        this.timer -= dt;
        if (this.timer <= 0) {
          const siege = this.punkte.findIndex((p) => p >= this.optionen.siege);
          if (siege >= 0) this.beendeSpiel(siege);
          else this.neueRunde();
        }
        break;
      case 'ende':
        if (Math.random() < dt * 50) this.konfetti(Math.random() * W, -10);
        break;
    }
  },

  computerZielt(dt) {
    const l = this.lamas[this.dran], p = this.computerPlan;
    this.timer += dt;
    const q = smoothstep(0, 1.2, this.timer);
    l.winkel = lerp(p.startWinkel, p.winkel, q);
    l.kraft = lerp(p.startKraft, p.kraft, q);
    if (this.timer > 1.35) {
      l.winkel = p.winkel;
      l.kraft = p.kraft;
      this.spucken();
    }
  },

  schrittAusholen(dt) {
    const l = this.lamas[this.dran];
    this.timer += dt;
    l.ausholen = clamp(this.timer / 0.34, 0, 1);
    if (this.timer >= 0.34) {
      l.ausholen = 0;
      l.rueckstoss = 1;
      this.schuss = neuerSchuss(l, l.winkel, l.kraft);
      this.takt = 0;
      this.spur = [];
      this.tropfenUhr = 0;
      this.phase = 'flug';
      Sound.spiele('spucken');
      this.sage(l, pick(EINSTELLUNGEN.sprueche.spucken), 0.9);
      const m = maulPosition(l);
      for (let i = 0; i < 9; i++) {
        this.neuesTeilchen(m.x, m.y, this.schuss.vx * 0.3 + (Math.random() - 0.5) * 130, this.schuss.vy * 0.3 + (Math.random() - 0.5) * 130, 0.35, 2 + Math.random() * 3, EINSTELLUNGEN.spuckeFarbe, 500);
      }
    }
  },

  schrittFlug(dt) {
    const s = this.schuss;
    this.takt += dt;
    while (this.takt >= SCHUSS_TAKT) {
      this.takt -= SCHUSS_TAKT;
      schussSchritt(s, this.wind);
      this.tropfenUhr += SCHUSS_TAKT;
      if (this.tropfenUhr > 1 / 30) {
        this.tropfenUhr = 0;
        this.spur.push({ x: s.x, y: s.y });
        if (Math.random() < 0.5) {
          this.neuesTeilchen(s.x, s.y, s.vx * 0.05 + (Math.random() - 0.5) * 30, s.vy * 0.05 + (Math.random() - 0.5) * 30, 0.4, 1.3 + Math.random() * 2, EINSTELLUNGEN.spuckeFarbe, 300);
        }
      }
      const ergebnis = schussErgebnis(s, this.welt, this.lamas, this.dran);
      if (ergebnis) {
        this.schussEnde(ergebnis);
        return;
      }
    }
  },

  schussEnde(ergebnis) {
    const s = this.schuss;
    const schuetze = this.dran, gegner = 1 - schuetze;
    this.letzteSpur[schuetze] = this.spur;
    this.schuss = null;
    const spr = EINSTELLUNGEN.sprueche;

    if (ergebnis.art === 'weg') {
      this.sage(this.lamas[gegner], pick(spr.daneben), 1.3);
      this.phase = 'warten';
      this.timer = 0.7;
      return;
    }

    // Wer wurde getroffen – direkt oder von Spritzern?
    let getroffen = -1;
    const reich = EINSTELLUNGEN.spritzerReichweite;
    if (ergebnis.art === 'lama') getroffen = ergebnis.lama;
    else if (beruehrtLama(this.lamas[gegner], s.x, s.y, reich)) getroffen = gegner;
    else if (s.scharf && beruehrtLama(this.lamas[schuetze], s.x, s.y, reich)) getroffen = schuetze;

    const radius = EINSTELLUNGEN.kraterGroesse;
    this.platsch(s.x, s.y, getroffen >= 0 ? 44 : 26);

    // Einschlag im Berg? Krater! Direkt aufs Lama: Fell bleibt ganz, nur Spucke.
    if (ergebnis.art === 'berg') {
      this.neueBrocken(this.welt.krater(s.x, s.y, radius));
      Sound.spiele('platsch');
      this.wackeln = 6;
      this.pruefeKuh(s.x, s.y, radius);
    }

    if (getroffen >= 0) {
      this.treffer(getroffen, schuetze);
    } else {
      const nah = Math.hypot(s.x - this.lamas[gegner].x, s.y - this.lamas[gegner].y + 50);
      if (Math.random() < 0.8) this.sage(this.lamas[gegner], pick(nah < 130 ? spr.knapp : spr.daneben), 1.3);
      this.phase = 'warten';
      this.timer = 0.75;
    }
  },

  pruefeKuh(x, y, radius) {
    const kuh = this.welt.kuehe.find((k) => Math.hypot(k.x - x, k.y - y) < radius + 36);
    if (kuh) {
      this.welt.kuehe = this.welt.kuehe.filter((k) => k !== kuh);
      Sound.spiele('muh');
      this.blasen.push({ x: kuh.x, y: kuh.y - 50, text: EINSTELLUNGEN.sprueche.kuh, rest: 1.6, dauer: 1.6 });
    }
  },

  treffer(getroffen, schuetze) {
    const spr = EINSTELLUNGEN.sprueche;
    const opfer = this.lamas[getroffen];
    const selbst = getroffen === schuetze;
    const gewinner = 1 - getroffen;
    this.punkte[gewinner]++;
    opfer.pose = 'getroffen';
    opfer.schleim = true;
    this.lamas[gewinner].pose = 'jubel';
    this.sage(opfer, pick(selbst ? spr.selbst : spr.getroffen), 2);
    this.sage(this.lamas[gewinner], pick(spr.jubel), 2);
    Sound.spiele('treffer');
    this.wackeln = 14;
    this.bei.punkte();
    this.bei.banner(selbst ? `${opfer.name} hat sich selbst angespuckt!` : `Treffer für ${this.lamas[gewinner].name}!`, 'treffer');
    this.rundenStarter = getroffen; // Wer getroffen wurde, darf nächste Runde anfangen.
    this.phase = 'rundenEnde';
    this.timer = 2.9;
    const sieger = this.lamas[gewinner];
    for (let i = 0; i < 26; i++) this.konfetti(sieger.x + (Math.random() - 0.5) * 90, sieger.y - 150);
  },

  beendeSpiel(gewinner) {
    this.phase = 'ende';
    this.lamas[gewinner].pose = 'jubel';
    this.lamas[1 - gewinner].pose = 'getroffen';
    Sound.spiele('sieg');
    this.bei.spielEnde(this.lamas[gewinner]);
  },

  aktualisiereLamas(dt) {
    for (const l of this.lamas) {
      l.rueckstoss = Math.max(0, l.rueckstoss - dt * 3.5);
      if (l.draussen || !this.welt) continue;
      const boden = this.welt.fest(l.x, l.y + 1) || this.welt.fest(l.x - 14, l.y + 1) || this.welt.fest(l.x + 14, l.y + 1);
      if (!boden || l.vy < 0) {
        if (!l.faellt) {
          l.faellt = true;
          l.vorherPose = l.pose;
          l.pose = 'fallen';
        }
        l.vy += EINSTELLUNGEN.schwerkraft * 1.4 * dt;
        l.y += l.vy * dt;
        if (l.y > H + 80) this.lamaDraussen(l);
      } else if (l.faellt) {
        l.faellt = false;
        while (this.welt.fest(l.x, l.y) && l.y > 0) l.y -= 1;
        l.pose = l.vorherPose === 'fallen' ? 'still' : l.vorherPose;
        if (l.vy > 200) {
          Sound.spiele('rumms');
          this.wackeln = Math.max(this.wackeln, 7);
          for (let i = 0; i < 12; i++) this.neuesTeilchen(l.x, l.y, (Math.random() - 0.5) * 190, -Math.random() * 110, 0.5, 2 + Math.random() * 3, '#cdb79e', 400);
        }
        l.vy = 0;
      }
    }
  },

  // Runtergepurzelt: zählt wie getroffen werden.
  lamaDraussen(l) {
    l.draussen = true;
    l.faellt = false;
    if (this.phase === 'rundenEnde' || this.phase === 'ende') return;
    const gewinner = 1 - l.index;
    this.punkte[gewinner]++;
    this.lamas[gewinner].pose = 'jubel';
    this.sage(this.lamas[gewinner], pick(EINSTELLUNGEN.sprueche.jubel), 2);
    Sound.spiele('treffer');
    this.bei.punkte();
    this.bei.banner(`${l.name} ist ins Tal gepurzelt!`, 'treffer');
    this.rundenStarter = l.index;
    this.schuss = null;
    this.phase = 'rundenEnde';
    this.timer = 2.9;
  },

  sage(l, text, dauer) {
    this.blasen = this.blasen.filter((b) => b.lama !== l);
    this.blasen.push({ lama: l, text, rest: dauer, dauer });
  },

  // ---------- Teilchen ----------
  neuesTeilchen(x, y, vx, vy, leben, groesse, farbe, schwere = 400, form = 'kreis') {
    if (this.teilchen.length > 500) return;
    this.teilchen.push({ x, y, vx, vy, leben, max: leben, groesse, farbe, schwere, form, dreh: Math.random() * 6 });
  },

  aktualisiereTeilchen(dt) {
    for (const t of this.teilchen) {
      t.vy += t.schwere * dt;
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.leben -= dt;
      t.dreh += dt * 6;
    }
    this.teilchen = this.teilchen.filter((t) => t.leben > 0);
  },

  platsch(x, y, anzahl) {
    const farbe = EINSTELLUNGEN.spuckeFarbe;
    for (let i = 0; i < anzahl; i++) {
      const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 280;
      this.neuesTeilchen(x, y, Math.cos(a) * v, Math.sin(a) * v - 90, 0.45 + Math.random() * 0.45, 2 + Math.random() * 5, i % 5 ? farbe : '#e8ffd0', 620);
    }
    const fels = this.welt.biom.fels[0];
    for (let i = 0; i < anzahl / 2; i++) {
      const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 200;
      this.neuesTeilchen(x, y, Math.cos(a) * v, Math.sin(a) * v - 120, 0.5 + Math.random() * 0.4, 2 + Math.random() * 4, fels, 700, 'eckig');
    }
  },

  konfetti(x, y) {
    const farben = ['#ff5d4a', '#ffd23f', '#3a86ff', '#9be564', '#ff7ab8', '#ffffff'];
    this.neuesTeilchen(x, y, (Math.random() - 0.5) * 240, Math.random() * 60, 2.4, 3 + Math.random() * 4, pick(farben), 120, 'eckig');
  },

  neueBrocken(liste) {
    for (const b of liste) this.brocken.push(b);
  },

  aktualisiereBrocken(dt) {
    const bleiben = [];
    for (const b of this.brocken) {
      b.vy += EINSTELLUNGEN.schwerkraft * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.dreh += b.drehTempo * dt;
      const unten = b.y + b.h, mitte = b.x + b.b / 2;
      if (unten > H + 40 || (this.welt && this.welt.fest(mitte, unten))) {
        const n = clamp(Math.floor(b.flaeche / 90), 6, 40);
        const biom = this.welt.biom;
        for (let i = 0; i < n; i++) {
          this.neuesTeilchen(b.x + Math.random() * b.b, b.y + Math.random() * b.h, (Math.random() - 0.5) * 220, -Math.random() * 190, 0.5 + Math.random() * 0.4, 2 + Math.random() * 4, pick([biom.fels[0], biom.gras[0], biom.felsDunkel, '#6b4a33']), 620, 'eckig');
        }
        Sound.spiele('rumms');
        this.wackeln = Math.max(this.wackeln, 4);
      } else bleiben.push(b);
    }
    this.brocken = bleiben;
  },

  // ---------- Malen ----------
  male() {
    const c = this.ctx;
    c.setTransform(this.sicht, 0, 0, this.sicht, 0, 0);
    if (!this.welt) {
      c.fillStyle = '#1d1633';
      c.fillRect(0, 0, W, H);
      return;
    }
    const welt = this.welt;
    if (this.wackeln > 0) {
      c.translate((Math.random() - 0.5) * this.wackeln, (Math.random() - 0.5) * this.wackeln);
    }
    c.drawImage(welt.hintergrund, -8, -8, W + 16, H + 16);
    welt.maleHimmelLeben(c, this.zeit);
    c.drawImage(welt.gelaende, 0, 0, W, H);

    if (this.phase === 'zielen') this.maleLetzteSpur(c);
    this.maleBrocken(c);

    for (const l of this.lamas) if (!l.draussen) zeichneLama(c, l, this.zeit, welt.biomName);

    if (this.phase === 'zielen') this.maleZielhilfe(c);
    if (['zielen', 'denken', 'ausholen'].includes(this.phase)) this.maleZeiger(c);

    this.maleTeilchen(c);
    if (this.schuss) this.maleSpucke(c);
    welt.maleFlocken(c, this.zeit);
    this.maleBlasen(c);

    if (this.optionen && this.optionen.wind) this.maleWind(c);

    if (this.blende > 0) {
      c.fillStyle = `rgba(29,22,51,${Math.min(1, this.blende)})`;
      c.fillRect(-10, -10, W + 20, H + 20);
    }
  },

  maleLetzteSpur(c) {
    const spur = this.letzteSpur[this.dran];
    if (!spur) return;
    c.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < spur.length; i += 2) {
      c.beginPath();
      c.arc(spur[i].x, spur[i].y, 2.2, 0, Math.PI * 2);
      c.fill();
    }
  },

  maleZielhilfe(c) {
    const l = this.lamas[this.dran];
    const s = neuerSchuss(l, l.winkel, l.kraft);
    const punkte = [];
    for (let i = 0; i < 96; i++) {
      s.vy += EINSTELLUNGEN.schwerkraft * SCHUSS_TAKT;
      s.x += s.vx * SCHUSS_TAKT;
      s.y += s.vy * SCHUSS_TAKT;
      if (i % 12 === 0) punkte.push([s.x, s.y]);
    }
    punkte.forEach(([x, y], i) => {
      const q = (i + 1) / punkte.length;
      c.fillStyle = TINTE;
      c.beginPath(); c.arc(x, y, 3.6 + q * 2.8 + 2, 0, Math.PI * 2); c.fill();
      c.fillStyle = i === punkte.length - 1 ? '#ffd23f' : '#ffffff';
      c.beginPath(); c.arc(x, y, 3.6 + q * 2.8, 0, Math.PI * 2); c.fill();
    });
  },

  maleZeiger(c) {
    const l = this.lamas[this.dran];
    const y = l.y - 142 + Math.sin(this.zeit * 5) * 6;
    const farbe = l.farben.poncho;
    shape(c, farbe, (p) => {
      p.moveTo(l.x - 14, y - 18);
      p.lineTo(l.x + 14, y - 18);
      p.lineTo(l.x, y);
      p.closePath();
    }, 3.5);
  },

  maleBrocken(c) {
    for (const b of this.brocken) {
      c.save();
      c.translate(b.x + b.b / 2, b.y + b.h / 2);
      c.rotate(b.dreh);
      c.drawImage(b.bild, -b.b / 2, -b.h / 2, b.b, b.h);
      c.restore();
    }
  },

  maleTeilchen(c) {
    for (const t of this.teilchen) {
      c.globalAlpha = clamp(t.leben / (t.max * 0.4), 0, 1);
      c.fillStyle = t.farbe;
      if (t.form === 'eckig') {
        c.save();
        c.translate(t.x, t.y);
        c.rotate(t.dreh);
        c.fillRect(-t.groesse, -t.groesse * 0.7, t.groesse * 2, t.groesse * 1.4);
        c.restore();
      } else {
        c.beginPath();
        c.arc(t.x, t.y, t.groesse, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.globalAlpha = 1;
  },

  maleSpucke(c) {
    const s = this.schuss;
    const farbe = EINSTELLUNGEN.spuckeFarbe;
    const dreh = Math.atan2(s.vy, s.vx);
    const dehnen = 1 + Math.hypot(s.vx, s.vy) / 1400;
    if (s.y > -8) {
      c.save();
      c.translate(s.x, s.y);
      c.rotate(dreh);
      shape(c, farbe, (p) => {
        p.moveTo(10 * dehnen, 0);
        p.bezierCurveTo(8 * dehnen, -8, -3, -8, -15 * dehnen, 0);
        p.bezierCurveTo(-3, 8, 8 * dehnen, 8, 10 * dehnen, 0);
        p.closePath();
      }, 3);
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.beginPath(); c.ellipse(3, -3, 3.5, 1.8, 0, 0, Math.PI * 2); c.fill();
      c.restore();
    } else {
      // Spucke ist über dem Bildschirm: kleiner Pfeil zeigt, wo sie gerade ist.
      const x = clamp(s.x, 18, W - 18);
      shape(c, farbe, (p) => {
        p.moveTo(x, 6);
        p.lineTo(x - 11, 24);
        p.lineTo(x + 11, 24);
        p.closePath();
      }, 3);
    }
  },

  maleBlasen(c) {
    for (const b of this.blasen) {
      const x0 = b.lama ? b.lama.x : b.x;
      const y0 = b.lama ? b.lama.y - 130 : b.y;
      const sicht = Math.min(1, (b.dauer - b.rest) * 8, b.rest * 5);
      c.save();
      c.font = 'bold 20px ui-rounded, "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
      const breite = c.measureText(b.text).width + 26;
      const bx = clamp(x0 - breite / 2, 8, W - breite - 8);
      const by = clamp(y0 - 50, 8, H);
      c.translate(bx + breite / 2, by + 20);
      c.scale(sicht, sicht);
      c.translate(-breite / 2, -20);
      shape(c, '#ffffff', (p) => {
        roundRectPath(p, 0, 0, breite, 38, 14);
        const sp = clamp(x0 - bx, 14, breite - 14);
        p.moveTo(sp - 8, 38);
        p.lineTo(sp, 50);
        p.lineTo(sp + 8, 38);
      }, 3);
      c.fillStyle = TINTE;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(b.text, breite / 2, 20);
      c.restore();
    }
  },

  maleWind(c) {
    const x = W / 2, y = 42, st = Math.abs(this.wind) / EINSTELLUNGEN.maxWind;
    c.save();
    c.fillStyle = 'rgba(255,255,255,0.88)';
    c.strokeStyle = TINTE;
    c.lineWidth = 3;
    c.beginPath();
    roundRectPath(c, x - 94, y - 25, 188, 50, 25);
    c.fill();
    c.stroke();
    c.fillStyle = TINTE;
    c.font = 'bold 15px ui-rounded, "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('Wind', x, y - 11);
    if (Math.abs(this.wind) < 4) {
      c.font = 'bold 14px ui-rounded, "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
      c.fillText('kein Wind', x, y + 9);
    } else {
      const seite = Math.sign(this.wind);
      const lang = 22 + st * 56;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.strokeStyle = st > 0.66 ? '#e63946' : st > 0.33 ? '#f4930d' : '#2a9d8f';
      c.lineWidth = 5;
      const a = x - seite * lang / 2, e = x + seite * lang / 2;
      c.beginPath();
      c.moveTo(a, y + 9);
      c.lineTo(e, y + 9);
      c.moveTo(e - seite * 9, y + 2);
      c.lineTo(e, y + 9);
      c.lineTo(e - seite * 9, y + 16);
      c.stroke();
    }
    c.restore();
  },
};

window.Spiel = Spiel;
