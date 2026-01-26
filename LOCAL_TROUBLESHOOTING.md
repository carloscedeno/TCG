# Documentación de Errores y Soluciones Local (TCG)

Este documento registra los errores encontrados durante el levantamiento del entorno local y sus respectivas soluciones para evitar recurrencias.

## 1. Módulo `pytest` no encontrado

**Error:** Al intentar ejecutar las pruebas con `pytest` o `python -m pytest`, el sistema devuelve un error indicando que el módulo no existe o el comando no es reconocido.
**Causa:** `pytest` y `pytest-asyncio` no estaban instalados en el entorno virtual activo (`.venv`).
**Solución:** Instalar las dependencias de testing en el entorno virtual.

```bash
.venv\Scripts\python.exe -m pip install pytest pytest-asyncio
```

**Prevención:** Asegurarse de que `pyproject.toml` o `requirements.txt` estén actualizados y ejecutar la instalación de dependencias después de clonar o actualizar el repo.

## 2. Inconsistencia en nombres de archivos de prueba

**Error:** Se intentó ejecutar `tests/integration/test_api.py` pero el archivo no existía bajo ese nombre exacto.
**Causa:** Los archivos tenían nombres diferentes como `tests/integration/test_supabase_apis.py` o scripts directos de integridad como `tests/verify_api_integrity.py`.
**Solución:** Verificar la estructura de `tests/` antes de ejecutar comandos automáticos. Se recomienda usar `tests/verify_api_integrity.py` para una validación rápida del estado del servidor.
**Prevención:** Mantener este documento de referencia actualizado con los comandos de verificación correctos.

## 3. Puertos por defecto

**Backend:** `http://localhost:8000`
**Frontend:** `http://localhost:5173/TCG/` (Vite)

## Comandos de Inicio Rápido (Local)

Para levantar todo el entorno:

1. **Backend (Python - Opcional para scrapers locales):**

   ```powershell
   uvicorn src.api.main:app --reload --port 8000
   ```

2. **Backend (Supabase Edge Functions - Estándar):**
   Para automatizar el despliegue y la verificación E2E en un solo paso:

   ```powershell
   .\scripts\deploy_api.ps1 -AccessToken "tu_token_aqui"
   ```

   *Este script desplegará la función y automáticamente ejecutará `tests/verify_supabase_functions.py` para asegurar que todo esté OK.*

3. **Frontend:**

   ```powershell
   cd frontend
   npm run dev
   ```

4. **Verificación:**

   ```powershell
   .venv\Scripts\python.exe tests/verify_api_integrity.py
   ```

## Notas sobre Supabase Edge Functions

- El frontend está configurado para apuntar a la URL de la función en la nube por defecto.
- Las variables de entorno `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` son inyectadas automáticamente por Supabase en el entorno de la función.
