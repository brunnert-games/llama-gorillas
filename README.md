# Spuck-Lamas

Zwei Lamas, ein Gebirge, viel Spucke: Ein Spiel im Stil des Klassikers *Gorillas*.
Es läuft komplett offline im Browser und braucht nur HTML, CSS und JavaScript.

## Starten

Doppelklick auf `index.html`. Installieren muss man nichts.

## Spielen

Ihr seid abwechselnd dran und stellt **Richtung** und **Stärke** ein. Trefft das andere Lama!
Der Wind oben in der Mitte lenkt die Spucke ab. Spucke frisst Löcher in Berge und Hindernisse,
und was keinen Halt mehr hat, fällt herunter.

| Was | Tastatur | Maus / Finger |
| --- | --- | --- |
| Richtung | ↑ ↓ | Regler oder `−` / `+` |
| Stärke | ← → | Regler oder `−` / `+` |
| Beides zugleich | | ins Bild tippen und ziehen |
| Spucken | Leertaste oder Enter | Knopf **Ptui!** |
| Pause | Esc | Knopf ⏸ |

Weiße Punkte zeigen, wo dein letzter Schuss geflogen ist. So kannst du beim nächsten Mal besser zielen.

## Selbst weiterbauen

Am besten fangt ihr in `js/einstellungen.js` an. Dort kann man gefahrlos ausprobieren:

- `schwerkraft: 90` – Spucken wie auf dem Mond
- `spuckeFarbe: '#ff66cc'` – pinke Spucke
- `kraterGroesse: 90` – riesige Löcher
- neue Sprüche für die Lamas

Nach dem Speichern lädt man das Spiel im Browser neu (F5 oder Cmd+R).

| Datei | Was steckt drin? |
| --- | --- |
| `js/einstellungen.js` | Alle Zahlen und Texte zum Herumspielen |
| `js/hindernisse.js` | Bäume, Hütten, Kuh, Kakteen, Inka-Mauer. Hier kann man Neues erfinden! |
| `js/lama.js` | So wird das Lama gezeichnet |
| `js/welt.js` | Erzeugt Berge, Himmel und Krater |
| `js/computer.js` | Flugbahn der Spucke und das Gehirn des Computer-Lamas |
| `js/spiel.js` | Spielablauf: Wer ist dran, was fliegt, was wird gemalt |
| `js/menue.js`, `index.html`, `style.css` | Menü und Knöpfe |
| `js/sound.js` | Alle Geräusche, vom Browser selbst erzeugt |
