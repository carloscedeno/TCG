#!/usr/bin/env python3
"""
Pruebas de Verificación para Supabase Edge Functions (TCG-API)
Este script verifica que los endpoints desplegados en Supabase funcionen correctamente.
"""

import httpx
import asyncio
import sys
import os
from datetime import datetime
from dotenv import load_dotenv

# Cargar variables de entorno para autenticación
load_dotenv()

# URL de la Edge Function en Supabase
SUPABASE_URL = "https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api"
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

async def test_endpoint(client, endpoint, description):
    print(f"🔍 Probando: {description} ({endpoint})...", end="", flush=True)
    try:
        start_time = datetime.now()
        response = await client.get(endpoint)
        duration = (datetime.now() - start_time).total_seconds()
        
        if response.status_code == 200:
            print(f" ✅ OK ({duration:.2f}s)")
            return True, response.json()
        else:
            print(f" ❌ ERROR ({response.status_code})")
            print(f"    Respuesta: {response.text[:100]}")
            return False, None
    except Exception as e:
        print(f" ❌ EXCEPCIÓN: {str(e)}")
        return False, None

async def run_e2e_edge_functions():
    print("🚀 INICIANDO VERIFICACIÓN E2E DE SUPABASE EDGE FUNCTIONS")
    print("=" * 60)
    
    headers = {
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
    } if SUPABASE_ANON_KEY else {}
    
    async with httpx.AsyncClient(base_url=SUPABASE_URL, timeout=30.0, headers=headers) as client:
        results = []
        
        # 1. Verificar Root
        res, data = await test_endpoint(client, "/", "Endpoint Raíz")
        results.append(res)
        if res:
            print(f"    Versión: {data.get('version')} | Mess: {data.get('message')}")

        # 2. Verificar Juegos
        res, data = await test_endpoint(client, "/api/games", "Listado de Juegos")
        results.append(res)
        if res:
            games = data.get('games', [])
            print(f"    Juegos encontrados: {len(games)} ({', '.join([g['game_code'] for g in games[:3]])}...)")

        # 3. Verificar Cartas (Búsqueda)
        res, data = await test_endpoint(client, "/api/cards?q=Sol Ring&limit=1", "Búsqueda de Carta (Sol Ring)")
        results.append(res)
        if res:
            cards = data.get('cards', [])
            if cards:
                print(f"    Resultado: {cards[0]['name']} | Precio: ${cards[0]['price']}")
            else:
                print("    ⚠️ No se encontraron cartas con 'Sol Ring'")

        # 4. Verificar Productos (Inventario)
        res, data = await test_endpoint(client, "/api/products?limit=5", "Listado de Productos (Inventario)")
        results.append(res)
        if res:
            products = data.get('products', [])
            print(f"    Productos en stock: {len(products)}")

        # 5. Verificar Sets
        res, data = await test_endpoint(client, "/api/sets?game_code=MTG", "Listado de Sets (MTG)")
        results.append(res)
        
    print("=" * 60)
    success_count = sum(results)
    total_count = len(results)
    
    if success_count == total_count:
        print(f"✅ VERIFICACIÓN COMPLETADA: {success_count}/{total_count} pruebas exitosas.")
        return True
    else:
        print(f"⚠️ VERIFICACIÓN PARCIAL: {success_count}/{total_count} pruebas exitosas.")
        return False

if __name__ == "__main__":
    success = asyncio.run(run_e2e_edge_functions())
    if not success:
        sys.exit(1)
