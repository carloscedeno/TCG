# ADR-003: Omni-TCG Dynamic Registry & Ingesta Integral SortSwift-First para Riftbound TCG

## Estado
Aceptado (Fecha: 2026-11-08)

## Contexto
Geekorium fue concebido originalmente alrededor del ecosistema Magic: The Gathering (MTG), apoyándose en APIs externas como Scryfall y Card Kingdom para metadatos y valoraciones de mercado. Con la expansión Omni-TCG (v2.0) y la incorporación de juegos independientes como **Riftbound TCG (`RFB`)**, el código de la interfaz presentaba componentes fuertemente acoplados (hardcodeo de Card Kingdom, grilla fija de legalidades MTG como Commander/Modern/Pauper, y condicionales dispersos como `game !== 'GND'`).

Adicionalmente, a diferencia de MTG (donde SortSwift sólo administra el inventario físico y las ubicaciones en gavetas), en **Riftbound TCG SortSwift actúa como la Fuente Única de Verdad** para:
1. Metadatos completos de cartas (nombre, atributos específicos, rarezas).
2. Precios de venta al público fijados por la tienda.
3. URLs de imágenes oficiales y fotografías de escaneo.
4. Inventario físico, stock en tiempo real y códigos de barras de gavetas.

## Decisiones de Arquitectura

### 1. Creación del Registro Declarativo Omni-TCG (`frontend/src/config/tcgRegistry.ts`)
Se centralizó la parametrización de cada TCG en un registro tipado e inmutable:
* **Marketplace Externo Dinámico**: Cada juego define su integración (`CardKingdom` para MTG, `TCGplayer` con enlace canónico por `productId` para RFB, Pokémon, One Piece, etc., o `undefined` si se oculta).
* **Legalidades de Formato Condicionales**: Si el TCG no posee formatos registrados o no aplican (como Gundam o Riftbound inicial), la sección se oculta automáticamente, evitando mostrar formatos absurdos (e.g. Commander en Riftbound).
* **Atributos Específicos Polimórficos**: Renderizado automático de badges de juego (`might`, `cost`, `domains` para RFB; `hp`, `ap`, `cost_level` para Gundam).

### 2. Sincronizador Dedicado SortSwift-First (`scripts/sync/riftbound/sync_sortswift_riftbound.py`)
Se implementó el Data Loader para Riftbound:
* Mapeo estricto del trigger PostgreSQL `trg_validate_tcg_attributes`: Toda carta de RFB inyecta en `cards.tcg_specific_attributes` los campos obligatorios `might`, `cost` y `domains`.
* Resolución de sets con autoincremento seguro (`next_set_id`).
* Mapeo de gavetas SortSwift a coordenadas físicas de Geekorium (`E1-N09-B02-RFB-[BIN]` o vitrinas de alto valor `E3-N01-V02-RFB-ALTOVALOR`).
* Inserción normalizada en `products` bajo el estándar SKU-Aware `[F]SET-NNNN`.

### 3. Normalización de Aspect Ratio de Imágenes
Se constató que las cartas mantienen la relación internacional estándar `63 × 88 mm` (2.5 × 3.5 pulgadas), asegurada en el frontend mediante `aspect-[63/88]` y `object-cover`. Se actualizó `imageOptimization.ts` para servir directamente los recursos del CDN de SortSwift sin mutaciones destructivas de URLs.

## Consecuencias
* **Positivas**:
  - `CardModal.tsx` y `CardDetail.tsx` son 100% agnósticos al juego.
  - La tienda puede incorporar cualquier TCG futuro simplemente añadiendo una entrada a `TCG_REGISTRY` en el frontend y ejecutando el loader correspondiente.
  - Se eliminó el riesgo de fugas de tráfico o links rotos hacia tiendas que no cotizan el juego (e.g. Card Kingdom en Riftbound).
  - Cumplimiento estricto de la directiva de integridad de base de datos en DEV.
