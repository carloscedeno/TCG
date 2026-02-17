# Product Requirements Document: Mejoras Visuales y Funcionales Web (V2.0)

## 1. Introducción

Este documento detalla los requerimientos para la implementación de mejoras estéticas, funcionales y correcciones de bugs en la plataforma web de Geekorium, basándose en el documento `docs/CAMBIOS PÁGINA WEB.pdf`. El objetivo es elevar la calidad visual, mejorar la experiencia de usuario (UX) en escritorio y móvil, y optimizar procesos de búsqueda y carga de datos.

## 2. Alcance

El alcance incluye modificaciones en el Frontend (Diseño, Componentes UI, Lógica de Cliente) y sugerencias para cambios en el proceso de carga de datos (Importación).

## 3. Requerimientos de Diseño y Estética

### 3.1. Tipografía

Se deben integrar y aplicar las siguientes familias tipográficas según las nuevas guías de estilo:

* **Bogue Medium**: Uso exclusivo para el Logo o Títulos muy específicos.
* **Rubik Regular**: Texto general y cuerpo.
* **Rubik Semibold**: Subtítulos o textos a resaltar.
* **Daito Normal Medium**: Títulos en versiones web o publicaciones.

**Nota Importante**: La carpeta `docs/Fuentes` se encuentra actualmente vacía. Se requiere confirmar la ubicación de los archivos de fuente o utilizar alternativas disponibles (Google Fonts para Rubik).

### 3.2. Paleta de Colores

Estandarización de colores según la nueva identidad de marca:

* **Fondo Web**: `#1F182D` (Violeta oscuro).
* **Botones y Elementos Activos**: `#00AEB4` (Turquesa/Aguamarina).
* **Bienvenida (Fondo)**: `#373266` (En reemplazo del beige).
* **Texto General (sobre fondo oscuro)**: `#FFFFFF` (Blanco).
* **Formatos/Legalidad**: `#F9AE00` (Amarillo).
* **Precios y Subtítulos**: Tono Aguamarina (`#00AEB4`).
* **Stock/Cantidad Disponible**: Color más oscuro para garantizar legibilidad sobre las cartas.

### 3.3. Logos e Imágenes

* Actualizar el logo principal y favicon con los nuevos assets en `docs/logos`.
* Asegurar que el logo nuevo aparezca en la esquina (posiblemente como botón de "Inicio").

### 3.4. Layout de Modal de Carta (Estándar de Implementación)

**CRÍTICO**: Para evitar regresiones en la visualización del Modal de Carta (problema de "imagen gigante" o "lista de versiones oculta"), se debe respetar estrictamente la siguiente arquitectura de layout en la columna izquierda:

1. **Contenedor de Imagen**:
    * Debe usar `flex-[1_1_0%]`.
    * Debe tener `min-h-0` (importante para permitir que la imagen se encoja si es necesario).
    * Posicionamiento `relative`.
    * **Nunca** usar `flex-1` sin restricciones o alturas fijas en píxeles que excedan el viewport disponible.

2. **Contenedor de Versiones (Lista)**:
    * Debe tener una altura porcentual base: `h-[35%]`.
    * Debe tener una altura mínima de seguridad: `min-h-[200px]`.
    * Debe tener `shrink-0` para prevenir que la imagen lo aplaste.
    * El contenido interno debe ser `overflow-y-auto`.

Esta configuración garantiza que, independientemente del tamaño de la imagen o de la pantalla, la lista de versiones siempre tendrá al menos 200px o el 35% del espacio vertical disponible, y la imagen se ajustará automáticamente al espacio restante.

**Validación**:

* Verificar siempre con cartas que tengan muchas versiones (ej. "Dark Ritual", "Boomerang") y cartas con pocas versiones.
* Verificar que el scroll de la lista de versiones funcione.
* Verificar que el modal de la imagen no empuje el contenido fuera del viewport.

## 4. Requerimientos Funcionales

### 4.1. Página de Inicio (Home)

* **Sección de Bienvenida**:
  * Cambiar texto a "Bienvenido a Geekorium Emporio Mágico".
  * Aplicar fondo `#373266`.
  * Estilar "Bienvenido a", líneas decorativas y botones con `#00AEB4`.
  * Texto explicativo en blanco `#FFFFFF`.

### 4.2. Búsqueda y Filtros

* **Mejora de Algoritmo de Búsqueda**:
  * Priorizar resultados exactos o muy similares al término de búsqueda (ej. "Ultima").
  * Ordenar resultados por relevancia: Coincidencia Exacta > Coincidencia Parcial (Inicio) > Coincidencia Parcial (Contenido).
* **Filtros Visuales**:
  * Ajustar los indicadores ("puntitos") de los filtros para usar los colores de la marca.
  * Mejorar la indicación visual de filtros activos.

### 4.3. Visualización de Cartas e Inventario

* **Detalle de Carta (Modal/Página)**:
  * **Distinción de Foil**: Implementar indicador visual claro para cartas Foil vs. No-Foil (Regular, Etched, etc.) tanto en la vista previa como en el detalle.
  * **Stock**: Mostrar la cantidad disponible debajo de la carta con un color oscuro para contraste.
  * **Precio de Mercado**: Ajustar alineación ligeramente a la derecha.
  * **Corrección de Bug**: Investigar y corregir error donde la carta no se visualiza al entrar ("no se ve la carta").
  * **Texto Superpuesto**: Corregir superposición de textos ("el texto se volvió verga") aumentando espaciado o márgenes.
* **Vista de Lista/Grid**:
  * **Botón Rápido de Compra**: Añadir botón "Agregar al Carrito" directo en la tarjeta/item de la lista, sin necesidad de abrir el detalle (para usuarios expertos).
  * **Contador de Carrito**: Añadir badge/contador en el icono del carrito que se actualice en tiempo real.

### 4.4. Redes Sociales

* Integrar botones de redes sociales en el Footer o Menú con los siguientes enlaces:
  * **Facebook**: `https://www.facebook.com/profile.php?id=61573984506104#`
  * **Discord**: `https://discord.gg/wmYhWw5Q`
  * **Twitch**: `https://www.twitch.tv/geekorium`
  * **YouTube**: `https://www.youtube.com/@Geekorium`
  * **Email**: `https://mailchi.mp/4e05f3c06e75/geekorium`

## 5. Requerimientos Móviles (Responsive)

* **Header Cortado**: Corregir altura o `viewport` inicial para evitar que el contenido se vea cortado al abrir la página.
* **Nombres de Cartas**: En modo lista, permitir que el nombre de la carta ocupe más líneas o ajustar tamaño de fuente para evitar truncamiento excesivo.
* **Indicador de Stock**: Renombrar etiqueta "EXISTENCIA" a "QTY: X" o "DISP: X" para ahorrar espacio y evitar colisión con la Rareza.

## 6. Gestión de Datos (Sugerencia)

* **Migración a Importación CSV**: Evaluar e implementar carga de inventario mediante CSV (exportación de Manabox) en lugar de TXT.
  * **Ventaja**: El CSV incluye columnas específicas para acabado (Foil/Regular), facilitando la distinción automática.

## 7. Plan de Pruebas y Validación

| ID | Requerimiento | Método de Validación | Criterio de Aceptación |
| :--- | :--- | :--- | :--- |
| **TEST-01** | Tipografía y Colores | Inspección Visual | Todas las fuentes y colores coinciden con la sección 3. No hay texto negro sobre fondo oscuro. |
| **TEST-02** | Algoritmo de Búsqueda | Prueba Manual | Búsqueda de "Ultima" muestra la carta exacta primero, seguida de derivados. |
| **TEST-03** | Distinción Foil | Prueba Manual | Cartas foil tienen icono/etiqueta distintiva. Filtros de foil funcionan correctamente. |
| **TEST-04** | Agregar al Carrito (Rápido) | Prueba Funcional | Clic en botón rápido añade item, actualiza contador de carrito y toast de confirmación. |
| **TEST-05** | Vista Móvil - Header | Dispositivo/Emulador | El header no corta el contenido principal al cargar. |
| **TEST-06** | Vista Móvil - Nombres | Dispositivo/Emulador | Nombres largos de cartas se leen completos (wrap) en modo lista. |
| **TEST-07** | Vista Móvil - QTY | Dispositivo/Emulador | Etiqueta dice "QTY" o "DISP" y no se solapa con Rareza. |
| **TEST-08** | Redes Sociales | Prueba de Enlaces | Todos los botones redirigen a las URLs correctas en nueva pestaña. |
| **TEST-09** | Importación CSV (Si se implementa) | Prueba de Carga | Archivo CSV de prueba se procesa sin errores; Foil/Regular se asignan correctamente. |

## 8. Siguientes Pasos

1. **Confirmar Fuentes**: Localizar archivos de fuente o aprobar uso de Google Fonts.
2. **Configurar Estilos Globales**: Actualizar `tailwind.config.js` o archivos CSS con la nueva paleta.
3. **Implementar Cambios Visuales**: Header, Footer, Cards.
4. **Implementar Lógica**: Búsqueda, Carrito, Importación.
5. **Ejecutar Pruebas**: Validar según plan.

## 9. Anexo: Aviso Legal, Propiedad Intelectual y Transparencia Comercial

### 9.1. Texto Completo (Español)

**1. Identificación y Neutralidad de la Plataforma:**
Geekorium El Emporio – RIF:. Geekorium es una plataforma tecnológica independiente de mercado secundario (marketplace) operada por [Nombre de tu Empresa/Proyecto]. Esta aplicación actúa única y exclusivamente como un intermediario neutral que facilita la conexión técnica entre usuarios terceros para la compra y venta de artículos coleccionables físicos de segunda mano. Geekorium no posee, no vende, no garantiza ni mantiene inventario propio de los productos listados por los usuarios, ni actúa como representante, agente o franquicia de los vendedores.

**2. Reconocimiento Exhaustivo de Propiedad Intelectual (Wizards of the Coast):**
Esta plataforma no está afiliada, respaldada, patrocinada ni aprobada específicamente por Wizards of the Coast LLC ni por Hasbro, Inc. Magic: The Gathering (MTG), incluyendo de manera enunciativa pero no limitativa: sus logotipos, nombres de cartas, símbolos de maná, símbolos de expansión, textos de ambientación (flavor text), reglas de juego, mecánicas originales, arte de las cartas, ilustraciones, diseños de marcos, nombres de personajes y de planos de existencia, son marcas registradas y material protegido por derechos de autor propiedad de Wizards of the Coast LLC, una subsidiaria de Hasbro, Inc. © 1993-2026 Wizards of the Coast LLC. Todos los derechos reservados.

El uso de estos activos en esta Aplicación se realiza bajo la doctrina del Uso Nominativo y el principio de Agotamiento Internacional de Derechos de Marca, conforme al Artículo 158 de la(<http://www.sice.oas.org/trade/junac/decisiones/dec486s5.asp>) y la Ley de Propiedad Industrial de Venezuela. Dicho uso tiene fines estrictamente informativos, referenciales y de identificación de productos originales dentro del tráfico mercantil legítimo.

**3. Atribución de Datos y APIs de Terceros:**

* **Scryfall:** Toda la información literal y gráfica de las cartas visualizada en esta plataforma es proporcionada por la API de Scryfall LLC. Card data provided by Scryfall. Este contenido se utiliza conforme a la(<https://company.wizards.com/en/legal/fancontentpolicy>) y las(<https://scryfall.com/docs/api>). El acceso a estos datos es gratuito para el usuario final y Geekorium no impone muros de pago para la consulta de dicha información.
* **CardKingdom (Precios):** Los valores monetarios mostrados como "Precio de Referencia" o "Market Price" se derivan de datos públicos de mercado de CardKingdom. Estos precios son exclusivamente referenciales y orientativos, proporcionados para facilitar la valoración equitativa en transacciones entre particulares (Peer-to-Peer). CardKingdom no garantiza la exactitud ni la disponibilidad de productos en esta Aplicación, y Geekorium se desvincula de cualquier discrepancia de precios conforme a los(<https://www.cardkingdom.com/static/tos>).

**4. Cumplimiento de Normativa de Consumo y Divisas (Venezuela):**
En cumplimiento con la Ley Orgánica de Precios Justos y las regulaciones de la SUNDDE, se informa:

* El precio final de venta es establecido libremente por el usuario vendedor en ejercicio de su derecho de propiedad.
* Geekorium no garantiza la veracidad de los precios referenciales externos.
* Toda transacción o referencia de valor en divisas extranjeras dentro de la plataforma para operaciones nacionales debe regirse por la tasa oficial publicada por el(<https://www.bcv.org.ve/>) a la fecha de la operación comercial.

**5. Política contra Falsificaciones y Edad Mínima:**
Queda estrictamente prohibida la oferta o venta de reproducciones no autorizadas, falsificaciones o "proxies" que violen los derechos de autor de Wizards of the Coast. La venta de tales artículos resultará en la expulsión inmediata de la plataforma. Los servicios de Geekorium están dirigidos exclusivamente a personas con capacidad legal para contratar (mayores de 18 años).

### 9.2. Comprehensive Legal Notice & Data Attribution (English)

**1. Platform Identity & Neutrality:**
Geekorium El Emporio – Tax ID (RIF):. Geekorium is an independent, third-party technological marketplace platform operated by [Company Name]. This Application acts solely as a neutral venue to facilitate technical connections between third-party users for the peer-to-peer purchase and sale of genuine physical collectible goods. Geekorium does not own, sell, or guarantee any inventory listed by third parties, nor does it act as an agent, franchise, or official representative of such sellers.

**2. Intellectual Property Acknowledgment (Wizards of the Coast):**
This platform is not affiliated with, endorsed, sponsored, or specifically approved by Wizards of the Coast LLC or Hasbro, Inc. Magic: The Gathering (MTG), including but not limited to its logos, card names, mana symbols, expansion symbols, flavor text, gameplay mechanics, card artwork, illustrations, frame designs, character names, and planes of existence, are trademarks and copyrighted material owned by Wizards of the Coast LLC, a subsidiary of Hasbro, Inc. © 1993-2026 Wizards of the Coast LLC. All rights reserved.

The use of these assets within this Application is strictly for informational, referential, and product identification purposes in the course of trade, pursuant to the Nominative Fair Use doctrine and the International Exhaustion of Trademark Rights principle, as established under Article 158 of the(<http://www.sice.oas.org/trade/junac/decisiones/dec486s5.asp>).

**3. Third-Party Data & API Attribution:**

* **Scryfall:** Literal and graphical card information presented is provided by the Scryfall API. Card data provided by Scryfall. This material is used in compliance with the(<https://company.wizards.com/en/legal/fancontentpolicy>) and(<https://scryfall.com/docs/api>). Access to this data remains free of charge for all end-users.
* **CardKingdom (Pricing):** Monetary values displayed as "Referential Prices" are based on public market data from CardKingdom. These values are provided solely as a valuation guide for user-to-user transactions and do not constitute a binding sales offer, a price guarantee, or a reflection of CardKingdom's actual inventory on this platform, pursuant to(<https://www.cardkingdom.com/static/tos>).

**4. Commercial Transparency & Regional Compliance (Latin America):**
Pursuant to Venezuelan Fair Price Laws and SUNDDE regulations, users are informed that final sales prices are determined independently by sellers. All local transactions involving foreign currency must comply with the official exchange rates published by the(<https://www.bcv.org.ve/>) on the date of the transaction.

**5. Anti-Counterfeiting & Age Requirements:**
The sale of unauthorized reproductions, counterfeits, or "proxies" is strictly prohibited and constitutes a violation of Wizards of the Coast's intellectual property rights. Users must be at least 18 years old to buy or sell on this platform.
