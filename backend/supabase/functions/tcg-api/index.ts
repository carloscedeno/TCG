#!/usr/bin/env python3
"""
Script para crear Edge Functions de Supabase que exponen las APIs como endpoints REST
"""

import os
import json
from pathlib import Path

class SupabaseEdgeFunctions:
    def __init__(self):
        self.functions_dir = Path("supabase/functions")
        self.functions_dir.mkdir(parents=True, exist_ok=True)
    
    def create_tcg_api_function(self):
        """Crear función principal de API TCG"""
        function_code = '''
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    // Parse request body
    let body = {}
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      try {
        body = await req.json()
      } catch {
        body = {}
      }
    }

    // Route handling
    let response

    // Games endpoints
    if (path.startsWith('/api/games')) {
      response = await handleGamesEndpoint(supabase, path, method, body)
    }
    // Sets endpoints
    else if (path.startsWith('/api/sets')) {
      response = await handleSetsEndpoint(supabase, path, method, body)
    }
    // Cards endpoints
    else if (path.startsWith('/api/cards')) {
      response = await handleCardsEndpoint(supabase, path, method, body)
    }
    // Prices endpoints
    else if (path.startsWith('/api/prices')) {
      response = await handlePricesEndpoint(supabase, path, method, body)
    }
    // Search endpoints
    else if (path.startsWith('/api/search')) {
      response = await handleSearchEndpoint(supabase, path, method, body)
    }
    // Collections endpoints
    else if (path.startsWith('/api/collections')) {
      response = await handleCollectionsEndpoint(supabase, path, method, body)
    }
    // Watchlists endpoints
    else if (path.startsWith('/api/watchlists')) {
      response = await handleWatchlistsEndpoint(supabase, path, method, body)
    }
    // Statistics endpoints
    else if (path.startsWith('/api/stats')) {
      response = await handleStatsEndpoint(supabase, path, method, body)
    }
    else {
      response = {
        error: 'Endpoint not found',
        available_endpoints: [
          '/api/games',
          '/api/sets',
          '/api/cards',
          '/api/prices',
          '/api/search',
          '/api/collections',
          '/api/watchlists',
          '/api/stats'
        ]
      }
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.error ? 400 : 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Games endpoints
async function handleGamesEndpoint(supabase, path, method, body) {
  if (method === 'GET') {
    if (path === '/api/games') {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
      
      if (error) throw error
      return { games: data }
    }
    
    // GET /api/games/{game_code}
    const gameCode = path.split('/').pop()
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('game_code', gameCode)
      .single()
    
    if (error) throw error
    return { game: data }
  }
  
  if (method === 'POST') {
    const { data, error } = await supabase
      .from('games')
      .insert(body)
      .select()
      .single()
    
    if (error) throw error
    return { game: data }
  }
  
  throw new Error('Method not allowed')
}

// Sets endpoints
async function handleSetsEndpoint(supabase, path, method, body) {
  if (method === 'GET') {
    if (path === '/api/sets') {
      const { game_code } = body
      let query = supabase
        .from('sets')
        .select('*, games(game_name, game_code)')
        .eq('is_digital', false)
      
      if (game_code) {
        query = query.eq('games.game_code', game_code)
      }
      
      const { data, error } = await query
      if (error) throw error
      return { sets: data }
    }
    
    // GET /api/sets/{set_id}
    const setId = path.split('/').pop()
    const { data, error } = await supabase
      .from('sets')
      .select('*, games(game_name, game_code)')
      .eq('set_id', setId)
      .single()
    
    if (error) throw error
    return { set: data }
  }
  
  if (method === 'POST') {
    const { data, error } = await supabase
      .from('sets')
      .insert(body)
      .select()
      .single()
    
    if (error) throw error
    return { set: data }
  }
  
  throw new Error('Method not allowed')
}

// Cards endpoints
async function handleCardsEndpoint(supabase, path, method, body) {
  if (method === 'GET') {
    if (path === '/api/cards') {
      const { game_code, limit = 50 } = body
      let query = supabase
        .from('cards')
        .select('*, games(game_name, game_code)')
        .limit(limit)
      
      if (game_code) {
        query = query.eq('games.game_code', game_code)
      }
      
      const { data, error } = await query
      if (error) throw error
      return { cards: data }
    }
    
    // GET /api/cards/{card_id}
    const cardId = path.split('/').pop()
    const { data, error } = await supabase
      .from('cards')
      .select('*, games(game_name, game_code)')
      .eq('card_id', cardId)
      .single()
    
    if (error) throw error
    return { card: data }
  }
  
  if (method === 'POST') {
    const { data, error } = await supabase
      .from('cards')
      .insert(body)
      .select()
      .single()
    
    if (error) throw error
    return { card: data }
  }
  
  throw new Error('Method not allowed')
}

// Prices endpoints
async function handlePricesEndpoint(supabase, path, method, body) {
  if (method === 'GET') {
    if (path === '/api/prices') {
      const { printing_id, days = 30 } = body
      
      if (!printing_id) {
        throw new Error('printing_id is required')
      }
      
      const sinceDate = new Date()
      sinceDate.setDate(sinceDate.getDate() - days)
      
      const { data, error } = await supabase
        .from('price_history')
        .select('*, sources(source_name), conditions(condition_name)')
        .eq('printing_id', printing_id)
        .gte('timestamp', sinceDate.toISOString())
        .order('timestamp', { ascending: false })
      
      if (error) throw error
      return { prices: data }
    }
    
    // GET /api/prices/current/{printing_id}
    if (path.includes('/current/')) {
      const printingId = path.split('/').pop()
      const { data, error } = await supabase
        .from('aggregated_prices')
        .select('*, conditions(condition_name)')
        .eq('printing_id', printingId)
      
      if (error) throw error
      return { current_prices: data }
    }
  }
  
  if (method === 'POST') {
    // Bulk insert prices
    const { prices } = body
    if (!prices || !Array.isArray(prices)) {
      throw new Error('prices array is required')
    }
    
    const { data, error } = await supabase
      .from('price_history')
      .insert(prices)
      .select()
    
    if (error) throw error
    return { inserted_prices: data }
  }
  
  throw new Error('Method not allowed')
}

// Search endpoints
async function handleSearchEndpoint(supabase, path, method, body) {
  if (method === 'POST') {
    const { query, game_code, limit = 50 } = body
    
    if (!query) {
      throw new Error('query is required')
    }
    
    // Use the search_cards_with_prices function
    const { data, error } = await supabase.rpc('search_cards_with_prices', {
      search_query: query,
      game_code_filter: game_code,
      limit_count: limit
    })
    
    if (error) throw error
    return { search_results: data }
  }
  
  throw new Error('Method not allowed')
}

// Collections endpoints
async function handleCollectionsEndpoint(supabase, path, method, body) {
  // Get user from JWT token
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    throw new Error('Authorization header required')
  }
  
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    throw new Error('Invalid token')
  }
  
  if (method === 'GET') {
    if (path === '/api/collections') {
      const { data, error } = await supabase
        .from('user_collections')
        .select('*, card_printings(*, sets(set_name), cards(card_name)), conditions(condition_name)')
        .eq('user_id', user.id)
      
      if (error) throw error
      return { collection: data }
    }
  }
  
  if (method === 'POST') {
    const { data, error } = await supabase
      .from('user_collections')
      .insert({ ...body, user_id: user.id })
      .select()
      .single()
    
    if (error) throw error
    return { collection_item: data }
  }
  
  if (method === 'PUT') {
    const { collection_id, ...updateData } = body
    const { data, error } = await supabase
      .from('user_collections')
      .update(updateData)
      .eq('collection_id', collection_id)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (error) throw error
    return { collection_item: data }
  }
  
  if (method === 'DELETE') {
    const { collection_id } = body
    const { error } = await supabase
      .from('user_collections')
      .delete()
      .eq('collection_id', collection_id)
      .eq('user_id', user.id)
    
    if (error) throw error
    return { message: 'Item removed from collection' }
  }
  
  throw new Error('Method not allowed')
}

// Watchlists endpoints
async function handleWatchlistsEndpoint(supabase, path, method, body) {
  // Get user from JWT token
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    throw new Error('Authorization header required')
  }
  
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    throw new Error('Invalid token')
  }
  
  if (method === 'GET') {
    if (path === '/api/watchlists') {
      const { data, error } = await supabase
        .from('user_watchlists')
        .select('*, card_printings(*, sets(set_name), cards(card_name))')
        .eq('user_id', user.id)
        .eq('is_active', true)
      
      if (error) throw error
      return { watchlist: data }
    }
  }
  
  if (method === 'POST') {
    const { data, error } = await supabase
      .from('user_watchlists')
      .insert({ ...body, user_id: user.id })
      .select()
      .single()
    
    if (error) throw error
    return { watchlist_item: data }
  }
  
  if (method === 'PUT') {
    const { watchlist_id, ...updateData } = body
    const { data, error } = await supabase
      .from('user_watchlists')
      .update(updateData)
      .eq('watchlist_id', watchlist_id)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (error) throw error
    return { watchlist_item: data }
  }
  
  if (method === 'DELETE') {
    const { watchlist_id } = body
    const { error } = await supabase
      .from('user_watchlists')
      .delete()
      .eq('watchlist_id', watchlist_id)
      .eq('user_id', user.id)
    
    if (error) throw error
    return { message: 'Item removed from watchlist' }
  }
  
  throw new Error('Method not allowed')
}

// Statistics endpoints
async function handleStatsEndpoint(supabase, path, method, body) {
  if (method === 'GET') {
    if (path === '/api/stats/prices') {
      const { game_code, days = 30 } = body
      
      const sinceDate = new Date()
      sinceDate.setDate(sinceDate.getDate() - days)
      
      let query = supabase
        .from('price_history')
        .select('price_usd, timestamp, card_printings(*, cards(*, games(game_code)))')
        .gte('timestamp', sinceDate.toISOString())
      
      if (game_code) {
        query = query.eq('card_printings.cards.games.game_code', game_code)
      }
      
      const { data, error } = await query
      if (error) throw error
      
      const prices = data.map(item => item.price_usd).filter(price => price > 0)
      
      return {
        total_prices: prices.length,
        avg_price: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
        min_price: prices.length > 0 ? Math.min(...prices) : 0,
        max_price: prices.length > 0 ? Math.max(...prices) : 0,
        price_range: prices.length > 0 ? Math.max(...prices) - Math.min(...prices) : 0
      }
    }
    
    if (path === '/api/stats/collection') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        throw new Error('Authorization header required')
      }
      
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      
      if (authError || !user) {
        throw new Error('Invalid token')
      }
      
      const { data: collection, error } = await supabase
        .from('user_collections')
        .select('quantity, aggregated_prices(avg_market_price_usd)')
        .eq('user_id', user.id)
      
      if (error) throw error
      
      let totalValue = 0
      let totalCards = 0
      
      for (const item of collection) {
        const avgPrice = item.aggregated_prices?.avg_market_price_usd || 0
        totalValue += avgPrice * item.quantity
        totalCards += item.quantity
      }
      
      return {
        total_cards: totalCards,
        total_value_usd: totalValue,
        collection_items: collection.length
      }
    }
  }
  
  throw new Error('Method not allowed')
}
'''
        
        # Crear archivo de la función
        function_file = self.functions_dir / "tcg-api" / "index.ts"
        function_file.parent.mkdir(exist_ok=True)
        
        with open(function_file, 'w') as f:
            f.write(function_code)
        
        # Crear archivo de configuración
        config_file = self.functions_dir / "tcg-api" / "supabase" / "config.toml"
        config_file.parent.mkdir(parents=True, exist_ok=True)
        
        config_content = '''
[functions.tcg-api]
verify_jwt = false
import_map = "./import_map.json"
'''
        
        with open(config_file, 'w') as f:
            f.write(config_content)
        
        print("✅ Función TCG API creada")
    
    def create_import_map(self):
        """Crear import map para las funciones"""
        import_map = {
            "imports": {
                "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2",
                "std/": "https://deno.land/std@0.168.0/"
            }
        }
        
        import_map_file = self.functions_dir / "import_map.json"
        with open(import_map_file, 'w') as f:
            json.dump(import_map, f, indent=2)
        
        print("✅ Import map creado")
    
    def create_deployment_script(self):
        """Crear script de despliegue"""
        deploy_script = '''#!/bin/bash
# Script para desplegar las Edge Functions de Supabase

echo "🚀 Desplegando Edge Functions..."

# Verificar que Supabase CLI esté instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI no está instalado"
    echo "💡 Instala con: npm install -g supabase"
    exit 1
fi

# Verificar que estemos en el directorio correcto
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ No se encontró supabase/config.toml"
    echo "💡 Asegúrate de estar en el directorio raíz del proyecto"
    exit 1
fi

# Desplegar funciones
echo "📦 Desplegando función TCG API..."
supabase functions deploy tcg-api --project-ref $SUPABASE_PROJECT_REF

echo "✅ Despliegue completado"
echo ""
echo "🔗 URLs de las funciones:"
echo "   TCG API: https://$SUPABASE_PROJECT_REF.supabase.co/functions/v1/tcg-api"
echo ""
echo "📚 Documentación de endpoints:"
echo "   GET  /api/games - Listar juegos"
echo "   GET  /api/games/{code} - Obtener juego específico"
echo "   GET  /api/sets - Listar sets"
echo "   GET  /api/cards - Listar cartas"
echo "   GET  /api/cards/{id} - Obtener carta específica"
echo "   GET  /api/prices - Obtener precios"
echo "   POST /api/search - Buscar cartas"
echo "   GET  /api/collections - Obtener colección del usuario"
echo "   POST /api/collections - Añadir a colección"
echo "   GET  /api/watchlists - Obtener watchlist del usuario"
echo "   POST /api/watchlists - Añadir a watchlist"
echo "   GET  /api/stats/prices - Estadísticas de precios"
echo "   GET  /api/stats/collection - Estadísticas de colección"
'''
        
        deploy_file = Path("deploy_functions.sh")
        with open(deploy_file, 'w') as f:
            f.write(deploy_script)
        
        # Hacer el script ejecutable
        os.chmod(deploy_file, 0o755)
        
        print("✅ Script de despliegue creado")
    
    def create_api_documentation(self):
        """Crear documentación de la API"""
        docs_content = '''# TCG API Documentation

## Base URL
```
https://your-project-ref.supabase.co/functions/v1/tcg-api
```

## Authentication
Para endpoints que requieren autenticación, incluye el token JWT en el header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Games

#### GET /api/games
Lista todos los juegos activos.

**Response:**
```json
{
  "games": [
    {
      "game_id": 1,
      "game_name": "Magic: The Gathering",
      "game_code": "MTG",
      "is_active": true
    }
  ]
}
```

#### GET /api/games/{game_code}
Obtiene un juego específico por código.

**Response:**
```json
{
  "game": {
    "game_id": 1,
    "game_name": "Magic: The Gathering",
    "game_code": "MTG"
  }
}
```

### Sets

#### GET /api/sets
Lista sets/ediciones.

**Query Parameters:**
- `game_code` (opcional): Filtrar por juego

**Response:**
```json
{
  "sets": [
    {
      "set_id": 1,
      "set_name": "Commander 2021",
      "set_code": "C21",
      "games": {
        "game_name": "Magic: The Gathering",
        "game_code": "MTG"
      }
    }
  ]
}
```

### Cards

#### GET /api/cards
Lista cartas.

**Query Parameters:**
- `game_code` (opcional): Filtrar por juego
- `limit` (opcional): Límite de resultados (default: 50)

#### GET /api/cards/{card_id}
Obtiene una carta específica.

### Search

#### POST /api/search
Búsqueda avanzada de cartas con precios.

**Request Body:**
```json
{
  "query": "Black Lotus",
  "game_code": "MTG",
  "limit": 10
}
```

**Response:**
```json
{
  "search_results": [
    {
      "card_id": "uuid",
      "card_name": "Black Lotus",
      "game_name": "Magic: The Gathering",
      "set_name": "Alpha",
      "collector_number": "1",
      "rarity": "Rare",
      "avg_price_usd": 50000.00,
      "low_price_usd": 45000.00,
      "high_price_usd": 55000.00,
      "price_count": 15,
      "image_url": "https://..."
    }
  ]
}
```

### Prices

#### GET /api/prices
Obtiene historial de precios.

**Query Parameters:**
- `printing_id` (requerido): ID de la impresión
- `days` (opcional): Días hacia atrás (default: 30)

#### GET /api/prices/current/{printing_id}
Obtiene precios actuales de una impresión.

#### POST /api/prices
Inserta precios masivamente.

**Request Body:**
```json
{
  "prices": [
    {
      "printing_id": "uuid",
      "source_id": 1,
      "condition_id": 1,
      "price_usd": 10.50,
      "price_eur": 9.80
    }
  ]
}
```

### Collections (Requiere autenticación)

#### GET /api/collections
Obtiene la colección del usuario.

#### POST /api/collections
Añade una carta a la colección.

**Request Body:**
```json
{
  "printing_id": "uuid",
  "quantity": 2,
  "condition_id": 1,
  "is_foil": false,
  "notes": "My favorite card"
}
```

#### PUT /api/collections
Actualiza un item de la colección.

#### DELETE /api/collections
Elimina un item de la colección.

### Watchlists (Requiere autenticación)

#### GET /api/watchlists
Obtiene el watchlist del usuario.

#### POST /api/watchlists
Añade una carta al watchlist.

**Request Body:**
```json
{
  "printing_id": "uuid",
  "target_price_usd": 50.00,
  "alert_type": "price_drop"
}
```

### Statistics

#### GET /api/stats/prices
Estadísticas de precios.

**Query Parameters:**
- `game_code` (opcional): Filtrar por juego
- `days` (opcional): Período en días (default: 30)

#### GET /api/stats/collection
Estadísticas de la colección del usuario (requiere autenticación).

## Error Responses

Todos los endpoints pueden devolver errores en este formato:

```json
{
  "error": "Error message description"
}
```

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per hour per user (para endpoints autenticados)

## CORS

La API soporta CORS y puede ser llamada desde aplicaciones web.
'''
        
        docs_file = Path("API_DOCUMENTATION.md")
        with open(docs_file, 'w') as f:
            f.write(docs_content)
        
        print("✅ Documentación de API creada")
    
    def create_test_client(self):
        """Crear cliente de prueba para las APIs"""
        test_client = '''#!/usr/bin/env python3
"""
Cliente de prueba para las Edge Functions de Supabase
"""

import requests
import json
from typing import Dict, Any

class TCGAPIClient:
    def __init__(self, base_url: str, api_key: str = None):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        
        if api_key:
            self.session.headers.update({
                'apikey': api_key,
                'Authorization': f'Bearer {api_key}'
            })
    
    def _make_request(self, method: str, endpoint: str, data: Dict = None) -> Dict[str, Any]:
        """Realizar petición HTTP"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, params=data)
            else:
                response = self.session.post(url, json=data)
            
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            print(f"Error en petición: {e}")
            return {'error': str(e)}
    
    def get_games(self) -> Dict[str, Any]:
        """Obtener todos los juegos"""
        return self._make_request('GET', '/api/games')
    
    def get_game(self, game_code: str) -> Dict[str, Any]:
        """Obtener juego específico"""
        return self._make_request('GET', f'/api/games/{game_code}')
    
    def get_sets(self, game_code: str = None) -> Dict[str, Any]:
        """Obtener sets"""
        params = {}
        if game_code:
            params['game_code'] = game_code
        return self._make_request('GET', '/api/sets', params)
    
    def search_cards(self, query: str, game_code: str = None, limit: int = 50) -> Dict[str, Any]:
        """Buscar cartas"""
        data = {
            'query': query,
            'limit': limit
        }
        if game_code:
            data['game_code'] = game_code
        
        return self._make_request('POST', '/api/search', data)
    
    def get_card(self, card_id: str) -> Dict[str, Any]:
        """Obtener carta específica"""
        return self._make_request('GET', f'/api/cards/{card_id}')
    
    def get_prices(self, printing_id: str, days: int = 30) -> Dict[str, Any]:
        """Obtener precios de una impresión"""
        data = {
            'printing_id': printing_id,
            'days': days
        }
        return self._make_request('GET', '/api/prices', data)
    
    def get_current_prices(self, printing_id: str) -> Dict[str, Any]:
        """Obtener precios actuales"""
        return self._make_request('GET', f'/api/prices/current/{printing_id}')
    
    def get_price_stats(self, game_code: str = None, days: int = 30) -> Dict[str, Any]:
        """Obtener estadísticas de precios"""
        data = {'days': days}
        if game_code:
            data['game_code'] = game_code
        return self._make_request('GET', '/api/stats/prices', data)

def main():
    """Función principal de prueba"""
    # Configurar cliente
    base_url = "https://your-project-ref.supabase.co/functions/v1/tcg-api"
    api_key = "your-anon-key"  # Opcional para endpoints públicos
    
    client = TCGAPIClient(base_url, api_key)
    
    print("🧪 Probando TCG API Client...")
    
    # Probar endpoints
    tests = [
        ("Obtener juegos", lambda: client.get_games()),
        ("Obtener MTG", lambda: client.get_game('MTG')),
        ("Obtener sets de MTG", lambda: client.get_sets('MTG')),
        ("Buscar Black Lotus", lambda: client.search_cards('Black Lotus', 'MTG', 5)),
        ("Estadísticas de precios", lambda: client.get_price_stats('MTG', 30))
    ]
    
    for test_name, test_func in tests:
        print(f"\\n🔧 {test_name}...")
        try:
            result = test_func()
            if 'error' in result:
                print(f"❌ Error: {result['error']}")
            else:
                print(f"✅ Éxito: {len(result.get('games', result.get('sets', result.get('search_results', []))))} resultados")
        except Exception as e:
            print(f"❌ Excepción: {e}")
    
    print("\\n🎉 Pruebas completadas")

if __name__ == "__main__":
    main()
'''
        
        test_file = Path("test_api_client.py")
        with open(test_file, 'w') as f:
            f.write(test_client)
        
        print("✅ Cliente de prueba creado")
    
    def create_all(self):
        """Crear todos los archivos de Edge Functions"""
        print("🚀 Creando Edge Functions de Supabase...")
        
        self.create_tcg_api_function()
        self.create_import_map()
        self.create_deployment_script()
        self.create_api_documentation()
        self.create_test_client()
        
        print("✅ Todas las Edge Functions creadas")
        print("")
        print("📋 Archivos creados:")
        print("   - supabase/functions/tcg-api/index.ts")
        print("   - supabase/functions/import_map.json")
        print("   - deploy_functions.sh")
        print("   - API_DOCUMENTATION.md")
        print("   - test_api_client.py")
        print("")
        print("🚀 Para desplegar:")
        print("   1. Configura las variables de entorno:")
        print("      export SUPABASE_PROJECT_REF=your-project-ref")
        print("   2. Ejecuta: ./deploy_functions.sh")
        print("")
        print("🧪 Para probar:")
        print("   python test_api_client.py")

def main():
    """Función principal"""
    edge_functions = SupabaseEdgeFunctions()
    edge_functions.create_all()

if __name__ == "__main__":
    main() 