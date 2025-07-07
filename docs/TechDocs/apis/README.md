# APIs y Integraciones

## Visión General

Esta documentación cubre todas las integraciones con APIs externas necesarias para el funcionamiento de la Plataforma Agregadora de Precios TCG. Utilizamos un enfoque híbrido que combina APIs específicas de cada juego con agregadores comerciales.

## Estrategia de Integración

### 1. APIs Específicas del Juego
- **Propósito**: Datos canónicos de cartas, sets, imágenes y reglas
- **Fuentes**: Scryfall (MTG), Pokémon TCG API, etc.
- **Ventajas**: Datos precisos y actualizados, imágenes de alta calidad

### 2. APIs de Agregadores Comerciales
- **Propósito**: Datos de precios de múltiples TCGs
- **Fuentes**: JustTCG, Cardhedger
- **Ventajas**: Reduce complejidad, datos históricos, soporte comercial

### 3. Web Scraping (Último Recurso)
- **Propósito**: Mercados sin API pública
- **Fuentes**: Cardmarket, tiendas específicas
- **Herramientas**: Apify, servicios de scraping especializados

## API 1: Scryfall (Magic: The Gathering)

### Información General
- **URL Base**: `https://api.scryfall.com`
- **Autenticación**: No requerida
- **Límites**: 10 peticiones por segundo
- **Documentación**: [https://scryfall.com/docs/api](https://scryfall.com/docs/api)

### Endpoints Principales

#### 1. Búsqueda de Cartas
```http
GET /cards/search?q={query}
```

**Parámetros:**
- `q`: Query de búsqueda (requerido)
- `page`: Número de página (opcional)
- `unique`: Tipo de unicidad (opcional)

**Ejemplo de Petición:**
```bash
curl "https://api.scryfall.com/cards/search?q=sol+ring"
```

**Ejemplo de Respuesta:**
```json
{
  "object": "list",
  "total_cards": 1,
  "has_more": false,
  "data": [
    {
      "object": "card",
      "id": "b30d345c-dc99-42be-98fb-42045c9b74e8",
      "name": "Sol Ring",
      "type_line": "Artifact",
      "oracle_text": "{T}: Add {C}{C}.",
      "mana_cost": "{1}",
      "rarity": "uncommon",
      "set": "c21",
      "set_name": "Commander 2021",
      "collector_number": "127",
      "image_uris": {
        "small": "https://cards.scryfall.io/small/front/b/3/b30d345c-dc99-42be-98fb-42045c9b74e8.jpg",
        "normal": "https://cards.scryfall.io/normal/front/b/3/b30d345c-dc99-42be-98fb-42045c9b74e8.jpg",
        "large": "https://cards.scryfall.io/large/front/b/3/b30d345c-dc99-42be-98fb-42045c9b74e8.jpg"
      },
      "prices": {
        "usd": "1.23",
        "usd_foil": "2.54",
        "eur": "1.50",
        "eur_foil": "3.00"
      }
    }
  ]
}
```

#### 2. Obtener Carta por ID
```http
GET /cards/{id}
```

**Ejemplo:**
```bash
curl "https://api.scryfall.com/cards/b30d345c-dc99-42be-98fb-42045c9b74e8"
```

#### 3. Obtener Sets
```http
GET /sets
```

**Ejemplo de Respuesta:**
```json
{
  "object": "list",
  "data": [
    {
      "object": "set",
      "id": "c21",
      "code": "c21",
      "name": "Commander 2021",
      "released_at": "2021-04-23",
      "digital": false,
      "set_type": "commander"
    }
  ]
}
```

### Implementación en el Sistema

```typescript
// services/scryfall.ts
export class ScryfallService {
  private baseUrl = 'https://api.scryfall.com';
  private rateLimiter = new RateLimiter(10, 1000); // 10 requests per second

  async searchCards(query: string, page: number = 1): Promise<ScryfallSearchResponse> {
    await this.rateLimiter.wait();
    
    const response = await fetch(
      `${this.baseUrl}/cards/search?q=${encodeURIComponent(query)}&page=${page}`
    );
    
    if (!response.ok) {
      throw new Error(`Scryfall API error: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getCardById(id: string): Promise<ScryfallCard> {
    await this.rateLimiter.wait();
    
    const response = await fetch(`${this.baseUrl}/cards/${id}`);
    
    if (!response.ok) {
      throw new Error(`Card not found: ${id}`);
    }
    
    return response.json();
  }

  async getAllSets(): Promise<ScryfallSet[]> {
    await this.rateLimiter.wait();
    
    const response = await fetch(`${this.baseUrl}/sets`);
    const data = await response.json();
    
    return data.data;
  }
}
```

## API 2: Pokémon TCG API

### Información General
- **URL Base**: `https://api.pokemontcg.io/v2`
- **Autenticación**: Opcional (clave API para límites más altos)
- **Límites**: 1000 peticiones por mes (gratis), 10000+ (con API key)
- **Documentación**: [https://pokemontcg.io/](https://pokemontcg.io/)

### Endpoints Principales

#### 1. Búsqueda de Cartas
```http
GET /cards?q=name:{cardName}
```

**Parámetros:**
- `q`: Query de búsqueda
- `page`: Número de página
- `pageSize`: Tamaño de página (máx 250)

**Ejemplo de Petición:**
```bash
curl "https://api.pokemontcg.io/v2/cards?q=name:charizard"
```

**Ejemplo de Respuesta:**
```json
{
  "data": [
    {
      "id": "base1-4",
      "name": "Charizard",
      "supertype": "Pokémon",
      "subtypes": ["Stage 2"],
      "level": "76",
      "hp": "120",
      "types": ["Fire"],
      "attacks": [
        {
          "name": "Fire Spin",
          "cost": ["Fire", "Fire", "Fire", "Fire"],
          "convertedEnergyCost": 4,
          "damage": "100",
          "text": "Discard 2 Energy cards attached to Charizard in order to use this attack."
        }
      ],
      "images": {
        "small": "https://images.pokemontcg.io/base1/4.png",
        "large": "https://images.pokemontcg.io/base1/4_hires.png"
      },
      "tcgplayer": {
        "url": "https://prices.pokemontcg.io/tcgplayer/base1-4",
        "updatedAt": "2025/06/28",
        "prices": {
          "holofoil": {
            "low": 200.0,
            "mid": 350.0,
            "high": 999.99,
            "market": 320.55
          }
        }
      }
    }
  ],
  "page": 1,
  "pageSize": 250,
  "count": 1,
  "totalCount": 1
}
```

#### 2. Obtener Sets
```http
GET /sets
```

### Implementación en el Sistema

```typescript
// services/pokemon-tcg.ts
export class PokemonTCGService {
  private baseUrl = 'https://api.pokemontcg.io/v2';
  private apiKey = process.env.POKEMON_TCG_API_KEY;

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (this.apiKey) {
      headers['X-Api-Key'] = this.apiKey;
    }
    
    return headers;
  }

  async searchCards(query: string, page: number = 1): Promise<PokemonTCGSearchResponse> {
    const response = await fetch(
      `${this.baseUrl}/cards?q=${encodeURIComponent(query)}&page=${page}`,
      { headers: this.getHeaders() }
    );
    
    if (!response.ok) {
      throw new Error(`Pokémon TCG API error: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getCardById(id: string): Promise<PokemonTCGCard> {
    const response = await fetch(
      `${this.baseUrl}/cards/${id}`,
      { headers: this.getHeaders() }
    );
    
    if (!response.ok) {
      throw new Error(`Card not found: ${id}`);
    }
    
    return response.json();
  }
}
```

## API 3: JustTCG (Agregador Comercial)

### Información General
- **URL Base**: `https://api.justtcg.com/v1` (conceptual)
- **Autenticación**: Requerida (API key de pago)
- **Límites**: Según plan de suscripción
- **Ventajas**: Datos de múltiples TCGs, precios históricos, por condición

### Endpoints Principales

#### 1. Obtener Precios de Carta
```http
GET /prices?game={game}&name={cardName}&set={setCode}&condition={condition}&foil={boolean}
```

**Parámetros:**
- `game`: Código del juego (MTG, POKEMON, LORCANA, etc.)
- `name`: Nombre de la carta
- `set`: Código del set (opcional)
- `condition`: Condición (NM, LP, MP, HP, DM)
- `foil`: Si es foil (true/false)

**Ejemplo de Respuesta (Conceptual):**
```json
{
  "card_name": "Elsa - Spirit of Winter",
  "game": "Lorcana",
  "set": "The First Chapter",
  "condition": "Near Mint",
  "is_foil": true,
  "prices": {
    "tcgplayer": { 
      "market": 45.50,
      "low": 42.00,
      "high": 49.99
    },
    "cardkingdom": { 
      "retail": 52.99,
      "buylist": 28.00
    },
    "cardmarket": { 
      "trend": 42.00,
      "low": 38.50,
      "high": 48.00
    }
  },
  "price_history": [
    {
      "date": "2025-06-28",
      "avg_price": 45.50,
      "volume": 15
    }
  ],
  "last_updated": "2025-06-28T14:30:00Z"
}
```

### Implementación en el Sistema

```typescript
// services/just-tcg.ts
export class JustTCGService {
  private baseUrl = 'https://api.justtcg.com/v1';
  private apiKey = process.env.JUSTTCG_API_KEY;

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };
  }

  async getCardPrices(params: {
    game: string;
    name: string;
    set?: string;
    condition?: string;
    foil?: boolean;
  }): Promise<JustTCGPriceResponse> {
    const queryParams = new URLSearchParams({
      game: params.game,
      name: params.name,
      ...(params.set && { set: params.set }),
      ...(params.condition && { condition: params.condition }),
      ...(params.foil !== undefined && { foil: params.foil.toString() })
    });

    const response = await fetch(
      `${this.baseUrl}/prices?${queryParams}`,
      { headers: this.getHeaders() }
    );
    
    if (!response.ok) {
      throw new Error(`JustTCG API error: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getBulkPrices(cards: Array<{
    game: string;
    name: string;
    set?: string;
    condition?: string;
    foil?: boolean;
  }>): Promise<JustTCGPriceResponse[]> {
    const response = await fetch(
      `${this.baseUrl}/prices/bulk`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ cards })
      }
    );
    
    if (!response.ok) {
      throw new Error(`JustTCG bulk API error: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

## API 4: Apify (Web Scraping)

### Información General
- **URL Base**: `https://api.apify.com/v2`
- **Autenticación**: Token de API
- **Propósito**: Web scraping de Cardmarket y otras fuentes
- **Documentación**: [https://apify.com/docs](https://apify.com/docs)

### Configuración de Scraper

#### 1. Cardmarket Trend Scraper
```typescript
// services/apify.ts
export class ApifyService {
  private baseUrl = 'https://api.apify.com/v2';
  private apiToken = process.env.APIFY_API_TOKEN;

  async scrapeCardmarket(cardUrl: string): Promise<CardmarketData> {
    const response = await fetch(
      `${this.baseUrl}/acts/ecomscrape~cardmarket-trend-scraper/runs`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`
        },
        body: JSON.stringify({
          "cardUrl": cardUrl,
          "maxRequestRetries": 3,
          "maxConcurrency": 1
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Apify API error: ${response.statusText}`);
    }

    const run = await response.json();
    
    // Esperar a que termine el scraping
    return this.waitForRunCompletion(run.id);
  }

  private async waitForRunCompletion(runId: string): Promise<CardmarketData> {
    while (true) {
      const response = await fetch(
        `${this.baseUrl}/acts/ecomscrape~cardmarket-trend-scraper/runs/${runId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`
          }
        }
      );

      const run = await response.json();
      
      if (run.status === 'SUCCEEDED') {
        return this.getRunResults(runId);
      } else if (run.status === 'FAILED') {
        throw new Error(`Scraping failed: ${run.meta.errorMessage}`);
      }
      
      // Esperar 5 segundos antes de verificar de nuevo
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  private async getRunResults(runId: string): Promise<CardmarketData> {
    const response = await fetch(
      `${this.baseUrl}/acts/ecomscrape~cardmarket-trend-scraper/runs/${runId}/dataset/items`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      }
    );

    const results = await response.json();
    return results[0]; // Asumiendo que solo scrapeamos una carta
  }
}
```

## Gestión de Rate Limiting

### Implementación de Rate Limiter

```typescript
// utils/rate-limiter.ts
export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindow: number;

  constructor(maxRequests: number, timeWindow: number) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    
    // Limpiar requests antiguos
    this.requests = this.requests.filter(
      time => now - time < this.timeWindow
    );
    
    // Si hemos alcanzado el límite, esperar
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // Agregar este request
    this.requests.push(now);
  }
}
```

## Gestión de Errores y Fallbacks

### Estrategia de Fallback

```typescript
// services/price-aggregator.ts
export class PriceAggregatorService {
  constructor(
    private justTCGService: JustTCGService,
    private apifyService: ApifyService,
    private scryfallService: ScryfallService
  ) {}

  async getCardPrices(cardName: string, game: string, set?: string): Promise<PriceData> {
    const sources: Array<() => Promise<PriceData>> = [
      // Fuente principal
      () => this.justTCGService.getCardPrices({ game, name: cardName, set }),
      
      // Fallback 1: Scryfall (solo para MTG)
      ...(game === 'MTG' ? [
        () => this.scryfallService.searchCards(cardName)
      ] : []),
      
      // Fallback 2: Web scraping
      () => this.apifyService.scrapeCardmarket(`https://www.cardmarket.com/en/${game}/Products/Singles/${set}/${cardName}`)
    ];

    for (const source of sources) {
      try {
        const data = await source();
        if (data && Object.keys(data.prices || {}).length > 0) {
          return data;
        }
      } catch (error) {
        console.warn(`Price source failed:`, error);
        continue;
      }
    }

    throw new Error(`No price data available for ${cardName}`);
  }
}
```

## Configuración de Variables de Entorno

### Archivo `.env.local`
```bash
# API Keys
SCRYFALL_API_URL=https://api.scryfall.com
POKEMON_TCG_API_KEY=your-pokemon-api-key
JUSTTCG_API_KEY=your-justtcg-api-key
APIFY_API_TOKEN=your-apify-token

# Rate Limiting
SCRYFALL_RATE_LIMIT=10
POKEMON_TCG_RATE_LIMIT=100
JUSTTCG_RATE_LIMIT=1000
APIFY_RATE_LIMIT=50

# Timeouts
API_TIMEOUT=30000
SCRAPING_TIMEOUT=60000
```

## Monitoreo y Logging

### Logging de APIs

```typescript
// utils/api-logger.ts
export class APILogger {
  static logRequest(service: string, endpoint: string, params: any): void {
    console.log(`[${service}] Request to ${endpoint}:`, {
      timestamp: new Date().toISOString(),
      params,
      service
    });
  }

  static logResponse(service: string, endpoint: string, response: any, duration: number): void {
    console.log(`[${service}] Response from ${endpoint}:`, {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      status: response.status || 'success',
      service
    });
  }

  static logError(service: string, endpoint: string, error: Error): void {
    console.error(`[${service}] Error from ${endpoint}:`, {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      service
    });
  }
}
```

## Testing de APIs

### Tests Unitarios

```typescript
// tests/services/scryfall.test.ts
import { ScryfallService } from '../../services/scryfall';

describe('ScryfallService', () => {
  let service: ScryfallService;

  beforeEach(() => {
    service = new ScryfallService();
  });

  test('should search cards successfully', async () => {
    const result = await service.searchCards('sol ring');
    
    expect(result.data).toBeDefined();
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].name).toContain('Sol Ring');
  });

  test('should handle API errors gracefully', async () => {
    await expect(service.searchCards('')).rejects.toThrow();
  });
});
```

## Consideraciones de Seguridad

### Protección de API Keys

1. **Variables de Entorno**: Nunca hardcodear API keys
2. **Rotación**: Rotar API keys regularmente
3. **Monitoreo**: Monitorear uso de APIs para detectar abuso
4. **Rate Limiting**: Implementar rate limiting en el lado del servidor

### Validación de Datos

```typescript
// utils/validation.ts
export function validateCardName(name: string): boolean {
  return name.length > 0 && name.length <= 200;
}

export function validateGameCode(code: string): boolean {
  const validCodes = ['MTG', 'POKEMON', 'LORCANA', 'FAB', 'YUGIOH', 'WIXOSS', 'ONEPIECE'];
  return validCodes.includes(code.toUpperCase());
}

export function validateCondition(condition: string): boolean {
  const validConditions = ['NM', 'LP', 'MP', 'HP', 'DM'];
  return validConditions.includes(condition.toUpperCase());
}
``` 