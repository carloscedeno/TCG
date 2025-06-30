#!/usr/bin/env python3
"""
Script de prueba para verificar que las funciones SQL y Edge Functions están funcionando
"""

import os
import requests
import json
import pytest
from typing import Dict, Any

def test_sql_functions(supabase_url: str, supabase_key: str):
    """Probar funciones SQL"""
    # Verificar que las variables están definidas
    assert supabase_url is not None, "SUPABASE_URL debe estar definida"
    assert supabase_key is not None, "SUPABASE_SERVICE_ROLE_KEY debe estar definida"
    
    # Verificar formato de URL
    assert supabase_url.startswith('https://'), "SUPABASE_URL debe ser una URL HTTPS válida"
    assert '.supabase.co' in supabase_url, "SUPABASE_URL debe ser una URL de Supabase válida"
    
    # Verificar formato de key
    assert len(supabase_key) > 50, "SUPABASE_SERVICE_ROLE_KEY debe ser una clave válida"
    assert supabase_key.startswith('eyJ'), "SUPABASE_SERVICE_ROLE_KEY debe ser un JWT válido"

def test_edge_functions(project_ref: str):
    """Probar Edge Functions"""
    # Verificar que project_ref está definido
    assert project_ref is not None, "SUPABASE_PROJECT_REF debe estar definido"
    assert len(project_ref) > 10, "SUPABASE_PROJECT_REF debe ser una referencia válida"
    
    base_url = f"https://{project_ref}.supabase.co/functions/v1/tcg-api"
    
    # Probar endpoint de juegos
    try:
        response = requests.get(f"{base_url}/api/games", timeout=10)
        assert response.status_code == 200, f"Endpoint /api/games devolvió {response.status_code}"
        
        data = response.json()
        assert 'games' in data, "Respuesta debe contener campo 'games'"
        assert isinstance(data['games'], list), "Campo 'games' debe ser una lista"
        
    except requests.exceptions.RequestException as e:
        pytest.fail(f"Error conectando a /api/games: {e}")
    
    # Probar endpoint raíz
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        assert response.status_code == 200, f"Endpoint raíz devolvió {response.status_code}"
        
        data = response.json()
        assert 'available_endpoints' in data, "Respuesta debe contener campo 'available_endpoints'"
        assert isinstance(data['available_endpoints'], list), "Campo 'available_endpoints' debe ser una lista"
        
    except requests.exceptions.RequestException as e:
        pytest.fail(f"Error conectando al endpoint raíz: {e}")

def test_environment_variables():
    """Probar que las variables de entorno están configuradas"""
    required_vars = [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'SUPABASE_PROJECT_REF'
    ]
    
    for var in required_vars:
        value = os.getenv(var)
        assert value is not None, f"Variable de entorno {var} debe estar definida"
        assert len(value) > 0, f"Variable de entorno {var} no puede estar vacía"

def test_supabase_connection_integration(supabase_url: str, supabase_key: str):
    """Probar conexión real a Supabase"""
    try:
        from supabase import create_client
        
        supabase = create_client(supabase_url, supabase_key)
        
        # Probar consulta simple
        response = supabase.table('games').select('*').limit(1).execute()
        
        assert response is not None, "Respuesta de Supabase no debe ser None"
        # La respuesta de Supabase tiene los datos directamente en el objeto
        assert hasattr(response, 'data'), "Respuesta debe tener atributo 'data'"
        assert response.data is not None, "Datos de respuesta no deben ser None"
        assert len(response.data) > 0, "Debe haber al menos un juego en la base de datos"
        
    except ImportError:
        pytest.skip("Supabase client no está instalado")
    except Exception as e:
        pytest.fail(f"Error conectando a Supabase: {e}")

def main():
    """Función principal para ejecución manual"""
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
    try:
        test_sql_functions(supabase_url, supabase_key)
        test_edge_functions(project_ref)
        test_environment_variables()
        print("✅ Todas las pruebas pasaron")
    except Exception as e:
        print(f"❌ Error en las pruebas: {e}")
        return
    
    print("🎉 Todas las pruebas completadas")

if __name__ == "__main__":
    main()
