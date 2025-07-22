import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Reproducibility
np.random.seed(42)

# Define users and home cities
users = ["Anna", "Ben", "Clara", "David", "Eva"]
cities_normal = ["Wien", "Berlin"]
devices = ["PC", "Tablet", "Handy"]

# Assign each user a fixed home city (no travel anomalies)
home_cities = dict(zip(users, np.random.choice(cities_normal, len(users), p=[0.7, 0.3])))

# 1) Generate normal logs (998 entries to have a total of 1000 with 2 anomaly entries)
n_normal = 998
start = datetime(2025, 7, 17, 9, 0)
end = datetime(2025, 7, 20, 17, 0)

# Generate timestamps uniformly
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

# Map each entry to the user's home city
normal["city"] = normal["user"].map(home_cities)

# 2) Generate "Impossible Travel" anomaly for Eva (2 entries)
anomaly_entries = [
    {
        "time": datetime(2025, 7, 18, 10, 0),
        "user": "Eva",
        "result": "success",
        "city": "Wien",
        "device": "PC",
        "action": "login",
        "download_size": "small"
    },
    {
        "time": datetime(2025, 7, 18, 10, 5),
        "user": "Eva",
        "result": "success",
        "city": "Paris",
        "device": "Tablet",
        "action": "login",
        "download_size": "small"
    }
]
anomaly_df = pd.DataFrame(anomaly_entries)

# Combine, shuffle, save as CSV
df = pd.concat([normal, anomaly_df], ignore_index=True)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

# Save file
csv_path = "login_impossible_travel_clean.csv"
df.to_csv(csv_path, index=False)

# Preview
df.head()
