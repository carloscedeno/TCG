import sys, os, uuid
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))

# Add project root to python path for scripts module
sys.path.append('e:/TCG Web App')
from scripts.sync.common.odoo_client import OdooClient
odoo = OdooClient()

dummy_order_id = str(uuid.uuid4())
print(f'Simulando compra de prueba desde la Web (Web Order ID: {dummy_order_id})')

# 1. Crear un partner (cliente) de prueba
partner_id = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'res.partner', 'create', [{
    'name': 'Carlos Prueba Web',
    'email': 'carlos.prueba@geekorium.com',
}])

# 2. Buscar un producto real para añadir al carrito
product = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'search_read', [[['default_code', '!=', False]]], {'limit': 1, 'fields': ['id', 'name', 'list_price']})[0]
print(f"Producto seleccionado: {product['name']} a ${product['list_price']}")

# 3. Crear la orden de venta
order_lines = [
    [0, 0, {
        'product_id': product['id'],
        'product_uom_qty': 1,
        'price_unit': product['list_price']
    }]
]

order_id = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'sale.order', 'create', [{
    'partner_id': partner_id,
    'order_line': order_lines,
    'client_order_ref': dummy_order_id
}])

# 4. Obtener el nombre de la orden creada
order = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'sale.order', 'read', [[order_id]], {'fields': ['name', 'amount_total', 'state']})[0]
print(f"\n✅ ¡ÉXITO! Orden de Venta creada en Odoo:")
print(f"- Odoo Order #: {order['name']}")
print(f"- Web Order Reference: {dummy_order_id}")
print(f"- Total: ${order['amount_total']}")
print(f"- Estado: {order['state']}")

