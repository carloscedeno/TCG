import asyncio
import sys
from src.api.services.cart_service import CartService
from src.api.services.collection_service import CollectionService
from src.api.services.alert_service import AlertService
from src.api.services.portfolio_service import PortfolioService
from src.api.utils.supabase_client import supabase

async def verify_everything():
    print("\n--- [VERIFICACIÓN INTEGRAL DEL PRD] ---")
    user_id = "ba28e77c-db6a-4ea3-812b-dd9ece48bcac"
    
    # 1. Test Portfolio & Analytics
    print("1. Verificando Analíticas de Portafolio...")
    try:
        analytics = await PortfolioService.get_portfolio_analytics(user_id)
        print(f"   [OK] Valor Mercado: ${analytics['total_market_value']}")
    except Exception as e:
        print(f"   [FAIL] Analytics: {e}")

    # 2. Test Alerts
    print("2. Verificando Procesamiento de Alertas...")
    try:
        res = await AlertService.process_all_alerts()
        print(f"   [OK] Alertas procesadas: {res['processed']}, disparadas: {res['triggered']}")
    except Exception as e:
        print(f"   [FAIL] Alerts: {e}")

    # 3. Test Commerce (Checkout)
    print("3. Verificando Ciclo de Compra e Inventario...")
    try:
        # Get a real product
        prods = supabase.table('products').select('id, stock, price').gt('stock', 0).limit(1).execute()
        if prods.data:
            p = prods.data[0]
            print(f"   Añadiendo producto {p['id']} al carrito...")
            await CartService.add_to_cart(user_id, p['id'], 1)
            print("   Ejecutando Checkout...")
            order = await CartService.checkout(user_id)
            print(f"   [OK] Orden completada: {order['order_id']}")
        else:
            print("   [SKIP] No hay productos con stock para probar checkout.")
    except Exception as e:
        print(f"   [FAIL] Commerce: {e}")

    # 4. Test Inventory Management (Edición Inline)
    print("4. Verificando Edición Inline de Inventario...")
    try:
        # Add item
        await CollectionService.import_data(user_id, [{'name': 'Black Lotus', 'quantity': 1}], {'name': 'name', 'quantity': 'quantity'})
        item = supabase.table('user_collections').select('id').eq('user_id', user_id).limit(1).execute()
        if item.data:
            i_id = item.data[0]['id']
            print(f"   Actualizando item {i_id} a cantidad 50...")
            await CollectionService.update_item(user_id, i_id, 50)
            print("   Eliminando item...")
            await CollectionService.remove_item(user_id, i_id)
            print("   [OK] Gestión de inventario verificada.")
    except Exception as e:
        print(f"   [FAIL] Inventory: {e}")

if __name__ == "__main__":
    asyncio.run(verify_everything())
