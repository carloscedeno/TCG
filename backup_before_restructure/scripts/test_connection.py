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
    print("🔍 Verificando configuración de Supabase...")
    
    # Verificar variables de entorno
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_anon_key = os.getenv('SUPABASE_ANON_KEY')
    supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    print(f"📋 Variables de entorno:")
    print(f"   SUPABASE_URL: {'✅ Configurado' if supabase_url else '❌ No configurado'}")
    print(f"   SUPABASE_ANON_KEY: {'✅ Configurado' if supabase_anon_key else '❌ No configurado'}")
    print(f"   SUPABASE_SERVICE_ROLE_KEY: {'✅ Configurado' if supabase_service_key else '❌ No configurado'}")
    
    if not all([supabase_url, supabase_anon_key, supabase_service_key]):
        print("\n❌ Variables de entorno faltantes")
        print("💡 Para configurar Supabase:")
        print("   1. Ve a https://supabase.com")
        print("   2. Crea un nuevo proyecto")
        print("   3. Ve a Settings > API")
        print("   4. Copia los valores a tu archivo .env")
        print("   5. O configura las variables de entorno directamente")
        return False
    
    # Verificar formato de URL (supabase_url ya no es None aquí)
    if not supabase_url or not supabase_url.startswith('https://') or '.supabase.co' not in supabase_url:
        print("❌ URL de Supabase inválida")
        print("   Debe ser: https://your-project-ref.supabase.co")
        return False
    
    print("✅ Variables de entorno configuradas correctamente")
    
    # Intentar importar y probar conexión
    try:
        print("\n🔌 Probando conexión con Supabase...")
        from supabase import create_client, Client
        
        # Crear cliente (supabase_url y supabase_anon_key ya no son None)
        supabase: Client = create_client(str(supabase_url), str(supabase_anon_key))
        
        # Probar conexión simple
        try:
            # Intentar una consulta simple
            response = supabase.table('games').select('count').limit(1).execute()
            print("✅ Conexión exitosa con Supabase")
            return True
        except Exception as e:
            print(f"❌ Error de conexión: {e}")
            
            # Verificar si es un error de autenticación
            if "JWT" in str(e) or "auth" in str(e).lower():
                print("💡 Error de autenticación - verifica tus claves API")
            elif "not found" in str(e).lower():
                print("💡 Tabla no encontrada - la base de datos puede estar vacía")
            else:
                print("💡 Error de red o configuración")
            
            return False
            
    except ImportError:
        print("❌ Error: No se pudo importar la librería supabase")
        print("💡 Instala con: pip install supabase")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def test_with_mock_data():
    """Probar con datos simulados"""
    print("\n🧪 Probando con datos simulados...")
    
    # Simular configuración
    mock_url = "https://test-project.supabase.co"
    mock_key = "test-key"
    
    print(f"   URL simulada: {mock_url}")
    print(f"   Clave simulada: {mock_key[:10]}...")
    
    try:
        from supabase import create_client
        supabase = create_client(mock_url, mock_key)
        print("✅ Cliente de Supabase creado correctamente")
        print("💡 Para usar con datos reales, configura las variables de entorno")
        return True
    except Exception as e:
        print(f"❌ Error creando cliente: {e}")
        return False

def show_setup_instructions():
    """Mostrar instrucciones de configuración"""
    print("\n📚 INSTRUCCIONES DE CONFIGURACIÓN")
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
    print("   Opción A - Archivo .env:")
    print("   ```")
    print("   SUPABASE_URL=https://your-project-ref.supabase.co")
    print("   SUPABASE_ANON_KEY=your-anon-key")
    print("   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key")
    print("   ```")
    
    print("\n   Opción B - Variables de entorno del sistema:")
    print("   ```bash")
    print("   export SUPABASE_URL=https://your-project-ref.supabase.co")
    print("   export SUPABASE_ANON_KEY=your-anon-key")
    print("   export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key")
    print("   ```")
    
    print("\n4. Ejecutar configuración:")
    print("   ```bash")
    print("   python setup_complete_system.py")
    print("   ```")

def main():
    """Función principal"""
    print("🚀 VERIFICACIÓN DE CONECTIVIDAD SUPABASE")
    print("=" * 50)
    
    # Probar conexión real
    connection_success = test_supabase_connection()
    
    if not connection_success:
        # Probar con datos simulados
        test_with_mock_data()
        
        # Mostrar instrucciones
        show_setup_instructions()
        
        print("\n❌ Supabase no está configurado correctamente")
        print("💡 Sigue las instrucciones arriba para configurarlo")
        return False
    
    print("\n🎉 ¡Supabase está funcionando correctamente!")
    print("✅ Puedes proceder con la configuración completa")
    print("💡 Ejecuta: python setup_complete_system.py")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 