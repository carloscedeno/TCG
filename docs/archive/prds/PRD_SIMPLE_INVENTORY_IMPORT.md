# PRD: Sincronización Simple de Inventario (Bulk Import)

## 1. Objetivo

Permitir al administrador cargar un archivo simple (TXT) con cartas y cantidades, y que el sistema **sume** estas cantidades al inventario (`stock`) existente o cree nuevas entradas si no existen.

**Principio Clave:** "Si la carta existe, suma. Si no existe, créala."

## 2. Flujo del Usuario

1. **Carga**: El administrador arrastra un archivo (ej. `importTestFile.txt`) en la pantalla de "Sincronizar Inventario".
2. **Validación Visual**: El sistema muestra una tabla de vista previa con las cartas detectadas y sus cantidades.
3. **Confirmación**: Al hacer clic en "Importar", el sistema procesa los datos.
4. **Resultado**: El inventario refleja inmediatamente el nuevo stock.

## 3. Lógica de Negocio (Backend)

### A. Mapeo de Datos

El sistema debe extraer los siguientes datos mínimos de cada fila del archivo:

* **Nombre** (`Card Name`): Para identificar la carta.
* **Cantidad** (`Quantity`): Número de copias a agregar.
* **Set** (`Set Code`): Opcional pero recomendado para precisión.
* **Condición** (`Condition`): Opcional, por defecto "NM" (Near Mint).

### B. Lógica de "UPSERT" (Actualización/Inserción)

Para cada fila del archivo importado:

1. **Buscar Producto Existente**:
    * El sistema busca en la tabla `products` si ya existe una entrada con el mismo `printing_id` (identificación única de la carta + set) y `condition`.

2. **Acción Condicional**:
    * **CASO 1: YA EXISTE**
        * `Nuevo Stock = Stock Actual en DB + Cantidad Importada`
        * El precio **no** se toca (a menos que sea 0 en DB y el archivo traiga precio).
    * **CASO 2: NO EXISTE (Nuevo Producto)**
        * Se crea una nueva fila en `products`.
        * `Stock = Cantidad Importada`.
        * Se rellenan los datos de la carta (Imagen, Rareza, Nombre, Juego) desde la base de datos maestra (`card_printings`).

### C. Manejo de Errores

* Si una carta no se encuentra en la base de datos maestra (`card_printings`), se debe reportar como error ("Carta no encontrada") y no bloquear el resto de la importación.
* Si el token de sesión es inválido (Error 401), el frontend debe redirigir al login o renovar el token automáticamente, no mostrar un error genérico.

## 4. Requerimientos Técnicos

* **Endpoint**: `POST /api/collections/import?import_type=inventory`
* **Tabla Destino**: `public.products`
* **Permisos**: Solo usuarios con rol `admin`.

## 5. Criterios de Aceptación

1. Cargar el archivo `importTestFile.txt` con 1 copia de "Court of Locthwain".
2. Si antes tenía 0, ahora debe tener 1.
3. Si vuelvo a cargar el mismo archivo, ahora debe tener 2.
4. Verificar visualmente en la página de Inventario (`/admin/inventory`) que el número ha subido.
