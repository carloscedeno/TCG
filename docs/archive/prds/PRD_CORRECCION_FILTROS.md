# PRD: Corrección de Filtros y Mejoras de UI en Sidebar

## 1. Resumen Ejecutivo

Este documento detalla las correcciones necesarias para los filtros de búsqueda en la aplicación TCG, enfocándose en la experiencia de usuario (UX) del sidebar y la funcionalidad técnica de los filtros de "Esencia de Mana", "Órbita Temporal" y "Esencia de Carta".

## 2. Problemas Identificados

### 2.1. Navegación y Scroll (UX)

* **Descripción**: La barra lateral (sidebar) es pegajosa (`sticky`) pero no tiene un scroll independiente.
* **Impacto**: En pantallas de baja resolución o cuando hay muchos filtros abiertos, los elementos inferiores (como el filtro de Tipo) quedan fuera de la vista y son inalcanzables.
* **Solución**: Implementar una altura máxima calculada (`max-height`) y habilitar el desplazamiento vertical (`overflow-y-auto`) con una barra de desplazamiento personalizada y elegante.

### 2.2. Esencia de Mana (Colores)

* **Descripción**: Los filtros de color no devuelven resultados en la pestaña "Stock Geekorium".
* **Causa Técnica**: El frontend envía nombres completos (`White`, `Blue`, etc.) mientras que la base de datos utiliza códigos de una sola letra (`W`, `U`, `B`, `R`, `G`).
* **Solución**: Mapear los nombres de colores a sus códigos correspondientes antes de realizar la llamada a la API/RPC.

### 2.3. Órbita Temporal (Año)

* **Descripción**: El rango de años funciona en el "Archivo" pero es ignorado en "Stock Geekorium".
* **Causa Técnica**: La función RPC `get_products_filtered` no acepta parámetros de año, y `Home.tsx` no los está pasando.
* **Solución**:
    1. Actualizar la función RPC `get_products_filtered` en la base de datos para incluir `year_from` y `year_to`.
    2. Modificar `Home.tsx` para enviar estos parámetros al buscar en el marketplace.

### 2.4. Esencia de Carta (Tipo)

* **Descripción**: El filtro de tipo no está filtrando correctamente los productos en el marketplace.
* **Solución**: Asegurar que los valores enviados coincidan con el formato `type_line` de Scryfall (ej. "Creature", "Artifact") y verificar que la búsqueda por patrón (`ILIKE`) en la base de datos sea eficiente.

## 3. Especificaciones Técnicas

### 3.1. Cambios en Base de Datos (SQL)

Actualizar `get_products_filtered` para soportar:

```sql
p_year_from INTEGER DEFAULT NULL,
p_year_to INTEGER DEFAULT NULL
-- ... en el WHERE:
AND (p_year_from IS NULL OR EXTRACT(YEAR FROM cp.release_date) >= p_year_from)
AND (p_year_to IS NULL OR EXTRACT(YEAR FROM cp.release_date) <= p_year_to)
```

### 3.2. Cambios en Frontend (TypeScript/React)

* **`api.ts`**: Actualizar `fetchProducts` para incluir los nuevos campos de año.
* **`Home.tsx`**:
  * Corregir el mapeo de colores a códigos (`White` -> `W`, etc.).
  * Pasar `yearRange` a la llamada de `fetchProducts`.
  * Ajustar el estilo del contenedor del sidebar: `sticky top-[140px] max-h-[calc(100vh-160px)] overflow-y-auto pr-2 custom-scrollbar`.

## 4. Criterios de Aceptación

1. [ ] El sidebar puede desplazarse independientemente si su contenido excede la altura de la pantalla.
2. [ ] Al seleccionar el color "Azul", se muestran solo cartas con `colors` conteniendo "U".
3. [ ] Al ajustar el rango de años a "1993 - 1995", el marketplace solo muestra cartas de esas ediciones (ej. Alpha, Beta, Unlimited).
4. [ ] El filtro de tipo (Criatura, Conjuro, etc.) filtra correctamente los resultados en el Stock Geekorium.
