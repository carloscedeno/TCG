# Reglas de Diseño Responsivo (Geekorium)

Para evitar regresiones en la experiencia de usuario (UX) y fallos visuales en dispositivos móviles, se deben seguir estas reglas estrictamente:

## 1. Regla del Botón Intocable

- **Problema**: Los botones con texto largo (`Add to Cart`, `Buy @ CardKingdom`) se cortan si intentan compartir espacio horizontal en contenedores estrechos.
- **Regla**: NUNCA usar layouts de fila (`flex-row`) para botones de acción principal en áreas que puedan medir menos de 400px.
- **Solución**: Usar `flex-col` con `w-full` por defecto y solo permitir `flex-row` en breakpoints `xl` o superiores.

## 2. Gestión de Z-Index

- **Z-[200]**: Modales de detalle (CardModal).
- **Z-[150]**: Drawers laterales (CartDrawer).
- **Z-[100]**: Dropdowns y menús flotantes.
- **Z-[50]**: Sticky Header.

## 3. Jerarquía Visual en Móvil

- **Prioridad Horizontal**: En dispositivos móviles, si una lista (ej. Versiones de cartas) ocupa mucho espacio vertical, debe colapsarse o convertirse en un scroll horizontal (`overflow-x-auto`) para permitir que la información principal del producto fluya hacia arriba.
- **Zonas de Impacto**: Todo botón interactivo en móvil debe tener una altura mínima de `h-12` (idealmente `h-14`) y padding lateral generoso.

## 4. Legality Indicators

- No usar iconos (`Check`, `X`) para indicar legalidad si se muestran más de 4 formatos simultáneamente.
- Usar **cajas de color** (Background & Border) para una identificación periférica rápida por parte del usuario.
