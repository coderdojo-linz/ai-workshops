# Modifizierte Version: Kombiniert Brute Force + Impossible Travel für Eva

import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Reproducibility
np.random.seed(42)

# Benutzer & Metadaten
users = ["Anna", "Ben", "Clara", "David", "Eva"]
cities_normal = ["Wien", "Berlin"]
cities_attack = ["Moskau", "Peking"]
devices = ["PC", "Tablet", "Handy"]

# Jede Person hat eine Home-City
home_cities = dict(zip(users, np.random.choice(cities_normal, len(users), p=[0.7, 0.3])))

# 1) Normale Logins (993 Einträge)
n_normal = 993
start = datetime(2025, 7, 17, 9, 0)
end = datetime(2025, 7, 20, 17, 0)
timestamps = [
    start + timedelta(seconds=np.random.randint(0, int((end - start).total_seconds())))
    for _ in range(n_normal)
]

normal = pd.DataFrame({
    "time": timestamps,
    "user": np.random.choice(users, n_normal),
    "result": np.random.choice(["fail", "success"], n_normal, p=[0.3, 0.7]),
    "city": None,
    "device": np.random.choice(devices, n_normal),
    "action": ["login"] * n_normal,
    "download_size": ["small"] * n_normal
})
normal["city"] = normal["user"].map(home_cities)

# 2) Brute Force + Impossible Travel Angriff auf Eva
attack_entries = []
base_time = datetime(2025, 7, 18, 3, 0)

# a) Mehrere Fehlversuche aus Moskau (Brute Force)
for i in range(5):
    attack_entries.append({
        "time": base_time + timedelta(minutes=i),
        "user": "Eva",
        "result": "fail",
        "city": "Moskau",
        "device": "PC",
        "action": "login",
        "download_size": "none"
    })

# b) Erfolgreicher Login kurz darauf aus Moskau (nach Brute Force)
attack_entries.append({
    "time": base_time + timedelta(minutes=5),
    "user": "Eva",
    "result": "success",
    "city": "Moskau",
    "device": "PC",
    "action": "login",
    "download_size": "none"
})

# c) Eva war zuvor in Wien eingeloggt (Impossible Travel)
attack_entries.insert(0, {
    "time": base_time - timedelta(minutes=2),
    "user": "Eva",
    "result": "success",
    "city": "Wien",
    "device": "Tablet",
    "action": "login",
    "download_size": "none"
})

# Als DataFrame
attack_df = pd.DataFrame(attack_entries)

# Kombinieren, mischen, speichern
full_df = pd.concat([normal, attack_df], ignore_index=True)
full_df = full_df.sample(frac=1, random_state=42).reset_index(drop=True)

# Speichern
csv_path = "../login_with_brute_force_and_impossible_travel.csv"
full_df.to_csv(csv_path, index=False)

# Vorschau anzeigen
print(full_df.head())
