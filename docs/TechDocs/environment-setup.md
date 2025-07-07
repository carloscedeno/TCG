# Configuración de Entorno

## Visión General

Esta guía proporciona instrucciones paso a paso para configurar el entorno de desarrollo completo para la Plataforma Agregadora de Precios TCG.

## Requisitos del Sistema

### Requisitos Mínimos

- **Sistema Operativo**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **RAM**: 8GB mínimo, 16GB recomendado
- **Almacenamiento**: 10GB de espacio libre
- **Procesador**: Intel i5/AMD Ryzen 5 o superior

### Software Requerido

#### 1. Node.js
```bash
# Verificar versión actual
node --version  # Debe ser 18.0.0 o superior

# Instalar Node.js 18 LTS
# Windows: Descargar desde https://nodejs.org/
# macOS: brew install node@18
# Ubuntu: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
```

#### 2. npm
```bash
# Verificar versión
npm --version  # Debe ser 9.0.0 o superior

# Actualizar npm si es necesario
npm install -g npm@latest
```

#### 3. Git
```bash
# Verificar versión
git --version  # Debe ser 2.30.0 o superior

# Configurar Git
git config --global user.name "Tu Nombre"
git config --global user.email "tu.email@ejemplo.com"
```

#### 4. Supabase CLI
```bash
# Instalar Supabase CLI
npm install -g supabase

# Verificar instalación
supabase --version

# Iniciar sesión
supabase login
```

#### 5. Docker (Opcional)
```bash
# Instalar Docker Desktop
# Windows/macOS: https://www.docker.com/products/docker-desktop
# Ubuntu: sudo apt-get install docker.io docker-compose

# Verificar instalación
docker --version
docker-compose --version
```

## Configuración del Proyecto

### 1. Clonar el Repositorio

```bash
# Clonar el repositorio
git clone https://github.com/your-org/tcg-price-aggregator.git
cd tcg-price-aggregator

# Verificar estructura del proyecto
ls -la
```

### 2. Configurar Supabase

```bash
# Inicializar Supabase
supabase init

# Crear proyecto en Supabase Dashboard
# 1. Ir a https://supabase.com
# 2. Crear nuevo proyecto
# 3. Copiar Project Reference

# Vincular proyecto local con remoto
supabase link --project-ref YOUR_PROJECT_REF

# Iniciar servicios locales
supabase start

# Verificar estado
supabase status
```

### 3. Configurar Variables de Entorno

#### Archivo `.env.local`
```bash
# Copiar archivo de ejemplo
cp .env.example .env.local

# Editar variables de entorno
nano .env.local
```

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

# Rate Limiting
SCRYFALL_RATE_LIMIT=10
POKEMON_TCG_RATE_LIMIT=100
JUSTTCG_RATE_LIMIT=1000
APIFY_RATE_LIMIT=50

# Timeouts
API_TIMEOUT=30000
SCRAPING_TIMEOUT=60000
```

### 4. Instalar Dependencias

```bash
# Instalar dependencias del frontend
cd frontend
npm install

# Instalar dependencias del backend
cd ../backend
npm install

# Instalar dependencias compartidas
cd ../shared
npm install

# Volver al directorio raíz
cd ..
```

### 5. Configurar Base de Datos

```bash
# Aplicar migraciones
supabase db push

# Generar tipos TypeScript
supabase gen types typescript --local > types/database.types.ts

# Insertar datos iniciales
supabase db seed
```

### 6. Configurar IDE

#### Visual Studio Code

**Extensiones Recomendadas:**
```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "supabase.supabase",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-jest"
  ]
}
```

**Configuración del Workspace:**
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

#### Configuración de Prettier
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

#### Configuración de ESLint
```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "plugins": ["@typescript-eslint", "react-hooks"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

## Scripts de Desarrollo

### Configurar Scripts en package.json

```json
// package.json (raíz)
{
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "test": "npm run test:frontend && npm run test:backend",
    "test:frontend": "cd frontend && npm run test",
    "test:backend": "cd backend && npm run test",
    "lint": "npm run lint:frontend && npm run lint:backend",
    "lint:frontend": "cd frontend && npm run lint",
    "lint:backend": "cd backend && npm run lint",
    "format": "prettier --write .",
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "supabase:reset": "supabase db reset",
    "supabase:push": "supabase db push",
    "supabase:types": "supabase gen types typescript --local > types/database.types.ts"
  },
  "devDependencies": {
    "concurrently": "^7.6.0"
  }
}
```

### Scripts del Frontend

```json
// frontend/package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "type-check": "tsc --noEmit"
  }
}
```

### Scripts del Backend

```json
// backend/package.json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Verificación de la Instalación

### 1. Verificar Servicios

```bash
# Verificar que Supabase esté funcionando
supabase status

# Verificar que la base de datos esté accesible
supabase db ping

# Verificar tipos de TypeScript
npm run supabase:types
```

### 2. Ejecutar Tests

```bash
# Ejecutar tests del frontend
cd frontend
npm run test

# Ejecutar tests del backend
cd ../backend
npm run test

# Ejecutar todos los tests
cd ..
npm run test
```

### 3. Verificar Linting

```bash
# Verificar linting del frontend
cd frontend
npm run lint

# Verificar linting del backend
cd ../backend
npm run lint

# Verificar todo el proyecto
cd ..
npm run lint
```

### 4. Iniciar Servicios de Desarrollo

```bash
# Iniciar todos los servicios
npm run dev

# O iniciar por separado
npm run dev:frontend  # Puerto 3000
npm run dev:backend   # Puerto 3001
```

## Configuración de APIs Externas

### 1. Scryfall API
- **URL**: https://api.scryfall.com
- **Autenticación**: No requerida
- **Límites**: 10 peticiones por segundo
- **Configuración**: No requiere API key

### 2. Pokémon TCG API
- **URL**: https://api.pokemontcg.io/v2
- **Autenticación**: Opcional (para límites más altos)
- **Registro**: https://dev.pokemontcg.io/
- **Configuración**: Agregar API key a variables de entorno

### 3. JustTCG API
- **URL**: https://api.justtcg.com/v1 (conceptual)
- **Autenticación**: Requerida
- **Registro**: Contactar con JustTCG
- **Configuración**: Agregar API key a variables de entorno

### 4. Apify
- **URL**: https://api.apify.com/v2
- **Autenticación**: Token de API
- **Registro**: https://apify.com/
- **Configuración**: Agregar token a variables de entorno

## Troubleshooting

### Problemas Comunes

#### 1. Error de Conexión a Supabase
```bash
# Verificar configuración
supabase status

# Reiniciar servicios
supabase stop
supabase start

# Verificar variables de entorno
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

#### 2. Error de Dependencias
```bash
# Limpiar cache de npm
npm cache clean --force

# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

#### 3. Error de TypeScript
```bash
# Verificar tipos de base de datos
npm run supabase:types

# Verificar configuración de TypeScript
npx tsc --noEmit
```

#### 4. Error de Puerto en Uso
```bash
# Verificar puertos en uso
lsof -i :3000
lsof -i :3001

# Matar procesos si es necesario
kill -9 <PID>
```

### Comandos de Diagnóstico

```bash
# Verificar versiones
node --version
npm --version
git --version
supabase --version

# Verificar estado de servicios
supabase status
docker ps

# Verificar logs
supabase logs
docker logs <container-name>

# Verificar configuración
cat .env.local
supabase projects list
```

## Configuración de Producción

### 1. Variables de Entorno de Producción

```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### 2. Configuración de Vercel

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

### 3. Configuración de Supabase Production

```bash
# Desplegar Edge Functions
supabase functions deploy

# Desplegar migraciones
supabase db push --db-url $DATABASE_URL

# Configurar variables de entorno
supabase secrets set MY_SECRET=value
```

## Recursos Adicionales

### Documentación
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Herramientas Útiles
- [Postman](https://www.postman.com/) - Testing de APIs
- [Insomnia](https://insomnia.rest/) - Cliente REST alternativo
- [TablePlus](https://tableplus.com/) - Cliente de base de datos
- [DBeaver](https://dbeaver.io/) - Cliente de base de datos gratuito

### Comunidad
- [Supabase Discord](https://discord.supabase.com/)
- [Next.js Discord](https://discord.gg/nextjs)
- [TypeScript Community](https://www.typescriptlang.org/community/) 