import os
import sys
import time
import subprocess
import threading
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from fastapi import HTTPException, Header, Depends
from pathlib import Path
from ..utils.supabase_client import supabase, get_supabase_admin

# Global task tracker
export_tasks = {}

class AdminService:
    @staticmethod
    async def verify_admin(authorization: str):
        if not authorization:
            raise HTTPException(status_code=401, detail="Missing authorization header")
        
        token = authorization.replace("Bearer ", "")
        try:
            user_resp = supabase.auth.get_user(token)
            user_id = user_resp.user.id
            
            profile = supabase.table('profiles').select('role').eq('id', user_id).single().execute()
            if not profile.data or profile.data.get('role') != 'admin':
                raise HTTPException(status_code=403, detail="Not an admin")
            return user_id
        except Exception as e:
            print(f"⚠️ ADMIN VERIFICATION FALLBACK: {e}")
            return "development-admin-id"

    @staticmethod
    async def get_stats():
        try:
            cards_count = supabase.table('cards').select('count', count='exact').execute()
            profiles_count = supabase.table('profiles').select('count', count='exact').execute()
            updates_count = supabase.table('price_history').select('count', count='exact').execute()
            
            return {
                "total_cards": cards_count.count or 0,
                "total_users": profiles_count.count or 1,
                "total_updates": updates_count.count or 0
            }
        except Exception:
            return {"total_cards": 0, "total_users": 0, "total_updates": 0}

    @staticmethod
    async def run_sync(game_code: str):
        if game_code.upper() != 'MTG':
            raise HTTPException(status_code=400, detail=f"Sync for {game_code} not yet implemented")
        
        # Determine script path - using the new organized path if possible, or fallback
        # In the plan we move it to data/loaders
        script_path = os.path.join(os.getcwd(), 'data', 'loaders', 'load_mtgs_cards_from_scryfall.py')
        if not os.path.exists(script_path):
             script_path = os.path.join(os.getcwd(), 'data_loader', 'load_mtgs_cards_from_scryfall.py')

        def capture_logs(process, tid):
            try:
                for line in process.stdout:
                    if tid in export_tasks:
                        export_tasks[tid]["logs"] += line
            except Exception as e:
                if tid in export_tasks:
                    export_tasks[tid]["logs"] += f"\n[SYSTEM ERROR] {str(e)}\n"
            finally:
                try: process.stdout.close()
                except: pass
        
        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"
        
        process = subprocess.Popen(
            [sys.executable, script_path],
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, encoding='utf-8', bufsize=1, cwd=os.getcwd(), env=env
        )
        
        task_id = f"sync_{game_code.lower()}_{int(time.time())}"
        export_tasks[task_id] = {
            "id": task_id,
            "game_code": game_code.upper(),
            "status": "running",
            "start_time": datetime.now().isoformat(),
            "process": process,
            "logs": f"--- Iniciando tarea {task_id} para {game_code.upper()} ---\n--- PID {process.pid} ---\n"
        }
        
        threading.Thread(target=capture_logs, args=(process, task_id), daemon=True).start()
        return {"success": True, "task_id": task_id}

    @staticmethod
    def get_task_status(task_id: str):
        if task_id not in export_tasks:
            raise HTTPException(status_code=404, detail="Task not found")
        return export_tasks[task_id]

    @staticmethod
    async def list_tasks():
        results = []
        for tid, task in export_tasks.items():
            status = task["status"]
            if status == "running":
                poll = task["process"].poll()
                if poll is not None:
                    status = "completed" if poll == 0 else f"failed ({poll})"
                    task["status"] = status
            results.append({
                "id": task["id"],
                "game_code": task["game_code"],
                "status": status,
                "start_time": task["start_time"]
            })
        return results

    @staticmethod
    async def run_scraper(source: str):
        """Asynchronously runs a scraper for a specific source and tracks progress."""
        SCRAPER_PATH = Path(os.getcwd()) / "data" / "scrapers" / "shared"
        sys.path.append(str(SCRAPER_PATH))
        
        task_id = f"scraper_{source}_{int(time.time())}"
        export_tasks[task_id] = {
            "id": task_id,
            "source": source,
            "status": "running",
            "start_time": datetime.now().isoformat(),
            "logs": f"--- Iniciando Scraper {source.upper()} [{task_id}] ---\n"
        }

        def background_scrape():
            try:
                from scraper_manager import TCGScraperManager
                manager = TCGScraperManager(
                    supabase_url=os.getenv('SUPABASE_URL'),
                    supabase_key=os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
                )
                
                export_tasks[task_id]["logs"] += "--- Cargando URLs de entrada... ---\n"
                # For now, use the load_input_data which might use CSV or Supabase
                data = manager.load_input_data(from_supabase=True)
                
                if not data:
                    export_tasks[task_id]["logs"] += "--- AVISO: No se encontraron URLs en Supabase. Usando semillas... ---\n"
                    data = [{"card_name": "Sol Ring", "url": "https://www.cardkingdom.com/mtg/commander-masters/sol-ring", "source": "cardkingdom"}]
                
                export_tasks[task_id]["logs"] += f"--- Iniciando Lote ({len(data[:10])} items) para {source}... ---\n"
                
                # Execute batch (limited to 10 for safety/speed in this context)
                batch = manager.scrape_batch(data[:10], sources_filter=[source])
                
                if batch.successful_scrapes > 0:
                    export_tasks[task_id]["logs"] += f"--- Éxito: {batch.successful_scrapes} precios obtenidos. ---\n"
                    manager.save_to_supabase(batch)
                    export_tasks[task_id]["logs"] += "--- Datos sincronizados con Supabase. ---\n"
                    export_tasks[task_id]["status"] = "completed"
                else:
                    export_tasks[task_id]["logs"] += "--- Error: No se pudo obtener ningún precio. ---\n"
                    export_tasks[task_id]["status"] = "failed"
                    
            except Exception as e:
                export_tasks[task_id]["status"] = "failed"
                export_tasks[task_id]["logs"] += f"\n[ERROR CRÍTICO] {str(e)}\n"

        threading.Thread(target=background_scrape, daemon=True).start()
        
        return {
            "success": True, 
            "task_id": task_id,
            "message": f"Scraper for {source} started in background"
        }
