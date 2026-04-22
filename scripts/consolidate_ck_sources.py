import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.append(str(PROJECT_ROOT))

from src.api.utils.supabase_client import get_supabase_admin

def consolidate_sources():
    load_dotenv()
    supabase = get_supabase_admin()
    
    print("🚀 Iniciando consolidación de fuentes CardKingdom...")
    
    # IDs detectados: 17 (Oficial), 21 (Duplicado)
    ID_OFFICIAL = 17
    ID_DUPLICATE = 21
    
    try:
        # 1. Verificar existencia
        off = supabase.table('sources').select('source_name').eq('source_id', ID_OFFICIAL).maybe_single().execute()
        dup = supabase.table('sources').select('source_name').eq('source_id', ID_DUPLICATE).maybe_single().execute()
        
        if not off.data:
            print(f"❌ Error: El ID oficial {ID_OFFICIAL} no existe.")
            return
        
        if not dup.data:
            print(f"✅ El duplicado {ID_DUPLICATE} ya no existe o fue eliminado.")
        else:
            print(f"⚠️ Encontrado duplicado: '{dup.data['source_name']}' (ID {ID_DUPLICATE})")
            
            # 2. Migrar price_history (en lotes para evitar timeouts si es masivo)
            print(f"🔄 Intentando migrar historial de precios de {ID_DUPLICATE} a {ID_OFFICIAL}...")
            try:
                # Nota: Update masivo en Supabase puede dar timeout. 
                # Si esto falla, lo ideal es un RPC con SQL directo.
                update_res = supabase.table('price_history') \
                    .update({'source_id': ID_OFFICIAL}) \
                    .eq('source_id', ID_DUPLICATE) \
                    .execute()
                print(f"✅ Migración de price_history completada.")
            except Exception as e:
                print(f"⚠️ Error durante migración de precios: {e}")
                print("   (Es posible que el ID 21 no tenga registros o la tabla sea demasiado grande)")
            
            # 3. Eliminar fuente duplicada
            print(f"🗑️ Eliminando fuente duplicada (ID {ID_DUPLICATE})...")
            try:
                del_res = supabase.table('sources').delete().eq('source_id', ID_DUPLICATE).execute()
                # En algunas versiones del cliente, los errores se lanzan como excepciones
                # En otras, se devuelven en el objeto (pero aquí falló el atributo .error)
                if hasattr(del_res, 'data') and del_res.data:
                    print(f"✅ Fuente eliminada correctamente. Registro: {del_res.data}")
                else:
                    print(f"⚠️ No se devolvieron datos del delete. Verificando si sigue existiendo...")
                    check = supabase.table('sources').select('source_id').eq('source_id', ID_DUPLICATE).maybe_single().execute()
                    if not check.data:
                        print("✅ Confirmado: La fuente ya no existe.")
                    else:
                        print("❌ La fuente aún existe. Probablemente por una restricción de llave foránea.")
            except Exception as e:
                print(f"❌ Error al ejecutar el delete: {e}")
                if hasattr(e, 'message'):
                    print(f"   Detalle del error: {e.message}")
                if hasattr(e, 'details'):
                    print(f"   Detalles técnicos: {e.details}")

        # 4. Sincronizar nombres si es necesario
        print(f"📝 Asegurando nombre correcto para ID {ID_OFFICIAL}...")
        supabase.table('sources').update({'source_name': 'CardKingdom', 'source_code': 'CARDKINGDOM'}).eq('source_id', ID_OFFICIAL).execute()
        
        print("✨ ¡PROCESO FINALIZADO!")
        
    except Exception as e:
        print(f"❌ Error crítico durante la consolidación: {e}")

if __name__ == "__main__":
    consolidate_sources()
