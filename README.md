# TCG Web App

Sistema completo de APIs para Trading Card Games con funcionalidades avanzadas de precios, colecciones y análisis.

## Características

- **Múltiples TCGs**: MTG, Pokémon, Lorcana, FAB, Yu-Gi-Oh!, Wixoss, One Piece
- **APIs RESTful**: Endpoints completos para todas las operaciones
- **Sistema de Scraping**: Obtención automática de precios de marketplaces
- **Base de Datos Optimizada**: Esquema flexible y escalable
- **Autenticación**: Sistema de usuarios y colecciones personales
- **Documentación Completa**: Guías y ejemplos de uso

## Arquitectura

```
TCG Web App/
├── backend/          # APIs y servicios
├── scraper/          # Sistema de scraping
├── data_loader/      # Carga de datos externos
├── frontend/         # Interfaz de usuario (futuro)
├── docs/            # Documentación
└── scripts/         # Scripts de utilidad
```

## Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd TCG-Web-App
   ```

2. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales de Supabase
   ```

3. **Instalar dependencias**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar base de datos**
   ```bash
   python scripts/setup.py
   ```

5. **Ejecutar pruebas**
   ```bash
   python scripts/test.py
   ```

## Documentación

- [Guía de APIs](docs/api/README.md)
- [Diseño de Base de Datos](docs/database/schema.md)
- [Configuración](docs/deployment/setup.md)
- [Arquitectura](docs/architecture/overview.md)

## Uso

### APIs
```python
from backend.supabase.client import TCGDatabaseAPI

api = TCGDatabaseAPI()
results = api.search_cards_with_prices('Black Lotus', 'MTG', 10)
```

### Scraper
```bash
python scraper/main.py
```

### Data Loader
```bash
python data_loader/main.py
```

## Testing

```bash
# Pruebas unitarias
pytest tests/unit/

# Pruebas de integración
pytest tests/integration/

# Todas las pruebas
pytest tests/
```

## Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Soporte

Para soporte, email: support@tcgwebapp.com o abre un issue en GitHub.
