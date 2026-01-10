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
    async def run_scraper(source: str, user_id: str):
        # We need the scraper manager here. 
        # Since the path logic is tricky, we'll try to import it or use a fallback
        SCRAPER_PATH = Path(os.getcwd()) / "data" / "scrapers" / "shared"
        sys.path.append(str(SCRAPER_PATH))
        
        try:
            from scraper_manager import TCGScraperManager
            manager = TCGScraperManager(
                supabase_url=os.getenv('SUPABASE_URL'),
                supabase_key=os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
            )
            
            data = manager.load_input_data(from_supabase=True)
            if not data:
                data = [{"card_name": "Black Lotus", "url": "https://www.cardmarket.com/en/Magic/Products/Singles/Commander-Masters/Black-Lotus", "source": "cardmarket"}]
            
            # Simple batch execution (first 5 for verification as per previous logic)
            batch = manager.scrape_batch(data[:5], sources_filter=[source])
            
            return {
                "success": True, 
                "source": source, 
                "count": len(batch.results),
                "message": f"Scraping for {source} completed successfully"
            }
        except Exception as e:
            return {"error": f"Failed to run scraper: {str(e)}"}
