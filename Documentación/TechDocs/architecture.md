# Arquitectura del Sistema

## Visión General

La Plataforma Agregadora de Precios TCG está diseñada como una aplicación web moderna con arquitectura de microservicios, utilizando tecnologías cloud-native para garantizar escalabilidad, rendimiento y mantenibilidad.

## Diagrama de Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Base de       │
│   (React/TS)    │◄──►│   (Node.js)     │◄──►│   Datos         │
│                 │    │                 │    │   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Supabase      │    │   APIs          │
│   (Hosting)     │    │   (Functions)   │    │   Externas      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Componentes del Sistema

### 1. Frontend (React + TypeScript)

**Tecnologías:**
- React 18+ con TypeScript
- Vite como bundler
- Tailwind CSS para estilos
- React Query para gestión de estado del servidor
- React Router para navegación
- Chart.js para gráficos

**Estructura:**
```
frontend/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── pages/         # Páginas principales
│   ├── hooks/         # Custom hooks
│   ├── services/      # Servicios de API
│   ├── types/         # Definiciones TypeScript
│   ├── utils/         # Utilidades
│   └── styles/        # Estilos globales
├── public/            # Assets estáticos
└── package.json
```

### 2. Backend (Node.js + Express)

**Tecnologías:**
- Node.js 18+
- Express.js
- TypeScript
- Supabase Client
- JWT para autenticación
- Rate limiting
- CORS

**Estructura:**
```
backend/
├── src/
│   ├── controllers/   # Controladores de rutas
│   ├── services/      # Lógica de negocio
│   ├── middleware/    # Middleware personalizado
│   ├── routes/        # Definición de rutas
│   ├── types/         # Tipos TypeScript
│   └── utils/         # Utilidades
├── tests/             # Tests unitarios
└── package.json
```

### 3. Base de Datos (Supabase)

**Tecnologías:**
- PostgreSQL 15+
- Supabase como plataforma
- Row Level Security (RLS)
- Real-time subscriptions
- Edge Functions

**Características:**
- Esquema normalizado
- Índices optimizados
- Triggers para cálculos automáticos
- Backup automático

### 4. APIs Externas

**APIs Principales:**
- **Scryfall**: Datos de Magic: The Gathering
- **Pokémon TCG API**: Datos de Pokémon
- **JustTCG**: Agregador de precios
- **Apify**: Web scraping de Cardmarket

## Patrones de Diseño

### 1. Repository Pattern
Para abstraer el acceso a datos y facilitar testing.

### 2. Service Layer Pattern
Para encapsular la lógica de negocio.

### 3. Factory Pattern
Para crear instancias de diferentes tipos de cartas.

### 4. Observer Pattern
Para notificaciones en tiempo real de cambios de precios.

## Flujo de Datos

### 1. Búsqueda de Cartas
```
Usuario → Frontend → Backend → APIs Externas → Base de Datos → Respuesta
```

### 2. Actualización de Precios
```
Scheduler → Backend → APIs Externas → Base de Datos → Notificación Real-time
```

### 3. Gestión de Colección
```
Usuario → Frontend → Backend → Base de Datos → Respuesta
```

## Seguridad

### 1. Autenticación
- Supabase Auth con JWT
- Refresh tokens automáticos
- Sesiones seguras

### 2. Autorización
- Row Level Security (RLS)
- Roles y permisos granulares
- Validación de entrada

### 3. Protección de Datos
- HTTPS obligatorio
- Sanitización de inputs
- Rate limiting
- CORS configurado

## Escalabilidad

### 1. Horizontal
- Load balancing con Vercel
- Múltiples instancias de backend
- Base de datos distribuida

### 2. Vertical
- Optimización de consultas
- Caching inteligente
- CDN para assets

### 3. Caching Strategy
- Redis para caché de sesiones
- CDN para imágenes
- Cache de consultas frecuentes

## Monitoreo y Logging

### 1. Métricas
- Response times
- Error rates
- User engagement
- API usage

### 2. Logging
- Structured logging
- Error tracking
- Performance monitoring
- User analytics

## Deployment

### 1. Frontend
- Vercel (automatic deployments)
- Preview deployments
- Edge functions

### 2. Backend
- Supabase Edge Functions
- Vercel Functions (alternativa)
- Docker containers

### 3. Base de Datos
- Supabase managed
- Automatic backups
- Point-in-time recovery

## Consideraciones de Rendimiento

### 1. Optimizaciones Frontend
- Code splitting
- Lazy loading
- Image optimization
- Bundle size optimization

### 2. Optimizaciones Backend
- Database indexing
- Query optimization
- Connection pooling
- Caching strategies

### 3. Optimizaciones Base de Datos
- Proper indexing
- Query optimization
- Partitioning for large tables
- Materialized views for analytics 