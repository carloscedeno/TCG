# PRD: Indicador de Progreso Visual para Importaciones Masivas

## 1. Contexto y Justificación

Actualmente, las importaciones de inventario se procesan en bloques de 500 ítems para optimizar el rendimiento y evitar "timeouts" (Error 546). Aunque el sistema es robusto por detrás, el usuario solo recibe un mensaje estático de "Procesando...". Para archivos grandes, esto crea incertidumbre sobre si el proceso sigue activo.

## 2. Objetivos

- Proporcionar retroalimentación visual en tiempo real durante la importación.
- Reflejar el avance basado en los lotes (chunks) procesados.
- Mantener la estética premium y "tech-focused" del Geekorium.

## 3. Requerimientos Funcionales

### A. Barra de Progreso Dinámica

- **Cálculo de Progreso**: El porcentaje se calculará como `(loteActual / totalLotes) * 100`.
- **Actualización Reactiva**: La barra debe avanzar inmediatamente después de recibir la respuesta exitosa de cada lote desde el backend.

### B. Etiquetas de Estado

- Mostrar el conteo actual de ítems procesados vs. el total (ej. "Importando 1,500 de 3,200 ítems...").
- Indicar el número de lote actual (ej. "Procesando Bloque 3 de 7").

### C. Estado de "Espera Activa"

- Mientras un lote está en tránsito, la barra debe mostrar una animación de pulso o brillo para indicar actividad.

## 4. Diseño Visual (UI/UX)

- **Estilo**: Glassmorphism (fondo translúcido, bordes suaves).
- **Color**: `geeko-cyan` (#00E5FF) con `drop-shadow` de resplandor.
- **Transiciones**: Animación suave de la anchura (`duration-500`) para evitar saltos bruscos.
- **Ubicación**: Reemplazará al botón "Confirmar Importación" mientras el `loading` sea `true`.

## 5. Especificaciones Técnicas

- **Frontend**:
  - Estados adicionales: `currentBatch`, `totalBatches`, `processedItems`.
  - Componente `ProgressBar` reutilizable o integrado en `BulkImport.tsx`.
- **Lógica de Batching**: Mantener el `CHUNK_SIZE = 500` ya implementado, pero inyectar las actualizaciones de estado en el bucle principal.

## 6. Criterios de Aceptación

1. Al iniciar la importación de un archivo de 2,000 líneas, la barra debe mostrar 4 segmentos (lotes).
2. La barra debe llenarse de 25% en 25% (aprox) conforme lleguen las respuestas del servidor.
3. El conteo de "Cartas importadas" debe actualizarse en tiempo real.
4. Al llegar al 100%, se debe mostrar automáticamente la tarjeta de éxito final.

## 7. Estado de Implementación (✅ 100% Completado)

- [x] **Barra Dinámica**: Implementada con animaciones `geeko-cyan` y efectos `shimmer`.
- [x] **Etiquetas de Estado**: Soportan conteo de ítems y bloques en tiempo real.
- [x] **Diseño Visual**: Glassmorphism aplicado con `backdrop-blur` y sombras decorativas.
- [x] **Lógica de Sincronización**: Integrada en el bucle de batching de `BulkImport.tsx`.

---
*Documento actualizado el 2026-02-12*
