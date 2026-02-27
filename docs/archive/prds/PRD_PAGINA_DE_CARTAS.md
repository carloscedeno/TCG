
# PRD: Portfolio & Base de Datos de Singles ("El Emporio")

**Fuente:** Documento `docs/Pagina de cartas.pdf`
**Estado:** Verificación en Progreso
**Fecha:** 09-02-2026

## 1. Visión General

Transformar la aplicación actual en un "Portafolio Online" especializado para la venta de cartas sueltas (singles) bajo la marca **"El Emporio"**. El sistema prioriza la búsqueda rápida, la visibilidad de inventario y un flujo de compra simplificado guiado por asesores, eliminando funciones de comunidad (torneos, perfiles sociales).

---

## 2. Requisitos de Marca y Diseño (UI/UX)

| ID | Requisito | Estado Actual | Verificación | Acción Necesaria |
| :--- | :--- | :--- | :--- | :--- |
| 2.1 | **Nombre del Sitio:** "El Emporio" | "Geekorium singles" | ⚠️ Parcial | Actualizar `<title>` y Header en `Home.tsx`. |
| 2.2 | **Tipografía:** Títulos `Bogue`, Cuerpo `Rubik` | `font-sans` (Inter/System default) | 🔴 No Cumple | Importar fuentes y configurar Tailwind. |
| 2.3 | **Landing Page:** Instrucciones y Redes Sociales | No existe. Footer tiene enlaces genéricos. | 🔴 No Cumple | Crear componente `LandingInstructions` o actualizar Footer con enlaces reales de WhatsApp/Redes. |
| 2.4 | **Eliminar Secciones:** Tournaments, Profile, Login (Público) | Existen enlaces a `/tournaments`, `/profile` en Header y UserMenu. | 🔴 No Cumple | Ocultar enlaces para usuarios no-admin. Mantener login solo para admin. |
| 2.5 | **Eliminar Tags:** Pokemon/Yugioh/Lorcana | Filtros Hardcoded en `Home.tsx` (`mockFilters`). | ⚠️ Parcial | Revisar si se deben ocultar o si son útiles para el catálogo. |

---

## 3. Catálogo y Visualización de Productos

| ID | Requisito | Estado Actual | Verificación | Acción Necesaria |
| :--- | :--- | :--- | :--- | :--- |
| 3.1 | **Toggle Sort:** Click en "Ordered by" invierte orden | Select Dropdown (`<select>`) | ⚠️ Diferente | Cambiar Select por Botones Toggle (UX más rápida). |
| 3.2 | **Vistas:** Grid, List, Individual | Grid/List Toggle existe. Individual es Modal. | ✅ Cumple | Validar si el Modal es suficiente como "Vista Individual". |
| 3.3 | **Precios Dobles:** Market vs Geekorium | `CardModal` muestra ambos. `Card` (Grid) muestra solo Market. | ⚠️ Parcial | Mostrar ambos precios (o distintivo) en la tarjeta del grid si hay espacio. |
| 3.4 | **Stock Visible:** "Cantidad Disponible" en layout inicial | Implementado (`total_stock` badge). | ✅ Cumple | Asegurar que sea visible sin hover (Actualmente usa z-index y posición absoluta). |
| 3.5 | **Novedades:** Label "Updated [Fecha]" | No implementado. | 🔴 No Cumple | Agregar campo `updated_at` visual o lógica de "New Arrival". |

---

## 4. Gestión de Inventario (Backend/Admin)

| ID | Requisito | Estado Actual | Verificación | Acción Necesaria |
| :--- | :--- | :--- | :--- | :--- |
| 4.1 | **Carga Unitaria:** Intuitiva | `AddProductModal` existe | ✅ Cumple | Verificar usabilidad. |
| 4.2 | **Carga Masiva (Bulk):** CSV Manabox/TCGPlayer | `BulkImport.tsx` implementado. | ✅ Cumple | Validar soporte específico de formatos Manabox. |

---

## 5. Flujo de Compra (Checkout)

| ID | Requisito | Estado Actual | Verificación | Acción Necesaria |
| :--- | :--- | :--- | :--- | :--- |
| 5.1 | **Carrito:** Funcionalidad estándar | Existe `CartDrawer`. | ✅ Cumple | - |
| 5.2 | **Checkout Invitado:** Sin Login | Requiere Auth (`if (!user) error`). | 🔴 No Cumple | Modificar `CheckoutPage` para permitir flujo sin `user_id` (o usuario anónimo). |
| 5.3 | **Datos Cliente:** Formulario completo | Formulario básico existe. | ✅ Cumple | Asegurar que se guarde en la orden. |
| 5.4 | **Pago:** Carga de Comprobante (No Pasarela) | Interfaz Fake de Tarjeta Crédito. | 🔴 No Cumple | Reemplazar UI de tarjeta por "Input File" (Comprobante) o Instrucciones de Transferencia. |
| 5.5 | **Finalización:** Correo a Ventas, No cobro auto | Crea orden en DB. | ⚠️ Parcial | Implementar notificación por correo (Email Service o Edge Function). |

---

## 6. Plan de Acción (Priorizado)

1. **Branding & Cleanup (Rápido):**
    * Actualizar nombre a "El Emporio".
    * Configurar fuentes (Bogue/Rubik).
    * Ocultar enlaces de Torneos/Perfil para públicos.
2. **Checkout Refactor (Crítico):**
    * Habilitar Guest Checkout (remover restricción de auth).
    * Cambiar paso de Pago: Eliminar Tarjeta, poner "Instrucciones de Pago Manual" + Integración WhatsApp/Correo.
3. **UI Catálogo:**
    * Mejorar Botones de Ordenamiento (Toggle).
    * Verificar visualización de Stock sin hover.

---

## 7. Preguntas Pendientes para Usuario

* ¿El "Login" se debe eliminar completamente para el público, o se deja discreto para clientes recurrentes que quieran ver historial?
* ¿Para el "Comprobante de Pago", es suficiente un botón de WhatsApp que envíe el pedido y el cliente adjunte el comprobante por ahí? (Más fácil de implementar y usual en LATAM).
