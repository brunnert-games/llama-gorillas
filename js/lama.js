// Hier wird das Lama gezeichnet. Es schaut in dieser Datei immer nach rechts
// und steht mit den Füßen auf y = 0. Beim anderen Spieler wird es gespiegelt.
const LAMA_GROESSE = 0.85;

const LAMA_FARBEN = [
  { wolle: '#fff1d6', schatten: '#e8d2ab', schnauze: '#ffe3c4', poncho: '#ff5d4a', muster: '#ffd23f', muster2: '#2a9d8f' },
  { wolle: '#d9a066', schatten: '#b97f4a', schnauze: '#f0c79a', poncho: '#3a86ff', muster: '#ffffff', muster2: '#ff9f1c' },
];

// Mehrere Kreise werden zu einem wolligen Klumpen mit gemeinsamer Umrandung.
function wollKlumpen(ctx, kreise, farbe, rand = 3) {
  ctx.fillStyle = TINTE;
  for (const [x, y, r] of kreise) {
    ctx.beginPath();
    ctx.arc(x, y, r + rand, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = farbe;
  for (const [x, y, r] of kreise) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function lamaBein(ctx, x, oben, schwung, farbe, hufFarbe) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = TINTE;
  ctx.lineWidth = 15;
  ctx.beginPath(); ctx.moveTo(x, oben); ctx.lineTo(x + schwung, -5); ctx.stroke();
  ctx.strokeStyle = farbe;
  ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(x, oben); ctx.lineTo(x + schwung, -5); ctx.stroke();
  shape(ctx, hufFarbe, (c) => roundRectPath(c, x + schwung - 7, -9, 14, 9, 3), 2.5);
}

function lamaOhr(ctx, x, y, kipp, farbe, innen) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(kipp);
  shape(ctx, farbe, (c) => {
    c.moveTo(-5, 3);
    c.quadraticCurveTo(-9, -12, -1, -24);
    c.quadraticCurveTo(8, -12, 5, 3);
    c.closePath();
  }, 2.5);
  ctx.fillStyle = innen;
  ctx.beginPath();
  ctx.moveTo(-2, 0);
  ctx.quadraticCurveTo(-4, -10, -1, -17);
  ctx.quadraticCurveTo(3, -10, 2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function chulloMuetze(ctx, farben) {
  // Bunte Wollmütze aus den Anden, mit Ohrenklappen und Bommel.
  ctx.save();
  ctx.translate(-1, -11);
  ctx.strokeStyle = TINTE; ctx.lineWidth = 2;
  shape(ctx, farben.muster, (c) => { c.moveTo(-15, 0); c.lineTo(-17, 16); c.lineTo(-10, 4); c.closePath(); }, 2.5);
  shape(ctx, farben.poncho, (c) => {
    c.moveTo(-16, 3);
    c.bezierCurveTo(-15, -20, 13, -20, 14, 3);
    c.closePath();
  }, 3);
  ctx.fillStyle = farben.muster;
  ctx.fillRect(-15, -3, 28, 3);
  ctx.fillStyle = farben.muster2;
  for (let i = -12; i < 12; i += 6) ctx.fillRect(i, -8, 3, 3);
  shape(ctx, farben.muster, (c) => c.arc(-1, -16, 5, 0, Math.PI * 2), 2.5);
  ctx.restore();
}

function alpenHut(ctx, farben) {
  // Grüner Filzhut mit Feder.
  ctx.save();
  ctx.translate(-2, -12);
  ctx.rotate(-0.08);
  shape(ctx, farben.muster, (c) => {
    c.moveTo(8, -6);
    c.quadraticCurveTo(22, -20, 22, -30);
    c.quadraticCurveTo(10, -24, 5, -9);
    c.closePath();
  }, 2.5);
  shape(ctx, '#4d7c4f', (c) => { c.moveTo(-14, 0); c.quadraticCurveTo(-11, -18, 0, -16); c.quadraticCurveTo(11, -18, 13, 0); c.closePath(); }, 3);
  ctx.fillStyle = farben.poncho;
  ctx.fillRect(-13, -5, 25, 4);
  shape(ctx, '#3e6741', (c) => c.ellipse(0, 1, 21, 4, 0, 0, Math.PI * 2), 3);
  ctx.restore();
}

function antenne(ctx, zeit) {
  ctx.strokeStyle = TINTE;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(3, -44); ctx.stroke();
  const leuchten = Math.sin(zeit * 6) > 0;
  shape(ctx, leuchten ? '#ff5d4a' : '#ffb3a8', (c) => c.arc(3, -47, 5, 0, Math.PI * 2), 2.5);
}

// l enthält: x, y, blick (1 = rechts, -1 = links), farben, pose, winkel,
// ausholen (0..1), rueckstoss (0..1), schleim, istComputer, phase
function zeichneLama(ctx, l, zeit, biomName) {
  const f = l.farben;
  const t = zeit + l.phase;
  const pose = l.pose;
  const atmen = Math.sin(t * 2.2) * 1.2;
  let huepfen = 0, kippen = 0;
  if (pose === 'jubel') huepfen = -Math.abs(Math.sin(t * 7)) * 26;
  if (pose === 'getroffen') kippen = -0.16 + Math.sin(t * 3) * 0.03;
  if (pose === 'fallen') kippen = Math.sin(t * 16) * 0.1;

  ctx.save();
  ctx.translate(l.x, l.y + huepfen);
  ctx.scale(l.blick * LAMA_GROESSE, LAMA_GROESSE);
  ctx.rotate(kippen);

  // Schatten am Boden
  if (pose !== 'fallen') {
    ctx.fillStyle = 'rgba(30,20,40,0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 1 - huepfen, 44 + huepfen * 0.3, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const beine = pose === 'jubel' ? Math.sin(t * 14) * 5 : pose === 'fallen' ? 10 : 0;

  // Hintere Beine
  lamaBein(ctx, -18, -30, -beine, f.schatten, '#5b4250');
  lamaBein(ctx, 20, -30, -beine, f.schatten, '#5b4250');

  // Schwänzchen
  wollKlumpen(ctx, [[-41, -52 + atmen, 8], [-46, -46 + atmen, 6]], f.wolle);

  // Vordere Beine
  lamaBein(ctx, -28, -30, beine, f.wolle, '#5b4250');
  lamaBein(ctx, 10, -30, beine, f.wolle, '#5b4250');

  // Wolliger Körper
  const y0 = -46 + atmen;
  wollKlumpen(ctx, [
    [-30, y0 + 2, 15], [-16, y0 - 9, 15], [2, y0 - 10, 15], [18, y0 - 6, 15],
    [24, y0 + 5, 13], [8, y0 + 8, 16], [-12, y0 + 9, 16], [-26, y0 + 8, 13],
  ], f.wolle);

  // Poncho
  ctx.save();
  ctx.translate(-5, y0 - 16);
  shape(ctx, f.poncho, (c) => {
    c.moveTo(-21, 0);
    c.quadraticCurveTo(0, -9, 21, 0);
    c.lineTo(24, 28);
    c.quadraticCurveTo(0, 35, -24, 28);
    c.closePath();
  }, 3);
  ctx.fillStyle = f.muster;
  ctx.fillRect(-22, 11, 44, 4);
  ctx.fillStyle = f.muster2;
  for (let i = -18; i <= 15; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 21); ctx.lineTo(i + 3.5, 17.5); ctx.lineTo(i + 7, 21); ctx.lineTo(i + 3.5, 24.5);
    ctx.closePath();
    ctx.fill();
  }
  // Fransen
  ctx.strokeStyle = TINTE;
  ctx.lineWidth = 2.5;
  for (let i = -20; i <= 20; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 30);
    ctx.lineTo(i + Math.sin(t * 3 + i) * 1.5, 37);
    ctx.stroke();
  }
  ctx.restore();

  // Hals + Kopf drehen sich beim Zielen
  const zielKipp = clamp((l.winkel || 30) - 30, -40, 70) / 70;
  const hals = -0.08 - zielKipp * 0.2 + l.ausholen * 0.42 - l.rueckstoss * 0.5 + Math.sin(t * 1.3) * 0.015;
  ctx.save();
  ctx.translate(20, y0 - 2);
  ctx.rotate(hals);
  wollKlumpen(ctx, [[0, 0, 13], [3, -13, 12], [6, -27, 11], [8, -39, 11]], f.wolle);

  ctx.translate(11, -50);
  ctx.rotate(-zielKipp * 0.32 + l.rueckstoss * 0.2);
  ctx.scale(1.22, 1.22); // Großer Kopf = niedlicher!

  const wackeln = pose === 'jubel' ? Math.sin(t * 12) * 0.3 : Math.sin(t * 1.7) * 0.06;
  lamaOhr(ctx, -7, -8, -0.25 + wackeln, f.schatten, '#f7a8a0');

  // Kopf + Schnauze
  wollKlumpen(ctx, [[0, 0, 13], [-5, -8, 8], [5, -9, 8]], f.wolle);
  shape(ctx, f.schnauze, (c) => c.ellipse(14, 4, 12, 9, 0, 0, Math.PI * 2), 3);
  lamaOhr(ctx, 5, -9, 0.2 + wackeln, f.wolle, '#f7a8a0');

  // Backen werden beim Ausholen dick!
  if (l.ausholen > 0.02) {
    shape(ctx, f.schnauze, (c) => c.arc(9, 6, 5 + l.ausholen * 9, 0, Math.PI * 2), 2.5);
    ctx.fillStyle = 'rgba(255,120,120,0.55)';
    ctx.beginPath(); ctx.arc(8, 6, 2 + l.ausholen * 5, 0, Math.PI * 2); ctx.fill();
  }

  // Nase
  ctx.fillStyle = TINTE;
  ctx.beginPath(); ctx.ellipse(21, 0, 2.2, 1.6, 0.5, 0, Math.PI * 2); ctx.fill();

  // Mund
  ctx.strokeStyle = TINTE;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  if (l.rueckstoss > 0.1 || pose === 'jubel' || pose === 'fallen') {
    shape(ctx, '#7c2d3e', (c) => c.ellipse(16, 8, 6, 4 + l.rueckstoss * 2, 0, 0, Math.PI * 2), 2.5);
  } else if (pose === 'getroffen') {
    ctx.beginPath();
    ctx.moveTo(10, 9);
    ctx.quadraticCurveTo(14, 5, 22, 9);
    ctx.stroke();
  } else if (l.ausholen > 0.02) {
    ctx.beginPath(); ctx.arc(21, 7, 2, 0, Math.PI * 2); ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(11, 7);
    ctx.quadraticCurveTo(17, 11, 24, 6);
    ctx.stroke();
  }

  // Auge
  const blinzeln = (t * 0.31) % 1 < 0.025;
  if (pose === 'getroffen') {
    // Spiralauge: schwindelig!
    ctx.strokeStyle = TINTE;
    ctx.lineWidth = 2;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(3, -3, 7.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    for (let a = 0; a < 12; a += 0.4) {
      const r = a * 0.5;
      const x = 3 + Math.cos(a + t * 5) * r, y = -3 + Math.sin(a + t * 5) * r;
      a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  } else if (blinzeln && pose !== 'fallen') {
    ctx.strokeStyle = TINTE;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-3, -3); ctx.quadraticCurveTo(3, 1, 9, -3); ctx.stroke();
  } else {
    const gross = pose === 'fallen' ? 9 : 7.5;
    shape(ctx, '#fff', (c) => c.arc(3, -3, gross, 0, Math.PI * 2), 2.5);
    const a = ((l.winkel || 0) * Math.PI) / 180;
    const px = 3 + Math.cos(a) * 2.5, py = -3 - Math.sin(a) * 2.5;
    ctx.fillStyle = TINTE;
    ctx.beginPath(); ctx.arc(px, py, 4.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(px + 1.5, py - 1.7, 1.5, 0, Math.PI * 2); ctx.fill();
    // Wimpern
    ctx.strokeStyle = TINTE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-3, -9); ctx.lineTo(-6, -12);
    ctx.moveTo(1, -11); ctx.lineTo(0, -14);
    ctx.stroke();
  }

  // Kopfschmuck
  if (biomName === 'alpen') alpenHut(ctx, f);
  else chulloMuetze(ctx, f);
  if (l.istComputer) antenne(ctx, t);

  // Spucke im Gesicht
  if (l.schleim) {
    const s = EINSTELLUNGEN.spuckeFarbe;
    ctx.fillStyle = s;
    [[10, -8, 8], [-6, 2, 9], [17, 6, 6], [3, 9, 5], [-10, -6, 5]].forEach(([x, y, r]) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    });
    const tropfen = (zeit * 8) % 14;
    ctx.fillRect(1, 9, 4, 6 + tropfen);
    ctx.fillRect(-8, 6, 3, 4 + tropfen * 0.6);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(8, -11, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  // Sterne drehen sich um den Kopf
  if (pose === 'getroffen') {
    ctx.fillStyle = '#ffd23f';
    ctx.strokeStyle = TINTE;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const a = t * 4 + (i * Math.PI * 2) / 3;
      ctx.save();
      ctx.translate(Math.cos(a) * 26, -28 + Math.sin(a) * 7);
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const r = k % 2 ? 2.7 : 6.5, w = (k * Math.PI) / 5 + t;
        ctx.lineTo(Math.cos(w) * r, Math.sin(w) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.restore(); // Hals + Kopf

  // Spucke auf dem Körper
  if (l.schleim) {
    ctx.fillStyle = EINSTELLUNGEN.spuckeFarbe;
    [[-8, y0 - 4, 10], [8, y0 - 9, 7], [-22, y0 + 4, 6]].forEach(([x, y, r]) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    });
  }

  ctx.restore();
}

// Kleines Lama-Bild für die Punktetafel.
function zeichneLamaBild(canvas, farben, biomName, istComputer) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const faktor = canvas.width / 80;
  ctx.save();
  ctx.scale(faktor, faktor);
  ctx.translate(14, 138);
  zeichneLama(ctx, {
    x: 0, y: 0, blick: 1, farben, pose: 'still', winkel: 20,
    ausholen: 0, rueckstoss: 0, schleim: false, istComputer, phase: 0,
  }, 0.5, biomName);
  ctx.restore();
}
