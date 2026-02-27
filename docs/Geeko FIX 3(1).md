# **PRD: Optimización y Funcionalidades Pendientes (Geekorium)**

**Versión:** 2.0 (Sin integración de carga masiva CSV)

## **1\. Resumen del Proyecto**

Este documento detalla las mejoras de interfaz, experiencia de usuario y flujo de ventas necesarias para completar la actualización del portal de **Geekorium Emporio Mágico**. El enfoque principal es la consistencia visual de la marca y la corrección de errores críticos en el proceso de compra.

---

## **2\. Identidad Visual y Branding (Pendientes)**

### **2.1. Implementación de Tipografías**

* **Títulos y Logo:** Aplicar la fuente **Bogue Medium**.  
* **Cuerpo de Texto:** Configurar **Rubik Regular** para la lectura general.  
* **Subtítulos y Énfasis:** Usar **Rubik Semi Bold**.  
* **Títulos de Sección (Web):** Implementar la tipografía **Daito**.  
  * *Restricción:* **No utilizar itálicas** cuando la fuente sea Daito o en la sección "¿Cómo comprar?".

  ### **2.2. Colores y UI**

* **Formatos:** Cambiar el color actual (verde) al amarillo de marca: `#F9AE00`.  
* **Logo:** Configurar el nuevo logo en la esquina superior para que funcione únicamente como botón de inicio (Home).  
* **Cartas:** Ajustar el texto de "Disponibilidad" sobre el arte de la carta a un tono más oscuro para mejorar el contraste y la legibilidad.  
  ---

  ## **3\. Funcionalidades del Sistema (Pendientes)**

  ### **3.1. Algoritmo de Búsqueda**

* **Jerarquía de Resultados:** El motor de búsqueda debe priorizar la **coincidencia exacta** por nombre de la carta. Los resultados por similitud o palabras clave parciales deben aparecer debajo del resultado exacto.

  ### **3.2. Canales de Comunicación**

* **Botón de WhatsApp:** \* Cambiar el texto actual "Online 24/7" por **"Atención por WhatsApp"**.  
  * Vincular directamente al número de ventas de singles: `04242507802`.  
* **Integración de Redes:** Activar los botones sociales en el pie de página y vincular el botón de email a la landing page de **Mailchimp**.  
  ---

  ## **4\. Experiencia de Usuario (UX) Móvil**

* **Botón de Compra Rápida:** Añadir un ícono de carrito ("Atajo") directamente sobre la imagen de la carta en la vista general, permitiendo agregar al carrito sin necesidad de abrir la ficha del producto.  
* **Contador Visual:** Implementar un círculo con el número de ítems sobre el ícono del carrito/cofre.  
* **Optimización de Textos:**  
  * Sustituir la palabra "Existencia" por **"QTY: X"** o **"DISP: X"** para evitar que el texto se corte en móviles.  
  * Asegurar que los nombres largos de las cartas se visualicen completos en la vista de lista.

  ---

  ## **5\. Flujo de Checkout y Validaciones**

  ### **5.1. Reglas del Carrito**

* **Bloqueo de Stock:** El sistema debe impedir que un usuario añada más unidades de una carta de las que existen realmente en el inventario para esa expansión específica.

  ### **5.2. Formulario de Pedido**

* **Validación de Email:** Implementar una máscara de validación estricta para el campo de correo electrónico (que verifique el formato `@` y `.com/net/etc`).  
* **Ubicación:** Habilitar la selección de **Estado y País** (actualmente restringido a USA).  
* **Métodos de Entrega:** Incluir selector obligatorio para:  
  1. Pick up (Retiro en tienda).  
  2. Delivery.  
  3. Envío Nacional.

  ### **5.3. Notificaciones**

* **Confirmación:** Al procesar la orden, enviar automáticamente un resumen del pedido al cliente y una alerta de "Nueva Orden" al correo de soporte del equipo.  
  ---

  ## **6\. Correcciones Técnicas (Bugs)**

* **Imágenes de Producto:** Corregir el fallo de carga que impide ver las imágenes de las cartas en la vista principal de stock.  
* **Subida de Archivos:** Reparar el botón **"Cargar comprobante"** para permitir la subida de archivos (PNG, JPG, PDF).  
* **Ajuste de Pantalla:** Corregir el error de visualización donde la página aparece "cortada" o desalineada al cargar inicialmente en navegadores móviles.


