with open('backend/database.py', 'r', encoding='utf-8') as f:
    code = f.read()

target = 'DATABASE_URL = os.getenv("DATABASE_URL")'
replacement = """DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
    elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)"""

if target in code and "postgresql+psycopg2://" not in code:
    code = code.replace(target, replacement, 1)
    with open('backend/database.py', 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(code)
    print("SUCCESS: database.py patched!")
else:
    print("INFO: database.py already contains fix.")

# Also add psycopg to backend/requirements.txt
with open('backend/requirements.txt', 'r', encoding='utf-8') as f:
    reqs = f.read()

if "psycopg" not in reqs or "psycopg[binary]" not in reqs:
    # Add psycopg[binary] and psycopg
    new_reqs = reqs.strip() + "\npsycopg[binary]>=3.1.0\n"
    with open('backend/requirements.txt', 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(new_reqs)
    print("SUCCESS: requirements.txt patched with psycopg[binary]!")

