# Documentación Técnica - Plataforma Agregadora de Precios TCG

## Índice

1. [Arquitectura del Sistema](./architecture.md)
2. [Base de Datos](./database/README.md)
3. [APIs y Integraciones](./apis/README.md)
4. [Configuración de Supabase](./supabase/README.md)
5. [Diccionario de Datos](./data-dictionary.md)
6. [Guías de Desarrollo](./development/README.md)
7. [Configuración de Entorno](./environment-setup.md)

## Visión General

Esta documentación técnica acompaña el desarrollo de la Plataforma Agregadora de Precios de TCG, una aplicación web avanzada para la agregación y análisis de precios de cartas coleccionables.

### Tecnologías Principales

- **Backend**: Node.js con Express.js
- **Frontend**: React.js con TypeScript
- **Base de Datos**: PostgreSQL (Supabase)
- **Autenticación**: Supabase Auth
- **APIs**: Scryfall, Pokémon TCG, JustTCG, Apify
- **Deployment**: Vercel (Frontend) + Supabase (Backend)

### Estructura del Proyecto

```
TCG Web App/
├── Documentación/
│   ├── Requisitos iniciales.txt
│   └── TechDocs/
│       ├── README.md (este archivo)
│       ├── architecture.md
│       ├── database/
│       ├── apis/
│       ├── supabase/
│       ├── development/
│       ├── data-dictionary.md
│       └── environment-setup.md
├── frontend/
├── backend/
└── shared/
```

## Estado del Proyecto

- [x] Documentación de requisitos
- [x] Estructura de documentación técnica
- [ ] Configuración de Supabase
- [ ] Esquema de base de datos
- [ ] APIs y integraciones
- [ ] Desarrollo del frontend
- [ ] Desarrollo del backend
- [ ] Testing y deployment

## Contacto

Para consultas técnicas, referirse a la documentación específica en cada carpeta o crear un issue en el repositorio del proyecto. 