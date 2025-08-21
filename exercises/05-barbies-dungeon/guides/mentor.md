# Barbies Glamour-Dungeon - Mentor's Guide

Dieses Handbuch hilft Mentoren, die Kinder durch die Übung "Barbies Glamour-Dungeon" zu führen.

---

## Rätsel 1: Die binäre Brücke - Leitfaden für Mentoren

### 1. Szenario-Überblick
- **Situation:** Barbie und Ken sind durch eine undurchsichtige Wand getrennt.
- **Kommunikationsmittel:** An der Wand zwischen ihnen befindet sich ein Bildschirm und zwei Tasten (eine für "0", eine für "1").
- **Ziel:** Das Kind muss herausfinden, dass die Tasten binären Code erzeugen, und Barbie anleiten, das Passwort "LOVE" per binärem ASCII-Code an Ken zu senden. Ken gibt den Code in das Schloss einer Truhe ein, um den Schlüssel für die nächste Tür zu erhalten.

### 2. Lernziele
- **Primär:** Einführung in die binäre Darstellung von Informationen (ASCII-Code).
- **Sekundär:** Logisches Denken und Problemlösung.

### 3. Lösung des Rätsels
- **Das Passwort:** `LOVE`
- **Die Methode:** Binärer ASCII-Code. Jeder Buchstabe wird in eine 8-stellige Sequenz aus Nullen und Einsen umgewandelt.
    - **L** = `01001100`
    - **O** = `01001111`
    - **V** = `01010110`
    - **E** = `01000101`

### 4. Schritte zur Anleitung des Kindes

1.  **Entdeckung:** Lassen Sie das Kind zunächst selbst die Situation erkunden.
    - *Frage:* "Was seht ihr im Raum? Was ist an der Wand?"
    - *Frage:* "Was könnten die beiden Tasten bewirken?"

2.  **Konzept der Binärkommunikation:** Wenn das Kind nicht von selbst darauf kommt, geben Sie einen Schubs in die richtige Richtung.
    - *Hinweis:* "Stellt euch vor, eine Taste ist eine 0 und die andere eine 1. Was könnte man mit nur Nullen und Einsen alles machen?"
    - *Hinweis:* "Computer kommunizieren nur mit Nullen und Einsen. Vielleicht ist das hier ähnlich?"

3.  **Einführung in ASCII:** Sobald das Kind das Binärkonzept hat, führen Sie ASCII ein.
    - *Erklärung:* "Super Idee! Es gibt einen speziellen Code, der Buchstaben in Nullen und Einsen übersetzt. Er heißt ASCII-Code. Wollen wir uns den mal ansehen?"
    - *Aktion:* Bitten Sie die KI (Nova), eine ASCII-Tabelle zu zeigen oder die Buchstaben für "LOVE" zu übersetzen.

4.  **Übermittlung:** Leiten Sie das Kind an, die Binärcodes für "L-O-V-E" nacheinander "einzugeben".
    - *Anweisung:* "Okay, jetzt sagt Barbie, sie sei bereit, die Codes zu senden. Sagt ihr, welchen Code sie für 'L' eingeben soll."

### 5. Wenn das Kind nicht weiterkommt
- **Tipp 1 (Das Werkzeug):** "Fokussieren wir uns auf die Tasten. Wenn jede Taste ein Signal sendet, wie könnte man daraus ein Wort bilden?"
- **Tipp 2 (Das System):** "Es muss ein System geben, das Buchstaben in Signale umwandelt. Hast du schon mal von Morsecode oder Binärcode gehört?"
- **Tipp 3 (Die Lösung):** "Das Passwort ist 'LOVE'. Lass uns Nova fragen, wie man 'L' in Binärcode schreibt."

### ASCII-Referenztabelle

| Character | ASCII Decimal | Binary (8-bit) |   | Character | ASCII Decimal | Binary (8-bit) |   | Character | ASCII Decimal | Binary (8-bit) |
|:---------:|:-------------:|:--------------:|---|:---------:|:-------------:|:--------------:|---|:---------:|:-------------:|:--------------:|
| 0 | 48 | 00110000 | | K | 75 | 01001011 | | e | 101 | 01100101 |
| 1 | 49 | 00110001 | | L | 76 | 01001100 | | f | 102 | 01100110 |
| 2 | 50 | 00110010 | | M | 77 | 01001101 | | g | 103 | 01100111 |
| 3 | 51 | 00110011 | | N | 78 | 01001110 | | h | 104 | 01101000 |
| 4 | 52 | 00110100 | | O | 79 | 01001111 | | i | 105 | 01101001 |
| 5 | 53 | 00110101 | | P | 80 | 01010000 | | j | 106 | 01101010 |
| 6 | 54 | 00110110 | | Q | 81 | 01010001 | | k | 107 | 01101011 |
| 7 | 55 | 00110111 | | R | 82 | 01010010 | | l | 108 | 01101100 |
| 8 | 56 | 00111000 | | S | 83 | 01010011 | | m | 109 | 01101101 |
| 9 | 57 | 00111001 | | T | 84 | 01010100 | | n | 110 | 01101110 |
| A | 65 | 01000001 | | U | 85 | 01010101 | | o | 111 | 01101111 |
| B | 66 | 01000010 | | V | 86 | 01010110 | | p | 112 | 01110000 |
| C | 67 | 01000011 | | W | 87 | 01010111 | | q | 113 | 01110001 |
| D | 68 | 01000100 | | X | 88 | 01011000 | | r | 114 | 01110010 |
| E | 69 | 01000101 | | Y | 89 | 01011001 | | s | 115 | 01110011 |
| F | 70 | 01000110 | | Z | 90 | 01011010 | | t | 116 | 01110100 |
| G | 71 | 01000111 | | a | 97 | 01100001 | | u | 117 | 01110101 |
| H | 72 | 01001000 | | b | 98 | 01100010 | | v | 118 | 01110110 |
| I | 73 | 01001001 | | c | 99 | 01100011 | | w | 119 | 01110111 |
| J | 74 | 01001010 | | d | 100 | 01100100 | | x | 120 | 01111000 |
|  |  |  | |  |  |  | | y | 121 | 01111001 |
|  |  |  | |  |  |  | | z | 122 | 01111010 |