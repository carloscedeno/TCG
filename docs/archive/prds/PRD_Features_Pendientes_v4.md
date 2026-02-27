# Product Requirements Document (PRD) - Funcionalidades Pendientes Geekorium v4.0

**Estado:** Planeación
**Objetivo:** Completar la implementación de las mecánicas detalladas en el PRD de Geekorium v4.0 (20260223) que aún no se encuentran integradas en la base de código actual.

---

## 1. Backend: Parser de Inventario (ManaBox)

**Problema Actual:**
La clase `ManaBoxParser` definida en las especificaciones para procesar archivos TXT exportados de ManaBox no existe actualmente en el backend.

**Requerimientos:**

- Implementar una clase/función `ManaBoxParser` en Python (`FastAPI`).
- El formato de entrada será texto plano (TXT) donde cada línea sigue la estructura: `1x Nombre Carta (SetCode) 123 *F*`.
- La lógica debe extraer:
  - Cantidad (`int`)
  - Nombre de la carta (`string`)
  - Código del Set (`string`)
  - Número de Coleccionista (`string`)
  - Estado Foil (Detección de `*F*`, `(F)` o `Foil`).
- Manejo de Fallos: Líneas corruptas o con formato no reconocido deben ir a un array temporal `failed_imports` para ser devueltas en el resumen de la API.

---

## 2. Flujo de Checkout: Subida de Comprobante de Pago a Supabase

**Problema Actual:**
El componente `CheckoutPage.tsx` permite al usuario seleccionar una imagen (usando la cámara en móvil), pero actualmente solo renderiza un preview en `Base64`. No se ejecuta la subida del archivo al Storage de Supabase.

**Requerimientos:**

- Crear o asegurar la existencia del bucket `payment-proofs` en Supabase Storage (con políticas de RLS que permitan subida pública o a través de la API autenticada si aplica).
- Modificar el flujo de `handlePlaceOrder` en `CheckoutPage.tsx`:
  - Antes/durante de la creación de la orden (`createOrder`), el archivo cargado en el input ref debe subirse a Supabase.
  - La ruta en el Storage debe seguir el patrón: `payment-proofs/{order_id}/{filename}` u organizar las carpetas por ID de Orden para fácil acceso desde el Admin Dashboard.
  - El URL o Path devuelto por el Storage debe inyectarse en los detalles de la orden para que los asesores puedan validar el pago.

---

## 3. UI/UX: Gestos Móviles (Swipe Down) y Ajustes en CardModal

**Problema Actual:**
No se están aprovechando los gestos nativos para móviles como el cierre deslizando el dedo hacia abajo ("Swipe Down") y la lista de versiones no tiene la altura máxima (`max-h-[35vh]`) especificada en el PRD base.

**Requerimientos:**

- Configuración de dependencias: Instalar `framer-motion` en el frontend (`npm install framer-motion`).
- Modificar `CardModal.tsx`:
  - Refactorizar el contenedor principal a un componente `<motion.div>`.
  - Añadir soporte para el prop `drag="y"`.
  - Configurar `dragConstraints` y `onDragEnd` para invocar la función `onClose` si el usuario desliza el modal hacia abajo más de cierto umbral (ej: `offset.y > 100`).
  - Aplicar la clase de Tailwind `max-h-[35vh]` al contenedor scrolleable con la lista de versiones para prevenir que tome toda la pantalla en resoluciones muy altas y mantener consistencia.

---

## 4. UI/UX: Lógica de Stock en el Carrito (CartDrawer)

**Problema Actual:**
El componente `CartDrawer.tsx` envía solicitudes de cambio de cantidad (`updateCartItemQuantity`) a la API asumiendo su validación, pero la UI no restringe proactivamente al usuario si este intenta superar el stock real (Inventory).

**Requerimientos:**

- El componente `CartDrawer.tsx` (o la llamada que obtiene el carrito inicial) debe tener conocimiento del `stock` máximo disponible por versión (`printing`).
- Lógica en botones de Cantidad (+):
  - Si `item.quantity >= item.stock_disponible`, el botón `+` debe deshabilitarse (`disabled=true`).
  - (Opcional) Mostrar un Tooltip UI o un mensajito temporal: *"Máximo en stock alcanzado"* al intentar hacer click cuando esté bloqueado, según establecía el PRD.

---

## 5. Integración: Mensajería de WhatsApp Dinámica

**Problema Actual:**
El cierre de la venta invoca una pestaña de WhatsApp, pero el formato de texto está incompleto frente a los requerimientos: falta el identificador único de la orden (`order_id`) recién creada.

**Requerimientos:**

- En `CheckoutPage.tsx` al momento de finalizar con éxito `createOrder`:
  - Recuperar el ID (UUID o short-ID) de la respuesta de la orden.
  - Actualizar el string a inyectar en WhatsApp:
    *Actual:* `"Hola Geekorium, mi nombre es [Nombre] ([Cédula]). Acabo de generar una orden por $[Monto]. Espero confirmación de stock."*
    *Nuevo (Esperado):*`"Hola Geekorium, mi nombre es [Nombre]. Acabo de generar la orden #[ID]. Adjunto mi comprobante de pago por $[Monto]. Espero confirmación de stock."`
