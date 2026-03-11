import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env from root
PROJECT_ROOT = Path(__file__).parent
load_dotenv(PROJECT_ROOT / ".env")

print("--- Environment Keys ---")
for key in os.environ:
    if "SUPABASE" in key:
        print(f"'{key}': {bool(os.environ[key])}")
