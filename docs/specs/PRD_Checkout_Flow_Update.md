# 📋 PRD: Ajuste del Flujo de Checkout y Reserva de Inventario

**Estado:** Planificación | **Fecha:** 2026-03-01
**Objetivo:** Alinear el proceso de compra digital del frontend con el nuevo flujo operativo aprobado, priorizando la verificación de inventario físico antes de exigir el pago al cliente y garantizando la reserva de stock temporal.

---

## 1. Visión General del Cambio

El flujo actual requiere que el cliente suba un comprobante de pago en el Paso 2 del checkout antes de que la orden sea confirmada por el sistema. Esto genera problemas si, tras el pago, se detecta que el producto no está físicamente disponible o no cumple con las expectativas (edición, idioma, etc.).

El **nuevo flujo** pospone el paso de pago. El cliente enviará su orden de "intención de compra" (Lead), el sistema descontará el stock de manera virtual temporalmente, y un Geeko-Asesor confirmará la integridad física del producto. Solo tras esa confirmación (Parcial o Total), el cliente procederá a pagar.

---

## 2. Requerimientos Funcionales

### 2.1 Checkout (Frontend - App del Cliente)

- **Modificación del Step 2 (Pago)**: Eliminar el requisito de subir comprobante de pago durante el Checkout inicial.
- **Selección de Método de Pago**: El usuario solo debe *seleccionar* cómo desea pagar (Zelle, Pago Móvil, Efectivo, etc.) para que el administrador sepa sus preferencias, pero no se le pedirá la transacción en ese momento.
- **Mensaje de Éxito**: Modificar la pantalla `CheckoutSuccessPage` para indicar claramente que "La orden ha sido recibida y el stock reservado temporalmente. Un asesor se pondrá en contacto para la confirmación física antes de emitir los datos de pago finales".
- **Generación de Orden (`pending_verification`)**: La orden debe nacer con este estatus en la DB. (Esto ya es el comportamiento base, solo hay que asegurarlo).

### 2.2 Motor de Reservas (Database / Supabase RPC)

- **Descuento Temporal de Stock**: Al crear la orden (mediante `create_order_atomic`), el stock de los `card_printings` involucrados debe descontarse inmediatamente para evitar sobreventas.
- **Restitución de Stock**: Si la orden pasa a estado `cancelled` (porque el cliente no quiso la confirmación parcial o porque no había stock real), el stock debe ser devuelto a los `products` / `card_printings`.

### 2.3 Panel de Administración (Operaciones Físicas)

- El administrador debe ver las órdenes en estado `pending_verification`.
- Debe tener botones de acción para resolver la verificación de inventario (El rombo del diagrama):
  - ✅ **Confirmar (Todo OK)**: La orden pasa a estado `awaiting_payment` o se notifica al usuario para que pague.
  - ⚠️ **Confirmar con Modificaciones (Sí, pero no)**: El admin se comunica con el cliente (fuera de banda, por WhatsApp) e informa la discrepancia. Si el cliente acepta, se edita la orden y se confirma.
  - ❌ **Rechazar / Sin Stock (No)**: Se cancela la orden, pasando a estado `cancelled`. Esto gatilla la restitución del stock virtual.
- Una vez confirmado y que el cliente paga (Post-Checkout), el admin debe poder marcar la orden como `paid` (Pagada) y proceder a los estados de despacho (`embalado`, `enviado`).

---

## 3. Experiencia de Usuario (Flujo Actualizado)

1. **Carrito**: El usuario revisa sus cartas y presiona Pagar.
2. **Paso 1 (Datos)**: Llena sus datos personales y forma de despacho.
3. **Paso 2 (Forma de Pago)**: Selecciona su método de pago preferido, pero **no transfiere dinero** ni sube adjuntos.
4. **Confirmación**: Presiona "Confirmar Orden".
5. **Success Page**: Redirección a éxito. El sistema apartó las cartas. Se envía un WhatsApp pre-generado al Geeko-Asesor indicando la orden.
6. **WhatsApp (Manual)**: El asesor va al almacén, confirma que la carta física está allí y está correcta. Le escribe al cliente y le da "luz verde" pasando los datos bancarios.
7. **Resolución**: El cliente paga, manda el comprobante por WhatsApp, y el administrador despacha.

---

## 4. Diseño Técnico e Implementación

**Frontend (`CheckoutPage.tsx`)**:

- Remover la UI de carga de archivos (`payment-proofs`).
- Cambiar la UI del Step 2 para mostrar solo "Selecciona tu método de pago preferido".
- Ajustar el payload de `createOrder` (ya no pasará `payment_proof_url`).

**Backend (`Supabase SQL`)**:

- Revisar `create_order_atomic`. Actualizar la tabla `products` restando `quantity` del stock disponible.
- Implementar trigger o función RPC `cancel_order` que revierta el stock sumando `quantity` nuevamente a `products` si la orden se cancela.
- Actualizar el Enum/Check constraint de `status` de la tabla `orders` si es necesario para soportar la vida media del nuevo flujo (`pending_verification` -> `awaiting_payment` -> `paid` -> `shipped` -> `completed`).

**Pruebas (`E2E Playwright`)**:

- Actualizar `guest_checkout.spec.ts` para que no busque el input de archivo.
- Crear/Actualizar tests en `admin.spec.ts` para cubrir la cancelación de órdenes y la restitución del stock.

---

## 5. Casos Límite a Considerar (Edge Cases)

- **Abandono de Orden Confirmada**: ¿Qué pasa si el stock se verificó, se le pidió pago al cliente, y el cliente nunca paga? Deberá existir una expiración o cancelación manual del admin que devuelva el stock a vitrina.
- **Race conditions en el inventario**: Al llamar a `create_order_atomic`, la consulta debe ser atómica respecto al chequeo del stock remanente para no descontar por debajo de cero.
