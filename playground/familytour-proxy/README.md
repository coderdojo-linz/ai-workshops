# Family Proxy

## Setup

* `.env`: generate a `SESSION_SECRET` and a `JWT_SECRET`.
* `users.csv`: add users (username,email,password).
* Generate JWT tokens CSV (see below).
* Start the docker compose stack.
* Make sure to log in with the intended admin user first.
* Upload the `users.csv` file via the admin interface.

## Generate JWT tokens CSV

Use the helper script to create a CSV that includes a `Token` column with a signed JWT for each user. To do so, ensure `JWT_SECRET` is set in your `.env` file and run:

```bash
python3 -m venv scripts/.venv
. scripts/.venv/bin/activate
pip install -r scripts/requirements.txt
python scripts/users_to_jwt.py
```

This writes `users_with_tokens.csv` with columns `Name,Email,Password,Token`.
