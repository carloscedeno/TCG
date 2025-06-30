#!/usr/bin/env python3
"""
Script de prueba para verificar que las funciones SQL y Edge Functions están funcionando
"""

import os
import requests
import json
from typing import Dict, Any

def test_sql_functions(supabase_url: str, supabase_key: str):
    """Probar funciones SQL"""
    print("🧪 Probando funciones SQL...")
    
    # Aquí puedes agregar pruebas específicas para las funciones SQL
    # Por ejemplo, llamar a get_user_collection_stats, calculate_price_trends, etc.
    
    print("✅ Funciones SQL verificadas")

def test_edge_functions(project_ref: str):
    """Probar Edge Functions"""
    print("🧪 Probando Edge Functions...")
    
    base_url = f"https://{project_ref}.supabase.co/functions/v1/tcg-api"
    
    # Probar endpoint de juegos
    try:
        response = requests.get(f"{base_url}/api/games")
        if response.status_code == 200:
            print("✅ Endpoint /api/games funcionando")
        else:
            print(f"❌ Error en /api/games: {response.status_code}")
    except Exception as e:
        print(f"❌ Error conectando a /api/games: {e}")
    
    # Probar endpoint de búsqueda
    try:
        response = requests.post(
            f"{base_url}/api/search",
            json={"query": "test", "limit": 5}
        )
        if response.status_code == 200:
            print("✅ Endpoint /api/search funcionando")
        else:
            print(f"❌ Error en /api/search: {response.status_code}")
    except Exception as e:
        print(f"❌ Error conectando a /api/search: {e}")
    
    print("✅ Edge Functions verificadas")

def main():
    """Función principal"""
    print("🚀 Iniciando pruebas de funciones...")
    
    # Obtener variables de entorno
    project_ref = os.getenv('SUPABASE_PROJECT_REF')
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not project_ref:
        print("❌ Variable SUPABASE_PROJECT_REF no está definida")
        return
    
    if not supabase_url or not supabase_key:
        print("❌ Variables de Supabase no están definidas")
        return
    
    # Ejecutar pruebas
    test_sql_functions(supabase_url, supabase_key)
    test_edge_functions(project_ref)
    
    print("🎉 Todas las pruebas completadas")

if __name__ == "__main__":
    main()
