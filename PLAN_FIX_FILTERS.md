# Plan de Corrección de Filtros y Ordenamiento

## Diagnóstico

Los filtros de ordenamiento no están funcionando porque:

1. **Fallo de Despliegue**: El despliegue de la Edge Function (`tcg-api`) está fallando con "Bundle generation timed out". Esto significa que el código que procesa y pasa los parámetros de ordenamiento (y devuelve el campo `cmc`) NO se ha actualizado en el servidor.
2. **Ordenamiento en Base de Datos**: A pesar de que la lógica SQL se actualizó, parece que el parámetro `sort` no está llegando correctamente o los datos de `cmc` no se están interpretando como se espera (posibles valores nulos o 0).

## Pasos a Seguir

### 1. Corregir el Despliegue de la Edge Function (Prioridad Alta)

El error "Bundle generation timed out" sugiere problemas con las dependencias o la red al empaquetar con Deno.

- **Acción**: Optimizar `import_map.json` y los imports en `index.ts`.
- **Acción**: Intentar desplegar usando una conexión más estable o verificando el estado de Docker/Deno local.
- **Alternativa**: Si el deploy sigue fallando, considerar simplificar la función temporalmente para lograr un deploy exitoso.

### 2. Verificar Datos de `cmc` en Base de Datos

Es posible que la columna `cmc` tenga valores nulos o incorrectos para muchas cartas, lo que hace que el ordenamiento por Maná parezca no funcionar.

- **Acción**: Ejecutar script SQL para auditar valores de `cmc`.

  ```sql
  SELECT card_name, cmc FROM cards WHERE card_name IN ('Disintegrate', 'Celestine Reef');
  ```

### 3. Depuración de la Función SQL

Si el deploy funciona pero el orden sigue mal:

- **Acción**: Añadir logs (`RAISE NOTICE`) en la función PL/PGSQL para ver qué valor de `sort_by` está recibiendo realmente.
- **Acción**: Forzar un ordenamiento por defecto explicito si `sort_by` es inválido.

### 4. Validación Frontend

- **Acción**: Verificar en la consola del navegador (Network) que el parámetro `sort` se envía correctamente (ej. `sort=mana_asc`). (Ya verificado en código, falta ver en vivo).

## Ejecución Inmediata

Intentaré diagnosticar la data de `cmc` ahora mismo y luego reintentar el despliegue con una configuración mínima.
