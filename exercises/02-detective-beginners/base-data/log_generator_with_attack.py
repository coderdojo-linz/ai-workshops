import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Reproducibility
np.random.seed(42)

# 1) Generate normal logs (970 entries)
n_normal = 970
start = datetime(2025, 7, 17, 9, 0)
end = datetime(2025, 7, 20, 17, 0)
times = [
    (start + timedelta(seconds=np.random.randint(0, int((end-start).total_seconds()))))
    .replace(hour=np.random.randint(9, 18), minute=np.random.randint(0, 60))
    for _ in range(n_normal)
]
users = ["Anna", "Ben", "Clara", "David", "Eva"]
cities_normal = ["Wien", "Berlin"]
devices = ["PC", "Tablet", "Handy"]

normal = pd.DataFrame({
    "time": times,
    "user": np.random.choice(users, n_normal),
    "result": np.random.choice(["fail", "success"], n_normal, p=[0.3, 0.7]),
    "city": np.random.choice(cities_normal, n_normal, p=[0.7, 0.3]),
    "device": np.random.choice(devices, n_normal),
    "action": ["login"] * n_normal,
    "download_size": ["small"] * n_normal
})

# 2) Generate villain pattern
villain = []
cities_cycle = ["Wien", "Berlin", "London", "Rom", "Paris"]
# Phase 1: 25 failed attempts (5 per user)
for i, user in enumerate(users):
    for _ in range(5):
        ts = start + timedelta(hours=np.random.randint(0, 48), minutes=np.random.randint(0, 60))
        ts = ts.replace(hour=np.random.randint(9, 18))
        villain.append({
            "time": ts,
            "user": user,
            "result": "fail",
            "city": cities_cycle[i],
            "device": np.random.choice(devices),
            "action": "login",
            "download_size": "small"
        })
# Phase 2: one nighttime success
villain.append({
    "time": datetime(2025, 7, 20, 2, 30),
    "user": "Clara",
    "result": "success",
    "city": "Wien",
    "device": "PC",
    "action": "login",
    "download_size": "small"
})
# Phase 3: 4 large downloads
for i in range(4):
    villain.append({
        "time": datetime(2025, 7, 20, 2, 31 + i, 0),
        "user": "Clara",
        "result": "success",
        "city": "Wien",
        "device": "PC",
        "action": "download",
        "download_size": "large"
    })

villain_df = pd.DataFrame(villain)

# Combine, shuffle, save as CSV

df = pd.concat([normal, villain_df], ignore_index=True)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)
csv_path = "login_attack_pattern.csv"
df.to_csv(csv_path, index=False)

# Preview
print("Vorschau auf die ersten 10 Zeilen:")
print(df.head(10))
print(f"CSV-Datei gespeichert als: {csv_path}")
