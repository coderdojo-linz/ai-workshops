import csv
import random
from datetime import datetime, timedelta

# Define categories and recipients
categories = {
    "Wohnen": ["Miete für Traumvilla"],
    "Mode": ["Glitzerkleid Boutique", "Schuh-Palast", "Accessoire-Himmel"],
    "Beauty": ["Super-Sparkle Kosmetik", "Glamour-Hairstudio"],
    "Reisen": ["Ticket nach Paris", "Hotel an der Côte d'Azur", "Flug nach Hawaii"],
    "Süßigkeiten": ["Pinke Cupcake Bäckerei", "Schoko-Paradies"],
    "Hobbies": ["Reitstunden", "Mal-Workshop", "Yoga-Kurs"],
    "Essen": ["Supermarkt", "Bio-Laden", "Sushi-Restaurant"]
}

# Generate expense data
expenses = []
start_date = datetime(2023, 7, 1)

# Add fixed rent
expenses.append({
    "Datum": "2023-07-05",
    "Ort": "Malibu",
    "Kategorie": "Wohnen",
    "Empfänger": "Miete für Traumvilla",
    "Betrag": 1200.00
})

# Generate other random expenses
for _ in range(40):
    cat = random.choice(list(categories.keys()))
    # Avoid adding more rent
    if cat == "Wohnen":
        continue

    recipient = random.choice(categories[cat])

    amount = 0
    if cat == "Reisen":
        amount = round(random.uniform(200, 800), 2)
    elif cat in ["Mode", "Hobbies"]:
        amount = round(random.uniform(50, 250), 2)
    elif cat == "Beauty":
        amount = round(random.uniform(30, 150), 2)
    else:
        amount = round(random.uniform(10, 60), 2)

    date = start_date + timedelta(days=random.randint(0, 30))

    expenses.append({
        "Datum": date.strftime("%Y-%m-%d"),
        "Ort": random.choice(["Malibu", "Paris", "New York", "Online"]),
        "Kategorie": cat,
        "Empfänger": recipient,
        "Betrag": amount
    })

# Write to CSV
file_path = 'barbie_expenses.csv'
with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
    fieldnames = ["Datum", "Ort", "Kategorie", "Empfänger", "Betrag"]
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

    writer.writeheader()
    writer.writerows(expenses)

print(f"CSV file '{file_path}' created successfully.")
