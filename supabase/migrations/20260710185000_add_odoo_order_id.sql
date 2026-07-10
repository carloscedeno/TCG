-- Agregar columna odoo_order_id a la tabla orders para guardar la referencia de Odoo (ej. SO00145)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS odoo_order_id TEXT UNIQUE;
