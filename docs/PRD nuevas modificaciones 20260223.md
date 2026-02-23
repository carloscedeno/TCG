# **Especificación Técnica de Ingeniería (PRD) \- Geekorium v4.0**

**Estado:** Ready for AI Implementation (Ralph Framework Optimized)

**Filosofía:** Compounding Engineering (Modularidad, Tipado Estricto, Mantenibilidad)

**Stack:** FastAPI (Backend), React 18+ (TS), Supabase (Auth/DB/Storage), Tailwind CSS.

## **1\. Contexto de Dominio y Objetivos Críticos**

Geekorium opera en un nicho de alta fidelidad: el coleccionismo de Magic: The Gathering (MTG). A diferencia de un e-commerce convencional, el inventario es altamente volátil y el valor de un activo depende de variables subjetivas como el estado físico (Condition) y el acabado (Foil).

### **1.1 El Modelo de "Venta Asistida"**

El sistema no es una pasarela de pago automatizada cerrada. Se define como un **Generador de Leads Verificados**. El objetivo técnico es reducir la fricción entre la selección del producto y la comunicación con el "Geeko-Asesor".

* **Implicación:** El carrito no garantiza la reserva del stock hasta que el asesor confirma la existencia física, debido a que el stock se comparte con ventas presenciales.

### **1.2 Objetivos de Ingeniería y Métricas de Éxito**

1. **Integridad de Datos (Precios):** 0% de discrepancia. El cálculo debe centralizarse en un PriceResolver en el backend para evitar manipulaciones en el cliente.  
2. **UX Adaptativa (Mobile-First):** Puntuación de CLS (Cumulative Layout Shift) inferior a 0.1. Uso de unidades dinámicas (dvh) para mitigar el impacto de las barras de navegación móviles.  
3. **Escalabilidad del Parser:** Motor modular capaz de procesar 500+ líneas de TXT de ManaBox en \< 2 segundos.  
4. **Resiliencia y Cache:** Implementación de *Stale-While-Revalidate* para datos de Scryfall, asegurando que la web sea funcional incluso con latencia alta en la red local.

## **2\. Sistema de Diseño (Design Tokens & UI Logic)**

Para asegurar un desarrollo "compounding", no se permiten valores "hardcoded". Todo debe derivar de tailwind.config.js.

### **2.1 Tokens de Color y Superficies (Dark Mode Premium)**

| Token | Categoría | Valor Hex | Uso Semántico y Accesibilidad |
| :---- | :---- | :---- | :---- |
| bg-primary | Background | \#1F182D | Main Viewport. Fondo profundo para resaltar el arte de las cartas. |
| bg-secondary | Surface | \#281F3E | Cards, Filter Containers. Elevación visual de nivel 1\. |
| bg-accent | Highlight | \#373266 | Header, Modals, Dividers. Secciones de contraste fuerte. |
| action-cyan | Interactive | \#00AEB4 | Buttons, Active States, Prices. Contraste AA garantizado. |
| format-gold | Status | \#F9AE00 | MTG Legality Badges (Pioneer, Modern, etc). |
| text-high | Typography | \#FFFFFF | Primary Content. Títulos, precios y nombres de cartas. |
| text-low | Typography | \#B7B7B7 | Flavor Text y etiquetas de metadatos secundarios. |

### **2.2 Jerarquía Tipográfica y Reglas de Renderizado**

* **Brand Hero (font-bogue):** Solo para Logo y H1. Debe utilizar font-display: swap para evitar el destello de texto invisible (FOIT).  
* **Interface UI (font-daito):** Navegación y CTAs. Diseñada para legibilidad en mayúsculas sin fatiga visual.  
* **Body/Data (font-rubik):** \- *Regular:* Texto base (16px).  
  * *Semibold:* Resaltado de stock y nombres (14px/16px).  
  * *Italic:* Exclusivo para el *Flavor Text* de las cartas (12px/14px).

## **3\. Arquitectura de Datos y Backend (FastAPI \+ Supabase)**

### **3.1 Contrato del Parser de Inventario (ManaBox TXT)**

El agente debe implementar la clase ManaBoxParser con las siguientes especificaciones:

* **Estructura de Línea:** 1x Ad Nauseam (2XM) 076 \*F\*  
* **Lógica de Parseo:**  
  1. Cantidad: Primer entero antes de 'x'.  
  2. Nombre: String entre 'x' y el primer paréntesis.  
  3. Set Code: String dentro de los paréntesis.  
  4. Collector Number: Entero después del paréntesis.  
  5. Atributo Foil: Si contiene \*F\*, (F) o Foil.  
* **Manejo de Fallos:** Si el parser encuentra una línea irreconocible, debe almacenarla en un array failed\_imports para mostrar un resumen al usuario ("10 cartas cargadas, 2 errores").

### **3.2 Esquema de Base de Datos (Compounding Architecture)**

\-- Gestión de Inventario Real vs Mercado  
CREATE TABLE inventory (  
  id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
  card\_name TEXT NOT NULL,  
  set\_code TEXT NOT NULL,  
  collector\_number TEXT NOT NULL,  
  is\_foil BOOLEAN DEFAULT FALSE,  
  condition TEXT CHECK (condition IN ('NM', 'LP', 'MP', 'HP', 'D')),  
  stock\_quantity INTEGER DEFAULT 1 CHECK (stock\_quantity \>= 0),  
  store\_price DECIMAL(10, 2), \-- Precio fijado por Geekorium  
  market\_price DECIMAL(10, 2), \-- Precio dinámico de referencia (API)  
  metadata JSONB, \-- Almacena colores de maná y tipos de carta para filtros  
  updated\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);

\-- Registro de Leads y Checkout  
CREATE TABLE orders (  
  id UUID PRIMARY KEY,  
  customer\_name TEXT NOT NULL,  
  id\_number TEXT NOT NULL, \-- Cédula de Identidad  
  whatsapp\_number TEXT NOT NULL,  
  order\_total DECIMAL(10, 2),  
  items JSONB, \-- Array de {name, set, qty, price, foil}  
  status TEXT DEFAULT 'pending\_verification'  
);

## **4\. Lógica de Componentes "Shielded" (React/TS)**

### **4.1 Componente: CardModal (Controlled Flex Pattern)**

El modal debe ser una pieza de ingeniería de precisión para evitar la frustración del usuario en móviles.

* **Header:** Sticky con nombre de la carta y botón de cierre (X) de 44px de radio táctil.  
* **Content:** \- Imagen de la carta: object-contain con Skeleton loader.  
  * Selector de Versiones: Lista scrolleable con altura fija (max-h-\[35vh\]). Cada fila debe indicar claramente si la versión está "En Stock" o "Disponible por encargo".  
* **Action Area:** Botón de "Añadir al Carrito" con feedback táctil (Haptic Feedback) y cambio de estado a "¡Añadido\!".

### **4.2 Componente: ShoppingCart (State Machine)**

El carrito debe manejar el estado de inventario en tiempo real.

* **Validación:** Si un usuario intenta añadir 5 copias de una carta donde solo hay 2 en stock, el botón "+" debe bloquearse visualmente y mostrar un tooltip: "Máximo en stock alcanzado".  
* **Persistencia:** Uso de React Context sincronizado con localStorage. Al cargar la app, se debe verificar si los precios del carrito han cambiado respecto a la DB y notificar al usuario: "Algunos precios han sido actualizados".

## **5\. Especificaciones de Responsive Design (Mobile First)**

Para resolver los problemas detectados de solapamiento y recortes:

1. **Viewport Dynamics:**  
   * La sección Home debe usar min-h-\[100dvh\] para ignorar las barras de navegación dinámicas de navegadores móviles.  
2. **List View List Optimization:**  
   * **Contenedor de Nombre:** Flexbox con min-w-0. El nombre de la carta debe usar line-clamp-2 para nombres como "Asmoranomardicadaistinaculdacar".  
   * **Márgenes de Colisión:** El precio (action-cyan) debe tener un margin-left: auto y un padding-left: 8px para que nunca se solape con el texto central.  
3. **Touch Gestures:**  
   * El detalle de la carta en móviles debe cerrarse mediante el gesto de "Swipe Down" (deslizar hacia abajo), utilizando la librería framer-motion para una sensación nativa.

## **6\. Workflow de Venta Asistida (Checkout Personalizado)**

### **6.1 Pasos del Checkout (Frictionless Lead Gen)**

1. **Identificación:** Formulario simplificado. Se requiere Cédula de Identidad (V/E) para la facturación futura.  
2. **Ubicación:** Dropdown dinámico con los 24 estados de Venezuela. Se elimina la opción de "USA" para evitar confusión en envíos locales.  
3. **Carga de Soporte:** El componente de upload debe permitir capturar fotos directamente desde la cámara del móvil. Los archivos se guardan en el bucket payment-proofs/{order\_id}/.  
4. **WhatsApp Handshake:** Al finalizar, se debe abrir automáticamente una pestaña con un mensaje estructurado:"Hola Geekorium, mi nombre es \[Nombre\]. Acabo de generar la orden \#\[ID\]. Adjunto mi comprobante de pago por \[Monto\]. Espero confirmación de stock."

## **7\. Control de Calidad y Mantenimiento (Compounding Principles)**

### **7.1 Testing y Estabilidad**

* **Unit Test (txt\_parser.test.ts):** Probar el parser con líneas corruptas, nombres con caracteres especiales y cartas sin número de coleccionista.  
* **Integrity Check:** Cada despliegue debe verificar que el bundle size no exceda los límites establecidos para asegurar carga rápida en redes 3G/LTE locales.

### **7.2 Observabilidad**

* Implementar un sistema de logs en el Dashboard de Admin que muestre: "Cartas más buscadas sin stock" para informar decisiones de compra de inventario.

**Firmado para Desarrollo:** Geeko-Engineering Division

**Referencia de Cambios:** PDF "CAMBIOS PÁGINA WEB (1).pdf" (Documentación completa aplicada)