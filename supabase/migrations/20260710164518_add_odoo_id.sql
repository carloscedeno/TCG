-- Agregar columna odoo_id a la tabla accessories
ALTER TABLE accessories
ADD COLUMN odoo_id BIGINT UNIQUE;

-- Opcional: Para evitar problemas futuros, también se podría añadir a products, pero el usuario confirmó
-- que solo creará sellados desde Odoo.
