# PRD de Corrección de Responsividad del Card Detail Modal

## 1. Introducción

Actualmente, el modal de detalle de la carta (`CardModal.tsx`) presenta múltiples fallos en dispositivos móviles y pantallas pequeñas. La distribución no es óptima, existen scrollbars innecesarios y la experiencia de usuario (UX) se siente "rota".

## 2. Objetivos

- Corregir el diseño responsivo del modal de detalle.
- Optimizar la distribución de elementos (Imagen, Versiones, Texto, Botones).
- Eliminar scrolls redundantes o innecesarios.
- Asegurar que la imagen de la carta escale correctamente sin perder calidad ni proporciones.
- Mejorar la visualización y usabilidad de la lista de ediciones.

## 3. Problemas Identificados (Basado en feedback del usuario)

### A. Distribución del Modal

- **Problema**: El modal en móvil ocupa toda la pantalla pero la distribución de los componentes (Imagen arriba, Texto abajo) hace que sea difícil navegar.
- **Solución**: Refinar el breakpoint de `flex-col` a `flex-row`. Ajustar el padding y margen para maximizar el espacio útil en móviles.

### B. Imagen de la Carta

- **Problema**: La imagen tiene una altura mínima (`min-h-[450px]`) que es excesiva para algunos teléfonos, desplazando el resto de la información.
- **Solución**: Usar `aspect-ratio` o alturas relativas al viewport (`vh`) para asegurar que la imagen quepa cómodamente junto con una parte de la información.

### C. Lista de Ediciones (Versions)

- **Problema**: Actualmente tiene un alto fijo (`h-[200px]`) que consume mucho espacio vertical o es insuficiente para muchas versiones.
- **Solución**: Convertir la lista de ediciones en una sección colapsable o un carrusel horizontal en versiones móviles, o integrarla mejor en el flujo de scroll principal.

### D. Botones y Llamadas a la Acción (CTA)

- **Problema**: Los botones de "Add to Cart" y "External Market" se ven amontonados o demasiado grandes en pantallas pequeñas.
- **Solución**: Ajustar el layout de la sección "Marketplace" para que use `flex-col` en móvil y `flex-row` solo cuando haya espacio suficiente. Unificar alturas de botones.

### E. Scrollbars Innecesarios

- **Problema**: El modal tiene scroll interno que a veces choca con el scroll de la página o genera barras dobles.
- **Solución**: Asegurar que `overflow-hidden` esté correctamente aplicado al body cuando el modal esté abierto y que el modal gestione su propio scroll de manera fluida.

## 4. Requerimientos Técnicos

### UI/UX (CSS/Tailwind)

- **Media Queries**: Revisar y ajustar los breakpoints (`sm`, `md`, `lg`).
- **Flex/Grid**: Optimizar el uso de `grid-cols-1 md:grid-cols-2` para asegurar transiciones suaves.
- **Heights**: Reemplazar alturas fijas (`h-240px`) por `max-h` y `flex-1` donde sea posible.
- **Z-Index**: Verificar que el modal siempre esté por encima de cualquier otro elemento.

### Componentes (React)

- **CardModal.tsx**: Refactorizar la estructura JSX para separar mejor el bloque de imagen+versiones del bloque de metadatos.

## 5. Plan de Acción

1. **Fase 1**: Refactorizar la estructura de `CardModal.tsx` para mejorar la jerarquía visual en móvil.
2. **Fase 2**: Ajustar los estilos de la imagen para que sea flexible.
3. **Fase 3**: Rediseñar la sección de "Marketplace" y "Legality" para que sea compacta en móviles.
4. **Fase 4**: Validación visual en diferentes tamaños de pantalla (Mobile, Tablet, Desktop).

## 6. Resultados Finales e Implementación

1. **Layout Reestructurado**: Sección de legalidad movida al tope (ancho completo) y acciones de precio movidas debajo en cajas "Side-by-Side".
2. **Prevención de Truncamiento**: Se eliminó el layout horizontal forzado en áreas críticas de botones. Se usa `flex-col` con botones al 100% de ancho en contenedores estrechos.
3. **Código de Colores p/ Legalidad**: Sustitución de iconos por cajas de color (Verde = Legal, Gris = No Legal) para una carga cognitiva menor.
4. **Z-Index**: Fijado en `200` para dominar la interfaz.
5. **Scroll Unificado**: En móviles, el modal se desplaza como un todo, eliminando scrolls internos anidados.

## 7. Reglas para el Futuro (Design System)

- **Regla del Botón Intocable**: NUNCA usar layouts horizontales (`flex-row`) para botones con texto largo (`Add to Cart`, `Buy @ ...`) en contenedores que puedan medir menos de 400px de ancho. Preferir siempre `flex-col` con `w-full`.
- **Z-Index Unificado**: Modales de primer nivel deben usar `z-[200]`. Drawers y menús `z-[150]`.
- **Responsive-First Headers**: Títulos de modales deben usar `text-balance` y escalas dinámicas de fuente para evitar el "Layout Shift" en nombres largos.
