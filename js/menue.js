// Verbindet die Knöpfe auf dem Bildschirm mit dem Spiel.

(function () {
  const $ = (id) => document.getElementById(id);
  const wahl = { modus: 'computer', stufe: 'leicht', biom: 'anden', siege: 3, wind: true };

  // ---------- Bühne passend zum Fenster ----------
  function passeBuehneAn() {
    const buehne = $('buehne');
    const breite = Math.min(window.innerWidth, (window.innerHeight * W) / H);
    buehne.style.width = breite + 'px';
    buehne.style.height = (breite * H) / W + 'px';
    buehne.style.setProperty('--u', breite / W + 'px');
    Spiel.groesseAnpassen();
  }
  window.addEventListener('resize', passeBuehneAn);

  // ---------- Auswahl im Menü ----------
  function waehleAus(gruppe, wert) {
    document.querySelectorAll(`[data-gruppe="${gruppe}"]`).forEach((k) => {
      const aktiv = k.dataset.wert === String(wert);
      k.classList.toggle('aktiv', aktiv);
      k.setAttribute('aria-pressed', aktiv);
    });
  }

  function zeigeModus() {
    $('stufen').classList.toggle('versteckt', wahl.modus !== 'computer');
    $('name2-feld').classList.toggle('versteckt', wahl.modus === 'computer');
  }

  document.querySelectorAll('[data-gruppe]').forEach((knopf) => {
    knopf.addEventListener('click', () => {
      Sound.aufwecken();
      Sound.spiele('klick');
      const gruppe = knopf.dataset.gruppe;
      let wert = knopf.dataset.wert;
      if (gruppe === 'siege') wert = Number(wert);
      if (gruppe === 'wind') wert = wert === 'an';
      const alt = wahl[gruppe];
      wahl[gruppe] = wert;
      waehleAus(gruppe, knopf.dataset.wert);
      zeigeModus();
      if (gruppe === 'biom' && alt !== wert) Spiel.zeigeMenuewelt(wert);
    });
  });

  // Vorschaubilder der Welten: echte, kleine Welten!
  function maleVorschau() {
    for (const biom of Object.keys(BIOME)) {
      const canvas = $('vorschau-' + biom);
      const welt = new Welt(biom);
      const c = canvas.getContext('2d');
      c.drawImage(welt.hintergrund, 0, 0, canvas.width, canvas.height);
      c.drawImage(welt.gelaende, 0, 0, canvas.width, canvas.height);
    }
  }

  // ---------- Spiel starten ----------
  function starteSpiel() {
    Sound.aufwecken();
    Sound.spiele('klick');
    const name1 = $('name1').value.trim() || EINSTELLUNGEN.spieler1;
    const name2 = wahl.modus === 'computer'
      ? EINSTELLUNGEN.computerNamen[wahl.stufe]
      : $('name2').value.trim() || EINSTELLUNGEN.spieler2;
    $('menue').classList.add('versteckt');
    $('hud').classList.remove('versteckt');
    $('ende').classList.add('versteckt');
    Spiel.neuesSpiel({ ...wahl, namen: [name1, name2] });
    aktualisiereTafel();
  }
  $('start').addEventListener('click', starteSpiel);

  function zurueckInsMenue() {
    Sound.spiele('klick');
    $('pause').classList.add('versteckt');
    $('ende').classList.add('versteckt');
    $('hud').classList.add('versteckt');
    $('steuerung').classList.add('versteckt');
    $('menue').classList.remove('versteckt');
    Spiel.pausiert = false;
    Spiel.zeigeMenuewelt(wahl.biom);
  }

  // ---------- Punktetafel ----------
  function aktualisiereTafel() {
    if (!Spiel.optionen) return;
    Spiel.lamas.forEach((l, i) => {
      $(`name-${i}`).textContent = l.name;
      zeichneLamaBild($(`bild-${i}`), l.farben, Spiel.optionen.biom, l.istComputer);
      const tropfen = $(`punkte-${i}`);
      while (tropfen.children.length > Spiel.optionen.siege) tropfen.lastChild.remove();
      while (tropfen.children.length < Spiel.optionen.siege) {
        const t = document.createElement('span');
        t.className = 'punkt';
        tropfen.appendChild(t);
      }
      [...tropfen.children].forEach((t, k) => t.classList.toggle('voll', k < Spiel.punkte[i]));
    });
  }

  // ---------- Zielen ----------
  const winkelRegler = $('winkel'), kraftRegler = $('kraft');
  winkelRegler.addEventListener('input', () => Spiel.setze('winkel', Number(winkelRegler.value)));
  kraftRegler.addEventListener('input', () => Spiel.setze('kraft', Number(kraftRegler.value)));

  document.querySelectorAll('[data-aendere]').forEach((k) => {
    const wert = k.dataset.aendere, richtung = Number(k.dataset.richtung);
    k.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      Sound.aufwecken();
      Spiel.halte(wert, richtung);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) =>
      k.addEventListener(ev, () => Spiel.lasseLos(wert))
    );
  });

  $('spuck-knopf').addEventListener('click', () => Spiel.spucken());

  // Direkt ins Bild tippen und ziehen
  let zieht = false;
  const feld = $('spielfeld');
  feld.addEventListener('pointerdown', (e) => {
    if (Spiel.phase !== 'zielen') return;
    Sound.aufwecken();
    zieht = true;
    feld.setPointerCapture(e.pointerId);
    Spiel.zieleMitFinger(e.clientX, e.clientY);
  });
  feld.addEventListener('pointermove', (e) => {
    if (zieht) Spiel.zieleMitFinger(e.clientX, e.clientY);
  });
  ['pointerup', 'pointercancel'].forEach((ev) => feld.addEventListener(ev, () => (zieht = false)));

  // Tastatur
  const tasten = {
    ArrowUp: ['winkel', 1], ArrowDown: ['winkel', -1],
    ArrowRight: ['kraft', 1], ArrowLeft: ['kraft', -1],
  };
  window.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'text') return;
    if (tasten[e.key]) {
      e.preventDefault();
      if (!e.repeat) Spiel.halte(tasten[e.key][0], tasten[e.key][1]);
    } else if (e.key === ' ' || e.key === 'Enter') {
      if (Spiel.phase === 'zielen' && !Spiel.pausiert) {
        e.preventDefault();
        Spiel.spucken();
      }
    } else if (e.key === 'Escape' && !$('hud').classList.contains('versteckt') && Spiel.phase !== 'ende') {
      schaltePause();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (tasten[e.key]) Spiel.lasseLos(tasten[e.key][0]);
  });

  // ---------- Pause und Ton ----------
  function schaltePause() {
    Sound.spiele('klick');
    Spiel.pausiert = !Spiel.pausiert;
    $('pause').classList.toggle('versteckt', !Spiel.pausiert);
  }
  $('pause-knopf').addEventListener('click', schaltePause);
  $('weiter').addEventListener('click', schaltePause);
  $('pause-menue').addEventListener('click', zurueckInsMenue);
  $('ton-knopf').addEventListener('click', () => {
    Sound.aufwecken();
    Sound.an = !Sound.an;
    $('ton-knopf').textContent = Sound.an ? '🔊' : '🔇';
    Sound.spiele('klick');
  });

  $('nochmal').addEventListener('click', starteSpiel);
  $('ende-menue').addEventListener('click', zurueckInsMenue);

  // ---------- Das Spiel meldet sich ----------
  Spiel.bei.zugStart = (l) => {
    const st = $('steuerung');
    st.classList.remove('versteckt');
    st.style.setProperty('--spielerfarbe', l.farben.poncho);
    $('wer-dran').textContent = l.name;
    $(`tafel-0`).classList.toggle('dran', l.index === 0);
    $(`tafel-1`).classList.toggle('dran', l.index === 1);
  };
  Spiel.bei.zugEnde = () => {
    $('steuerung').classList.add('versteckt');
    if (Spiel.phase === 'denken') {
      $(`tafel-${Spiel.dran}`).classList.add('dran');
      $(`tafel-${1 - Spiel.dran}`).classList.remove('dran');
    }
  };
  Spiel.bei.werte = (l) => {
    winkelRegler.value = l.winkel;
    kraftRegler.value = l.kraft;
    $('winkel-zahl').textContent = Math.round(l.winkel) + '°';
    $('kraft-zahl').textContent = Math.round(l.kraft);
  };
  Spiel.bei.punkte = aktualisiereTafel;

  let bannerUhr = null;
  Spiel.bei.banner = (text, art) => {
    const b = $('banner');
    b.textContent = text;
    b.className = art;
    void b.offsetWidth; // Animation neu starten
    b.classList.add('zeigen');
    clearTimeout(bannerUhr);
    bannerUhr = setTimeout(() => b.classList.remove('zeigen'), art === 'runde' ? 1100 : 2500);
  };
  Spiel.bei.spielEnde = (sieger) => {
    $('sieger').textContent = `${sieger.name} gewinnt!`;
    $('stand').textContent = `${Spiel.lamas[0].name} ${Spiel.punkte[0]} : ${Spiel.punkte[1]} ${Spiel.lamas[1].name}`;
    zeichneLamaBild($('sieger-bild'), sieger.farben, Spiel.optionen.biom, sieger.istComputer);
    $('ende').classList.remove('versteckt');
  };

  // ---------- Los geht's ----------
  Spiel.start();
  passeBuehneAn();
  Spiel.zeigeMenuewelt(wahl.biom);
  maleVorschau();
  waehleAus('modus', wahl.modus);
  waehleAus('stufe', wahl.stufe);
  waehleAus('biom', wahl.biom);
  waehleAus('siege', wahl.siege);
  waehleAus('wind', wahl.wind ? 'an' : 'aus');
  zeigeModus();
  $('name1').placeholder = EINSTELLUNGEN.spieler1;
  $('name2').placeholder = EINSTELLUNGEN.spieler2;
})();
