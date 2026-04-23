-- =============================================================================
-- FIX_ADMIN_DEV.sql
-- Asegura la infraestructura de perfiles y permite crear administradores en DEV
-- =============================================================================

BEGIN;

-- 1. Asegurar tabla de perfiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS en perfiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 3. Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Función para promover a admin (por email)
CREATE OR REPLACE FUNCTION public.make_admin_by_email(p_email TEXT)
RETURNS void AS $$
DECLARE
    target_id UUID;
BEGIN
    SELECT id INTO target_id FROM auth.users WHERE email = p_email;
    
    IF target_id IS NULL THEN
        RAISE EXCEPTION 'Usuario con email % no encontrado', p_email;
    END IF;

    -- Actualizar tabla de perfiles
    INSERT INTO public.profiles (id, role)
    VALUES (target_id, 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';

    -- Opcional: Actualizar metadatos de auth para login más rápido
    UPDATE auth.users 
    SET raw_app_meta_data = jsonb_set(
        COALESCE(raw_app_meta_data, '{}'::jsonb),
        '{role}',
        '"admin"'
    )
    WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- INSTRUCCIONES:
-- 1. Ejecuta este script en el SQL Editor de Supabase (DEV).
-- 2. Crea tu usuario normalmente en la web o en el Dashboard.
-- 3. Ejecuta: SELECT make_admin_by_email('tu-email@ejemplo.com');
