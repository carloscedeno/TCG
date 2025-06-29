from dataclasses import dataclass
from typing import Optional

@dataclass
class CardPrice:
    card_name: str
    set_name: str
    condition: str
    price: float
    currency: str
    source: str
    url: str
    scraped_at: str  # ISO datetime
    extra: Optional[dict] = None 