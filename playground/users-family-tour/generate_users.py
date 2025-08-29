# Generate users.csv with 100 users
# Format:
# Name,Email,Password,Role
import csv
from random import randint
import os


def generate_user_password():
    # A through Z, 0 through 9 excluding I, 1 and 0, O
    allowed_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    allowed_chars = allowed_chars.replace("I", "").replace("O", "").replace("0", "").replace("1", "")
    
    # Generate a random 6-character password
    password = ''.join(allowed_chars[randint(0, len(allowed_chars) - 1)] for _ in range(6))
    return password

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    file_path = os.path.join(script_dir, "users.csv")
    file_path_2 = os.path.join(script_dir, "users_export.csv")

    with open(file_path, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["Name", "Email", "Password", "Role"])  # Header
        users = []
        for _ in range(100):
            while True:
                name = "ars" + str(randint(1000, 9999))
                if name not in users:
                    break
            users.append(name)
            email = name.lower() + "@linz.coderdojo.net"
            password = generate_user_password()
            role = "user"
            writer.writerow([name, email, password, role])
    
    with open(file_path_2, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["Email", "Password"])
        with open(file_path, mode="r", newline="") as file:
            reader = csv.reader(file)
            next(reader)  # Skip header
            for row in reader:
                # Get name and password
                email = row[1]
                password = row[2]
                writer.writerow([email, password])


if __name__ == "__main__":
    main()
