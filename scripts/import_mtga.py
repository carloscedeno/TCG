"""
Script para importar inventario en formato MTGA/Arena
Formato: <cantidad> <nombre> (<set>) <collector_number> [*F*]
Ejemplo: 1 Ezio Auditore da Firenze (ACR) 131
"""
import os
import sys
import re
from typing import List, Dict, Any

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from src.api.utils.supabase_client import get_supabase_admin

# Regex para parsear el formato MTGA
# Formato: "1 Ezio Auditore da Firenze (ACR) 131"
# Opcionalmente puede tener *F* al final para foil
MTGA_FORMAT_REGEX = r'^(\d+)\s+(.+?)\s+\((.+?)\)\s+(\d+[a-z]?)\s*(\*F\*)?$'

def parse_mtga_line(line: str) -> Dict[str, Any] | None:
    """
    Parsea una línea en formato MTGA y retorna un diccionario con los datos.
    """
    line = line.strip()
    if not line:
        return None
    
    match = re.match(MTGA_FORMAT_REGEX, line)
    if not match:
        print(f"⚠️ Línea no reconocida: {line}")
        return None
    
    quantity, name, set_code, collector_number, foil = match.groups()
    
    return {
        'quantity': int(quantity),
        'name': name.strip(),
        'set_code': set_code.strip().upper(),
        'collector_number': collector_number.strip(),
        'is_foil': bool(foil)
    }

def import_mtga_file(file_path: str, game: str = 'MTG'):
    """
    Importa un archivo en formato MTGA a la tabla products.
    """
    if not os.path.exists(file_path):
        print(f"❌ Error: Archivo no encontrado: {file_path}")
        return
    
    admin_client = get_supabase_admin()
    
    print(f"📖 Leyendo archivo MTGA: {file_path}...")
    
    parsed_cards = []
    failed_lines = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                parsed = parse_mtga_line(line)
                if parsed:
                    parsed_cards.append(parsed)
                elif line.strip():  # Solo reportar líneas no vacías que fallaron
                    failed_lines.append((line_num, line.strip()))
        
        if failed_lines:
            print(f"\n⚠️ {len(failed_lines)} líneas no pudieron ser parseadas:")
            for line_num, line in failed_lines[:5]:  # Mostrar solo las primeras 5
                print(f"  Línea {line_num}: {line}")
            if len(failed_lines) > 5:
                print(f"  ... y {len(failed_lines) - 5} más")
        
        if not parsed_cards:
            print("❌ No se encontraron cartas válidas en el archivo.")
            return
        
        print(f"\n✅ {len(parsed_cards)} cartas parseadas correctamente.")
        print(f"🔍 Buscando información de cartas en la base de datos...\n")
        
        products_to_upsert = []
        not_found = []
        
        for card in parsed_cards:
            try:
                # Buscar la carta en card_printings
                query = admin_client.table('card_printings').select(
                    'printing_id, image_url, cards!inner(card_name), sets!inner(set_code, set_name), aggregated_prices(avg_market_price_usd)'
                ).eq('cards.card_name', card['name']).eq('sets.set_code', card['set_code'].lower())
                
                # Si tiene collector_number, usarlo para match exacto
                if card['collector_number']:
                    query = query.eq('collector_number', card['collector_number'])
                
                res = query.limit(1).execute()
                
                # Fallback: buscar solo por nombre si no se encontró con set
                if not res.data:
                    print(f"  ⚠️ No encontrado con set {card['set_code']}, buscando solo por nombre: {card['name']}")
                    res = admin_client.table('card_printings').select(
                        'printing_id, image_url, cards!inner(card_name), sets(set_code, set_name), aggregated_prices(avg_market_price_usd)'
                    ).eq('cards.card_name', card['name']).limit(1).execute()
                
                if res.data:
                    match = res.data[0]
                    printing_id = match.get('printing_id')
                    image_url = match.get('image_url')
                    set_info = match.get('sets', {})
                    actual_set_code = set_info.get('set_code', card['set_code']).upper() if set_info else card['set_code']
                    set_name = set_info.get('set_name', '') if set_info else ''
                    
                    # Obtener precio
                    prices = match.get('aggregated_prices') or []
                    market_price = 0
                    if isinstance(prices, list) and prices:
                        market_price = prices[0].get('avg_market_price_usd') or 0
                    elif isinstance(prices, dict):
                        market_price = prices.get('avg_market_price_usd') or 0
                    
                    products_to_upsert.append({
                        'name': card['name'],
                        'game': game,
                        'set_code': actual_set_code,
                        'stock': card['quantity'],
                        'price': market_price,
                        'image_url': image_url,
                        'printing_id': printing_id
                    })
                    
                    foil_indicator = " (FOIL)" if card['is_foil'] else ""
                    print(f"  ✅ {card['name']} ({actual_set_code}) #{card['collector_number']}{foil_indicator} - ${market_price:.2f}")
                else:
                    not_found.append(f"{card['name']} ({card['set_code']}) #{card['collector_number']}")
                    print(f"  ❌ No encontrado: {card['name']} ({card['set_code']}) #{card['collector_number']}")
            
            except Exception as e:
                print(f"  ❌ Error procesando {card['name']}: {e}")
                not_found.append(f"{card['name']} ({card['set_code']}) - Error: {e}")
        
        if not products_to_upsert:
            print("\n❌ No se encontraron cartas válidas para importar.")
            if not_found:
                print(f"\n📝 Cartas no encontradas ({len(not_found)}):")
                for nf in not_found[:10]:
                    print(f"  - {nf}")
                if len(not_found) > 10:
                    print(f"  ... y {len(not_found) - 10} más")
            return
        
        print(f"\n🚀 Importando {len(products_to_upsert)} productos a la tabla 'products'...")
        
        # Consolidar duplicados
        consolidated = {}
        for p in products_to_upsert:
            key = (p['name'], p['set_code'])
            if key in consolidated:
                consolidated[key]['stock'] += p['stock']
            else:
                consolidated[key] = p
        
        final_list = list(consolidated.values())
        
        print(f"📦 {len(final_list)} productos únicos después de consolidación.\n")
        
        # Upsert a la base de datos
        imported_count = 0
        updated_count = 0
        
        for item in final_list:
            try:
                # Verificar si el producto ya existe
                check = admin_client.table('products').select('id, stock').eq('printing_id', item['printing_id']).execute()
                
                if check.data:
                    # Actualizar stock existente
                    row_id = check.data[0]['id']
                    new_stock = check.data[0]['stock'] + item['stock']
                    admin_client.table('products').update({
                        'stock': new_stock,
                        'price': item['price']
                    }).eq('id', row_id).execute()
                    print(f"  📈 Actualizado: {item['name']} - Stock: {check.data[0]['stock']} → {new_stock}")
                    updated_count += 1
                else:
                    # Insertar nuevo producto
                    admin_client.table('products').insert(item).execute()
                    print(f"  ✨ Nuevo: {item['name']} - Stock: {item['stock']}, Precio: ${item['price']:.2f}")
                    imported_count += 1
            
            except Exception as e:
                print(f"  ❌ Error al guardar {item['name']}: {e}")
        
        print(f"\n🎉 Importación completada!")
        print(f"  ✨ Nuevos productos: {imported_count}")
        print(f"  📈 Productos actualizados: {updated_count}")
        
        if not_found:
            print(f"\n⚠️ {len(not_found)} cartas no encontradas en la base de datos:")
            for nf in not_found[:10]:
                print(f"  - {nf}")
            if len(not_found) > 10:
                print(f"  ... y {len(not_found) - 10} más")
    
    except Exception as e:
        print(f"❌ Error crítico durante la importación: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Importar archivo MTGA/Arena a inventario')
    parser.add_argument('file', help='Ruta al archivo .txt en formato MTGA')
    parser.add_argument('--game', default='MTG', help='Categoría del juego (MTG, PKM, YGO)')
    
    args = parser.parse_args()
    import_mtga_file(args.file, args.game)
