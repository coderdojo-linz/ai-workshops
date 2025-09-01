#!/usr/bin/env python3
import argparse
import base64
import csv
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone

try:
    import jwt  # PyJWT
except Exception as e:
    print("This script requires PyJWT. Install dependencies first: pip install -r requirements.txt", file=sys.stderr)
    raise


def _strip_quotes(val: str) -> str:
    if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
        return val[1:-1]
    return val


def load_env_secret(env_path: str, key: str = "JWT_SECRET") -> str:
    """
    Minimal .env loader for a single key without external deps.
    Supports simple KEY=VALUE lines and ignores comments/blank lines.
    """
    if not os.path.exists(env_path):
        raise FileNotFoundError(f".env not found at {env_path}")
    pattern = re.compile(r"^\s*" + re.escape(key) + r"\s*=\s*(.*)\s*$")
    with open(env_path, "r", encoding="utf-8") as f:
        for raw in f:
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            m = pattern.match(line)
            if not m:
                continue
            val = _strip_quotes(m.group(1).strip())
            if not val:
                raise ValueError(f"{key} in .env is empty")
            return val
    raise KeyError(f"{key} not found in {env_path}")


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Generate JWT tokens for users.csv using JWT_SECRET from .env")
    p.add_argument("--input", "-i", default="users.csv", help="Input CSV with columns: Name,Email,Password")
    p.add_argument("--output", "-o", default="users_with_tokens.csv", help="Output CSV to write with Token column added")
    p.add_argument("--env", default=".env", help="Path to .env file containing JWT_SECRET")
    p.add_argument("--days", type=int, default=30, help="Token validity in days (default: 30)")
    p.add_argument("--alg", default="HS256", choices=["HS256", "HS384", "HS512"], help="JWT signing algorithm")
    p.add_argument("--issuer", default=None, help="Optional iss claim")
    p.add_argument("--audience", default=None, help="Optional aud claim")
    return p.parse_args()


def read_users(csv_path: str):
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        # Normalize expected headers
        header_map = {}
        for h in reader.fieldnames or []:
            lh = (h or "").strip().lower()
            if lh in ("name", "username"):
                header_map["name"] = h
            elif lh in ("email", "mail"):
                header_map["email"] = h
            elif lh in ("password", "pass", "pwd"):
                header_map["password"] = h
        missing = [k for k, v in header_map.items() if not v]
        if missing:
            raise ValueError(f"Missing required columns in {csv_path}: {', '.join(missing)}")

        for row in reader:
            name = (row.get(header_map["name"], "") or "").strip()
            email = (row.get(header_map["email"], "") or "").strip()
            password = (row.get(header_map["password"], "") or "").strip()
            if not name or not email:
                continue
            yield {"name": name, "email": email, "password": password}


def make_token(user: dict, secret: str, days: int, alg: str, issuer: str | None, audience: str | None) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(days=days)
    payload = {
        # Stable identifiers first
        "sub": user["email"],
        "email": user["email"],
        "name": user["name"],
        "groups": ["users"],
        # Security/temporal claims
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    if issuer:
        payload["iss"] = issuer
    if audience:
        payload["aud"] = audience

    token = jwt.encode(payload, secret, algorithm=alg)
    # PyJWT returns str for >=2.0
    return token


def write_output(users_iter, output_path: str, secret: str, days: int, alg: str, issuer: str | None, audience: str | None):
    wrote = 0
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        fieldnames = ["Name", "Email", "Password", "Token"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for u in users_iter:
            token = make_token(u, secret, days, alg, issuer, audience)
            writer.writerow({
                "Name": u["name"],
                "Email": u["email"],
                "Password": u.get("password", ""),
                "Token": token,
            })
            wrote += 1
    return wrote


def main():
    args = parse_args()
    try:
        secret = load_env_secret(args.env, "JWT_SECRET")
    except Exception as e:
        print(f"Failed to load JWT_SECRET from {args.env}: {e}", file=sys.stderr)
        return 2

    try:
        users_iter = list(read_users(args.input))
    except Exception as e:
        print(f"Failed to read users from {args.input}: {e}", file=sys.stderr)
        return 3

    if not users_iter:
        print("No users found; nothing to do.")
        return 0

    try:
        count = write_output(users_iter, args.output, secret, args.days, args.alg, args.issuer, args.audience)
    except Exception as e:
        print(f"Failed to write output CSV: {e}", file=sys.stderr)
        return 4

    print(f"Wrote {count} users with JWT tokens to {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
