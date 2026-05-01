import os
import sys
from pathlib import Path
from datetime import datetime, timezone

# Add project root and sync directories to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.append(str(PROJECT_ROOT))
sys.path.append(str(PROJECT_ROOT / "scripts" / "sync"))

from mtg.ck_sync import run_ck_sync

def test_single_card_sync():
    print("Running sync for 'Witherbloom, the Balancer'...")
    # The current ck_sync.py doesn't support a single card easily without fetching the full pricelist
    # But I can run it and it should update it if it's in the DB.
    # To save time, I'll just run the logic for fetching and updating.
    
    # Actually, I'll just run the whole thing. It should take a minute or two.
    run_ck_sync()

if __name__ == "__main__":
    test_single_card_sync()
