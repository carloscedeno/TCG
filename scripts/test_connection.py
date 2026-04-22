#!/usr/bin/env python3
"""
Script para probar la conectividad con Supabase
"""

import os
import sys
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def test_supabase_connection():
    """Probar conexión con Supabase"""
    print("--- Verificando configuracion de Supabase ---")
    
    # Verificar variables de entorno
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_anon_key = os.getenv('SUPABASE_ANON_KEY')
    supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    print(f"Variables de entorno:")
    print(f"   SUPABASE_URL: {'[OK]' if supabase_url else '[MISSING]'}")
    print(f"   SUPABASE_ANON_KEY: {'[OK]' if supabase_anon_key else '[MISSING]'}")
    print(f"   SUPABASE_SERVICE_ROLE_KEY: {'[OK]' if supabase_service_key else '[MISSING]'}")
    
    if not all([supabase_url, supabase_anon_key, supabase_service_key]):
        print("\nERROR: Variables de entorno faltantes")
        print("Sugerencia para configurar Supabase:")
        print("   1. Ve a https://supabase.com")
        print("   2. Crea un nuevo proyecto")
        print("   3. Ve a Settings > API")
        print("   4. Copia los valores a tu archivo .env")
        print("   5. O configura las variables de entorno directamente")
        return False
    
    # Verificar formato de URL
    if not supabase_url or not supabase_url.startswith('https://') or '.supabase.co' not in supabase_url:
        print("ERROR: URL de Supabase invalida")
        print("   Debe ser: https://your-project-ref.supabase.co")
        return False
    
    print("SUCCESS: Variables de entorno configuradas correctamente")
    
    # Intentar importar y probar conexión
    try:
        print("\n--- Probando conexion con Supabase ---")
        from supabase import create_client, Client
        
        # Crear cliente
        supabase: Client = create_client(str(supabase_url), str(supabase_anon_key))
        
        # Probar conexión simple
        try:
            # Intentar una consulta simple
            response = supabase.table('games').select('count').limit(1).execute()
            print("SUCCESS: Conexion exitosa con Supabase")
            return True
        except Exception as e:
            print(f"ERROR de conexion: {e}")
            
            # Verificar si es un error de autenticación
            if "JWT" in str(e) or "auth" in str(e).lower():
                print("HINT: Error de autenticacion - verifica tus claves API")
            elif "not found" in str(e).lower():
                print("HINT: Tabla no encontrada - la base de datos puede estar vacia")
            else:
                print("HINT: Error de red o configuracion")
            
            return False
            
    except ImportError:
        print("ERROR: No se pudo importar la libreria supabase")
        print("HINT: Instala con: pip install supabase")
        return False
    except Exception as e:
        print(f"ERROR inesperado: {e}")
        return False

def test_with_mock_data():
    """Probar con datos simulados"""
    print("\n--- Probando con datos simulados ---")
    
    # Simular configuración
    mock_url = "https://test-project.supabase.co"
    mock_key = "test-key"
    
    print(f"   URL simulada: {mock_url}")
    print(f"   Clave simulada: {mock_key[:10]}...")
    
    try:
        from supabase import create_client
        supabase = create_client(mock_url, mock_key)
        print("SUCCESS: Cliente de Supabase creado correctamente")
        return True
    except Exception as e:
        print(f"ERROR creando cliente: {e}")
        return False

def show_setup_instructions():
    """Mostrar instrucciones de configuración"""
    print("\nINSTRUCCIONES DE CONFIGURACION")
    print("=" * 50)
    
    print("1. Crear proyecto en Supabase:")
    print("   - Ve a https://supabase.com")
    print("   - Crea una cuenta o inicia sesión")
    print("   - Crea un nuevo proyecto")
    print("   - Espera a que se complete la configuración")
    
    print("\n2. Obtener credenciales:")
    print("   - Ve a Settings > API")
    print("   - Copia 'Project URL'")
    print("   - Copia 'anon public' key")
    print("   - Copia 'service_role' key")
    
    print("\n3. Configurar variables de entorno:")
    print("   Opcion A - Archivo .env:")
    print("   ```")
    print("   SUPABASE_URL=https://your-project-ref.supabase.co")
    print("   SUPABASE_ANON_KEY=your-anon-key")
    print("   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key")
    print("   ```")
    
    print("\n   Opcion B - Variables de entorno del sistema:")
    print("   ```bash")
    print("   set SUPABASE_URL=https://your-project-ref.supabase.co")
    print("   set SUPABASE_ANON_KEY=your-anon-key")
    print("   set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key")
    print("   ```")

def main():
    """Función principal"""
    print("VERIFICACION DE CONECTIVIDAD SUPABASE")
    print("=" * 50)
    
    # Probar conexión real
    connection_success = test_supabase_connection()
    
    if not connection_success:
        test_with_mock_data()
        show_setup_instructions()
        print("\nERROR: Supabase no esta configurado correctamente")
        return False
    
    print("\nCONEXION COMPLETADA EXITOSAMENTE")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)