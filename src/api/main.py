"""Main FastAPI application."""

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(
    title="MTG TCG Web App",
    description="Advanced TCG price aggregation and analysis platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": "2025-01-28T00:00:00Z"}

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to MTG TCG Web App",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/cards")
async def get_cards(
    q: Optional[str] = Query(None, description="Search query for card name"),
    game: Optional[str] = Query(None, description="Game code filter"),
    set: Optional[str] = Query(None, description="Set name filter"),
    rarity: Optional[str] = Query(None, description="Rarity filter"),
    color: Optional[str] = Query(None, description="Color filter"),
    limit: int = Query(50, description="Limit results"),
    offset: int = Query(0, description="Offset results")
):
    """Get cards with optional filters."""
    if not supabase:
        return {"cards": [], "error": "Database not configured"}
    
    try:
        # Determine if we need to force inner joins for filtering
        # In PostgREST, filtering on a joined table requires !inner to filter the top-level rows
        cards_join = "cards!inner" if (q or rarity or game or color) else "cards"
        sets_join = "sets!inner" if set else "sets"
        
        query = supabase.table('card_printings').select(
            f'printing_id, image_url, '
            f'{cards_join}(card_id, card_name, type_line, rarity, game_id, colors), '
            f'{sets_join}(set_name), '
            'aggregated_prices(avg_market_price_usd)',
            count='exact'
        )
        
        # Apply search filter
        if q:
            query = query.ilike('cards.card_name', f'%{q}%')
        
        # Apply rarity filter
        if rarity:
            rarities = [r.strip().lower() for r in rarity.split(',')]
            query = query.in_('cards.rarity', rarities)

        # Apply game filter
        if game:
            game_names = [g.strip() for g in game.split(',')]
            game_map = {'Magic: The Gathering': 22, 'Pokémon': 23, 'Lorcana': 24, 'Yu-Gi-Oh!': 26}
            game_ids = [game_map[gn] for gn in game_names if gn in game_map]
            if game_ids:
                query = query.in_('cards.game_id', game_ids)

        # Apply set filter
        if set:
            set_names = [s.strip() for s in set.split(',')]
            query = query.in_('sets.set_name', set_names)

        # Apply color filter
        if color:
            color_names = [c.strip() for c in color.split(',')]
            color_map = {'White': 'W', 'Blue': 'U', 'Black': 'B', 'Red': 'R', 'Green': 'G', 'Colorless': 'C'}
            color_codes = [color_map[cn] for cn in color_names if cn in color_map]
            if color_codes:
                query = query.overlap('cards.colors', color_codes)

        # Apply limit and offset
        query = query.limit(limit).offset(offset)
        
        response = query.execute()
        total_count = response.count
        
        cards = []
        for item in response.data:
            if not item.get('cards'): continue
                
            card_data = item.get('cards')
            set_data = item.get('sets') or {}
            price_data = item.get('aggregated_prices') or []
            
            price = 0
            if price_data and len(price_data) > 0:
                price = price_data[0].get('avg_market_price_usd', 0)
            
            cards.append({
                "card_id": item.get('printing_id'),
                "name": card_data.get('card_name'),
                "type": card_data.get('type_line'),
                "set": set_data.get('set_name', ''),
                "price": price,
                "image_url": item.get('image_url'),
                "rarity": card_data.get('rarity')
            })
        
        return {"cards": cards, "total_count": total_count}
    except Exception as e:
        print(f"Query failed: {e}")
        return {"cards": [], "total_count": 0, "error": str(e)}

@app.get("/api/sets")
async def get_sets(
    game_code: Optional[str] = Query(None, description="Game code filter")
):
    """Get all sets, optionally filtered by game."""
    if not supabase:
        return {"sets": [], "error": "Database not configured"}
    
    try:
        query = supabase.table('sets').select('set_id, set_name, set_code, games(game_name, game_code)')
        
        if game_code:
            # Filter by game code through the relationship
            query = query.eq('games.game_code', game_code)
        
        response = query.execute()
        return {"sets": response.data}
    except Exception as e:
        return {"sets": [], "error": str(e)}
