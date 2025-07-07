# MCP Server para MTG TCG Web App

Este servidor MCP expone toda la documentación técnica, arquitectura y especificaciones del proyecto, así como herramientas para consultar el estado de calidad y pruebas automáticas.

## Herramientas disponibles

- `get_project_overview`: Resumen de la estructura y componentes principales del proyecto.
- `get_architecture_info`: Información detallada de la arquitectura, Supabase, Edge Functions y base de datos.
- `get_database_schema`: Esquema completo de la base de datos y diccionario de datos.
- `get_api_documentation`: Documentación de APIs, endpoints y funciones Edge.
- `get_environment_setup`: Instrucciones de setup, configuración y despliegue.
- `get_test_status`: **Nuevo**. Consulta el estado de las pruebas automáticas (unitarias e integración), incluyendo número de tests pasados/fallidos y salida resumida.
- `get_test_coverage`: **Nuevo**. Consulta el porcentaje de cobertura de código de los tests, global y por módulo.

## Ejemplo de uso

### Consultar estado de pruebas
```json
{
  "tool": "get_test_status",
  "input": {}
}
```
**Respuesta:**
```
Test status: 22 passed, 0 failed, 22 total.

Output:
=========================================== test session starts ===========================================
platform win32 -- Python 3.12.6, pytest-8.4.1, pluggy-1.6.0
...
```

### Consultar cobertura de código
```json
{
  "tool": "get_test_coverage",
  "input": {}
}
```
**Respuesta:**
```
Coverage summary: TOTAL   1234   56   95%

Output:
Name                        Stmts   Miss  Cover
---------------------------------------------
src/core/xyz.py                50      0   100%
src/api/abc.py                 80      5    94%
...
```

## Notas
- El MCP server ejecuta los tests y cobertura en tiempo real, mostrando el estado más reciente.
- Si necesitas agregar nuevas herramientas o endpoints, edita `mcp_server.py` y sigue el patrón de las funciones decoradas.
- Para más detalles sobre la estructura del proyecto y la integración de pruebas, consulta la documentación técnica expuesta por el propio MCP. 