# Plan de Implementación: Gestión de Inventario y Carga de Cartas

## 1. Visión y Objetivo

Implementar un sistema administrativo completo para la gestión del inventario de la tienda ("Carga de Cartas"). El sistema debe permitir a los administradores buscar cartas en la base de datos global, añadir copias al inventario de la tienda definiendo precio, cantidad y condición, y gestionar los productos existentes de manera eficiente.

---

## 2. Análisis de Brecha (Gap Analysis)

| Característica | Estado Actual | Requerido (Meta) | Acción Necesaria |
| :--- | :--- | :--- | :--- |
| **Tabla de Productos** | Existente (`products`) con `stock`, `price`, `condition`. | Completamente funcional y gestionable. | Validar constraints y valores default. |
| **Interfaz de Carga** | Inexistente (Solo `ImportCollection.tsx` para bulk). | UI para búsqueda manual y adición unitaria de cartas. | Crear `AddProductModal` y flujos de búsqueda. |
| **Gestión de Stock** | Manual/SQL directo. | Dashboard visual para ver y editar inventario. | Crear página `/admin/inventory`. |
| **Validación de Datos** | Nula en frontend. | Validación de precios positivos y stock no negativo. | Implementar validaciones Zod/RHF. |
| **Búsqueda de Inventario** | No existe. | Buscador rápido dentro del inventario de la tienda. | Implementar filtros en dashboard. |

---

## 3. Escenarios y Criterios de Aceptación (User Stories)

### Historia 1: Carga Manual de Cartas (Add Product)

**Como** administrador de la tienda,
**Quiero** buscar una carta específica y agregarla al inventario,
**Para** ponerla a la venta inmediatamente.

* **Criterios de Aceptación:**
    1. [ ] Buscador con autocompletado que consulta la base de datos global de cartas (`card_printings`).
    2. [ ] Al seleccionar una carta, permite elegir la edición (si hay múltiples impresiones).
    3. [ ] Formulario para ingresar:
        * Precio de venta (Store Price).
        * Cantidad (Stock).
        * Condición (NM, LP, MP, HP, DMG) - Default: NM.
    4. [ ] Muestra el "Market Price" como referencia visual.
    5. [ ] Al guardar, inserta o actualiza la fila en la tabla `products`.
    6. [ ] Feedback visual de éxito ("Carta agregada").

### Historia 2: Gestión de Inventario (Edit/Delete)

**Como** administrador,
**Quiero** ver una lista de todo mi inventario y modificar precios o stock,
**Para** mantener la tienda actualizada.

* **Criterios de Aceptación:**
    1. [ ] Tabla paginada de productos en inventario.
    2. [ ] Búsqueda y filtrado por nombre, set y condición.
    3. [ ] Edición rápida (Inline o Modal) de Precio y Stock.
    4. [ ] Botón para eliminar producto del inventario (Soft delete o Hard delete).
    5. [ ] Visualización clara de "Out of Stock" (Stock 0).

---

## 4. Diseño de Pantallas y Componentes (UI/UX)

### 4.1. Inventory Dashboard (`/admin/inventory`)

* **Header**: Título "Inventario", Botón primario "Agregar Producto".
* **Filtros**: Barra de búsqueda, Dropdown de Sets, Checkbox "Solo Stock Bajo".
* **Tabla**:
  * Imagen (Thumbnail).
  * Nombre de Carta.
  * Set / Edición (Icono + Código).
  * Condición (Badge de color: NM=Verde, LP=Azul, etc.).
  * Precio (Input editable o Texto).
  * Stock (Input con botones +/-).
  * Acciones (Guardar, Eliminar).

### 4.2. Modal "Agregar Producto"

* **Paso 1: Búsqueda**: Input grande con autocompletado (reutilizando lógica de `SearchBar` pero apuntando a todas las cartas).
* **Paso 2: Selección**: Muestra la carta seleccionada con su imagen y detalles.
* **Paso 3: Datos de Venta**:
  * Input Precio (Sugerencia: "Market Price: $X.XX").
  * Input Stock.
  * Select Condición.
* **Footer**: Botones Cancelar / Guardar.

---

## 5. Arquitectura Técnica y Base de Datos

### 5.1. Esquema de Base de Datos (Confirmación)

Tabla `products`:

* `id` (UUID, PK)
* `printing_id` (UUID, FK -> `card_printings`)
* `stock` (Integer, Default 0)
* `price` (Numeric)
* `condition` (Text, Check: 'NM', 'LP', 'MP', 'HP', 'DMG')

*Acción*: Agregar Constraint UNIQUE en `(printing_id, condition)` para evitar duplicados lógicos.

### 5.2. Backend (Supabase RPCs)

#### 5.2.1 `upsert_product_inventory`

Función para insertar o actualizar un producto de manera segura.

```sql
CREATE OR REPLACE FUNCTION upsert_product_inventory(
    p_printing_id UUID,
    p_price NUMERIC,
    p_stock INTEGER,
    p_condition TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.products (printing_id, price, stock, condition)
    VALUES (p_printing_id, p_price, p_stock, p_condition)
    ON CONFLICT (printing_id, condition) 
    DO UPDATE SET 
        price = EXCLUDED.price,
        stock = public.products.stock + EXCLUDED.stock, -- Sumar stock si ya existe
        updated_at = now();
END;
$$ LANGUAGE plpgsql;
```

#### 5.2.2 `get_inventory_list`

Función optimizada para listar productos con joins a `card_printings`.

### 5.3. Frontend

* Crear `frontend/src/pages/Admin/InventoryPage.tsx`.
* Crear `frontend/src/components/Admin/AddProductModal.tsx`.
* Reutilizar `useDebounce` y servicios de API existentes.

---

## 6. Plan de Pruebas (Verification Plan)

### 6.1 Pruebas Automáticas (Tests Unitarios)

Se crearán tests para las funciones de validación y cálculo.

### 6.2 Pruebas Manuales (Paso a Paso)

#### Prueba 1: Agregar Nueva Carta

1. Navegar a `/admin/inventory`.
2. Hacer clic en "Agregar Producto".
3. Buscar "Black Lotus" (o carta existente).
4. Seleccionar una edición específica.
5. Ingresar: Precio $100, Stock 2, Condición NM.
6. Guardar.
7. **Verificación**: La carta aparece en la tabla de inventario con los datos correctos.
8. **Verificación DB**: Consultar tabla `products` y verificar la fila creada.

#### Prueba 2: Actualizar Stock Existente

1. Buscar la carta agregada en el paso anterior.
2. Intentar agregar la MISMA carta con la MISMA condición (NM).
3. Ingresar Stock: 3.
4. Guardar.
5. **Verificación**: El stock total debe ser ahora 5 (2 iniciales + 3 nuevos). El precio se actualiza al último ingresado.

#### Prueba 3: Gestión de Inventario

1. En la tabla, cambiar el precio de $100 a $150.
2. Reducir stock a 0.
3. **Verificación**: El cambio persiste al recargar la página.

#### Prueba 4: Validación

1. Intentar guardar con precio negativo.
2. **Verificación**: El sistema muestra error y no permite guardar.

---

## 7. Ejecución

1. **DB**: Crear índices y constraints, crear RPCs.
2. **Frontend**: Crear `InventoryPage` y `AddProductModal`.
3. **Integration**: Conectar Frontend con RPCs.
4. **Testing**: Ejecutar plan de pruebas manuales.
