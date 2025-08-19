import csv
import random
from datetime import datetime
import calendar
from faker import Faker

# Initialize Faker for German data
fake = Faker('de_DE')

# Define detailed product categories with specific items
beauty_products = {
    "makeup": {
        "luxury": ["Dior Rouge Lipstick", "Chanel Foundation", "YSL Mascara", "Tom Ford Eyeshadow", "La Mer Concealer"],
        "regular": ["Maybelline Mascara", "L'Oréal Foundation", "Essence Lipstick", "Catrice Eyeshadow", "NYX Eyeliner"]
    },
    "fragrances": {
        "luxury": ["Chanel No. 5", "Dior J'adore", "Tom Ford Black Orchid", "Hermès Twilly", "Viktor & Rolf Flowerbomb"],
        "regular": ["Body Shop White Musk", "The Ordinary Parfum", "Zara Parfum", "Douglas Signature", "Colab Dry Shampoo"]
    },
    "skincare": ["Gesichtsmaske", "Serum", "Feuchtigkeitscreme", "Gesichtsreiniger", "Sonnencreme", "Peeling"]
}

fashion_items = {
    "luxury": ["Designer Handtasche", "Seidenbluse", "Kaschmir Pullover", "Designer Schuhe", "Luxus Sonnenbrille"],
    "regular": ["Jeans", "T-Shirt", "Pullover", "Sneaker", "Stiefel", "Kleid", "Rock", "Blazer"]
}

food_dining = {
    "restaurants": ["Restaurant", "Café", "Bistro", "Brasserie", "Steakhouse", "Sushi Bar", "Italiener", "Weinbar"],
    "drinks": ["Cocktailbar", "Rooftop Bar", "Champagner Lounge", "Weinprobe", "Coffee Shop"],
    "delivery": ["Lieferando", "Uber Eats", "Food Delivery", "Pizza Service"]
}

tech_items = ["Smartphone", "Laptop", "Tablet", "Kopfhörer", "Smartwatch", "Kamera", "Lautsprecher", "Gaming Equipment"]

hobby_items = ["Yoga Kurs", "Pilates", "Spa Tag", "Massage", "Fitness Studio", "Tennis", "Golf", "Schwimmen"]

travel_items = ["Flugticket", "Hotel", "Mietwagen", "Spa Resort", "City Trip", "Wellness Wochenende"]

# Define categories with new structure
categories = {
    "Wohnen": {"min": 1200, "max": 1200, "recipients": ["Miete für Traumvilla"]},
    "Beauty": {"min": 15, "max": 300},
    "Mode": {"min": 30, "max": 800},
    "Essen & Trinken": {"min": 15, "max": 200},
    "Reisen": {"min": 100, "max": 2000},
    "Süßigkeiten": {"min": 5, "max": 40},
    "Hobbies": {"min": 25, "max": 400},
    "Technik": {"min": 50, "max": 2500}
}

def generate_product_and_recipient(category, amount):
    """Generate realistic product and recipient based on category and amount"""
    
    if category == "Beauty":
        if amount > 150:  # Luxury beauty
            if random.choice([True, False]):
                product = random.choice(beauty_products["makeup"]["luxury"])
                recipient = random.choice(["Sephora", "Douglas", "Parfümerie Pieper", "Beauty Boutique"])
            else:
                product = random.choice(beauty_products["fragrances"]["luxury"])
                recipient = random.choice(["Parfümerie", "Douglas", "Sephora", "Beauty Store"])
        else:  # Regular beauty
            if random.choice([True, False]):
                product = random.choice(beauty_products["makeup"]["regular"])
                recipient = random.choice(["dm", "Rossmann", "Müller", "Douglas"])
            else:
                product = random.choice(beauty_products["skincare"])
                recipient = random.choice(["dm", "Rossmann", "Apotheke", "Müller"])
    
    elif category == "Mode":
        if amount > 300:  # Luxury fashion
            product = random.choice(fashion_items["luxury"])
            recipient = random.choice(["Galeria Kaufhof", "Breuninger", "Designer Boutique", "Luxury Fashion"])
        else:  # Regular fashion
            product = random.choice(fashion_items["regular"])
            recipient = random.choice(["H&M", "Zara", "C&A", "Peek & Cloppenburg", "Mango"])
    
    elif category == "Essen & Trinken":
        if amount > 80:  # Fine dining
            restaurant_type = random.choice(food_dining["restaurants"])
            product = f"Dinner im {restaurant_type}"
            recipient = f"{fake.company()} {restaurant_type}"
        elif amount > 40:  # Casual dining or drinks
            if random.choice([True, False]):
                bar_type = random.choice(food_dining["drinks"])
                product = f"Getränke in {bar_type}"
                recipient = f"{fake.first_name()}'s {bar_type}"
            else:
                restaurant = random.choice(food_dining["restaurants"])
                product = f"Essen im {restaurant}"
                recipient = f"{fake.company()} {restaurant}"
        else:  # Delivery or casual
            service = random.choice(food_dining["delivery"])
            product = f"Food Delivery"
            recipient = service
    
    elif category == "Technik":
        product = random.choice(tech_items)
        if amount > 500:
            recipient = random.choice(["Apple Store", "Media Markt", "Saturn", "Cyberport"])
        else:
            recipient = random.choice(["Media Markt", "Saturn", "Conrad", "Alternate"])
    
    elif category == "Hobbies":
        product = random.choice(hobby_items)
        recipient = f"{fake.company()} Studio"
    
    elif category == "Reisen":
        product = random.choice(travel_items)
        recipient = random.choice(["Booking.com", "Expedia", "Lufthansa", "Travel Agency", "Spa Resort"])
    
    elif category == "Süßigkeiten":
        sweets = ["Pralinen", "Schokolade", "Gummibärchen", "Cookies", "Macarons", "Cupcakes"]
        product = random.choice(sweets)
        recipient = random.choice(["Confiserie", "Bäckerei", "Süßwarengeschäft", "Lindt", "Ferrero"])
    
    else:
        product = fake.catch_phrase()
        recipient = fake.company()
    
    return product, recipient

# Generate expense data
expenses = []
start_date = datetime(2023, 1, 1)
end_date = datetime(2025, 8, 19)

# Loop through each month from start_date to end_date
current_date = start_date
while current_date <= end_date:
    year, month = current_date.year, current_date.month

    # Add fixed rent for the month
    rent_date = datetime(year, month, 5)
    if rent_date <= end_date:
        expenses.append({
            "Datum": rent_date.strftime("%Y-%m-%d"),
            "Ort": "Malibu",
            "Kategorie": "Wohnen",
            "Produkt": "Monatsmiete",
            "Empfänger": "Miete für Traumvilla",
            "Betrag": 1200.00
        })

    # Generate a random number of other expenses for the month
    num_expenses_month = random.randint(100, 300)
    # Correctly get the number of days in the month
    days_in_month = calendar.monthrange(year, month)[1]

    for _ in range(num_expenses_month):
        random_day = random.randint(1, days_in_month)
        date = datetime(year, month, random_day)

        if date > end_date:
            continue

        cat = random.choice(list(categories.keys()))
        if cat == "Wohnen":
            continue

        details = categories[cat]
        amount = round(random.uniform(details["min"], details["max"]), 2)
        product, recipient = generate_product_and_recipient(cat, amount)

        expenses.append({
            "Datum": date.strftime("%Y-%m-%d"),
            "Ort": fake.city(),
            "Kategorie": cat,
            "Produkt": product,
            "Empfänger": recipient,
            "Betrag": amount
        })

    # Move to the next month
    if month == 12:
        current_date = datetime(year + 1, 1, 1)
    else:
        current_date = datetime(year, month + 1, 1)


# Sort expenses by date in descending order
expenses.sort(key=lambda x: datetime.strptime(x['Datum'], '%Y-%m-%d'), reverse=True)


# Write to CSV
# Note: The script is in a subdirectory, so we need to make sure the output path is correct.
# This script will be run from the root, so the path should be relative to the root.
file_path = 'workshop-ui/prompts/05-barbies-dungeon/barbie_expenses.csv'
with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
    fieldnames = ["Datum", "Ort", "Kategorie", "Produkt", "Empfänger", "Betrag"]
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

    writer.writeheader()
    writer.writerows(expenses)

print(f"CSV file '{file_path}' with {len(expenses)} expenses created successfully.")
