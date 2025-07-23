# Guide für Mentor:innen: Lösung und Hintergrund

## 1. Überblick
- **Ziel:** Mithilfe von Login-Logs den Daten­diebstahl aufklären  
- **Verdächtiger Benutzer:** **Eva**  
- **Anomalie:** „Impossible Travel“ zwischen Wien und Paris in 5 Minuten

---

## 2. Schritt-für-Schritt-Lösung

1. **Log-Analyse**  
   - In den Log-Daten sind 1.000 Einträge.  
   - Alle fünf Nutzer:innen (Anna, Ben, Clara, David, Eva) haben normale Einlogg-Versuche in ihren Heimstädten (Wien oder Berlin) – mit einer Fehlerquote von ca. 30 % Fehlversuchen.

2. **Anomalie entdecken**  
   - **18. Juli 2025, 10:00 Uhr:** Eva loggt sich erfolgreich in **Wien** ein.  
   - **18. Juli 2025, 10:05 Uhr:** Eva loggt sich erfolgreich in **Paris** ein.  
   - Physikalisch unmöglich, innerhalb von fünf Minuten von Wien nach Paris zu reisen.

3. **Verdacht bestätigen**  
   - Dieser schnelle Ortswechsel deutet auf Diebstahl oder Missbrauch von Zugangsdaten hin.  
   - **Ergebnis:** Eva ist die Daten­diebin.

---

## 3. Hintergrundwissen

### a) Warum Logs prüfen?
- Unternehmen sammeln Login-Daten, um unautorisierten Zugriff zu erkennen.  
- Verdächtige Muster wie viele Fehlversuche oder Zugriffe aus ungewöhnlichen Orten lösen Alarm aus.

### b) „Impossible Travel“
- Zwei Logins an weit entfernten Orten in einem unrealistischen Zeitabstand.  
- Klassiker zur Erkennung von Credential-Diebstahl (geklaute Passwörter) oder Session-Hijacking (Übernahme einer Sitzung).

### c) Rolle von KI-Chatbots
- Erklären komplexe Sachverhalte in einfacher Sprache.  
- Geben Hinweise, ohne die Lösung vorwegzunehmen.

---

## 4. Tipps für die Mentor:innen
- **Sprachlevel anpassen:** Vermeidet Fachjargon und nutzt persönliche Beispiele.  
- **Fragen stellen:**  
  - „Warum ist dieser Login verdächtig?“  
  - „Wie schnell kann man zwischen zwei Städten reisen?“  
- **Lernziel:** Kinder sollen verstehen, wie IT-Forensiker arbeiten und welche Hilfsmittel (Logs, Anomalie-Erkennung) sie einsetzen.

---

**Fazit:**  
Eva ist die Täterin, weil sie in extrem kurzer Zeit an zwei geografisch entfernten Orten erfolgreich eingeloggt war – ein klares Indiz für den Datendiebstahl.  
```
