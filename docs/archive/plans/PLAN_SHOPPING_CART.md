# Plan de Implementación: Mecanismo de Carrito de Compra Completo

## 1. Visión y Objetivo

Implementar un sistema de carrito de compras robusto, estándar de la industria (E-commerce "Best Practices"), que permita a los usuarios (invitados y registrados) navegar, agregar productos, gestionar su carrito y finalizar la compra de manera segura y fluida. El sistema debe manejar stock en tiempo real y asegurar la integridad de los datos de las órdenes.

---

## 2. Análisis de Brecha (Gap Analysis)

Estado actual vs. Requerimientos de un sistema completo.

| Característica | Estado Actual | Requerido (Meta) | Acción Necesaria |
| :--- | :--- | :--- | :--- |
| **Persistencia del Carrito** | Básico (Tabla `carts`) | Persistencia persistente (invitados en LocalStorage, usuarios en DB). | Sincronización al iniciar sesión. |
| **Gestión de Stock** | Parcial (Columna `stock`) | Validación atómica al checkout (evitar sobreventa). | Crear RPC `checkout_atomic`. |
| **Detalle de Órdenes** | **CRÍTICO: NO EXISTE** | Tabla `order_items` para saber QUÉ se compró. | **Crear tabla `order_items`.** |
| **Condiciones de Cartas** | No claro en `products` | Soporte para NM, LP, MP, HP, DMG. | Agregar `condition` a `products`. |
| **Direcciones de Envío** | No existe | Guardar direcciones de usuarios. | Crear tabla `user_addresses`. |
| **Pasarela de Pago** | Simulado | Integración real o simulada robusta (Stripe/PayPal plan). | Definir interfaces de pago. |
| **UI de Checkout** | Botón simple | Flujo de múltiples pasos (Envío -> Pago -> Confirmación). | Diseñar `CheckoutPage.tsx`. |

---

## 3. Escenarios y Criterios de Aceptación (User Stories)

### Historia 1: Gestión del Carrito (Usuario/Invitado)

**Como** usuario (o invitado),
**Quiero** agregar, editar y eliminar cartas de mi carrito,
**Para** gestionar lo que voy a comprar antes de pagar.

* **Criterios de Aceptación:**
    1. [ ] Al hacer clic en "Agregar al Carrito", el icono del carrito se actualiza inmediatamente (optimistic UI).
    2. [ ] Si el producto ya existe, se suma a la cantidad existente.
    3. [ ] No se puede agregar más cantidad de la que existe en `stock` (validación visual).
    4. [ ] Desde el "Cart Drawer", puedo incrementar/decrementar cantidades.
    5. [ ] Al llegar a cantidad 0, se pide confirmación o se elimina el item.
    6. [ ] El subtotal se recalcula en tiempo real.

### Historia 2: Flujo de Checkout (Standard E-commerce)

**Como** cliente listo para comprar,
**Quiero** ingresar mis datos de envío y pago en pasos claros,
**Para** completar mi compra sin errores.

* **Criterios de Aceptación:**
    1. [ ] **Paso 1 - Resumen**: Vista completa de items, impuestos estimados y envío.
    2. [ ] **Paso 2 - Envío**: Formulario de dirección (Calle, Ciudad, Estado, ZIP). Si soy usuario registrado, puedo seleccionar una guardada.
    3. [ ] **Paso 3 - Pago**: Selección de método (Tarjeta, PayPal). *Nota: Para MVP puede ser simulado, pero la UI debe existir.*
    4. [ ] **Validación de Stock Final**: Al confirmar, el sistema verifica el stock UNA ÚLTIMA VEZ. Si algo se agotó en ese segundo, avisa y no procesa el cobro.

### Historia 3: Historial de Órdenes

**Como** cliente que ya compró,
**Quiero** ver mi historial de pedidos y su detalle,
**Para** saber qué compré y el estado del envío.

* **Criterios de Aceptación:**
    1. [ ] Existe una sección "Mis Pedidos" en el perfil.
    2. [ ] Puedo ver el ID de la orden, fecha, total y estado (Pendiente, Enviado).
    3. [ ] Al hacer clic, veo el detalle exacto (cartas, ediciones, cantidades, precio unitario al momento de compra).

---

## 4. Diseño de Pantallas y Componentes (UI/UX)

### 4.1. Cart Drawer (Mejora del Actual)

* **Ubicación**: Deslizable desde la derecha.
* **Elementos**:
  * Lista de items con **imágenes grandes** y claras.
  * Selectores de cantidad (`-` / `+`) grandes y táctiles.
  * Precio unitario y subtotal por línea.
  * **Botón Principal**: "PROCEDER AL PAGO" (Full Width, Sticky Bottom).
  * Mensaje de "Envío Gratis faltan $X" (Gamification).

### 4.2. Checkout Page (`/checkout`) - NUEVA

Diseño de 2 columnas (Izquierda: Pasos, Derecha: Resumen de Orden Sticky).

* **Breadcrumbs**: Carrito > Información > Envío > Pago.
* **Columna Izquierda (Formularios)**:
  * **Contact Info**: Email (autolleno si login).
  * **Shipping Address**: Inputs estándar con validación.
* **Columna Derecha (Order Summary)**:
  * Lista compacta de items.
  * Desglose: Subtotal, Shipping, Tax, **Total**.

### 4.3. Order Success Page (`/checkout/success`)

* **Icono**: Check verde animado grande.
* **Texto**: "¡Gracias por tu compra, [Nombre]!"
* **Detalle**: Número de Orden #12345.
* **CTA**: "Seguir Comprando" o "Ver mi Pedido".

---

## 5. Arquitectura Técnica y Base de Datos

### 5.1. Cambios en Schema (Supabase SQL)

#### Nueva Tabla: `order_items` (CRÍTICO)

```sql
CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id) NOT NULL,
    product_id uuid REFERENCES public.products(id), -- Opcional set null si se borra producto
    printing_id uuid REFERENCES public.card_printings(printing_id), -- Backup de referencia
    product_name text NOT NULL, -- Snapshot del nombre
    quantity int NOT NULL,
    price_at_purchase numeric NOT NULL, -- Snapshot del precio
    created_at timestamptz DEFAULT now()
);
```

#### Modificación Tabla: `products`

Agregar columna para condición (si no se maneja vía producto distinto).

```sql
ALTER TABLE public.products ADD COLUMN condition text DEFAULT 'NM'; -- O link a tabla conditions
```

#### Nueva Tabla: `user_addresses`

```sql
CREATE TABLE public.user_addresses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    full_name text,
    address_line1 text,
    city text,
    state text,
    zip_code text,
    country text,
    is_default boolean DEFAULT false
);
```

### 5.2. API & Edge Functions

1. **`cart-sync`**: Sincronizar carrito local (guest) con DB al hacer login.
2. **`create_order_atomic`** (RPC):
    * Recibe: `user_id`, `items`, `address`.
    * Transacción SQL:
        * Verifica stock de todos los items.
        * Resta stock.
        * Crea `orders`.
        * Crea `order_items`.
        * Borra `cart` y `cart_items`.
    * Retorna: `order_id` o Error de Stock.

---

## 6. Plan de Ejecución

1. **Fase 1: Backend (DB & RPCs)**
    * Crear tablas faltantes (`order_items`, `user_addresses`).
    * Crear función segura de checkout (`create_order_atomic`).
2. **Fase 2: Frontend Core (Cart Logic)**
    * Mejorar `CartContext` para manejar estado guest vs user.
    * Implementar persistencia local robusta.
3. **Fase 3: Pantallas de Checkout**
    * Construir página `/checkout` con validación de formularios.
    * Integrar llamada a API de checkout.
4. **Fase 4: Testing & Polish**
    * Probar flujos de error (stock insuficiente).
    * Estilos finales y animaciones.

---
Este plan asegura un nivel profesional y completo, cubriendo las deficiencias actuales del prototipo.
