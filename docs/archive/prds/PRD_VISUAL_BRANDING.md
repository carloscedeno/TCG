# PRD - Mejoras Visuales y Marca "El Emporio"

**Estado:** En Definición  
**Fecha:** 2026-02-13  
**Fuente:** Instagram (@geekorium), `docs/logos`, `docs/pdf_content.txt`

## 1. Visión Estética

Transformar la interfaz actual en un **"Emporio Mágico"** de cartas coleccionables. La estética debe ser consona con el Instagram de Geekorium: una mezcla de **alta fantasía medieval** (pergaminos, sellos de lacre, tipografía elegante) con un acabado **premium y moderno** (glassmorphism, brillos mágicos, animaciones sutiles).

## 2. Sistema de Diseño (UI/UX)

### 2.1. Paleta de Colores "Geeko-Magic"

| Color | Hex | Función |
| :--- | :--- | :--- |
| **Indigo Imperial** | `#0a0a0a` / `#16162a` | Fondos profundos, Header (95% opacidad). |
| **Oro Reliquia** | `#FCAF45` | Iconos principales, bordes de realce, estados activos. |
| **Cian de Mana** | `#00E5FF` | Botones de acción (CTA), realces de "En Stock", links. |
| **Púrpura Lacre** | `#4a1d5a` | Fondos de sellos, indicadores de categoría. |
| **Pergamino** | `#f4e4bc` | Fondos de secciones informativas o modales (texturizado). |

### 2.2. Tipografía

* **Títulos (H1, H2, Cards):** `Bogue` (o Serif premium similar si no está disponible, e.g., 'Cinzel' o 'Playfair Display').
* **Cuerpo y Datos:** `Rubik` (Sans-serif moderno y legible).

## 3. Componentes de Marca

### 3.1. Logo y Favicon

* **Logo Principal:** Usar `docs/logos/Logo.jpg` (Círculo 'O' con diamante amarillo).
* **Favicon:** Versión simplificada del diamante central del logo.
* **Nombre:** "El Emporio" (con "Geekorium" como subtítulo discreto).

### 3.2. Iconografía "Wax Seal"

Reemplazar iconos estándar en secciones clave por los sellos en `docs/logos/`:

* **Stock Geekorium / Inventario:** `Emporio.jpg` (Puerta).
* **Comunidad / Perfil:** `Geekomunidad.jpg` (Personas).
* **Misiones / Instrucciones:** `Misiones.jpg` (Pergamino).
* **Puntos / Moneda:** `Nisperitas.jpg` (Gema).

## 4. Funcionalidades Visuales Específicas

### 4.1. Precios "Antes y Ahora"

* En el `CardModal` y `CardGrid` (cuando aplique), mostrar el precio anterior tachado si hay una oferta o ajuste manual de "GK Price".
* Etiquetar claramente: **Market price** vs **GK price**.

### 4.2. Landing de Instrucciones (Cómo Comprar)

* Sección en la Home explicando el proceso de compra guiada por WhatsApp.
* Uso de fondo estilo pergamino para esta sección específica.

### 4.3. Redes Sociales y Contacto

* **WhatsApp Principal:** `wa.me/584128042832`
* **WhatsApp Singles:** `wa.me/584242507802`
* **Instagram:** `instagram.com/geekorium/`
* **TikTok:** `tiktok.com/@geekorium`
* **Facebook:** `facebook.com/profile.php?id=61573984506104`
* **YouTube:** `youtube.com/@Geekorium`
* **Twitch:** `twitch.tv/geekorium`

## 5. Criterios de Aceptación

1. El Header muestra el nuevo nombre y logo de "El Emporio".
2. El esquema de colores en la web coincide con la paleta de Instagram.
3. Los iconos de "sellos de lacre" están presentes en la navegación y pestañas principales.
4. El Footer contiene todos los enlaces y números de contacto reales.
5. La tipografía es consistente con el manual de diseño.
