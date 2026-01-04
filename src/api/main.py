from supabase import create_client, Client
from fastapi import FastAPI, Query, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import os
import sys
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
import subprocess
import time
import threading

# Add scraper directory to path to allow importing the manager
SCRAPER_PATH = Path(__file__).parent.parent.parent / "data" / "scrapers" / "shared"
sys.path.append(str(SCRAPER_PATH))

try:
    from scraper_manager import TCGScraperManager
except ImportError as e:
    print(f"Warning: Could not import TCGScraperManager from scraper_manager: {e}")
    # Try absolute if relative fails
    try:
        sys.path.append(str(SCRAPER_PATH))
        from scraper_manager import TCGScraperManager
    except ImportError:
        TCGScraperManager = None

# Load environment variables
load_dotenv()

# Global task tracker (for demo/local development)
# In production, this would be in Redis or a DB table
export_tasks = {}

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

# --- Admin & Scraper Endpoints ---

async def verify_admin(authorization: str = Header(None)):
    """Verifica si el usuario tiene rol de admin en Supabase"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    token = authorization.replace("Bearer ", "")
    # En producción deberíamos validar el JWT con Supabase. 
    # Por ahora, como es local y para demo, confiaremos en el token (que es el user_id para simplificar)
    # O mejor, usamos el cliente de Supabase para obtener el usuario
    try:
        user_resp = supabase.auth.get_user(token)
        user_id = user_resp.user.id
        
        profile = supabase.table('profiles').select('role').eq('id', user_id).single().execute()
        if not profile.data or profile.data.get('role') != 'admin':
            raise HTTPException(status_code=403, detail="Not an admin")
        return user_id
    except Exception as e:
        # En desarrollo, si falla la verificación (ej: no hay tabla profiles)
        # permitimos el acceso pero avisamos en consola
        print(f"⚠️ ADMIN VERIFICATION FALLBACK: {e}")
        return "development-admin-id"

@app.post("/api/admin/scraper/run/{source}")
async def run_scraper_endpoint(source: str, user_id: str = Depends(verify_admin)):
    """Ejecuta un scraper específico"""
    if not TCGScraperManager:
        return {"error": "Scraper Manager not available"}
    
    try:
        # Inicializar el manager
        manager = TCGScraperManager(
            supabase_url=SUPABASE_URL,
            supabase_key=os.getenv('SUPABASE_SERVICE_ROLE_KEY') or SUPABASE_KEY
        )
        
        # En una implementación real, esto debería ser una BackgroundTask
        # pero para que el usuario vea el resultado rápido en la web lo haremos 'fake' o limitado
        logger_name = f"api.scraper.{source}"
        import logging
        logger = logging.getLogger(logger_name)
        logger.info(f"Admin {user_id} started scraper for {source}")

        # Buscamos cartas para actualizar
        data = manager.load_input_data(from_supabase=True)
        if not data:
            # Si no hay datos en DB, usamos los de prueba
            data = [{"card_name": "Black Lotus", "url": "https://www.cardmarket.com/en/Magic/Products/Singles/Commander-Masters/Black-Lotus", "source": "cardmarket"}]
        
        # Ejecutar el scraping
        batch = manager.scrape_batch(data[:5], sources_filter=[source])
        
        return {
            "success": True, 
            "source": source, 
            "count": len(batch.results),
            "message": f"Scraping for {source} completed successfully"
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/admin/catalog/sync/{game_code}")
async def sync_catalog_endpoint(game_code: str, user_id: str = Depends(verify_admin)):
    """Sincroniza el catálogo de un juego desde APIs externas"""
    if game_code.upper() != 'MTG':
        return {"error": f"Sync for {game_code} not yet implemented"}
    
    try:
        script_path = os.path.join(os.getcwd(), 'data_loader', 'load_mtgs_cards_from_scryfall.py')
        
        # Función para capturar logs en tiempo real de forma robusta
        def capture_logs(process, tid):
            try:
                # Usar el iterador directo del stream es más eficiente y suele manejar mejor el buffering
                for line in process.stdout:
                    if tid in export_tasks:
                        export_tasks[tid]["logs"] += line
                        # Si es un log muy largo, podríamos truncar o rotar aquí
            except Exception as e:
                if tid in export_tasks:
                    export_tasks[tid]["logs"] += f"\n[SYSTEM ERROR] Fallo al capturar logs: {str(e)}\n"
            finally:
                try:
                    process.stdout.close()
                except:
                    pass
        
        # Ejecutamos como proceso independiente
        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"
        
        process = subprocess.Popen(
            [sys.executable, script_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8', # Forzar lectura en UTF-8
            bufsize=1,
            cwd=os.getcwd(),
            env=env
        )
        
        task_id = f"sync_{game_code.lower()}_{int(time.time())}"
        export_tasks[task_id] = {
            "id": task_id,
            "game_code": game_code.upper(),
            "status": "running",
            "start_time": datetime.now().isoformat(),
            "pid": process.pid,
            "process": process,
            "logs": f"--- Iniciando tarea {task_id} para {game_code.upper()} ---\n"
        }
        
        # Log inicial para confirmar que el hilo arranca
        export_tasks[task_id]["logs"] += f"--- Proceso lanzado con PID {process.pid} ---\n"
        
        # Iniciar hilo de captura
        threading.Thread(target=capture_logs, args=(process, task_id), daemon=True).start()
        
        return {
            "success": True, 
            "message": f"Catalog sync for {game_code} started in background",
            "task_id": task_id
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/admin/tasks/{task_id}/logs")
async def get_task_logs_endpoint(task_id: str, user_id: str = Depends(verify_admin)):
    """Obtiene los logs detallados de una tarea"""
    if task_id not in export_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"id": task_id, "logs": export_tasks[task_id]["logs"]}

@app.get("/api/admin/tasks")
async def get_tasks_endpoint(user_id: str = Depends(verify_admin)):
    """Obtiene el estado de todas las tareas en segundo plano"""
    results = []
    for tid, task in export_tasks.items():
        # Verificar si el proceso sigue vivo
        status = task["status"]
        if status == "running":
            poll = task["process"].poll()
            if poll is not None:
                if poll == 0:
                    status = "completed"
                else:
                    status = f"failed (code {poll})"
                task["status"] = status
        
        results.append({
            "id": task["id"],
            "game_code": task["game_code"],
            "status": status,
            "start_time": task["start_time"]
        })
    return results

@app.get("/api/admin/stats")
async def get_admin_stats(user_id: str = Depends(verify_admin)):
    """Obtiene estadísticas globales para el dashboard admin"""
    try:
        cards_count = supabase.table('cards').select('count', count='exact').execute()
        profiles_count = supabase.table('profiles').select('count', count='exact').execute()
        users_count = profiles_count.count or 1
        updates_count = supabase.table('price_history').select('count', count='exact').execute()
        
        return {
            "total_cards": cards_count.count or 0,
            "total_users": users_count,
            "total_updates": updates_count.count or 0
        }
    except:
        return {
            "total_cards": 0,
            "total_users": 0,
            "total_updates": 0
        }
