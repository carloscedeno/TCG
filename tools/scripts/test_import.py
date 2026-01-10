import sys
from pathlib import Path

# Add root to path
ROOT = Path(r"e:\TCG Web App")
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

try:
    from data.scrapers.shared.scraper_manager import TCGScraperManager
    print("✅ Importación exitosa!")
except ImportError as e:
    import traceback
    print(f"❌ Error de importación: {e}")
    traceback.print_exc()
