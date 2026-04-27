# Requerimientos: Geekorium Omni-TCG (v2.0)

Este documento desglosa el PRD en Historias de Usuario y Criterios de Aceptación (AC) para guiar la ejecución técnica.

## Historias de Usuario

### HU-01: Soporte Multijuego (Pokémon/Digimon)
**Como** Administrador de Geekorium,  
**quiero** integrar metadatos de Pokémon y Digimon en la base de datos actual,  
**para** expandir el catálogo sin modificar la estructura de las tablas existentes.

**Criterios de Aceptación:**
- [ ] Los atributos específicos (HP, Evoluciones, DP, Costos de Evolución) deben almacenarse en la columna `tcg_specific_attributes` (JSONB).
- [ ] La ingesta de Pokémon debe soportar múltiples variantes (Reverse Holo, Full Art) como registros independientes en `card_printings`.
- [ ] La ingesta de Digimon debe implementar reintentos con backoff exponencial para manejar las restricciones de Cloudflare de su API pública.

### HU-02: SKUs Universales e Identidad
**Como** Sistema de Inventario,  
**quiero** generar SKUs inmutables con el formato `[F]SET-NNNN`,  
**para** evitar ambigüedades entre cartas homónimas y facilitar el cruce de precios.

**Criterios de Aceptación:**
- [ ] El SKU debe generarse dinámicamente: `[F]` si es foil, seguido del código del set y el número de coleccionista.
- [ ] La lógica de actualización de precios debe usar el `printing_id` o el SKU normalizado, NUNCA el nombre de la carta.
- [ ] El sistema debe permitir la creación automática de productos con stock 0 cuando no existan en inventario ("Por Encargo").

### HU-03: Performance y Vistas
**Como** Usuario del Marketplace,  
**quiero** filtrar cartas por atributos específicos (ej: HP > 100) instantáneamente,  
**para** tener una experiencia de navegación fluida.

**Criterios de Aceptación:**
- [ ] Existencia de índices GIN sobre las columnas JSONB de atributos.
- [ ] La vista materializada `mv_unique_cards` debe refrescarse de forma `CONCURRENTLY` tras cada sincronización.
- [ ] Las consultas de filtrado sobre JSONB deben responder en menos de 200ms.

## Restricciones Técnicas (Leyes Aplicadas)
1. **Ley 6 (Performance)**: Uso obligatorio de denormalización en JSONB e índices GIN.
2. **Ley 14 (Stock)**: Los filtros por defecto deben ocultar ítems con stock 0 (excepto en modo referencia).
3. **Regla de Negocio 7**: Priorización del SKU de CardKingdom para mapeo de acabados.
