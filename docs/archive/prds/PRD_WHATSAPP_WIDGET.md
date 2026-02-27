# PRD: WhatsApp Floating Widget ("El Botcito de El Emporio")

## 1. Objetivo

Mejorar la conversión y la atención al cliente proporcionando un acceso directo, persistente y visualmente atractivo a los canales de comunicación oficiales de **Geekorium El Emporio** a través de WhatsApp.

## 2. Experiencia de Usuario (UX)

* **Visibilidad:** Un botón flotante situado en la esquina inferior derecha de la pantalla.
* **Interacción:**
  * Al hacer clic, se despliega un pequeño menú "estilo chat" que ofrece las dos opciones de contacto: **Atención Principal** y **Venta de Singles**.
  * Incluye un mensaje de bienvenida personalizado según la sección.
* **Feedback Visual:** Animación sutil (pulso) para captar la atención sin ser intrusivo.

## 3. Diseño Visual (UI)

* **Icono:** Logo oficial de WhatsApp o una versión estilizada con los colores de la marca.
* **Colores:**
  * Fondo del botón: `#25D366` (Verde WhatsApp) o `var(--color-geeko-cyan)` con gradiente.
  * Sombra: `0 8px 32px rgba(0, 229, 255, 0.3)`.
* **Componente de Menú (Dropdown):**
  * Fondo: Glassmorphism (oscuro/transparente) o `parchment-card` si se busca un estilo medieval.
  * Tipografía: `Rubik` para el cuerpo y `Bogue` para el título del menú.
* **Tooltip:** Pequeña burbuja de texto que aparece tras 5 segundos con el mensaje: "¿Necesitas ayuda con tu misión?".

## 4. Funcionalidad Técnica

* **Canales de Contacto:**
    1. **WhatsApp Principal:** `+58 412-8042832` (Consultas generales, envíos).
    2. **WhatsApp Singles:** `+58 424-2507802` (Específico para compra/venta de cartas sueltas).
* **Plantillas de Mensaje (Pre-filled):**
  * Mensaje automático sugerido: *"¡Hola Geekorium! Vengo desde la página web y me gustaría información sobre..."*
* **Responsividad:** En dispositivos móviles, el botón se desplaza ligeramente para no tapar elementos críticos de navegación.

## 5. Requisitos No Funcionales

* **Rendimiento:** El widget no debe afectar el tiempo de carga inicial (Lazy loading recomendado).
* **Accesibilidad:** Debe incluir etiquetas `aria-label` para lectores de pantalla.
* **Persistencia:** La burbuja de ayuda solo debe aparecer una vez por sesión para no molestar al usuario recurrente.

## 6. Criterios de Aceptación

1. El botón es visible en todas las páginas del portal.
2. Al hacer clic, se muestran claramente ambos números de teléfono.
3. La integración redirige correctamente a la aplicación de WhatsApp (web o móvil).
4. El diseño sigue la paleta de colores "Geeko-Magic" definida.
