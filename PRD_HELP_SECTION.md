# PRD: Centro de Ayuda e Interacción ("El Códice del Emporio")

## 1. Objetivo

Transformar la asistencia al usuario en una experiencia inmersiva de descubrimiento. El objetivo es centralizar la resolución de dudas mediante una sección de FAQ estructurada por categorías, un infograma visual y un tutorial en video, todo bajo la estética medieval/premium de **Geekorium El Emporio**.

## 2. Estructura del Contenido (FAQ por Categorías)

La sección de ayuda se dividirá en cuatro grandes gremios de conocimiento:

### A. Gremio de Buscadores (Búsqueda General)

* **¿Cómo encuentro una carta específica?** Manual del uso de la barra de búsqueda superior y búsqueda por texto parcial.
* **¿Qué cartas están disponibles?** Explicación de la diferencia entre el "Stock Geekorium" (disponible ya) y el "Archivo" (referencia histórica).
* **¿Puedo buscar por edición?** Guía para encontrar colecciones completas.

### B. El Alquimista de Filtros (Uso de Filtros Avanzados)

* **Filtros de Rareza:** Cómo filtrar desde Common hasta Mythic Rare.
* **Mana Essence:** Explicación de la búsqueda por colores y tipos de energía.
* **Temporal Orbit:** Cómo navegar por las fechas de lanzamiento y legalidad de formatos.
* **Card Essence:** Filtros por tipo de carta (Criatura, Hechizo, Tierra, etc.).

### C. El Tesorero del Emporio (Proceso de Compra)

* **¿Cómo añado cartas al carrito?** Explicación del botón de compra y selección de versiones (Foil vs Non-Foil).
* **GK Price vs Market Price:** ¿Por qué nuestros precios son diferentes y cómo ahorrar?
* **¿Hay un límite de unidades?** Información sobre el stock real disponible por cada iteración.

### D. El Concilio de Asesores (Asesoría y Finalización)

* **¿Cómo hablo con un Geeko-Asesor?** El rol de WhatsApp en la validación final.
* **¿Qué pasa después de enviar mi carrito?** Flujo de trabajo desde que sale de la web hasta que llega a tus manos.
* **Métodos de Pago y Envío:** Información base sobre cómo se coordinan estos detalles en el chat.

## 3. El Infograma Visionario: "La Senda de la Single"

Un componente visual tipo **stepper horizontal** con el estilo de un pergamino que se desenrolla:

1. **Exploración:** Icono de catalejo animado.
2. **Selección:** Icono de mano tomando una carta con destellos cian.
3. **Preparación:** Icono de un cofre (carrito) guardando los ítems.
4. **Invocación:** El logo de WhatsApp brillando para conectar con el asesor.

## 4. Biblioteca de Hechizos (Multimedia)

* **Video Tutorial:** Un marco ornamentado (madera/oro) integrando un video corto que demuestre:
  * La rapidez de los filtros.
  * La belleza del modal de cartas.
  * Lo sencillo que es llegar al chat de WhatsApp.

## 5. Implementación Técnica y Visual (Actualizado)

### A. Iconografía Mágica (SVG Puro)

Se han desarrollado iconos vectoriales personalizados (sin dependencias externas de imagen) con animaciones CSS avanzadas:

1. **El Descubrimiento (Catalejo):** Animación de radar (`ping`) en el lente, estrellas rebotando (`bounce`) y cuerpo con brillo.
2. **La Selección (Mano de Mago):** Carta levitando (`bounce`) sobre una mano espectral con aura.
3. **La Preparación (Cofre):** Brillo interior pulsante (`pulse`) y detalles dorados.
4. **El Pacto (Sello):** Sello de lacre con runa brillante y destellos de confirmación.

### B. Video Player Interactivo ("Crónicas Visionarias")

* **Thumbnail Generado por Código:** En lugar de una imagen estática, se usa una composición CSS compleja con gradientes rotatorios (`spin`), glassmorphism y una interfaz simulada del sitio.
* **Modal de Cine:** Al hacer clic en el botón de Play, se abre un modal a pantalla completa con fondo `backdrop-blur` que carga el video tutorial (YouTube Embed).

### C. La Ruta del Conocimiento (Connector Path)

* **Línea de Flujo:** Un SVG de fondo conecta los 4 pasos del infograma.
* **Partícula de Energía:** Un círculo de luz viaja a través de la línea (`animateMotion`) simulando el flujo de los datos/magia a través del proceso.

## 6. Diseño Visual y UX (look & feel)

* **Layout:** Acordeones estilo pergamino para las FAQs con transiciones suaves de altura y opacidad.
* **Paleta:** Fondo `#f4e4bc` (pergamino), textos en negro carbón para legibilidad, acentos en `geeko-cyan` y `geeko-purple`.
* **Interacción:** Hover effects que iluminan las categorías con un aura mágica y escalan los elementos.
* **Persistencia:** Botón de acceso rápido desde el Header (nuevo botón "AYUDA") y el Footer.

## 7. Criterios de Aceptación (Estado Actual: Completado)

1. ✅ Las 4 categorías de FAQ están claramente diferenciadas e implementadas.
2. ✅ El infograma cuenta con iconos personalizados animados y una ruta conectora visual.
3. ✅ El reproductor de video es interactivo y funcional (abre modal).
4. ✅ El componente es 100% responsivo y mantiene la estética premium en móviles.
