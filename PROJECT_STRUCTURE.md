# Estructura del Proyecto TCG Web App

## 🏗️ Nueva Arquitectura de Carpetas

```
TCG Web App/
├── .env                          # Variables de entorno (raíz del proyecto)
├── .gitignore                    # Archivos ignorados por Git
├── README.md                     # Documentación principal del proyecto
├── requirements.txt              # Dependencias de Python
├── pyproject.toml               # Configuración del proyecto Python
│
├── backend/                      # Backend y APIs
│   ├── __init__.py
│   ├── config/                   # Configuración del backend
│   │   ├── __init__.py
│   │   ├── settings.py           # Configuración general
│   │   ├── database.py           # Configuración de base de datos
│   │   └── environment.py        # Variables de entorno
│   │
│   ├── database/                 # Base de datos y modelos
│   │   ├── __init__.py
│   │   ├── models/               # Modelos de datos
│   │   │   ├── __init__.py
│   │   │   ├── games.py          # Modelo de juegos
│   │   │   ├── cards.py          # Modelo de cartas
│   │   │   ├── prices.py         # Modelo de precios
│   │   │   └── users.py          # Modelo de usuarios
│   │   ├── migrations/           # Migraciones de base de datos
│   │   │   ├── 001_initial_schema.sql
│   │   │   ├── 002_add_indexes.sql
│   │   │   └── 003_add_triggers.sql
│   │   ├── seeds/                # Datos iniciales
│   │   │   ├── 001_games.sql
│   │   │   ├── 002_conditions.sql
│   │   │   └── 003_sources.sql
│   │   └── setup.py              # Configuración de BD
│   │
│   ├── api/                      # APIs y endpoints
│   │   ├── __init__.py
│   │   ├── routes/               # Rutas de la API
│   │   │   ├── __init__.py
│   │   │   ├── games.py          # Endpoints de juegos
│   │   │   ├── cards.py          # Endpoints de cartas
│   │   │   ├── prices.py         # Endpoints de precios
│   │   │   ├── collections.py    # Endpoints de colecciones
│   │   │   └── search.py         # Endpoints de búsqueda
│   │   ├── middleware/           # Middleware
│   │   │   ├── __init__.py
│   │   │   ├── auth.py           # Autenticación
│   │   │   ├── cors.py           # CORS
│   │   │   └── rate_limit.py     # Rate limiting
│   │   └── utils/                # Utilidades de API
│   │       ├── __init__.py
│   │       ├── responses.py      # Respuestas estandarizadas
│   │       └── validators.py     # Validación de datos
│   │
│   ├── services/                 # Lógica de negocio
│   │   ├── __init__.py
│   │   ├── tcg_service.py        # Servicio principal TCG
│   │   ├── price_service.py      # Servicio de precios
│   │   ├── collection_service.py # Servicio de colecciones
│   │   └── search_service.py     # Servicio de búsqueda
│   │
│   └── supabase/                 # Integración con Supabase
│       ├── __init__.py
│       ├── client.py             # Cliente de Supabase
│       ├── functions/            # Edge Functions
│       │   ├── tcg-api/
│       │   │   ├── index.ts
│       │   │   └── supabase/
│       │   │       └── config.toml
│       │   └── import_map.json
│       └── setup.py              # Configuración de Supabase
│
├── scraper/                      # Sistema de scraping
│   ├── __init__.py
│   ├── config/                   # Configuración del scraper
│   │   ├── __init__.py
│   │   ├── settings.py           # Configuración general
│   │   └── marketplaces.py       # Configuración de marketplaces
│   │
│   ├── scrapers/                 # Scrapers específicos
│   │   ├── __init__.py
│   │   ├── base.py               # Clase base para scrapers
│   │   ├── cardmarket.py         # Scraper de Cardmarket
│   │   ├── tcgplayer.py          # Scraper de TCGplayer
│   │   ├── cardkingdom.py        # Scraper de Card Kingdom
│   │   └── trollandtoad.py       # Scraper de Troll and Toad
│   │
│   ├── data/                     # Gestión de datos
│   │   ├── __init__.py
│   │   ├── manager.py            # Gestor de datos
│   │   ├── normalizer.py         # Normalización de datos
│   │   └── validator.py          # Validación de datos
│   │
│   ├── utils/                    # Utilidades del scraper
│   │   ├── __init__.py
│   │   ├── anti_bot.py           # Gestión anti-bot
│   │   ├── rate_limiter.py       # Rate limiting
│   │   └── logger.py             # Logging
│   │
│   ├── tests/                    # Pruebas del scraper
│   │   ├── __init__.py
│   │   ├── test_scrapers.py
│   │   ├── test_data_manager.py
│   │   └── test_utils.py
│   │
│   └── main.py                   # Script principal del scraper
│
├── data_loader/                  # Cargador de datos externos
│   ├── __init__.py
│   ├── config/                   # Configuración
│   │   ├── __init__.py
│   │   └── apis.py               # Configuración de APIs externas
│   │
│   ├── loaders/                  # Cargadores específicos
│   │   ├── __init__.py
│   │   ├── scryfall.py           # Cargador de Scryfall (MTG)
│   │   ├── pokemon.py            # Cargador de Pokémon API
│   │   └── sample_data.py        # Generador de datos de muestra
│   │
│   └── main.py                   # Script principal del cargador
│
├── frontend/                     # Frontend (futuro)
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── README.md
│
├── docs/                         # Documentación
│   ├── api/                      # Documentación de APIs
│   │   ├── README.md
│   │   ├── endpoints.md
│   │   └── examples.md
│   ├── database/                 # Documentación de BD
│   │   ├── schema.md
│   │   ├── migrations.md
│   │   └── seeds.md
│   ├── deployment/               # Documentación de despliegue
│   │   ├── setup.md
│   │   ├── environment.md
│   │   └── troubleshooting.md
│   └── architecture/             # Documentación de arquitectura
│       ├── overview.md
│       ├── database_design.md
│       └── api_design.md
│
├── scripts/                      # Scripts de utilidad
│   ├── setup.py                  # Configuración inicial
│   ├── deploy.py                 # Despliegue
│   ├── backup.py                 # Backup de datos
│   └── test.py                   # Ejecución de pruebas
│
├── tests/                        # Pruebas generales
│   ├── __init__.py
│   ├── unit/                     # Pruebas unitarias
│   ├── integration/              # Pruebas de integración
│   └── e2e/                      # Pruebas end-to-end
│
└── logs/                         # Logs del sistema
    ├── scraper/
    ├── api/
    └── database/
```

## 🎯 Beneficios de esta Estructura

### 1. **Separación de Responsabilidades**
- **Backend**: APIs, servicios y lógica de negocio
- **Scraper**: Sistema independiente de scraping
- **Data Loader**: Carga de datos externos
- **Frontend**: Interfaz de usuario (futuro)

### 2. **Configuración Centralizada**
- **Variables de entorno** en la raíz del proyecto
- **Configuración modular** por componente
- **Fácil mantenimiento** y escalabilidad

### 3. **Organización Profesional**
- **Estructura estándar** de proyectos Python
- **Separación clara** entre diferentes capas
- **Fácil navegación** y comprensión

### 4. **Escalabilidad**
- **Módulos independientes** que pueden crecer
- **Fácil agregar** nuevos componentes
- **Testing organizado** por capas

## 🚀 Próximos Pasos

1. **Crear la nueva estructura** de carpetas
2. **Mover archivos existentes** a sus ubicaciones correctas
3. **Actualizar imports** y referencias
4. **Configurar el archivo .env** en la raíz
5. **Actualizar documentación** y scripts

¿Te parece bien esta estructura? ¿Quieres que proceda a reorganizar todo el proyecto? 