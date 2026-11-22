// Physik der Spucke und das Gehirn des Computer-Lamas.

const SCHUSS_TAKT = 1 / 240; // So oft pro Sekunde wird die Flugbahn berechnet

function schussTempo(blick, winkel, kraft) {
  const a = (winkel * Math.PI) / 180;
  const v = (kraft / 100) * EINSTELLUNGEN.maxSpuckTempo;
  return { vx: Math.cos(a) * v * blick, vy: -Math.sin(a) * v };
}

function maulPosition(l) {
  return { x: l.x + l.blick * 52, y: l.y - 84 };
}

// Das Lama besteht beim Treffen aus Körper und Kopf (zwei Kreise).
function lamaTeile(l) {
  return [
    { x: l.x - 2 * l.blick, y: l.y - 38, r: 33 },
    { x: l.x + 30 * l.blick, y: l.y - 86, r: 22 },
  ];
}

function beruehrtLama(l, x, y, extra) {
  for (const t of lamaTeile(l)) {
    const dx = x - t.x, dy = y - t.y, r = t.r + extra;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

function schussSchritt(s, wind) {
  s.vx += wind * SCHUSS_TAKT;
  s.vy += EINSTELLUNGEN.schwerkraft * SCHUSS_TAKT;
  s.x += s.vx * SCHUSS_TAKT;
  s.y += s.vy * SCHUSS_TAKT;
  s.zeit += SCHUSS_TAKT;
}

// Prüft, ob die Spucke irgendwo angekommen ist. Gibt null zurück, wenn sie weiterfliegt.
function schussErgebnis(s, welt, lamas, schuetze) {
  const spucker = lamas[schuetze];
  if (!s.scharf && !beruehrtLama(spucker, s.x, s.y, 8)) s.scharf = true;
  for (let i = 0; i < lamas.length; i++) {
    if (i === schuetze && !s.scharf) continue;
    if (beruehrtLama(lamas[i], s.x, s.y, 7)) return { art: 'lama', lama: i };
  }
  if (welt.fest(s.x, s.y)) return { art: 'berg' };
  if (s.x < -320 || s.x > W + 320 || s.y > H + 30 || s.zeit > 16) return { art: 'weg' };
  return null;
}

function neuerSchuss(l, winkel, kraft) {
  const m = maulPosition(l);
  const v = schussTempo(l.blick, winkel, kraft);
  return { x: m.x, y: m.y, vx: v.vx, vy: v.vy, zeit: 0, scharf: false };
}

// Probeschuss im Kopf: Wo würde die Spucke landen?
function probeSchuss(welt, lamas, schuetze, ziel, winkel, kraft, wind) {
  const s = neuerSchuss(lamas[schuetze], winkel, kraft);
  const zielLama = lamas[ziel];
  const zx = zielLama.x, zy = zielLama.y - 50;
  let naechste = Infinity;
  for (;;) {
    schussSchritt(s, wind);
    const dx = s.x - zx, dy = s.y - zy;
    const d = dx * dx + dy * dy;
    if (d < naechste) naechste = d;
    const e = schussErgebnis(s, welt, lamas, schuetze);
    if (e) {
      let trifftZiel = false, trifftSich = false;
      const spritzer = EINSTELLUNGEN.spritzerReichweite;
      if (e.art === 'lama') {
        trifftZiel = e.lama === ziel;
        trifftSich = e.lama === schuetze;
      } else if (e.art === 'berg') {
        trifftZiel = beruehrtLama(zielLama, s.x, s.y, spritzer);
        trifftSich = s.scharf && beruehrtLama(lamas[schuetze], s.x, s.y, spritzer);
      }
      return { trifftZiel, trifftSich, naechste: Math.sqrt(naechste), zeit: s.zeit };
    }
  }
}

// Probiert ganz viele Schüsse im Kopf aus und merkt sich den besten.
function besterSchuss(welt, lamas, schuetze, ziel, wind) {
  let bester = null, bestePunkte = -Infinity;
  for (let winkel = 12; winkel <= 88; winkel += 3) {
    for (let kraft = 16; kraft <= 100; kraft += 2) {
      const e = probeSchuss(welt, lamas, schuetze, ziel, winkel, kraft, wind);
      if (e.trifftSich) continue;
      const punkte = e.trifftZiel ? 2000 - e.naechste - Math.abs(winkel - 45) * 0.5 : -e.naechste;
      if (punkte > bestePunkte) {
        bestePunkte = punkte;
        bester = { winkel, kraft, trifft: e.trifftZiel };
      }
    }
  }
  return bester;
}

function glockenZufall() {
  return (Math.random() + Math.random() + Math.random() - 1.5) / 0.75;
}

const Computer = {
  // Überlegt sich den nächsten Schuss und baut dann – je nach Stufe – Fehler ein.
  ueberlege(welt, lamas, ich, gegner, wind, stufe, schussNummer) {
    const k = EINSTELLUNGEN.computer[stufe];
    const kenntWind = schussNummer >= k.windAbSchuss;
    const plan = besterSchuss(welt, lamas, ich, gegner, kenntWind ? wind : 0) || { winkel: 80, kraft: 80 };
    const faktor = Math.max(k.kleinsterFehler, Math.pow(k.lernen, schussNummer));
    return {
      winkel: clamp(Math.round(plan.winkel + glockenZufall() * k.winkelFehler * faktor), 8, 110),
      kraft: clamp(Math.round(plan.kraft + glockenZufall() * k.kraftFehler * faktor), 10, 100),
    };
  },
};
