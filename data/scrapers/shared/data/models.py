"""
Modelos de datos para el sistema de scraping de TCG
Compatibles con la estructura robusta de base de datos multi-TCG
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple
import json

@dataclass
class CardPrice:
    """Modelo para precios de cartas con soporte multi-TCG"""
    card_name: str
    set_name: str
    condition: str = "Near Mint"
    price: float = 0.0
    currency: str = "USD"
    source: str = ""
    url: str = ""
    scraped_at: str = ""
    
    # Campos específicos por TCG
    game_code: str = ""
    collector_number: Optional[str] = None
    rarity: Optional[str] = None
    is_foil: bool = False
    is_etched: bool = False
    is_alt_art: bool = False
    is_first_edition: bool = False
    
    # Atributos específicos por TCG (JSON)
    tcg_specific_attributes: Dict[str, Any] = field(default_factory=dict)
    tcg_specific_printing_attributes: Dict[str, Any] = field(default_factory=dict)
    
    # Campos de precio adicionales
    price_type: str = "market"  # market, buy, sell, low, mid, high
    stock_quantity: Optional[int] = None

@dataclass
class CardData:
    """Modelo para datos completos de cartas"""
    card_name: str
    game_code: str
    type_line: Optional[str] = None
    oracle_text: Optional[str] = None
    mana_cost: Optional[str] = None
    power: Optional[str] = None
    toughness: Optional[str] = None
    base_rarity: Optional[str] = None
    
    # Campos específicos por TCG
    hp: Optional[str] = None  # Para Pokémon, Flesh and Blood
    level: Optional[str] = None  # Para Yu-Gi-Oh!, Wixoss
    color: Optional[str] = None  # Para Lorcana, Wixoss, One Piece
    attribute: Optional[str] = None  # Para Yu-Gi-Oh!, One Piece
    loyalty: Optional[str] = None  # Para MTG Planeswalkers
    defense: Optional[str] = None  # Para MTG Battles
    
    # Atributos específicos por TCG (JSON)
    tcg_specific_attributes: Dict[str, Any] = field(default_factory=dict)
    
    # Datos de impresión
    set_code: Optional[str] = None
    collector_number: Optional[str] = None
    rarity: Optional[str] = None
    artist: Optional[str] = None
    is_foil: bool = False
    is_etched: bool = False
    is_alt_art: bool = False
    is_first_edition: bool = False
    is_full_art: bool = False
    is_borderless: bool = False
    is_showcase: bool = False
    is_promo: bool = False
    promo_type: Optional[str] = None
    frame_effects: List[str] = field(default_factory=list)
    border_color: Optional[str] = None
    
    # Atributos específicos de impresión (JSON)
    tcg_specific_printing_attributes: Dict[str, Any] = field(default_factory=dict)
    
    # URLs de imágenes
    image_url_small: Optional[str] = None
    image_url_normal: Optional[str] = None
    image_url_large: Optional[str] = None

@dataclass
class ScrapingResult:
    """Resultado de un scraping individual"""
    success: bool
    card_name: str
    source: str
    price: Optional[float] = None
    currency: str = "USD"
    error_message: Optional[str] = None
    scraped_at: str = ""
    url: str = ""
    
    # Datos adicionales
    condition: str = "Near Mint"
    stock_quantity: Optional[int] = None
    is_foil: bool = False
    is_etched: bool = False

@dataclass
class ScrapingBatch:
    """Resultado de un lote de scraping"""
    total_cards: int = 0
    successful_scrapes: int = 0
    failed_scrapes: int = 0
    results: List[ScrapingResult] = field(default_factory=list)
    start_time: datetime = field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    
    @property
    def success_rate(self) -> float:
        """Calcula la tasa de éxito del scraping"""
        if self.total_cards == 0:
            return 0.0
        return (self.successful_scrapes / self.total_cards) * 100
    
    @property
    def duration(self) -> Optional[float]:
        """Calcula la duración del scraping en segundos"""
        if self.end_time is None:
            return None
        return (self.end_time - self.start_time).total_seconds()

class TCGAttributeMapper:
    """Mapeador de atributos específicos por TCG"""
    
    # Mapeo de atributos específicos por TCG
    TCG_ATTRIBUTES = {
        'MTG': {
            'loyalty': 'loyalty',
            'defense': 'defense',
            'frame_effects': 'frame_effects',
            'promo_types': 'promo_types',
            'illustration_id': 'illustration_id'
        },
        'POKEMON': {
            'hp': 'hp',
            'evolves_from': 'evolves_from',
            'evolves_to': 'evolves_to',
            'weaknesses': 'weaknesses',
            'resistances': 'resistances',
            'retreat_cost': 'retreat_cost',
            'attacks': 'attacks',
            'abilities': 'abilities'
        },
        'LORCANA': {
            'ink_color': 'ink_color',
            'inkwell': 'inkwell',
            'classifications': 'classifications',
            'strength': 'strength',
            'willpower': 'willpower',
            'lore': 'lore'
        },
        'FAB': {
            'pitch_value': 'pitch_value',
            'life': 'life',
            'intellect': 'intellect',
            'class': 'class',
            'talents': 'talents'
        },
        'YUGIOH': {
            'level': 'level',
            'race': 'race',
            'link': 'link',
            'linkmarkers': 'linkmarkers',
            'scale': 'scale',
            'archetype': 'archetype'
        },
        'WIXOSS': {
            'color': 'color',
            'level': 'level',
            'limit': 'limit',
            'grow_cost': 'grow_cost',
            'has_life_burst': 'has_life_burst',
            'class': 'class'
        },
        'ONEPIECE': {
            'color': 'color',
            'counter': 'counter',
            'subtypes': 'subtypes',
            'is_leader': 'is_leader'
        }
    }
    
    @classmethod
    def get_tcg_attributes(cls, game_code: str) -> Dict[str, str]:
        """Obtiene los atributos específicos para un TCG"""
        return cls.TCG_ATTRIBUTES.get(game_code.upper(), {})
    
    @classmethod
    def map_attributes(cls, game_code: str, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Mapea atributos desde datos crudos a la estructura de la base de datos"""
        tcg_attrs = cls.get_tcg_attributes(game_code)
        mapped_attrs = {}
        
        for db_field, raw_field in tcg_attrs.items():
            if raw_field in raw_data:
                mapped_attrs[db_field] = raw_data[raw_field]
        
        return mapped_attrs

class TCGMarketplaceMapper:
    """Mapeador de TCG por marketplace - Detecta qué TCGs están disponibles en cada marketplace"""
    
    MARKETPLACE_TCG_MAPPING = {
        'cardmarket': {
            'MTG': ['/magic/', '/Magic/'],
            'POKEMON': ['/pokemon/', '/Pokemon/'],
            'LORCANA': ['/lorcana/', '/Lorcana/'],
            'FAB': ['/flesh-and-blood/', '/Flesh-and-Blood/'],
            'YUGIOH': ['/yugioh/', '/YuGiOh/'],
            'WIXOSS': ['/wixoss/', '/Wixoss/'],
            'ONEPIECE': ['/one-piece/', '/One-Piece/']
        },
        'tcgplayer': {
            'MTG': ['/magic/', 'magic-the-gathering', 'magic'],
            'POKEMON': ['/pokemon/', 'pokemon'],
            'LORCANA': ['/lorcana/', 'lorcana'],
            'FAB': ['/flesh-and-blood/', 'flesh-and-blood', 'fab'],
            'YUGIOH': ['/yugioh/', 'yugioh'],
            'ONEPIECE': ['/one-piece/', 'one-piece']
            # WIXOSS no disponible en TCGplayer
        },
        'cardkingdom': {
            'MTG': ['/magic_the_gathering/', 'magic-the-gathering', 'magic'],
            'POKEMON': ['/pokemon/', 'pokemon'],
            'LORCANA': ['/lorcana/', 'lorcana'],
            'FAB': ['/flesh_and_blood/', 'flesh-and-blood', 'fab'],
            'YUGIOH': ['/yugioh/', 'yugioh'],
            'ONEPIECE': ['/one_piece/', 'one-piece']
            # WIXOSS no disponible en Card Kingdom
        },
        'trollandtoad': {
            'MTG': ['/magic-the-gathering/', 'magic-the-gathering', 'magic'],
            'POKEMON': ['/pokemon/', 'pokemon'],
            'LORCANA': ['/lorcana/', 'lorcana'],
            'FAB': ['/flesh-and-blood/', 'flesh-and-blood', 'fab'],
            'YUGIOH': ['/yugioh/', 'yugioh'],
            'ONEPIECE': ['/one-piece/', 'one-piece']
            # WIXOSS no disponible en Troll and Toad
        }
    }
    
    @classmethod
    def detect_tcg_from_url(cls, url: str, source: str) -> Optional[str]:
        """Detecta el TCG basado en la URL y el marketplace"""
        url_lower = url.lower()
        source_lower = source.lower()
        
        if source_lower not in cls.MARKETPLACE_TCG_MAPPING:
            return None
        
        tcg_mapping = cls.MARKETPLACE_TCG_MAPPING[source_lower]
        
        for tcg, patterns in tcg_mapping.items():
            for pattern in patterns:
                if pattern.lower() in url_lower:
                    return tcg
        
        # Para TCGplayer, intentar detectar por contenido de la página o metadatos
        if source_lower == 'tcgplayer':
            # Detectar por palabras clave en la URL o parámetros
            if any(keyword in url_lower for keyword in ['magic', 'mtg', 'planeswalker']):
                return 'MTG'
            elif any(keyword in url_lower for keyword in ['pokemon', 'pikachu', 'charizard']):
                return 'POKEMON'
            elif any(keyword in url_lower for keyword in ['lorcana', 'elsa', 'disney']):
                return 'LORCANA'
            elif any(keyword in url_lower for keyword in ['flesh', 'blood', 'fab', 'prism']):
                return 'FAB'
            elif any(keyword in url_lower for keyword in ['yugioh', 'blue-eyes', 'dark-magician']):
                return 'YUGIOH'
            elif any(keyword in url_lower for keyword in ['one-piece', 'luffy', 'straw-hat']):
                return 'ONEPIECE'
        
        return None
    
    @classmethod
    def is_tcg_supported(cls, tcg: str, source: str) -> bool:
        """Verifica si un TCG está soportado en un marketplace específico"""
        source_lower = source.lower()
        if source_lower not in cls.MARKETPLACE_TCG_MAPPING:
            return False
        
        return tcg in cls.MARKETPLACE_TCG_MAPPING[source_lower]
    
    @classmethod
    def get_supported_tcgs(cls, source: str) -> List[str]:
        """Obtiene la lista de TCGs soportados por un marketplace"""
        source_lower = source.lower()
        if source_lower not in cls.MARKETPLACE_TCG_MAPPING:
            return []
        
        return list(cls.MARKETPLACE_TCG_MAPPING[source_lower].keys())
    
    @classmethod
    def get_marketplace_coverage(cls) -> Dict[str, List[str]]:
        """Obtiene la cobertura completa de TCGs por marketplace"""
        return {
            source: list(tcgs.keys()) 
            for source, tcgs in cls.MARKETPLACE_TCG_MAPPING.items()
        }
    
    @classmethod
    def get_best_marketplace_for_tcg(cls, tcg: str) -> List[str]:
        """Obtiene los mejores marketplaces para un TCG específico"""
        best_marketplaces = []
        
        for source, tcgs in cls.MARKETPLACE_TCG_MAPPING.items():
            if tcg in tcgs:
                best_marketplaces.append(source)
        
        return best_marketplaces

class PriceNormalizer:
    """Normalizador de precios y monedas"""
    
    CURRENCY_SYMBOLS = {
        '$': 'USD',
        '€': 'EUR',
        '£': 'GBP',
        '¥': 'JPY'
    }
    
    @classmethod
    def normalize_price(cls, price_text: str) -> tuple[float, str]:
        """Normaliza un precio desde texto a valor numérico y moneda"""
        if not price_text:
            return 0.0, "USD"
        
        # Limpiar el texto
        price_text = price_text.strip()
        
        # Detectar moneda
        currency = "USD"
        for symbol, curr in cls.CURRENCY_SYMBOLS.items():
            if symbol in price_text:
                currency = curr
                price_text = price_text.replace(symbol, '')
                break
        
        # Limpiar caracteres no numéricos excepto punto y coma
        import re
        price_text = re.sub(r'[^\d.,]', '', price_text)
        
        # Convertir coma a punto si es necesario
        if ',' in price_text and '.' in price_text:
            # Formato europeo: 1.234,56
            if price_text.rfind(',') > price_text.rfind('.'):
                price_text = price_text.replace('.', '').replace(',', '.')
            # Formato americano: 1,234.56
            else:
                price_text = price_text.replace(',', '')
        elif ',' in price_text:
            # Solo comas, verificar si es decimal
            parts = price_text.split(',')
            if len(parts) > 1 and len(parts[-1]) <= 2:
                # Probablemente decimal
                price_text = price_text.replace(',', '.')
            else:
                # Probablemente separador de miles
                price_text = price_text.replace(',', '')
        
        try:
            price = float(price_text)
            return price, currency
        except ValueError:
            return 0.0, currency

class ConditionMapper:
    """Mapeador de condiciones entre diferentes fuentes"""
    
    CONDITION_MAPPING = {
        'TCGPLAYER': {
            'Near Mint': 'NM',
            'Lightly Played': 'LP',
            'Moderately Played': 'MP',
            'Heavily Played': 'HP',
            'Damaged': 'DM'
        },
        'CARDMARKET': {
            'Mint': 'NM',
            'Near Mint': 'NM',
            'Slightly Played (SP)': 'LP',
            'Played (PL)': 'MP',
            'Heavily Played (HP)': 'HP',
            'Poor (PO)': 'DM'
        },
        'CARDKINGDOM': {
            'NM/Mint (NM/M)': 'NM',
            'Excellent (EX)': 'LP',
            'Very Good (VG)': 'MP',
            'Good (G)': 'HP',
            'Damaged (D/DM)': 'DM'
        }
    }
    
    @classmethod
    def normalize_condition(cls, condition: str, source: str) -> str:
        """Normaliza una condición desde una fuente específica"""
        if not condition:
            return "NM"
        
        condition = condition.strip()
        source_mapping = cls.CONDITION_MAPPING.get(source.upper(), {})
        
        # Buscar coincidencia exacta
        if condition in source_mapping:
            return source_mapping[condition]
        
        # Buscar coincidencia parcial
        for source_condition, normalized in source_mapping.items():
            if condition.lower() in source_condition.lower():
                return normalized
        
        # Si no se encuentra, intentar mapear directamente
        for normalized_condition in ['NM', 'LP', 'MP', 'HP', 'DM']:
            if normalized_condition.lower() in condition.lower():
                return normalized_condition
        
        return "NM"  # Por defecto

def create_card_price_from_dict(data: Dict[str, Any]) -> CardPrice:
    """Crea un CardPrice desde un diccionario"""
    return CardPrice(
        card_name=data.get('card_name', ''),
        set_name=data.get('set_name', ''),
        condition=data.get('condition', 'Near Mint'),
        price=data.get('price', 0.0),
        currency=data.get('currency', 'USD'),
        source=data.get('source', ''),
        url=data.get('url', ''),
        scraped_at=data.get('scraped_at', ''),
        game_code=data.get('game_code', ''),
        collector_number=data.get('collector_number'),
        rarity=data.get('rarity'),
        is_foil=data.get('is_foil', False),
        is_etched=data.get('is_etched', False),
        is_alt_art=data.get('is_alt_art', False),
        is_first_edition=data.get('is_first_edition', False),
        tcg_specific_attributes=data.get('tcg_specific_attributes', {}),
        tcg_specific_printing_attributes=data.get('tcg_specific_printing_attributes', {}),
        price_type=data.get('price_type', 'market'),
        stock_quantity=data.get('stock_quantity')
    )

def create_card_data_from_dict(data: Dict[str, Any]) -> CardData:
    """Crea un CardData desde un diccionario"""
    return CardData(
        card_name=data.get('card_name', ''),
        game_code=data.get('game_code', ''),
        type_line=data.get('type_line'),
        oracle_text=data.get('oracle_text'),
        mana_cost=data.get('mana_cost'),
        power=data.get('power'),
        toughness=data.get('toughness'),
        base_rarity=data.get('base_rarity'),
        hp=data.get('hp'),
        level=data.get('level'),
        color=data.get('color'),
        attribute=data.get('attribute'),
        loyalty=data.get('loyalty'),
        defense=data.get('defense'),
        tcg_specific_attributes=data.get('tcg_specific_attributes', {}),
        set_code=data.get('set_code'),
        collector_number=data.get('collector_number'),
        rarity=data.get('rarity'),
        artist=data.get('artist'),
        is_foil=data.get('is_foil', False),
        is_etched=data.get('is_etched', False),
        is_alt_art=data.get('is_alt_art', False),
        is_first_edition=data.get('is_first_edition', False),
        is_full_art=data.get('is_full_art', False),
        is_borderless=data.get('is_borderless', False),
        is_showcase=data.get('is_showcase', False),
        is_promo=data.get('is_promo', False),
        promo_type=data.get('promo_type'),
        frame_effects=data.get('frame_effects', []),
        border_color=data.get('border_color'),
        tcg_specific_printing_attributes=data.get('tcg_specific_printing_attributes', {}),
        image_url_small=data.get('image_url_small'),
        image_url_normal=data.get('image_url_normal'),
        image_url_large=data.get('image_url_large')
    )

@dataclass
class CardVariant:
    """Modelo para variantes específicas de cartas (arte alternativo, foil, ediciones, etc.)"""
    variant_id: str
    card_name: str
    game_code: str
    set_code: str
    collector_number: str
    
    # Identificadores únicos
    illustration_id: Optional[str] = None
    tcgplayer_id: Optional[str] = None
    cardmarket_id: Optional[str] = None
    scryfall_id: Optional[str] = None
    
    # Tipos de variantes
    art_variant_type: Optional[str] = None  # alt_art, manga_rare, showcase, etc.
    foil_type: Optional[str] = None  # regular, etched, glossy, rainbow, etc.
    edition: Optional[str] = None  # 1st, unlimited, etc.
    treatment: Optional[str] = None  # showcase, borderless, full_art, etc.
    promo_type: Optional[str] = None  # prerelease, fnm, judge, etc.
    
    # Atributos específicos por TCG
    tcg_specific_variant_attributes: Dict[str, Any] = field(default_factory=dict)
    
    # URLs de imágenes para esta variante específica
    image_url_small: Optional[str] = None
    image_url_normal: Optional[str] = None
    image_url_large: Optional[str] = None
    image_url_art_crop: Optional[str] = None
    
    # Metadatos
    artist: Optional[str] = None
    release_date: Optional[str] = None
    is_secret_rare: bool = False
    is_parallel_rare: bool = False
    
    def __post_init__(self):
        """Generar variant_id si no se proporciona"""
        if not self.variant_id:
            base_id = f"{self.game_code}_{self.set_code}_{self.collector_number}"
            variant_suffix = []
            
            if self.art_variant_type:
                variant_suffix.append(self.art_variant_type)
            if self.foil_type and self.foil_type != "regular":
                variant_suffix.append(self.foil_type)
            if self.edition:
                variant_suffix.append(self.edition)
            if self.treatment:
                variant_suffix.append(self.treatment)
            
            if variant_suffix:
                self.variant_id = f"{base_id}_{'_'.join(variant_suffix)}"
            else:
                self.variant_id = base_id

class VariantDetector:
    """Detector inteligente de variantes de cartas basado en patrones y metadatos"""
    
    # Patrones de detección por TCG
    VARIANT_PATTERNS = {
        'MTG': {
            'art_variant': [
                'alt art', 'alternate art', 'showcase', 'borderless', 'full art',
                'extended art', 'secret lair', 'promo', 'prerelease', 'fnm'
            ],
            'foil_type': [
                'foil', 'etched foil', 'glossy foil', 'rainbow foil', 'retro foil',
                'textured foil', 'galaxy foil', 'cosmic foil'
            ],
            'treatment': [
                'showcase', 'borderless', 'full art', 'extended art', 'retro frame',
                'modern frame', 'old border', 'new border'
            ]
        },
        'POKEMON': {
            'art_variant': [
                'alt art', 'alternate art', 'full art', 'rainbow rare', 'gold rare',
                'shiny vault', 'secret rare', 'ultra rare', 'character rare'
            ],
            'foil_type': [
                'holo', 'reverse holo', 'rainbow holo', 'gold holo', 'shiny'
            ],
            'treatment': [
                'full art', 'rainbow', 'gold', 'shiny', 'character art'
            ]
        },
        'YUGIOH': {
            'art_variant': [
                'alt art', 'alternate art', 'secret rare', 'ultimate rare', 'ghost rare',
                'starlight rare', 'platinum rare', 'gold rare'
            ],
            'foil_type': [
                'foil', 'secret foil', 'ultimate foil', 'ghost foil', 'starlight foil'
            ],
            'treatment': [
                'secret rare', 'ultimate rare', 'ghost rare', 'starlight rare'
            ]
        },
        'LORCANA': {
            'art_variant': [
                'alt art', 'alternate art', 'enchanted', 'promo', 'prerelease'
            ],
            'foil_type': [
                'foil', 'enchanted foil', 'rainbow foil'
            ],
            'treatment': [
                'enchanted', 'promo', 'prerelease'
            ]
        },
        'FAB': {
            'art_variant': [
                'alt art', 'alternate art', 'cold foil', 'rainbow foil', 'marvel'
            ],
            'foil_type': [
                'foil', 'cold foil', 'rainbow foil', 'marvel foil'
            ],
            'treatment': [
                'cold foil', 'rainbow foil', 'marvel'
            ]
        },
        'ONEPIECE': {
            'art_variant': [
                'alt art', 'alternate art', 'manga rare', 'parallel rare', 'secret rare',
                'leader rare', 'character rare'
            ],
            'foil_type': [
                'foil', 'manga foil', 'parallel foil', 'secret foil'
            ],
            'treatment': [
                'manga rare', 'parallel rare', 'secret rare', 'leader rare'
            ]
        },
        'WIXOSS': {
            'art_variant': [
                'alt art', 'alternate art', 'secret rare', 'parallel rare'
            ],
            'foil_type': [
                'foil', 'secret foil', 'parallel foil'
            ],
            'treatment': [
                'secret rare', 'parallel rare'
            ]
        }
    }
    
    @classmethod
    def detect_variant_from_text(cls, text: str, game_code: str) -> Dict[str, str]:
        """Detecta variantes basándose en texto descriptivo"""
        if not text or game_code not in cls.VARIANT_PATTERNS:
            return {}
        
        text_lower = text.lower()
        patterns = cls.VARIANT_PATTERNS[game_code]
        detected_variants = {}
        
        # Detectar tipo de arte alternativo
        for pattern in patterns.get('art_variant', []):
            if pattern in text_lower:
                detected_variants['art_variant_type'] = pattern
                break
        
        # Detectar tipo de foil
        for pattern in patterns.get('foil_type', []):
            if pattern in text_lower:
                detected_variants['foil_type'] = pattern
                break
        
        # Detectar tratamiento especial
        for pattern in patterns.get('treatment', []):
            if pattern in text_lower:
                detected_variants['treatment'] = pattern
                break
        
        # Detectar edición
        if '1st' in text_lower or 'first edition' in text_lower:
            detected_variants['edition'] = '1st'
        elif 'unlimited' in text_lower:
            detected_variants['edition'] = 'unlimited'
        
        # Detectar promos
        if 'promo' in text_lower:
            detected_variants['promo_type'] = 'promo'
        elif 'prerelease' in text_lower:
            detected_variants['promo_type'] = 'prerelease'
        elif 'fnm' in text_lower or 'friday night magic' in text_lower:
            detected_variants['promo_type'] = 'fnm'
        
        return detected_variants
    
    @classmethod
    def detect_variant_from_url(cls, url: str, game_code: str) -> Dict[str, str]:
        """Detecta variantes basándose en patrones de URL"""
        if not url or game_code not in cls.VARIANT_PATTERNS:
            return {}
        
        url_lower = url.lower()
        detected_variants = {}
        
        # Patrones específicos por marketplace
        if 'cardmarket.com' in url_lower:
            if '/foil/' in url_lower or url_lower.endswith('/foil'):
                detected_variants['foil_type'] = 'foil'
            if '/etched/' in url_lower or url_lower.endswith('/etched'):
                detected_variants['foil_type'] = 'etched foil'
            if '/alt-art/' in url_lower or '/alternate-art/' in url_lower:
                detected_variants['art_variant_type'] = 'alt art'
        
        elif 'tcgplayer.com' in url_lower:
            if '/foil' in url_lower:
                detected_variants['foil_type'] = 'foil'
            if '/etched' in url_lower:
                detected_variants['foil_type'] = 'etched foil'
            if '/alt-art' in url_lower:
                detected_variants['art_variant_type'] = 'alt art'
        
        elif 'cardkingdom.com' in url_lower:
            if '/foil' in url_lower:
                detected_variants['foil_type'] = 'foil'
            if '/etched' in url_lower:
                detected_variants['foil_type'] = 'etched foil'
        
        return detected_variants

class CardIdentifier:
    """Sistema de identificadores únicos para correlación entre plataformas"""
    
    def __init__(self):
        self.identifiers = {}
    
    def add_identifier(self, card_name: str, game_code: str, identifier_type: str, value: str):
        """Agrega un identificador para una carta"""
        key = f"{game_code}_{card_name}"
        if key not in self.identifiers:
            self.identifiers[key] = {}
        
        self.identifiers[key][identifier_type] = value
    
    def get_identifiers(self, card_name: str, game_code: str) -> Dict[str, str]:
        """Obtiene todos los identificadores para una carta"""
        key = f"{game_code}_{card_name}"
        return self.identifiers.get(key, {})
    
    def find_card_by_identifier(self, identifier_type: str, value: str) -> Optional[Tuple[str, str]]:
        """Encuentra una carta por su identificador"""
        for key, ids in self.identifiers.items():
            if ids.get(identifier_type) == value:
                game_code, card_name = key.split('_', 1)
                return (game_code, card_name)
        return None
    
    def correlate_cards(self, card_name: str, game_code: str, set_code: Optional[str] = None) -> List[Dict[str, str]]:
        """Correlaciona una carta con sus equivalentes en otras plataformas"""
        identifiers = self.get_identifiers(card_name, game_code)
        correlations = []
        
        # Buscar por identificadores conocidos
        for id_type, value in identifiers.items():
            if value:
                correlations.append({
                    'identifier_type': id_type,
                    'value': value,
                    'source': 'direct_match'
                })
        
        # Buscar por nombre y set (coincidencia difusa)
        if set_code:
            for key, ids in self.identifiers.items():
                other_game, other_name = key.split('_', 1)
                if other_game == game_code and other_name.lower() == card_name.lower():
                    correlations.append({
                        'identifier_type': 'name_set_match',
                        'value': f"{other_name}_{set_code}",
                        'source': 'fuzzy_match'
                    })
        
        return correlations 