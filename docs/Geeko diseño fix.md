

### **1\. Especificaciones de Diseño y Tipografía**

#### **Paleta de Colores (Branding)**

* **Fondo de la web:** \#1F182D.  
* **Color Primario (Sustituye al beige):** \#373266.  
* **Color Aguamarina:** \#00AEB4. Se aplica en botones, líneas decorativas, sección "Bienvenido a", precios y subtítulos.  
* **Contraste (Sustituye al negro):** Blanco \#FFFFFF.  
* **Formatos (Sustituye al verde):** Amarillo \#F9AE00.  
* **Otras variantes técnicas:** \#523176, \#B7B7B7, \#281F3E.

#### **Tipografías y Estilos**

* **Logo y Títulos muy específicos:** **Bogue Medium**.  
* **Cuerpo de texto (Normal):** **Rubik Regular**.  
* **Subtítulos y Resaltado de texto:** **Rubik Semi Bold**.  
* **Títulos web y publicaciones:** **Daito** (Normal/Medium).  
* **Restricciones:** \* No usar itálicas en la sección "¿Cómo comprar?".  
  * No usar itálicas con la tipografía **Daito** en la sección de ayuda.

#### **Elementos de Interfaz (UI)**

* **Logotipo:** Colocar exclusivamente el logo nuevo en la esquina superior como botón de inicio.  
* **Disponibilidad en cartas:** El color del texto "disponible" debe ser más oscuro para no perderse con el arte de las cartas.  
* **Filtros:** Adaptar los puntos del filtro y su estado "marcado" a los colores de la marca.

---

### **2\. PRD: Actualización Geekorium Emporio Mágico**

#### **I. Resumen del Proyecto**

Actualización integral de la plataforma e-commerce de Geekorium para alinearla con la nueva identidad visual y optimizar la gestión de inventario de cartas coleccionables, mejorando la experiencia de usuario en dispositivos móviles y el flujo de compra personalizado.

#### **II. Objetivos del Producto**

* Implementar la nueva paleta de colores y sistema tipográfico.  
* Optimizar el buscador para priorizar coincidencias exactas.  
* Estandarizar la carga de inventario mediante archivos CSV.  
* Corregir fallos críticos en el control de stock y el proceso de checkout.

#### **III. Requisitos Funcionales**

**A. Gestión de Inventario**

* **Carga vía CSV:** Migrar del formato .txt a carga masiva por .csv (compatible con exportaciones de ManaBox o TCG Player) que incluya columnas de "Foil", "Tipo de Foil" y "Juego".  
* **Diferenciación Foil:** El sistema debe distinguir automáticamente entre cartas *Foil* y *No Foil*, permitiendo precios de mercado y cantidades de stock independientes para cada versión.

**B. Algoritmo de Búsqueda y Navegación**

* **Buscador Inteligente:** Los resultados deben mostrar primero la coincidencia más exacta con el término buscado y luego resultados similares.  
* **Canales de Contacto:**  
  * Sustituir el texto del botón flotante "Online 24/7" por "**Atención por WhatsApp**".  
  * Redirigir el botón de WhatsApp directamente al número de singles: **04242507802**.  
  * Vincular el botón de email al landing page de Mailchimp.

**C. Proceso de Compra (Checkout)**

* **Formulario de Datos:** Capturar Nombre, Cédula, Teléfono, Dirección y Correo.  
* **Validaciones:** Implementar validación estricta de formato en el campo de correo electrónico.  
* **Métodos de Despacho:** Añadir selección obligatoria entre Pick up, Delivery o Envío Nacional.  
* **Flujo de Pago:** El proceso debe ser informativo. El cliente no paga hasta que el staff verifique la existencia física y coordine el pago vía WhatsApp/Correo.  
* **Notificaciones:** Generar envío automático de copia de la orden al cliente y alerta al staff de soporte.

#### **IV. Experiencia de Usuario (UX) \- Enfoque Móvil**

* **Atajos de Compra:** Añadir un botón externo a la carta en la vista previa para agregar al carrito rápidamente.  
* **Contador de Carrito:** Incluir un contador visible de ítems en el icono del carrito.  
* **Etiquetas de Stock:** Cambiar el texto "Existencia" por "**QTY: X**" o "**DISP: X**" para evitar que se superponga con la rareza de la carta en pantallas pequeñas.  
* **Ajuste de Lista:** Asegurar que el nombre de la carta se visualice completo en el modo de vista de lista.

#### **V. Corrección de Errores (Bugs)**

* **Control de Stock:** Bloquear la capacidad de añadir al carrito cantidades superiores a las disponibles en el inventario por expansión.  
* **Imágenes:** Corregir el error de carga donde no se visualizan las imágenes de las cartas en la vista principal.  
* **Geolocalización:** Habilitar la selección de otros países además de USA en el checkout.  
* **Subida de Archivos:** Reparar el botón "Cargar comprobante" que actualmente no permite la carga de documentos.

#### **VI. Criterios de Aceptación**

1. La web refleja fielmente la paleta \#1F182D, \#373266 y \#00AEB4.  
2. Las tipografías Bogue, Rubik y Daito están aplicadas según la jerarquía establecida.  
3. El sistema de carga CSV reconoce y separa variantes Foil.  
4. El flujo de checkout valida el email y notifica a ambas partes al finalizar.

