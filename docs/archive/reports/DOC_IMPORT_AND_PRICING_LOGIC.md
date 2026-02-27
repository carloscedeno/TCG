# 📑 Documentación de Lógica: Importación y Precios (Hotfix)

**Versión**: 1.0
**Fecha**: 2026-02-12
**Estado**: Implementado y Verificado

---

## 🚀 1. Importación Turbomode (v4)

Se ha optimizado el sistema de importación masiva para manejar miles de registros sin fallos por timeout (Error 546).

### Lógica de Selección ("Regla del Valor Más Alto")

Cuando se importa una carta sin especificar una edición (Set) exacta, el sistema utiliza la siguiente jerarquía para elegir qué impresión (`printing_id`) añadir al inventario:

1. **Prioridad por Precio**: Se selecciona la versión que tenga el **precio de mercado más alto** (`avg_market_price_usd` DESC).
2. **Reciente**: Si los precios son iguales, se selecciona la versión **más reciente** (`released_at` DESC).

**Beneficio**: Si un usuario importa "Lightning Bolt" a secas, el sistema asume por defecto la versión más valiosa para proteger el margen del inventario.

### Optimización Técnica (CTE & Bulk)

* **Procesamiento Basado en Conjuntos**: Se eliminaron los bucles `FOR` en PostgreSQL. Toda la inserción se realiza en una sola operación masiva.
* **Concurrencia Frontend**: El frontend envía lotes de **200 ítems** de forma paralela (3 a la vez), alcanzando velocidades de ~600 cartas cada 2-3 segundos.

---

## 💰 2. Lógica de Precios en "Stock Geekorium"

Se ha implementado una lógica de "Fallback" para asegurar que la grilla de inventario nunca muestre precios vacíos o ceros.

### Jerarquía de Visualización

El precio mostrado en las tarjetas del catálogo sigue esta regla:

1. **Precio de Tienda (Manual)**: Si el producto tiene un precio superior a `$0.00` definido en el inventario, se muestra este.
2. **Precio de Mercado (Automático)**: Si el precio es `$0.00` (valor por defecto al importar), el sistema realiza un "Join" en tiempo real con la tabla de precios agregados (`aggregated_prices`) y muestra el valor de **Card Kingdom** (`avg_market_price_usd`).

**Resultado**: El administrador puede importar miles de cartas con precio 0 y el sistema mantendrá el catálogo actualizado con precios de mercado automáticamente.

---

## 🛠️ 3. Cambios en Base de Datos

* **Índices**: Se añadió un índice especial `LOWER(card_name)` para que las búsquedas de importación sean instantáneas.
* **Función RPC**: `bulk_import_inventory` es ahora el motor principal de gestión de stock.

---
*Documento generado automáticamente tras la aplicación del hotfix de importación masiva.*
