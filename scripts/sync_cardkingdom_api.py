"""
CardKingdom API Sync Entry Point.
Delegates to the bulletproof MTG CardKingdom sync engine in scripts/sync/mtg/ck_sync.py.
"""
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.append(str(PROJECT_ROOT))
sys.path.append(str(PROJECT_ROOT / "scripts" / "sync"))

from scripts.sync.mtg.ck_sync import run_ck_sync

if __name__ == "__main__":
    run_ck_sync()
