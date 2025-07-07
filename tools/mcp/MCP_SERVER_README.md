# MTG Documentation MCP Server

Este servidor MCP (Model Context Protocol) expone toda la documentación del proyecto MTG TCG Web App, permitiendo que los LLMs accedan a información técnica completa sobre la arquitectura, base de datos, APIs y especificaciones del proyecto.

## 🚀 Características

### **Documentación Expuesta**
- **Requisitos del proyecto** y especificaciones iniciales
- **Arquitectura del sistema** (Supabase, Edge Functions, React)
- **Esquema de base de datos** completo con diccionario de datos
- **Documentación de APIs** y endpoints
- **Guías de configuración** y deployment
- **Estructuras de cartas** para múltiples TCGs (MTG, Pokémon, Yu-Gi-Oh!, etc.)
- **Mejoras implementadas** y progreso del desarrollo

### **Herramientas Disponibles**

#### **1. get_project_overview**
Obtiene una visión general del proyecto incluyendo:
- Requisitos iniciales
- Mejoras implementadas
- Resumen del sistema

#### **2. get_architecture_info**
Información detallada sobre:
- Arquitectura del sistema
- Configuración de Supabase
- Edge Functions
- Diseño de la base de datos

#### **3. get_database_schema**
Esquema completo de la base de datos:
- Diccionario de datos
- Relaciones entre tablas
- Migraciones y seeds
- Índices y triggers

#### **4. get_api_documentation**
Documentación de APIs:
- Endpoints disponibles
- Edge Functions
- Integración con Supabase
- Ejemplos de uso

#### **5. get_environment_setup**
Configuración del entorno:
- Instrucciones de setup
- Variables de entorno
- Deployment
- Configuración de desarrollo

#### **6. get_tcg_structures**
Estructuras de cartas para diferentes TCGs:
- MTG (Magic: The Gathering)
- Pokémon
- Yu-Gi-Oh!
- Lorcana
- One Piece
- Flesh and Blood
- Wixoss

#### **7. get_development_guidelines**
Guías de desarrollo:
- Testing procedures
- Best practices
- Workflow de desarrollo
- Code standards

#### **8. search_documentation**
Búsqueda avanzada en toda la documentación:
- Búsqueda por categorías
- Palabras clave
- Conceptos técnicos específicos

## 📦 Instalación

### **Requisitos**
- Python 3.8+
- pip

### **Setup Automático**
```bash
python setup_mcp_server.py
```

### **Setup Manual**
```bash
# Instalar dependencias
pip install mcp>=1.0.0

# Crear configuración
mkdir -p ~/.mcp
```

## ⚙️ Configuración

### **Archivo de Configuración**
Crear `~/.mcp/config.json`:

```json
{
  "mcpServers": {
    "mtg-docs": {
      "command": "python",
      "args": ["/path/to/mcp_server.py"],
      "env": {
        "PYTHONPATH": "/path/to/project"
      }
    }
  }
}
```

### **Variables de Entorno**
- `PYTHONPATH`: Ruta al directorio del proyecto
- `MCP_LOG_LEVEL`: Nivel de logging (INFO, DEBUG, etc.)

## 🔧 Uso

### **Con MCP Clients**

#### **Claude Desktop**
1. Abrir Claude Desktop
2. Ir a Settings > Model Context Protocol
3. Añadir el servidor `mtg-docs`
4. Usar las herramientas disponibles

#### **Otros Clients**
```bash
# Ejemplo con curl
curl -X POST http://localhost:8000/tools/get_project_overview \
  -H "Content-Type: application/json" \
  -d '{}'
```

### **Ejemplos de Uso**

#### **Obtener Overview del Proyecto**
```
Tool: get_project_overview
Input: {}
```

#### **Buscar en Documentación**
```
Tool: search_documentation
Input: {
  "query": "supabase edge functions",
  "category": "api"
}
```

#### **Obtener Estructura de MTG**
```
Tool: get_tcg_structures
Input: {
  "tcg_type": "MTG"
}
```

## 📁 Estructura de Archivos

```
TCG Web App/
├── mcp_server.py              # Servidor MCP principal
├── setup_mcp_server.py        # Script de instalación
├── mcp_config.json           # Configuración MCP
├── MCP_SERVER_README.md      # Esta documentación
└── Documentación/            # Documentación expuesta
    ├── Requisitos iniciales.txt
    ├── Mejoras_Implementadas.md
    ├── TechDocs/
    │   ├── architecture.md
    │   ├── data-dictionary.md
    │   ├── environment-setup.md
    │   ├── apis/
    │   ├── database/
    │   └── development/
    └── Estructura Detallada Cartas *.txt
```

## 🛠️ Desarrollo

### **Añadir Nueva Documentación**
1. Colocar archivos en `Documentación/`
2. Actualizar `list_resources()` en `mcp_server.py`
3. Añadir herramientas específicas si es necesario

### **Añadir Nuevas Herramientas**
1. Definir en `list_tools()`
2. Implementar en `call_tool()`
3. Documentar en este README

### **Testing**
```bash
# Test básico
python -c "import mcp_server; print('Server imports successfully')"

# Test con datos de ejemplo
python test_mcp_server.py
```

## 🔍 Troubleshooting

### **Problemas Comunes**

#### **Error: Module not found**
```bash
pip install mcp>=1.0.0
export PYTHONPATH=/path/to/project
```

#### **Error: Permission denied**
```bash
chmod +x mcp_server.py
chmod +x setup_mcp_server.py
```

#### **Error: Config not found**
```bash
mkdir -p ~/.mcp
cp mcp_config.json ~/.mcp/config.json
```

### **Logs**
```bash
# Habilitar debug logging
export MCP_LOG_LEVEL=DEBUG
python mcp_server.py
```

## 📊 Métricas

- **Documentos expuestos**: 15+ archivos
- **Herramientas disponibles**: 8 herramientas
- **Categorías de búsqueda**: 7 categorías
- **TCGs soportados**: 7 juegos diferentes

## 🤝 Contribución

Para contribuir al MCP server:

1. Fork el proyecto
2. Crear feature branch
3. Implementar cambios
4. Añadir tests
5. Actualizar documentación
6. Crear Pull Request

## 📄 Licencia

Este MCP server es parte del proyecto MTG TCG Web App y sigue la misma licencia del proyecto principal.

## 🆘 Soporte

Para soporte técnico:
- Revisar logs del servidor
- Verificar configuración MCP
- Consultar documentación del proyecto
- Abrir issue en el repositorio 