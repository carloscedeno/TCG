# Guía de Administración: Pedidos e Inventario

Esta guía detalla cómo utilizar las nuevas funcionalidades de administración para gestionar pedidos y el inventario en el sistema Geekorium.

## 🚀 Acceso al Panel de Administración

Para acceder al panel de administración, asegúrate de que el servidor de desarrollo esté corriendo (o usa el entorno de staging).

1. **Entornos Disponibles**:
    - **Local**: `http://localhost:5173/admin`
    - **Staging/Dev**: `https://dev.geekorium.shop/admin`
2. Si no tienes sesión iniciada, el sistema está configurado temporalmente para permitir acceso de demostración (Admin Mode Forzado para local).

Desde el **Admin Dashboard**, verás tarjetas de acceso rápido a las diferentes secciones:

- **Inventory Terminal**: Gestión de stock y productos.
- **Order Management**: Gestión de pedidos y cancelaciones.

---

## 📦 Gestión de Pedidos (Order Management)

Accede mediante la tarjeta **"Order Terminal"** o navegando a `/admin/orders`.

### 1. Visualización de Pedidos

- La pantalla muestra una lista de todos los pedidos registrados en el sistema.
- Cada tarjeta de pedido muestra:
  - **ID del Pedido**: Identificador único.
  - **Estado**: `pending` (amarillo), `completed` (azul), `cancelled` (rojo).
  - **Fecha**: Fecha de creación.
  - **Usuario**: ID del usuario o "Guest" si fue compra de invitado.
  - **Total**: Monto total de la orden.

### 2. Ver Detalle de Productos

- **Haz clic en cualquier parte de la tarjeta del pedido** para expandirla.
- Se desplegará una sección con los **ítems comprados**:
  - Imagen de la carta/producto.
  - Nombre y Set.
  - Cantidad comprada (x1, x4, etc).
  - Precio unitario al momento de la compra.

### 3. Gestión de Estados y Cancelaciones

- **Selector de Estado**: En cada fila de pedido encontrarás un desplegable con el estado actual (ej: `PENDING PAYMENT`, `PAID`, `READY FOR PICKUP`).
- **Cambiar Estado**:
     1. Haz clic en el selector y elige el nuevo estado.
     2. El sistema confirmará si es una acción crítica.
     3. **Automáticamente se gestionará el stock**:
         - **Al cancelar (`Cancelled`) o devolver (`Returned`)**: El stock se **restaura** al inventario.
         - **Al reactivar** (desde cancelado a `Paid`/`Pending`): El stock se **vuelve a descontar** (si hay disponible).

 ---

## 📊 Gestión de Inventario (Inventory Management)

Accede mediante la tarjeta **"Inventory Terminal"** o navegando a `/admin/inventory`.

### 1. Lista de Productos

- Muestra todos los productos disponibles con su imagen, nombre, set y precio.

### 2. Edición Rápida de Stock (Quick Edit)

- Esta es la funcionalidad clave para ajustes rápidos.
- Localiza la columna **Stock**.
- **Haz clic directamente sobre el número de stock** de un producto.
- El número se convertirá en un campo de texto editable.
- Ingresa la nueva cantidad.
- Presiona `Enter` o haz clic fuera del campo.
- Verás un indicador de carga y luego el número actualizado (parpadeará en verde si fue exitoso).

---

## 🧪 Cómo Probar el Flujo Completo (Demo Local)

Para verificar que todo funciona correctamente:

1. **Crear un Pedido (Frontend Guest):**
    - Abre una ventana de incógnito o asegúrate de no estar logueado como admin.
    - Ve a la tienda pública (`/`).
    - Añade un producto al carrito (fíjate en su stock actual).
    - Procede al Checkout (`/checkout`).
    - Completa los datos de envío (Guest Checkout).
    - Confirma la compra.
    - *Resultado:* Se crea la orden y **el stock del producto disminuye**.

2. **Verificar en Admin:**
    - Ve a `/admin/orders`.
    - Deberías ver la nueva orden al tope de la lista.
    - Expándela para verificar que los productos son correctos.

3. **Cancelar y Restaurar:**
    - Haz clic en "CANCEL ORDER" en esa misma orden.
    - Ve a `/admin/inventory` (o verifica en la tienda pública).
    - *Resultado:* **El stock del producto debe haber aumentado** nuevamente a su valor original.

---

## 🛠️ Notas Técnicas para Desarrolladores

- **Base de Datos**: Se utiliza Supabase (PostgreSQL).
- **Tablas Clave**:
  - `public.orders`: Cabecera de pedidos.
  - `public.order_items`: Detalle de productos por pedido.
  - `public.products`: Inventario maestro.
- **Funciones RPC (Backend Logic)**:
  - `create_order_atomic`: Maneja la creación de pedidos, inserción de ítems y descuento de stock en una sola transacción.
  - `cancel_order_and_restock`: Maneja la cancelación y devolución de stock atómicamente.

---
*Documento actualizado por Antigravity Agent (Alineación Abril 2026).*
