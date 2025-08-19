import csv
import random
from datetime import datetime, timedelta
from faker import Faker

# Initialize Faker for German data
fake = Faker('de_DE')

# Define categories and their typical spending ranges
categories = {
    "Wohnen": {"min": 1200, "max": 1200, "recipients": ["Miete für Traumvilla"]},
    "Mode": {"min": 50, "max": 400},
    "Beauty": {"min": 30, "max": 200},
    "Reisen": {"min": 200, "max": 1000},
    "Süßigkeiten": {"min": 10, "max": 50},
    "Hobbies": {"min": 40, "max": 300},
    "Essen": {"min": 20, "max": 150},
    "Technik": {"min": 100, "max": 1500}
}

# Generate expense data
expenses = []
start_date = datetime(2023, 7, 1)
num_expenses = 150

# Add fixed rent
expenses.append({
    "Datum": "2023-07-05",
    "Ort": "Malibu",
    "Kategorie": "Wohnen",
    "Produkt": "Monatsmiete",
    "Empfänger": "Miete für Traumvilla",
    "Betrag": 1200.00
})

# Generate other random expenses
for _ in range(num_expenses):
    cat = random.choice(list(categories.keys()))
    if cat == "Wohnen":
        continue

    details = categories[cat]
    amount = round(random.uniform(details["min"], details["max"]), 2)

    date = start_date + timedelta(days=random.randint(0, 30))

    expenses.append({
        "Datum": date.strftime("%Y-%m-%d"),
        "Ort": fake.city(),
        "Kategorie": cat,
        "Produkt": fake.catch_phrase(),
        "Empfänger": fake.company(),
        "Betrag": amount
    })

# Write to CSV
# Note: The script is in a subdirectory, so we need to make sure the output path is correct.
# This script will be run from the root, so the path should be relative to the root.
file_path = 'barbie_expenses.csv'
with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
    fieldnames = ["Datum", "Ort", "Kategorie", "Produkt", "Empfänger", "Betrag"]
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

    writer.writeheader()
    writer.writerows(expenses)

print(f"CSV file '{file_path}' with {len(expenses)} expenses created successfully.")
