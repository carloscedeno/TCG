
# PRD: Brechas de Implementación "El Emporio"

**Objetivo:** Cerrar la brecha entre la implementación actual y los requisitos definidos en `docs/Pagina de cartas.pdf` para transformar "Geekorium Singles" en **"El Emporio"**.

---

## 1. Identidad de Marca y Diseño (Branding)

### 1.1. Nombre y Logo

* **Requisito:** El sitio debe llamarse **"El Emporio"**.
* **Cambios:**
  * Actualizar `<title>` en `index.html`.
  * Actualizar texto en Header (`Home.tsx`, `ImportCollection.tsx`, `Profile.tsx`, `TournamentHub.tsx`).
  * Reemplazar logo actual (letra "G") por texto/logo "El Emporio".

### 1.2. Tipografía

* **Requisito:** Usar fuentes específicas para alinearse con la marca.
  * **Títulos:** `Bogue` (o `Daito` como secundaria).
  * **Cuerpo:** `Rubik` (Google Font).
* **Implementación Técnica:**
  * Agregar `@import` de Google Fonts para Rubik en `index.css`.
  * Agregar `@font-face` para Bogue/Daito (si se tienen los archivos) o usar una alternativa similar temporalmente si no se proveen los archivos `.woff`.
  * Configurar `tailwind.config.js` para extender `fontFamily`.

### 1.3. Footer y Landing

* **Requisito:** Sección "Cómo comprar" y enlaces a redes sociales.
* **Cambios:**
  * Actualizar Footer en `Home.tsx` con enlaces reales:
    * WhatsApp Principal: `wa.me/584128042832`
    * WhatsApp Singles: `wa.me/584242507802`
    * IG, TikTok, FB, YT, Twitch.
  * Agregar sección visual "Instrucciones de Compra" antes del footer o en un modal/drawer accesible.

---

## 2. Simplificación de Navegación

### 2.1. Eliminar Secciones Públicas

* **Requisito:** Eliminar "Tournaments", "My Profile", "Iniciar Sesión" (para el público general).
* **Cambios:**
  * **Header:** Remover enlaces a `/tournaments` y `/profile`.
  * **UserMenu:** Ocultar botón de Login/Register para usuarios no autenticados.
  * **Acceso Admin:** Mantener una ruta oculta (ej. `/admin/login` o un atajo de teclado) para que los administradores puedan loguearse y cargar inventario.

---

## 3. Catálogo y UX

### 3.1. Ordenamiento (Toggle Sort)

* **Requisito:** Botones que invierten el orden al hacer clic repetido (A-Z <-> Z-A), en lugar de un `select` dropdown.
* **Cambios en `Home.tsx`:**
  * Reemplazar `<select>` por botones:
    * `[Nombre ⇅]`
    * `[Precio ⇅]`
    * `[Fecha ⇅]`
  * Lógica: Si `sortBy === 'name'`, al hacer click cambiar a `name_desc`.

---

## 4. Flujo de Compra (Checkout) - CRÍTICO

### 4.1. Guest Checkout (Compra sin Cuenta)

* **Requisito:** Permitir comprar sin obligar al usuario a registrarse o iniciar sesión.
* **Cambios:**
  * **Context:** Modificar `CartContext` y `AuthContext` para no bloquearacciones de carrito si `!user`.
  * **CheckoutPage:** Eliminar verificación de sesión. Permitir flujo si hay items en `cart`.

### 4.2. Formulario de Pago Manual

* **Requisito:** No cobrar automáticamente. Cargar comprobante o coordinar pago.
* **Cambios en `CheckoutPage`:**
  * Eliminar paso de "Tarjeta de Crédito" / Stripe simulado.
  * Nuevo Paso "Pago y Confirmación":
    * Mostrar Resumen Total.
    * Instrucciones: "Realiza tu pago móvil/transferencia a [Datos]".
    * Opción A: Input File "Adjuntar Comprobante" (subir a Supabase Storage).
    * Opción B: Botón "Finalizar en WhatsApp" (Genera link con detalle del pedido).
  * **Acción Final:** Crear la orden en Supabase con estado `pending_verification`.

### 4.3. Notificaciones

* **Requisito:** Correo a ventas y contacto posterior.
* **Cambios:**
  * Al crear la orden, disparar una Edge Function `send-order-email` (o simularlo por ahora) que envíe el detalle a `ventas@elemporio.com` (ficticio por ahora).
  * Mostrar pantalla de éxito: "¡Orden Recibida! Un Geeko Asesor te contactará pronto".

---

## 5. Criterios de Aceptación (Checklist)

* [ ] El sitio muestra "El Emporio" y usa las fuentes Bogue/Rubik.
* [ ] Un usuario anónimo puede agregar cartas al carrito y llegar al checkout.
* [ ] El checkout no pide tarjeta de crédito, sino que muestra instrucciones de pago manual.
* [ ] Al finalizar, se crea una orden en base de datos asociada a los datos del formulario (email/teléfono) sin requerir `user_id` registrado.
* [ ] No existen enlaces visibles a Torneos ni Perfil en la navegación principal.
* [ ] Los botones de ordenamiento funcionan con lógica de "toggle" (click para invertir).
