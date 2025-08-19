# 🕵️‍♀️🔍 Cyber-Spürnasen: Rettet den Lichtkristall

Willkommen bei der Cyberwerk AG. Ein Daten-Dieb versucht, sich als Mitarbeiter auszugeben und den Lichtkristall zu stehlen.

Deine Mission: Finde die verdächtige Person in den Logdaten – begründe deine Entscheidung mit Beweisen aus den Daten.

![Cyberwerk HQ und Lichtkristall](./images/hq_lightcrystal.png "Cyberwerk HQ und Lichtkristall")

---

## So arbeitest du mit Nova (der KI)

- Stelle Fragen an Nova, immer in kleinen Schritten.
- Bitte Nova, dir Dinge zu zeigen (Tabellen, Diagramme) statt lange zu erklären.
- Wenn du etwas nicht verstehst: Frag Nova direkt danach. Sie hilft dir.

---

## Schritt-für-Schritt

1. Überblick holen
   - Bitte Nova, 5–10 Zeilen aus der Datei `exercises/02-detective-beginners/dataset/login_with_brute_force_and_impossible_travel.csv` zu zeigen.
   - Frage nach einer kurzen Zusammenfassung, welche Spalten es gibt. Wenn du Fragen hast: Frag Nova.

   ![Beispiel Log-Zeilen](./images/logs_sample.png "Beispiel Log-Zeilen")

2. Verdächtige Muster finden
   - Bitte Nova: „Finde Nutzer mit vielen fehlgeschlagenen Logins, gefolgt von einem erfolgreichen Login.“
   - Bitte Nova: „Gibt es ‚unmögliche Reisen‘ (ein Nutzer in kurzer Zeit in weit entfernten Städten)?“

3. Belege sammeln (Grafiken)
   - Bitte um ein Balkendiagramm: fehlgeschlagene vs. erfolgreiche Logins pro Nutzer.
   - Bitte um eine Darstellung für ‚unmögliche Reisen‘ (z. B. Zeitlinie oder Karte).

   ![Fehl-/Erfolg-Logins pro Nutzer](./images/failed_success_barchart.png "Fehl-/Erfolg-Logins pro Nutzer")

   ![Unmögliche Reise visualisiert](./images/impossible_travel_map.png "Unmögliche Reise visualisiert")

4. Entscheidung treffen
   - Welcher Nutzer wirkt am verdächtigsten? Begründe deine Wahl mit deinen Belegen (Tabellen/Grafiken).
   - Jede Aussage sollte einen Beweis aus den Daten haben.

---

## Nützliche Prompts (zum Kopieren)

- „Zeige 10 Zeilen aus `exercises/02-detective-beginners/dataset/login_with_brute_force_and_impossible_travel.csv`.“
- „Erkläre kurz die Spalten. Was bedeuten sie?“
- „Wer hat viele fehlgeschlagene Logins und danach einen erfolgreichen?“
- „Gibt es Nutzer mit Logins kurz hintereinander in verschiedenen Städten (unmögliche Reise)?“
- „Erzeuge ein Balkendiagramm: fehlgeschlagene vs. erfolgreiche Logins pro Nutzer.“
- „Zeige mir die verdächtigsten Nutzer mit Belegen (Zeilen/Grafiken).“

---

Hinweis zu Bildern: Platziere die verwendeten Bilder am Ende in `exercises/02-detective-beginners/guides/images/` mit genau diesen Dateinamen:

- `hq_lightcrystal.png`
- `logs_sample.png`
- `failed_success_barchart.png`
- `impossible_travel_map.png`

