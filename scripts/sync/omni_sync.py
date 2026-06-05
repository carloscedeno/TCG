import sys
import os
import logging
from pathlib import Path
from datetime import datetime

# Add project root and sync directories to path
PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.append(str(PROJECT_ROOT))
sys.path.append(str(PROJECT_ROOT / "scripts" / "sync"))

from mtg.ck_sync import run_ck_sync
from pokemon.pokemon_sync import run_sync as run_pokemon_sync

# Setup Master Logging
log_dir = PROJECT_ROOT / 'logs' / 'sync'
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_dir / 'omni_sync.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("OmniSync")

def run_omni_sync():
    logger.info("==========================================")
    logger.info("STARTING OMNI-TCG MASTER SYNC")
    logger.info("==========================================")
    
    start_time = datetime.now()
    
    # 1. MTG Card Kingdom Sync
    logger.info("\n--- STEP 1: MTG Card Kingdom (Retail Prices) ---")
    try:
        run_ck_sync()
        logger.info("MTG Sync Completed.")
    except Exception as e:
        logger.error(f"MTG Sync Failed: {e}")
    
    # 2. Pokemon TCG API Sync
    logger.info("\n--- STEP 2: Pokemon TCG (Market Prices) ---")
    try:
        # We need a list of sets to sync cards for, or just sync metadata
        # For a daily sync, we might want to sync recently updated sets or a core catalog
        # For now, let's just sync the 'base1' (test) or metadata if no set provided
        # The pokemon_sync script handles metadata if no set_id is passed
        run_pokemon_sync() 
        logger.info("[OK] Pokemon Metadata Sync Completed.")
        
        # If we want to sync specific high-value sets automatically:
        # sets_to_sync = ["swsh12pt5", "sv4pt5", "base1"]
        # for s in sets_to_sync:
        #    run_pokemon_sync(s)
        
    except Exception as e:
        logger.error(f"[ERROR] Pokemon Sync Failed: {e}")

    end_time = datetime.now()
    duration = end_time - start_time
    
    logger.info("==========================================")
    logger.info("OMNI-TCG MASTER SYNC FINISHED")
    logger.info("DURATION: " + str(duration))
    logger.info("==========================================")

if __name__ == "__main__":
    run_omni_sync()
