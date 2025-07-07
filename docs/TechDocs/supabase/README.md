# Configuración de Supabase

## Visión General

Supabase es la plataforma principal para nuestra aplicación, proporcionando base de datos PostgreSQL, autenticación, real-time subscriptions, Edge Functions y storage. Esta documentación cubre la configuración completa del proyecto.

## Configuración Inicial

### 1. Crear Proyecto Supabase

1. Ir a [supabase.com](https://supabase.com)
2. Crear una nueva cuenta o iniciar sesión
3. Crear un nuevo proyecto
4. Seleccionar la región más cercana a los usuarios objetivo
5. Configurar contraseña de base de datos

### 2. Instalar Supabase CLI

```bash
# Instalar Supabase CLI globalmente
npm install -g supabase

# O usar npx
npx supabase --version

# Iniciar sesión
supabase login
```

### 3. Inicializar Proyecto Local

```bash
# En el directorio raíz del proyecto
supabase init

# Vincular con proyecto remoto
supabase link --project-ref YOUR_PROJECT_REF
```

## Variables de Entorno

### Archivo `.env.local`

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database Configuration
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# API Keys
SCRYFALL_API_URL=https://api.scryfall.com
POKEMON_TCG_API_KEY=your-pokemon-api-key
JUSTTCG_API_KEY=your-justtcg-api-key
APIFY_API_TOKEN=your-apify-token

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Archivo `.env.production`

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database Configuration
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# API Keys
SCRYFALL_API_URL=https://api.scryfall.com
POKEMON_TCG_API_KEY=your-pokemon-api-key
JUSTTCG_API_KEY=your-justtcg-api-key
APIFY_API_TOKEN=your-apify-token

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

## Configuración de Autenticación

### 1. Configuración de Auth en Supabase Dashboard

1. Ir a **Authentication > Settings**
2. Configurar **Site URL**: `http://localhost:3000` (desarrollo)
3. Configurar **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`
4. Habilitar **Email confirmations**
5. Configurar **Password strength requirements**

### 2. Configuración de Email Templates

```sql
-- Personalizar templates de email
UPDATE auth.config
SET 
  mailer_autoconfirm = false,
  enable_signup = true,
  enable_confirmations = true,
  enable_recoveries = true;
```

### 3. Configuración de Políticas de Contraseñas

```sql
-- Configurar políticas de contraseñas
UPDATE auth.config
SET 
  password_min_length = 8,
  password_require_uppercase = true,
  password_require_lowercase = true,
  password_require_numbers = true,
  password_require_special_chars = true;
```

## Configuración de Storage

### 1. Crear Buckets

```sql
-- Bucket para imágenes de cartas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('card-images', 'card-images', true);

-- Bucket para avatares de usuario
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Bucket para archivos de importación
INSERT INTO storage.buckets (id, name, public) 
VALUES ('imports', 'imports', false);
```

### 2. Políticas de Storage

```sql
-- Políticas para card-images (público)
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'card-images');

-- Políticas para avatars (solo propietario)
CREATE POLICY "Users can view own avatar" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Políticas para imports (solo propietario)
CREATE POLICY "Users can manage own imports" ON storage.objects
FOR ALL USING (
  bucket_id = 'imports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Edge Functions

### 1. Estructura de Edge Functions

```
supabase/
├── functions/
│   ├── update-prices/
│   │   ├── index.ts
│   │   └── package.json
│   ├── import-collection/
│   │   ├── index.ts
│   │   └── package.json
│   └── sync-card-data/
│       ├── index.ts
│       └── package.json
└── config.toml
```

### 2. Ejemplo: Función de Actualización de Precios

```typescript
// supabase/functions/update-prices/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Lógica de actualización de precios
    const { data, error } = await supabaseClient
      .from('price_history')
      .select('*')
      .limit(10)

    if (error) throw error

    return new Response(
      JSON.stringify({ data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
```

### 3. Desplegar Edge Functions

```bash
# Desplegar todas las funciones
supabase functions deploy

# Desplegar función específica
supabase functions deploy update-prices

# Ver logs de función
supabase functions logs update-prices
```

## Configuración de Base de Datos

### 1. Ejecutar Migraciones

```bash
# Aplicar migraciones locales
supabase db push

# Resetear base de datos (desarrollo)
supabase db reset

# Generar tipos TypeScript
supabase gen types typescript --local > types/database.types.ts
```

### 2. Configuración de RLS

```sql
-- Habilitar RLS en todas las tablas de usuario
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;

-- Crear políticas (ver documentación de base de datos)
```

### 3. Configuración de Real-time

```sql
-- Habilitar real-time para tablas específicas
ALTER PUBLICATION supabase_realtime ADD TABLE price_history;
ALTER PUBLICATION supabase_realtime ADD TABLE aggregated_prices;
```

## Configuración de Monitoreo

### 1. Configurar Logs

```bash
# Ver logs de base de datos
supabase db logs

# Ver logs de Edge Functions
supabase functions logs

# Ver logs de autenticación
supabase auth logs
```

### 2. Configurar Alertas

En el dashboard de Supabase:
1. Ir a **Settings > Alerts**
2. Configurar alertas para:
   - Uso de almacenamiento
   - Errores de Edge Functions
   - Límites de API
   - Uso de base de datos

## Configuración de Desarrollo

### 1. Configuración Local

```bash
# Iniciar Supabase localmente
supabase start

# Verificar estado
supabase status

# Detener servicios locales
supabase stop
```

### 2. Configuración de IDE

```json
// .vscode/settings.json
{
  "supabase": {
    "projectRef": "your-project-ref",
    "dbPassword": "your-db-password"
  }
}
```

### 3. Scripts de Desarrollo

```json
// package.json
{
  "scripts": {
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "supabase:reset": "supabase db reset",
    "supabase:push": "supabase db push",
    "supabase:types": "supabase gen types typescript --local > types/database.types.ts"
  }
}
```

## Configuración de Producción

### 1. Configuración de Dominio

1. Ir a **Settings > General**
2. Configurar **Custom Domain**
3. Actualizar DNS records
4. Configurar SSL automático

### 2. Configuración de Backup

```sql
-- Configurar backup automático
SELECT cron.schedule(
  'backup-database',
  '0 2 * * *', -- Diario a las 2 AM
  'SELECT pg_dump(...)'
);
```

### 3. Configuración de Seguridad

```sql
-- Configurar políticas de seguridad adicionales
CREATE POLICY "Rate limiting" ON auth.users
FOR ALL USING (
  -- Implementar lógica de rate limiting
);
```

## Troubleshooting

### Problemas Comunes

1. **Error de conexión a base de datos**
   - Verificar variables de entorno
   - Verificar configuración de red
   - Verificar credenciales

2. **Error de autenticación**
   - Verificar configuración de Auth
   - Verificar redirect URLs
   - Verificar políticas de RLS

3. **Error de Edge Functions**
   - Verificar logs de función
   - Verificar variables de entorno
   - Verificar permisos

### Comandos de Diagnóstico

```bash
# Verificar estado de servicios
supabase status

# Verificar configuración
supabase projects list

# Verificar logs
supabase logs

# Verificar tipos
supabase gen types typescript --local
```

## Recursos Adicionales

- [Documentación oficial de Supabase](https://supabase.com/docs)
- [Guía de migraciones](https://supabase.com/docs/guides/database/migrations)
- [Guía de Edge Functions](https://supabase.com/docs/guides/functions)
- [Guía de autenticación](https://supabase.com/docs/guides/auth)
- [Guía de storage](https://supabase.com/docs/guides/storage) 