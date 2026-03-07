-- Semilla de datos para el entorno de desarrollo (TCG Project)
-- Este script inserta datos básicos para probar el flujo de la tienda sin afectar producción.

-- 1. Usuarios de prueba (Profiles)
-- Nota: En Supabase, los perfiles suelen crearse vía trigger desde auth.users.
-- Aquí insertamos perfiles de prueba asumiendo que los IDs ya existen o se crearán.
INSERT INTO public.profiles (id, email, full_name, role)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'Admin Developer', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'user@example.com', 'Test User', 'user')
ON CONFLICT (id) DO NOTHING;

-- 2. Productos de Ejemplo (Accesorios)
-- Estos productos son independientes del catálogo de cartas maestro.
INSERT INTO public.products (name, description, price, stock_quantity, category, image_url, is_active, type)
VALUES 
  ('Sleeves Dragon Shield - Matte Black', 'Paquete de 100 protectores para cartas.', 12.99, 50, 'Accessories', 'https://example.com/sleeves.jpg', true, 'accessory'),
  ('Deck Box Ultra Pro', 'Caja para guardar mazos de hasta 100 cartas.', 5.50, 20, 'Accessories', 'https://example.com/deckbox.jpg', true, 'accessory')
ON CONFLICT DO NOTHING;

-- 3. Ejemplo de Log de Notificaciones
INSERT INTO public.notification_logs (user_id, type, status, message)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'order_update', 'sent', 'Tu pedido de prueba ha sido creado.');

-- NOTA: Se recomienda correr un dump de las tablas maestros (cards, card_printings)
-- después de inicializar la rama para tener el catálogo completo.
