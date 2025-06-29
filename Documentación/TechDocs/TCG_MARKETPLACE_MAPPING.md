# Mapeo de TCG por Marketplace

## 📊 Resumen de Cobertura por Marketplace

| Marketplace | MTG | Pokémon | Lorcana | FAB | Yu-Gi-Oh! | Wixoss | One Piece |
|-------------|-----|---------|---------|-----|-----------|--------|-----------|
| **Cardmarket** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **TCGplayer** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Card Kingdom** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Troll and Toad** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

## 🔍 Detalles por Marketplace

### 1. Cardmarket (Europa)

**URL Base**: `https://www.cardmarket.com`

#### ✅ **Magic: The Gathering**
- **URL Pattern**: `/en/Magic/Products/Singles/{set}/{card}`
- **Ejemplo**: `https://www.cardmarket.com/en/Magic/Products/Singles/Commander-Masters/Sol-Ring`
- **Detectores**: `/magic/`, `/Magic/`

#### ✅ **Pokémon TCG**
- **URL Pattern**: `/en/Pokemon/Products/Singles/{set}/{card}`
- **Ejemplo**: `https://www.cardmarket.com/en/Pokemon/Products/Singles/Base-Set/Charizard`
- **Detectores**: `/pokemon/`, `/Pokemon/`

#### ✅ **Lorcana**
- **URL Pattern**: `/en/Lorcana/Products/Singles/{set}/{card}`
- **Ejemplo**: `https://www.cardmarket.com/en/Lorcana/Products/Singles/The-First-Chapter/Elsa-Spirit-of-Winter`
- **Detectores**: `/lorcana/`, `/Lorcana/`

#### ✅ **Flesh and Blood**
- **URL Pattern**: `/en/Flesh-and-Blood/Products/Singles/{set}/{card}`
- **Ejemplo**: `https://www.cardmarket.com/en/Flesh-and-Blood/Products/Singles/Monarch/Prism`
- **Detectores**: `/flesh-and-blood/`, `/Flesh-and-Blood/`

#### ✅ **Yu-Gi-Oh!**
- **URL Pattern**: `/en/YuGiOh/Products/Singles/{set}/{card}`
- **Ejemplo**: `https://www.cardmarket.com/en/YuGiOh/Products/Singles/Legend-of-Blue-Eyes-White-Dragon/Blue-Eyes-White-Dragon`
- **Detectores**: `/yugioh/`, `/YuGiOh/`

#### ✅ **Wixoss**
- **URL Pattern**: `/en/Wixoss/Products/Singles/{set}/{card}`
- **Ejemplo**: `https://www.cardmarket.com/en/Wixoss/Products/Singles/Peeping-Analyze/Tama`
- **Detectores**: `/wixoss/`, `/Wixoss/`

#### ✅ **One Piece TCG**
- **URL Pattern**: `/en/One-Piece/Products/Singles/{set}/{card}`
- **Ejemplo**: `https://www.cardmarket.com/en/One-Piece/Products/Singles/OP-01-Romance-Dawn/Luffy`
- **Detectores**: `/one-piece/`, `/One-Piece/`

---

### 2. TCGplayer (Norteamérica)

**URL Base**: `https://www.tcgplayer.com`

#### ✅ **Magic: The Gathering**
- **URL Pattern**: `/product/{product_id}/{card-name}`
- **Ejemplo**: `https://www.tcgplayer.com/product/12345/sol-ring`
- **Detectores**: `/magic/`, `magic-the-gathering`

#### ✅ **Pokémon TCG**
- **URL Pattern**: `/product/{product_id}/{card-name}`
- **Ejemplo**: `https://www.tcgplayer.com/product/67890/charizard`
- **Detectores**: `/pokemon/`, `pokemon`

#### ✅ **Lorcana**
- **URL Pattern**: `/product/{product_id}/{card-name}`
- **Ejemplo**: `https://www.tcgplayer.com/product/11111/elsa-spirit-of-winter`
- **Detectores**: `/lorcana/`, `lorcana`

#### ✅ **Flesh and Blood**
- **URL Pattern**: `/product/{product_id}/{card-name}`
- **Ejemplo**: `https://www.tcgplayer.com/product/22222/prism`
- **Detectores**: `/flesh-and-blood/`, `flesh-and-blood`

#### ✅ **Yu-Gi-Oh!**
- **URL Pattern**: `/product/{product_id}/{card-name}`
- **Ejemplo**: `https://www.tcgplayer.com/product/33333/blue-eyes-white-dragon`
- **Detectores**: `/yugioh/`, `yugioh`

#### ❌ **Wixoss**
- **Estado**: No disponible
- **Nota**: TCGplayer no vende cartas de Wixoss

#### ✅ **One Piece TCG**
- **URL Pattern**: `/product/{product_id}/{card-name}`
- **Ejemplo**: `https://www.tcgplayer.com/product/44444/luffy`
- **Detectores**: `/one-piece/`, `one-piece`

---

### 3. Card Kingdom (Norteamérica)

**URL Base**: `https://www.cardkingdom.com`

#### ✅ **Magic: The Gathering**
- **URL Pattern**: `/catalog/magic_the_gathering/search?search=general&filter[name]={card}`
- **Ejemplo**: `https://www.cardkingdom.com/catalog/magic_the_gathering/search?search=general&filter[name]=sol+ring`
- **Detectores**: `/magic_the_gathering/`, `magic-the-gathering`

#### ✅ **Pokémon TCG**
- **URL Pattern**: `/catalog/pokemon/search?search=general&filter[name]={card}`
- **Ejemplo**: `https://www.cardkingdom.com/catalog/pokemon/search?search=general&filter[name]=charizard`
- **Detectores**: `/pokemon/`, `pokemon`

#### ✅ **Lorcana**
- **URL Pattern**: `/catalog/lorcana/search?search=general&filter[name]={card}`
- **Ejemplo**: `https://www.cardkingdom.com/catalog/lorcana/search?search=general&filter[name]=elsa`
- **Detectores**: `/lorcana/`, `lorcana`

#### ✅ **Flesh and Blood**
- **URL Pattern**: `/catalog/flesh_and_blood/search?search=general&filter[name]={card}`
- **Ejemplo**: `https://www.cardkingdom.com/catalog/flesh_and_blood/search?search=general&filter[name]=prism`
- **Detectores**: `/flesh_and_blood/`, `flesh-and-blood`

#### ✅ **Yu-Gi-Oh!**
- **URL Pattern**: `/catalog/yugioh/search?search=general&filter[name]={card}`
- **Ejemplo**: `https://www.cardkingdom.com/catalog/yugioh/search?search=general&filter[name]=blue+eyes`
- **Detectores**: `/yugioh/`, `yugioh`

#### ❌ **Wixoss**
- **Estado**: No disponible
- **Nota**: Card Kingdom no vende cartas de Wixoss

#### ✅ **One Piece TCG**
- **URL Pattern**: `/catalog/one_piece/search?search=general&filter[name]={card}`
- **Ejemplo**: `https://www.cardkingdom.com/catalog/one_piece/search?search=general&filter[name]=luffy`
- **Detectores**: `/one_piece/`, `one-piece`

---

### 4. Troll and Toad (Norteamérica)

**URL Base**: `https://www.trollandtoad.com`

#### ✅ **Magic: The Gathering**
- **URL Pattern**: `/magic-the-gathering/singles/{set}/{card}`
- **Ejemplo**: `https://www.trollandtoad.com/magic-the-gathering/singles/commander-masters/sol-ring`
- **Detectores**: `/magic-the-gathering/`, `magic-the-gathering`

#### ✅ **Pokémon TCG**
- **URL Pattern**: `/pokemon/singles/{set}/{card}`
- **Ejemplo**: `https://www.trollandtoad.com/pokemon/singles/base-set/charizard`
- **Detectores**: `/pokemon/`, `pokemon`

#### ✅ **Lorcana**
- **URL Pattern**: `/lorcana/singles/{set}/{card}`
- **Ejemplo**: `https://www.trollandtoad.com/lorcana/singles/the-first-chapter/elsa`
- **Detectores**: `/lorcana/`, `lorcana`

#### ✅ **Flesh and Blood**
- **URL Pattern**: `/flesh-and-blood/singles/{set}/{card}`
- **Ejemplo**: `https://www.trollandtoad.com/flesh-and-blood/singles/monarch/prism`
- **Detectores**: `/flesh-and-blood/`, `flesh-and-blood`

#### ✅ **Yu-Gi-Oh!**
- **URL Pattern**: `/yugioh/singles/{set}/{card}`
- **Ejemplo**: `https://www.trollandtoad.com/yugioh/singles/legend-of-blue-eyes/blue-eyes-white-dragon`
- **Detectores**: `/yugioh/`, `yugioh`

#### ❌ **Wixoss**
- **Estado**: No disponible
- **Nota**: Troll and Toad no vende cartas de Wixoss

#### ✅ **One Piece TCG**
- **URL Pattern**: `/one-piece/singles/{set}/{card}`
- **Ejemplo**: `https://www.trollandtoad.com/one-piece/singles/op-01-romance-dawn/luffy`
- **Detectores**: `/one-piece/`, `one-piece`

---

## 🎯 Implementación en el Sistema

### Detección Automática Mejorada

```python
class TCGMarketplaceMapper:
    """Mapeador de TCG por marketplace"""
    
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
            'MTG': ['/magic/', 'magic-the-gathering'],
            'POKEMON': ['/pokemon/', 'pokemon'],
            'LORCANA': ['/lorcana/', 'lorcana'],
            'FAB': ['/flesh-and-blood/', 'flesh-and-blood'],
            'YUGIOH': ['/yugioh/', 'yugioh'],
            'ONEPIECE': ['/one-piece/', 'one-piece']
            # WIXOSS no disponible
        },
        'cardkingdom': {
            'MTG': ['/magic_the_gathering/', 'magic-the-gathering'],
            'POKEMON': ['/pokemon/', 'pokemon'],
            'LORCANA': ['/lorcana/', 'lorcana'],
            'FAB': ['/flesh_and_blood/', 'flesh-and-blood'],
            'YUGIOH': ['/yugioh/', 'yugioh'],
            'ONEPIECE': ['/one_piece/', 'one-piece']
            # WIXOSS no disponible
        },
        'trollandtoad': {
            'MTG': ['/magic-the-gathering/', 'magic-the-gathering'],
            'POKEMON': ['/pokemon/', 'pokemon'],
            'LORCANA': ['/lorcana/', 'lorcana'],
            'FAB': ['/flesh-and-blood/', 'flesh-and-blood'],
            'YUGIOH': ['/yugioh/', 'yugioh'],
            'ONEPIECE': ['/one-piece/', 'one-piece']
            # WIXOSS no disponible
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
```

### Validación en el Scraper

```python
def scrape_card(self, card_data: Dict[str, Any]) -> ScrapingResult:
    """Scrapear una carta individual con validación de marketplace"""
    try:
        source = card_data.get('source', '').lower()
        url = card_data.get('url', '')
        card_name = card_data.get('card_name', '')
        
        # Detectar TCG
        game_code = card_data.get('game_code', '')
        if not game_code:
            game_code = TCGMarketplaceMapper.detect_tcg_from_url(url, source)
        
        # Validar si el TCG está soportado en este marketplace
        if game_code and not TCGMarketplaceMapper.is_tcg_supported(game_code, source):
            return ScrapingResult(
                success=False,
                card_name=card_name,
                source=source,
                error_message=f"TCG {game_code} no está soportado en {source}",
                url=url,
                scraped_at=datetime.utcnow().isoformat()
            )
        
        # Continuar con el scraping...
        
    except Exception as e:
        # Manejo de errores...
```

## 📋 Recomendaciones de Uso

### 1. **Para Wixoss**
- **Usar solo Cardmarket** ya que es el único marketplace que lo soporta
- **Considerar APIs japonesas** para datos más completos

### 2. **Para Lorcana**
- **Cardmarket** tiene la mejor cobertura en Europa
- **TCGplayer y Card Kingdom** tienen buena cobertura en Norteamérica

### 3. **Para Flesh and Blood**
- **Todos los marketplaces principales** lo soportan
- **Cardmarket** puede tener precios más competitivos en Europa

### 4. **Para One Piece TCG**
- **Relativamente nuevo**, verificar disponibilidad
- **Cardmarket** puede tener mejor cobertura inicial

## 🔄 Actualización del Sistema

Este mapeo debe integrarse en:

1. **`models.py`** - Agregar la clase `TCGMarketplaceMapper`
2. **`main.py`** - Actualizar la detección de TCG
3. **Scrapers individuales** - Validar soporte antes de scrapear
4. **Documentación** - Incluir esta información en las guías

Esto hará que el sistema sea mucho más inteligente y evite intentar scrapear TCGs que no están disponibles en ciertos marketplaces. 