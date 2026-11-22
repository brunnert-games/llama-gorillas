// ============================================================
//  HIER DARFST DU ALLES AUSPROBIEREN!
//  Ändere eine Zahl oder ein Wort, speichere die Datei und lade
//  das Spiel im Browser neu (Taste F5 oder Cmd+R).
//  Kaputt gegangen? Kein Problem: Zahl einfach zurückändern.
// ============================================================

const EINSTELLUNGEN = {
  // --- Physik ---
  schwerkraft: 520,       // Wie schnell fällt die Spucke? Mond: 90, Erde: 520, Riesenplanet: 1200
  maxSpuckTempo: 950,     // Wie schnell fliegt die Spucke bei Kraft 100?
  maxWind: 80,            // Wie stark kann der Wind höchstens sein?

  // --- Spucke ---
  kraterGroesse: 36,      // Wie groß ist das Loch, das die Spucke in den Berg macht?
  spritzerReichweite: 14, // So nah muss ein Spritzer am Lama sein, damit es zählt
  spuckeFarbe: '#9be564', // Farbe der Spucke (probier mal '#ff66cc' für Pink!)

  // --- Namen ---
  spieler1: 'Paco',
  spieler2: 'Lotta',
  computerNamen: {
    leicht: 'Schlaf-Lama',
    mittel: 'Schlau-Lama',
    schwer: 'Profi-Lama',
  },

  // --- Wie gut trifft der Computer? ---
  //  winkelFehler / kraftFehler: So weit zielt er am Anfang daneben
  //  lernen: Mit jedem Schuss wird der Fehler so viel kleiner (0.5 = halb so groß)
  //  kleinsterFehler: Besser als dieser Anteil vom Fehler wird er nie
  //  windAbSchuss: Ab dem wievielten Schuss bemerkt er den Wind? (0 = sofort)
  computer: {
    leicht: { winkelFehler: 14, kraftFehler: 14, lernen: 0.88, kleinsterFehler: 0.35, windAbSchuss: 5 },
    mittel: { winkelFehler: 10, kraftFehler: 10, lernen: 0.8, kleinsterFehler: 0.2, windAbSchuss: 0 },
    schwer: { winkelFehler: 3.5, kraftFehler: 3.5, lernen: 0.45, kleinsterFehler: 0, windAbSchuss: 0 },
  },

  // --- Was die Lamas sagen ---
  sprueche: {
    spucken: ['Ptui!', 'Ptuuuh!', 'Fffft!', 'Achtung!', 'Hier kommt’s!'],
    knapp: ['Uff, knapp!', 'Puh!', 'Das war nah!', 'Hui!'],
    daneben: ['Daneben!', 'Hihi!', 'Nicht getroffen!', 'Bäh-bäh!', 'Zielen üben!'],
    getroffen: ['Igitt!', 'Bäääh!', 'Iiiih!', 'Pfui!'],
    jubel: ['Jippie!', 'Treffer!', 'Hurra!', 'Yeah!'],
    selbst: ['Hoppla!', 'Oh nein!', 'Ups!'],
    computerDenkt: ['Hmm …', 'Mal sehen …', 'Moment …'],
    kuh: 'Muuuuh!',
  },
};
