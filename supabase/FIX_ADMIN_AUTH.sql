-- =============================================================================
-- FIX_ADMIN_AUTH: Reparación de Acceso Administrativo
-- =============================================================================
-- Este script asegura que el usuario admin@geeko.com exista y tenga el rol 'admin'.
-- Ejecutar en el SQL Editor de Supabase.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  new_user_id UUID := '00000000-0000-0000-0000-000000000001'; -- ID estático para consistencia en dev
  user_email TEXT := 'admin@geeko.com';
  user_pass TEXT := 'admin123';
  existing_id UUID;
BEGIN
  -- 1. Buscar si el usuario ya existe por email
  SELECT id INTO existing_id FROM auth.users WHERE email = user_email;

  IF existing_id IS NULL THEN
    -- 2. Crear usuario en auth.users si no existe
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      last_sign_in_at,
      confirmation_token,
      is_super_admin
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      user_email,
      crypt(user_pass, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      now(),
      '',
      false
    );
    existing_id := new_user_id;
    RAISE NOTICE 'Usuario admin@geeko.com creado con ID %', existing_id;
  ELSE
    -- 3. Resetear password si ya existe
    UPDATE auth.users 
    SET encrypted_password = crypt(user_pass, gen_salt('bf')),
        updated_at = now()
    WHERE id = existing_id;
    RAISE NOTICE 'Password de admin@geeko.com reseteado.';
  END IF;

  -- 4. Asegurar perfil con rol admin
  INSERT INTO public.profiles (id, role)
  VALUES (existing_id, 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = now();

  RAISE NOTICE 'Permisos de admin confirmados (role=admin) para ID %', existing_id;
END $$;
