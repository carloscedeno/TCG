# Plan de Implementación: Autocompletado en Búsqueda

## Objetivo

Mejorar la experiencia de usuario en la barra de búsqueda principal añadiendo sugerencias de autocompletado en tiempo real mientras el usuario escribe el nombre de una carta.

## 1. Backend (Base de Datos)

Crear una función RPC eficiente para buscar nombres de cartas.

- **Función SQL**: `search_card_names(query_text, limit_count)`
- **Lógica**: Buscar en la tabla `cards` donde `card_name` empiece con el texto ingresado (o contenga, según preferencia, pero "empiece con" es más rápido para autocompletar).
- **Retorno**: Lista de nombres únicos (`DISTINCT`).

## 2. Frontend (Cliente API)

Actualizar `frontend/src/utils/api.ts`.

- **Nuevo método**: `searchCardNames(query: string): Promise<string[]>`
- **Implementación**: Llamada directa a `supabase.rpc('search_card_names', { ... })`.

## 3. Componente UI (`SearchBar.tsx`)

Transformar el componente actual para soportar el dropdown.

- **Estado**:
  - `suggestions`: Array de strings.
  - `showSuggestions`: Booleano para mostrar/ocultar.
- **Lógica**:
  - Al escribir (`onChange`), si el texto > 2 caracteres, llamar a `searchCardNames`.
  - Debounce de ~300ms para no saturar la API.
  - Al hacer clic en una sugerencia, actualizar el `value` del input y cerrar sugerencias.
  - Cerrar sugerencias al hacer clic fuera (click outside listener o blur con delay).
- **Estilos (Tailwind)**:
  - Contenedor absoluto debajo del input.
  - Fondo oscuro semi-transparente (`bg-neutral-900/90`, `backdrop-blur`).
  - Items con hover (`hover:bg-neutral-800`).
  - Borde sutil y sombra (`shadow-xl`).

## Pasos de Ejecución

1. **Crear RPC en SQL**: Crear la función en BD.
2. **Actualizar API Frontend**: Añadir la función en `api.ts`.
3. **Refactorizar SearchBar**: Implementar la lógica y UI del dropdown.
4. **Probar**: Verificar que al escribir aparezcan nombres y al seleccionar se filtre.

## Criterios de Aceptación

### Funcionalidad

- [x] **Activación**: Las sugerencias deben aparecer solo después de escribir 2 o más caracteres.
- [x] **Precisión**: La lista debe mostrar nombres de cartas que coincidan con el texto ingresado.
- [x] **Selección**: Al hacer clic en una sugerencia, el texto del input debe actualizarse y las sugerencias deben desaparecer.
- [x] **Busqueda Automática**: Al seleccionar una sugerencia, se debe disparar automáticamente la búsqueda (o al menos actualizar el estado para que el usuario pueda buscar).

### UI/UX

- [x] **Estilo**: El dropdown debe tener un fondo oscuro semi-transparente (glassmorphism) acorde al diseño actual.
- [x] **Feedback**: Debe haber un indicador visual (hover) al pasar el mouse por las opciones.
- [x] **Cierre**: El menú de sugerencias debe cerrarse automáticamente al hacer clic fuera del componente o presionar ESC.

### Rendimiento

- [x] **Debounce**: No se deben realizar llamadas a la API por cada tecla pulsada; debe haber un retraso (aprox. 300ms).
- [x] **Velocidad**: Las sugerencias deben cargar en menos de 500ms en condiciones normales.
