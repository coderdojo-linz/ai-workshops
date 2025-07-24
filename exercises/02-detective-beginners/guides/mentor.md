# Guide für Mentor:innen: Lösung und Hintergrund

## 1. Überblick
- **Ziel:** Verdächtige Aktivitäten in den Logdaten aufdecken  
- **Angriffsform:** Kombination aus Brute Force (viele Fehlversuche) und Blitz‑Reise (Impossible Travel)  
- **Betroffener Account:** **Eva**

---

## 2. Schritt-für-Schritt-Lösung

1. **Log-Analyse**
   - Der Datensatz enthält 1.000 Login-Vorgänge von fünf Benutzer:innen (Anna, Ben, Clara, David, Eva).
   - Alle Benutzer:innen haben Logins mit ca. 30 % Fehlversuchen – verteilt über mehrere Tage.
   - Auffällig: Eva hat mehrere ungewöhnliche Einträge in sehr kurzer Zeit.

2. **Anomalien entdecken**
   - **18. Juli 2025, 02:58 Uhr:** Eva loggt sich erfolgreich in **Wien** ein.  
   - Direkt danach folgen **mehrere fehlgeschlagene Login-Versuche aus Moskau** (03:00–03:04 Uhr).  
   - **03:05 Uhr:** Erfolgreicher Login aus **Moskau**.  
   - Dieser schnelle Ortswechsel ist **physikalisch unmöglich**.  
   - Zusätzlich: Viele Fehlversuche vor dem erfolgreichen Zugriff – Hinweis auf **Brute Force**.

3. **Verdacht bestätigen**
   - Die Logins zeigen zwei auffällige Muster:
     - Ein Login aus Wien – kurz danach einer aus Moskau → Blitz‑Reise
     - 5 fehlgeschlagene Versuche → dann Erfolg → Brute Force
   - **Ergebnis:** Evas Account wurde vermutlich von einer anderen Person genutzt.  
   - Für die Kinder ist **Eva die „Täterin“**, auch wenn sie in Wahrheit ein Opfer von Datenklau ist.

---

## 3. Hintergrundwissen

### a) Brute Force
- Angreifer probieren automatisiert viele Passwortkombinationen, bis sie Erfolg haben.
- In Logs sichtbar durch eine Häufung von `fail`-Einträgen in kurzer Zeit.

### b) Blitz‑Reise / „Impossible Travel“
- Zwei erfolgreiche Logins an sehr weit entfernten Orten in kurzer Zeit.
- Wird in der IT-Sicherheit genutzt, um **gestohlene Zugangsdaten** zu erkennen.

### c) Warum KI einsetzen?
- Chatbots können spielerisch helfen, komplexe Begriffe wie „Brute Force“ oder „Impossible Travel“ zu erklären.
- Die Kinder sollen selbst kombinieren – nicht direkt die Lösung bekommen!

---

## 4. Tipps für die Mentor:innen

- **Sprache kindgerecht halten:** z. B. statt „IP-Adresse“ → „geheimer Pfad“  
- **Aktivierende Fragen stellen:**  
  - „Warum ist dieser Login mitten in der Nacht verdächtig?“  
  - „Wie kann jemand so schnell von Wien nach Moskau reisen?“  
  - „Was passiert, wenn jemand 5-mal das falsche Passwort eingibt?“  
- **Spannung aufbauen:** Lasst die Kinder Vermutungen äußern, kombiniert mit dem Chatbot.

---

## 5. Lernziel

Kinder verstehen:
- was ungewöhnliches Verhalten (Anomalien) in Login-Daten bedeutet,  
- wie man digitale Spuren liest und kombiniert,  
- wie man mithilfe von Technik und Logik einen Fall löst.

---

**Fazit:**  
Die verdächtigen Logins aus zwei Städten in kurzer Zeit **plus** viele Fehlversuche führen zur Erkenntnis:  
**Eva ist scheinbar die Täterin – in Wahrheit wurde ihr Zugang missbraucht.**  
Das erkennen die Kinder durch die Kombination aus Beobachtung, Detektiv‑Logik und KI-Unterstützung.
