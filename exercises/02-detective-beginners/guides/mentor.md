# Detective Beginners – Mentor Guide

Willkommen! Dieses Modul trainiert grundlegende Security-Forensik: Log-Dateien lesen, Hypothesen bilden, Muster erkennen und Belege visualisieren. Die Kinder arbeiten fragend mit der KI (Nova) – Erklärungen gibt Nova auf Nachfrage.

## Lernziele

- Datenkompetenz: Spalten verstehen (`time, user, result, city, device, action, download_size`).
- Sicherheitskonzepte: Brute-Force-Versuch, „Impossible Travel“ erkennen.
- Explorative Analyse: Fragen formulieren, filtern, zählen, visualisieren.
- Evidenzbasiertes Argumentieren: Behauptung → Beleg (Tabelle/Grafik).

## Story in 1 Minute

Der Lichtkristall wurde aus dem HQ gestohlen. In den Login-Logs verstecken sich Spuren: viele Fehlversuche vor einem Erfolg (Brute Force) und Logins aus weit entfernten Städten in kurzer Zeit (Impossible Travel). Die Kids sind Cyber-Detektiv:innen und sollen den plausibelsten Verdacht ableiten und belegen.

## Material & Setup

- Dateien:
  - `exercises/02-detective-beginners/dataset/login_with_brute_force_and_impossible_travel.csv`
  - `exercises/02-detective-beginners/dataset/login_impossible_travel_clean.csv`
- Guides:
  - Kids: `exercises/02-detective-beginners/guides/kids.md`
  - Mentor: dieses Dokument
- Optional: vorbereitete Bilder (bitte einfügen unter `guides/images/`):
  - `hq_lightcrystal.png`
  - `logs_sample.png`
  - `failed_success_barchart.png`
  - `impossible_travel_map.png`

## Ablauf (25–35 min)

1. Einstieg (2–3 min)
   - Rahmen setzen: Ziel ist nicht „alles wissen“, sondern gute Fragen stellen und Belege sammeln.
   - Hinweis: Nova erklärt auf Nachfrage. Kinder dürfen jederzeit nachfragen.
2. Daten sichten (5–7 min)
   - Erste 5–10 Zeilen zeigen lassen. Spalten benennen. Auffälligkeiten sammeln.
3. Hypothesen prüfen (8–12 min)
   - Brute-Force-Muster: viele `fail` vor `success` pro Nutzer.
   - Impossible Travel: Städte/Zeiten vergleichen; Distanz/Zeit-Plots oder Marker.
4. Belege erzeugen (5–8 min)
   - Balkendiagramme (fails vs. success pro Nutzer), Timeline/Map für Reise-Anomalien.
5. Entscheidung & Kurzpräsentation (5 min)
   - „Wer ist verdächtig? Warum?“ mit 1–2 Grafiken oder Tabellen begründen.

## Mentor-Tipps

- Fragen coachen: „Woran würdest du das erkennen? Welche Spalte hilft dir?“
- Schrittweite klein halten: Eine Frage → kleiner Check → nächste Frage.
- Visual statt Wust: Lieber eine klare Grafik als fünf halbgare.
- Sprache offen: Deutsche Prompts sind ok; Nova versteht Kurzsätze.
- Rollen klären: Kids entscheiden, Nova liefert Werkzeuge.

## Häufige Stolpersteine

- Zu breite Fragen → anregen, konkreter zu werden (Nutzer, Zeitraum, Ereignisfolge).
- Spalten verwechseln → gemeinsam Kopfzeile lesen lassen.
- Kausal vs. Korrelation → betonen: Wir sammeln Indizien, nicht Urteile.

## Erfolgskriterien

- Mindestens eine schlüssige Hypothese zu Brute Force oder Impossible Travel.
- Ein belegendes Artefakt (Tabelle und/oder Grafik) pro Behauptung.
- Kurze, nachvollziehbare Begründung in eigenen Worten.

## Beispiel-Prompts (als Starthilfe)

- „Zeige 10 Zeilen aus der Datei X und liste die Spaltennamen.“
- „Zähle pro Nutzer die Anzahl `fail` und `success` und sortiere nach `fail` absteigend.“
- „Finde Nutzer, bei denen mehrere `fail`-Events direkt vor einem `success`-Event lagen (zeitlich).“
- „Erkenne ‚Impossible Travel‘: Gleicher Nutzer, stark unterschiedliche Städte in kurzer Zeit; zeige Beispiele.“
- „Erstelle ein Balkendiagramm: `fail` vs. `success` pro Nutzer.“
- „Visualisiere ‚Impossible Travel‘ auf einer Karte oder Timeline.“

## Bildhinweise

Füge die Beispielbilder bei Bedarf in `guides/images/` ein und referenziere sie im Kids-Guide:

![HQ mit Lichtkristall](./images/hq_lightcrystal.png "HQ mit Lichtkristall")

![Beispiel Log-Zeilen](./images/logs_sample.png "Beispiel Log-Zeilen")

![Fehl-/Erfolg-Logins pro Nutzer](./images/failed_success_barchart.png "Fehl-/Erfolg-Logins pro Nutzer")

![Unmögliche Reise visualisiert](./images/impossible_travel_map.png "Unmögliche Reise visualisiert")

