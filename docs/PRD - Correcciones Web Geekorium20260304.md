# **Product Requirements Document (PRD)**

**Proyecto:** Plataforma E-commerce Singles MTG (Geekorium)

**Fecha de Revisión:** 03/03/2026

**Documento Base:** Copy of CAMBIOS PÁGINA WEB.pdf, lorwyn.csv

**Estado:** Listo para Desarrollo (Ready for Dev)

**Autor/Propietario de Producto:** Equipo de Producto Geekorium

## **1\. Resumen Ejecutivo y Objetivos del Negocio**

Este documento detalla las correcciones críticas requeridas en la plataforma web de venta de cartas sueltas (singles) de Magic: The Gathering de Geekorium. El sistema actual presenta incidencias operativas que están afectando directamente la experiencia del usuario y la conversión de ventas.

Los ajustes se centran en dos áreas principales que tienen un impacto inmediato en el negocio:

1. **Corrección Integral de la Lógica de Precios:** Solucionar de manera definitiva la discrepancia entre los precios mostrados en el frontend para versiones *Normales* frente a versiones *Foil*. Esta falla genera desconfianza en el comprador (al ver precios inflados) o pérdidas para la tienda (al vender cartas Foil a precio de Normal). Se debe garantizar que el frontend refleje con precisión absoluta la base de datos (CSV importado) y/o la API de referencia (Scryfall/Card Kingdom).  
2. **Optimización y Fricción Cero en el Flujo de Checkout:** Simplificar radicalmente la pasarela de pago final. El objetivo es eliminar la exposición innecesaria de datos bancarios estáticos en la web (que pueden cambiar o generar confusión) y redirigir la culminación de la compra (el momento de mayor intención) directamente a un canal de atención personalizada vía WhatsApp, donde un asesor cerrará la venta y coordinará la logística.

**Impacto Esperado:** Reducción del 100% en quejas por discrepancia de precios en carrito y un aumento estimado en la tasa de conversión al ofrecer un cierre de venta asistido y más humano a través de WhatsApp.

## **2\. Alcance (Scope)**

Para garantizar un ciclo de desarrollo rápido y efectivo, es vital delimitar exactamente qué se va a modificar y qué se mantendrá intacto.

### **Dentro del Alcance (In Scope)**

* Modificación de la lógica de renderizado en la Vista de Detalle de Producto (/product/:id) para asegurar el despliegue correcto de precios por variante.  
* Refactorización de la Vista de Checkout (/checkout o /cart), eliminando componentes de UI estáticos y añadiendo lógica de generación de enlaces dinámicos (Deep Linking) hacia la API de WhatsApp.  
* Pruebas de regresión sobre el carrito de compras y las validaciones de inventario existentes.  
* Optimización de la lectura de datos tipo float y boolean/string provenientes del archivo CSV.

### **Fuera del Alcance (Out of Scope)**

* **Lógica de Límites de Inventario:** Alterar la lógica actual de validación de cantidades máximas en el carrito. El cliente confirmó en el reporte visual que funciona correctamente: *"Armé la orden y no me dejó meter más de las que habían disponibles, eso está bello"*. Esto no debe tocarse, solo validarse.  
* **Rediseño Estructural de la UI:** No se realizará un rediseño completo de la interfaz gráfica, paletas de colores, ni tipografías más allá de la limpieza de la vista de checkout y la actualización del botón de compra.  
* **Integración de Pasarelas de Pago Automáticas:** No se integrarán APIs de Stripe, PayPal o pasarelas bancarias locales en esta fase. Todo el pago seguirá siendo manual/asistido.

## **3\. Requerimientos Detallados (Épicas y User Stories)**

### **ÉPICA 1: Corrección de Visualización de Precios y Variantes**

**Contexto del Problema:** Actualmente, la aplicación web está confundiendo o invirtiendo los precios de las cartas debido a un mal manejo de los identificadores o estados en el frontend. El reporte documenta que cartas como *Nyx Infusion (JOU)* muestran el precio *Foil* más bajo que el *Normal*, o cruzan el precio de mercado afectando la decisión de compra.

* **User Story 1.1:** Como usuario coleccionista, al ver el detalle de una carta, quiero ver el precio exacto e inequívoco correspondiente a su versión física (Normal o Foil) para tener seguridad de cuánto voy a pagar antes de añadirla al carrito.  
* **Criterios de Aceptación (Acceptance Criteria):**  
  * El sistema backend/frontend debe leer y parsear correctamente la columna Foil del archivo CSV fuente (lorwyn.csv).  
  * **Comportamiento UI:** Si la variante es Foil \== normal (o false), el frontend debe renderizar el precio base bajo una etiqueta visual clara que diga "NORMAL".  
  * **Comportamiento UI:** Si la variante es Foil \== foil (o true), el frontend debe renderizar el precio premium correspondiente bajo una etiqueta visual "FOIL".  
  * **Caso de Prueba Principal (Test Case):** Buscar la carta *Nyx Infusion (JOU)*. Verificar que el precio de Retail Normal sea exactamente $0.35 y la variante Foil sea $0.49 (replicando la captura enviada por el cliente).  
* **Especificaciones Técnicas y Manejo de Errores:**  
  * **Race Conditions:** Revisar la lógica de *fetch* asíncrono en el componente de detalle de producto. Es muy probable que al consultar a la API usando los IDs (Scryfall ID o ManaBox ID), el estado de React/Angular se esté sobreescribiendo asíncronamente y mostrando el precio de la última respuesta en ambas variantes.  
  * **Tipo de Datos:** Asegurar que el campo Purchase price del CSV se está importando como un número flotante (Float) y no como un String con comas que pueda estar rompiendo el renderizado numérico.  
  * **Variantes Únicas:** Si una carta del CSV *solo* tiene versión Foil (ej. cartas promocionales), el selector UI de versión Normal debe aparecer deshabilitado o estar ausente.

### **ÉPICA 2: Rediseño del Flujo de Pago (Checkout \- WhatsApp Routing)**

**Contexto del Problema:** La pantalla final de confirmación de pago está saturada de información sensible (datos bancarios de Pago Móvil, Cédulas, correos de Zelle). El cliente ha solicitado que esta vista actúe exclusivamente como un resumen (Order Summary) y que la acción principal transfiera toda la carga transaccional a un canal de WhatsApp asistido.

* **User Story 2.1:** Como comprador, al llegar al final de mi proceso de compra, quiero ver un resumen limpio de mi orden y un único botón para contactar a un asesor por WhatsApp, evitando confundirme con múltiples números de cuenta bancaria.  
* **Criterios de Aceptación (Acceptance Criteria):**  
  * **Limpieza de UI (Deprecation):** Ocultar/Eliminar por completo los bloques de texto e iconos de "Pago Móvil Banco Mercantil" y "Zelle" (incluyendo números telefónicos, Cédula/RIF y correos electrónicos) de la vista /checkout.  
  * **Preservación de UI:** Dejar visibles de forma estructurada las siguientes secciones:  
    1. **Resumen de Orden:** Lista detallada de cartas, cantidad, multiplicador de precio, Subtotal, Costo de Envío ("A coordinar") y Total final.  
    2. **Datos del Cliente:** Nombre, CI/RIF, y Teléfono de contacto ingresados previamente.  
  * **Nuevo CTA (Call to Action):** Reemplazar cualquier botón de pago anterior por un botón único, grande y destacado (usando el color primario de la marca) que diga: **"Confirmar y Pagar por WhatsApp"**.  
  * **Acción de Redirección:** Al hacer clic en el botón, el sistema debe ejecutar la redirección hacia la API de WhatsApp. En móviles debe abrir la app nativa; en desktop, debe abrir WhatsApp Web en una nueva pestaña (target="\_blank").  
  * **Número Destino:** 584242507802  
* **Especificaciones Técnicas (Generación de Mensaje WA):**  
  * El frontend debe interceptar los datos del estado del carrito y construir una cadena de texto formateada.  
  * Se DEBE utilizar encodeURIComponent() nativo de JavaScript sobre toda la cadena generada para asegurar que los espacios, símbolos de dólar ($) y saltos de línea (\\n) se rendericen correctamente en la URL.  
  * **Estructura estandarizada del mensaje:**  
    ¡Hola Geeko-Asesor\! Quiero concretar esta orden:  
    \*Cliente:\* \[Nombre del Cliente\]  
    \*CI/RIF:\* \[Documento\]  
    \*Total a Pagar:\* $\[Total\]

    \*Detalle de Cartas:\*  
    \- 1x Wanderbrine Preacher (ECL) \[Normal\] \- $0.35  
    \- 1x Nyx Infusion (JOU) \[Foil\] \- $0.49

  * **Manejo de Límite de URL:** Si el carrito tiene más de 40 cartas distintas, la URL resultante podría exceder el límite seguro de caracteres de WhatsApp (aprox. 2000 caracteres). En este caso extremo, el sistema debe acortar la lista en el mensaje y agregar la frase: *"Y \[X\] cartas adicionales. Por favor revisa mi orden en el sistema bajo mi nombre."*

### **ÉPICA 3: Validación Continua de Inventario (Regresión de Estado)**

**Contexto del Problema:** Durante la refactorización de componentes que manejan el estado global (como el carrito y los precios), es fácil romper validaciones preexistentes. El bloqueo de stock máximo actual es una de las funcionalidades más apreciadas por el cliente.

* **Requerimiento Técnico:** Asegurar mediante pruebas unitarias o manuales que los cambios arquitectónicos en el frontend exigidos por la Épica 1 y 2 no desacoplan la validación de la columna Quantity proveniente del CSV del estado global del carrito.  
* **Criterio de Aceptación:** Si la base de datos (derivada del CSV) indica que Quantity: 2 para la carta *Stalactite Dagger*, el selector numérico de incremento (+) dentro del carrito debe visualmente deshabilitarse (estado disabled) o arrojar una notificación tipo *toast* amigable al usuario si este intenta agregar la unidad número 3\. El subtotal no debe incrementar bajo ninguna circunstancia por encima del stock.

## **4\. Mapeo de Datos Ampliado (Basado en la estructura de lorwyn.csv)**

El equipo de backend (procesamiento de CSV) y frontend (consumo de objetos) debe asegurarse de mapear estrictamente los siguientes campos, prestando atención a los tipos de datos y su impacto.

| Campo CSV | Tipo de Dato | Ejemplo en Data | Uso en la UI y Lógica de Negocio | Acción / Cuidado Requerido |
| :---- | :---- | :---- | :---- | :---- |
| Name | String | "Wanderbrine Preacher" | Título principal de la carta en catálogo y checkout. | Mantener intacto. Escapar caracteres especiales si los hubiese. |
| Set code | String | "ECL" | Etiqueta de la expansión. | Mostrar en paréntesis junto al nombre para facilitar la búsqueda física del asesor. |
| Foil | String (normal / foil) | "foil" | **CRÍTICO:** Determina la variante UI. | Filtrar y agrupar las variantes bajo un mismo Name para evitar mostrar duplicados en el catálogo, pero diferenciando precios en el detalle. |
| Quantity | Integer | 2 | Límite dinámico máximo en carrito. | Mantener validación estricta actual (Ver Épica 3). |
| Purchase price | Float | 0.35 | Precio unitario base o premium. | Convertir explícitamente a Float al importar. Renderizar siempre con dos decimales (toFixed(2)). |
| Condition | String | "near\_mint" | Metadato de calidad. | Informar al cliente el estado de la carta (NM, SP, MP, HP). Mostrar sutilmente en la vista de producto. |
| Language | String | "en", "es" | Idioma de impresión. | Mostrar bandera o iniciales. Fundamental para compradores exigentes. |
| Scryfall ID | UUID | 6954df09-95f3... | Fetch de imágenes de alta resolución. | **Punto de Falla Común:** Verificar que no se estén cruzando los UUIDs de la variante normal con la foil en el llamado asíncrono a la API de Scryfall. |

## **5\. Matriz de Pruebas de Calidad (QA Checklist Extendido)**

El equipo de Quality Assurance (QA) no debe otorgar la aprobación de pase a producción (Sign-off) hasta que todos los puntos de esta matriz pasen satisfactoriamente en entornos Desktop, iOS (Safari) y Android (Chrome).

### **A. Pruebas Funcionales y de Integración (Precios)**

* \[ \] **Test C-01 (Mapeo Básico):** Ingresar a 3 cartas aleatorias que posean versiones Normal y Foil en el archivo lorwyn.csv. Verificar que el precio mostrado en la web coincide **exactamente** con la columna Purchase price asignada a cada fila respectiva.  
* \[ \] **Test C-02 (Aislamiento de Estado):** Abrir la carta *Nyx Infusion* en dos pestañas diferentes simultáneamente. Cambiar a Foil en la primera pestaña; verificar que la segunda pestaña mantiene su estado original (Normal).  
* \[ \] **Test C-03 (Imágenes Correctas):** Validar que al seleccionar la versión Foil, si la API de Scryfall devuelve un arte alternativo (como pasa en algunas expansiones), la imagen del producto se actualice correctamente usando el Scryfall ID respectivo.

### **B. Pruebas de Interfaz de Usuario (UI) y Checkout**

* \[ \] **Test U-01 (Limpieza de UI):** Entrar a la pasarela de pago simulando un flujo completo. Confirmar visualmente que NO existen logos, textos ni referencias ocultas a Mercantil, Zelle o Pago Móvil.  
* \[ \] **Test U-02 (Resumen Preciso):** Verificar que la tabla de "Resumen de Orden" suma correctamente el subtotal matemático de (Precio x Cantidad) de las cartas y muestra el costo de envío ("A coordinar").

### **C. Pruebas de Usabilidad y Enrutamiento WhatsApp**

* \[ \] **Test W-01 (Deep Linking Básico):** Hacer clic en "Confirmar y Pagar por WhatsApp". Verificar que redirige exactamente al teléfono destino (wa.me/584242507802).  
* \[ \] **Test W-02 (Integridad del Payload):** Al abrir WhatsApp, confirmar que la caja de texto se pre-llena respetando los saltos de línea (formato legible) e incluye al menos el nombre del cliente, el total y 2 ítems de prueba.  
* \[ \] **Test W-03 (Payload Largo \- Límite de Caracteres):** Añadir artificialmente 50 cartas distintas al carrito y presionar checkout. Validar que la aplicación no colapse al generar la URL de WhatsApp y trunque correctamente la lista si excede los límites de la URL.

### **D. Pruebas de Regresión (Límite de Carrito)**

* \[ \] **Test R-01 (Bloqueo de Stock):** Buscar una carta que en el CSV tenga Quantity: 1\. Agregarla al carrito. Intentar agregar una segunda unidad desde la vista del producto y desde el contador del propio carrito. Ambos intentos deben fallar y la cantidad en el carrito debe permanecer en 1\.

**Firmas de Aprobación para Despliegue:** \* Producto: \[Pendiente de Firma\]

* Líder Técnico: \[Pendiente de Firma\]  
* QA Lead: \[Pendiente de Firma\]