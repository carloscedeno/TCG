#!/usr/bin/env python3
"""
Script para reorganizar el proyecto TCG Web App según la nueva estructura de carpetas
"""

import os
import shutil
from pathlib import Path
import sys

class ProjectReorganizer:
    def __init__(self):
        self.root_dir = Path.cwd()
        self.scraper_dir = self.root_dir / "scraper"
        
    def create_directory_structure(self):
        """Crear la nueva estructura de directorios"""
        print("🏗️ Creando nueva estructura de directorios...")
        
        # Estructura principal
        directories = [
            "backend",
            "backend/config",
            "backend/database",
            "backend/database/models",
            "backend/database/migrations",
            "backend/database/seeds",
            "backend/api",
            "backend/api/routes",
            "backend/api/middleware",
            "backend/api/utils",
            "backend/services",
            "backend/supabase",
            "backend/supabase/functions",
            "backend/supabase/functions/tcg-api",
            "backend/supabase/functions/tcg-api/supabase",
            
            "scraper/config",
            "scraper/scrapers",
            "scraper/data",
            "scraper/utils",
            "scraper/tests",
            
            "data_loader",
            "data_loader/config",
            "data_loader/loaders",
            
            "frontend",
            "frontend/public",
            "frontend/src",
            
            "docs",
            "docs/api",
            "docs/database",
            "docs/deployment",
            "docs/architecture",
            
            "scripts",
            "tests",
            "tests/unit",
            "tests/integration",
            "tests/e2e",
            
            "logs",
            "logs/scraper",
            "logs/api",
            "logs/database"
        ]
        
        for directory in directories:
            dir_path = self.root_dir / directory
            dir_path.mkdir(parents=True, exist_ok=True)
            print(f"✅ Creado: {directory}")
    
    def create_init_files(self):
        """Crear archivos __init__.py en todos los directorios Python"""
        print("\n📦 Creando archivos __init__.py...")
        
        python_dirs = [
            "backend",
            "backend/config",
            "backend/database",
            "backend/database/models",
            "backend/api",
            "backend/api/routes",
            "backend/api/middleware",
            "backend/api/utils",
            "backend/services",
            "backend/supabase",
            "scraper",
            "scraper/config",
            "scraper/scrapers",
            "scraper/data",
            "scraper/utils",
            "scraper/tests",
            "data_loader",
            "data_loader/config",
            "data_loader/loaders",
            "tests",
            "tests/unit",
            "tests/integration",
            "tests/e2e"
        ]
        
        for directory in python_dirs:
            init_file = self.root_dir / directory / "__init__.py"
            if not init_file.exists():
                init_file.touch()
                print(f"✅ Creado: {directory}/__init__.py")
    
    def move_scraper_files(self):
        """Mover archivos del scraper a la nueva estructura"""
        print("\n📁 Moviendo archivos del scraper...")
        
        # Mapeo de archivos actuales a nueva ubicación
        file_mapping = {
            # Configuración
            "supabase_setup.py": "backend/supabase/setup.py",
            "supabase_apis.py": "backend/supabase/client.py",
            "supabase_edge_functions.py": "backend/supabase/functions/tcg-api/index.ts",
            "test_supabase_connection.py": "scripts/test_connection.py",
            "setup_complete_system.py": "scripts/setup.py",
            
            # Scrapers
            "scrapers/cardmarket.py": "scraper/scrapers/cardmarket.py",
            "scrapers/tcgplayer.py": "scraper/scrapers/tcgplayer.py",
            "scrapers/cardkingdom.py": "scraper/scrapers/cardkingdom.py",
            "scrapers/trollandtoad.py": "scraper/scrapers/trollandtoad.py",
            
            # Gestión de datos
            "data_manager.py": "scraper/data/manager.py",
            "models.py": "scraper/data/models.py",
            
            # Utilidades
            "anti_bot_manager.py": "scraper/utils/anti_bot.py",
            "utils.py": "scraper/utils/common.py",
            
            # Tests
            "test_supabase_apis.py": "tests/integration/test_supabase_apis.py",
            "test_advanced_features.py": "tests/unit/test_advanced_features.py",
            "test_marketplace_mapping.py": "tests/unit/test_marketplace_mapping.py",
            "test_real_scraping.py": "tests/integration/test_real_scraping.py",
            
            # Data loader
            "tcg_data_loader.py": "data_loader/main.py",
            
            # Documentación
            "SUPABASE_APIS_SUMMARY.md": "docs/api/supabase_apis.md",
            "SCRAPING_SUMMARY.md": "docs/architecture/scraping_summary.md",
            "README.md": "scraper/README.md"
        }
        
        for old_path, new_path in file_mapping.items():
            old_file = self.scraper_dir / old_path
            new_file = self.root_dir / new_path
            
            if old_file.exists():
                # Crear directorio padre si no existe
                new_file.parent.mkdir(parents=True, exist_ok=True)
                
                # Mover archivo
                shutil.move(str(old_file), str(new_file))
                print(f"✅ Movido: {old_path} → {new_path}")
            else:
                print(f"⚠️ No encontrado: {old_path}")
    
    def create_configuration_files(self):
        """Crear archivos de configuración"""
        print("\n⚙️ Creando archivos de configuración...")
        
        # requirements.txt en la raíz
        requirements_content = """# Dependencias del proyecto TCG Web App

# Backend
supabase==2.16.0
python-dotenv==1.1.1
pydantic==2.11.7

# Scraper
requests==2.32.4
beautifulsoup4==4.13.4
lxml==6.0.0
aiohttp==3.9.0
pandas==2.3.0
numpy==2.3.1

# Testing
pytest==8.4.1
pytest-mock==3.14.1

# Utilities
colorama==0.4.6
pygments==2.19.2
"""
        
        with open(self.root_dir / "requirements.txt", "w") as f:
            f.write(requirements_content)
        print("✅ Creado: requirements.txt")
        
        # pyproject.toml
        pyproject_content = """[tool.poetry]
name = "tcg-web-app"
version = "0.1.0"
description = "Sistema completo de APIs para Trading Card Games"
authors = ["Your Name <your.email@example.com>"]

[tool.poetry.dependencies]
python = "^3.8"
supabase = "^2.16.0"
python-dotenv = "^1.1.1"
pydantic = "^2.11.7"
requests = "^2.32.4"
beautifulsoup4 = "^4.13.4"
aiohttp = "^3.9.0"
pandas = "^2.3.0"

[tool.poetry.dev-dependencies]
pytest = "^8.4.1"
pytest-mock = "^3.14.1"

[build-system]
requires = ["poetry-core>=1.0.0"]
build-backend = "poetry.core.masonry.api"
"""
        
        with open(self.root_dir / "pyproject.toml", "w") as f:
            f.write(pyproject_content)
        print("✅ Creado: pyproject.toml")
        
        # .gitignore actualizado
        gitignore_content = """# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Logs
logs/
*.log

# Data files
*.csv
*.json
*.db
*.sqlite

# OS
.DS_Store
Thumbs.db

# Supabase
.supabase/

# Frontend
frontend/node_modules/
frontend/.next/
frontend/.nuxt/
frontend/dist/
"""
        
        with open(self.root_dir / ".gitignore", "w") as f:
            f.write(gitignore_content)
        print("✅ Creado: .gitignore")
    
    def create_main_readme(self):
        """Crear README principal del proyecto"""
        print("\n📚 Creando README principal...")
        
        readme_content = """# TCG Web App

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
"""
        
        with open(self.root_dir / "README.md", "w", encoding='utf-8') as f:
            f.write(readme_content)
        print("✅ Creado: README.md")
    
    def create_env_example(self):
        """Crear archivo .env.example"""
        print("\n🔐 Creando .env.example...")
        
        env_example_content = """# Variables de entorno para TCG Web App
# Copia este archivo como .env y configura tus valores reales

# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_PROJECT_REF=your-project-ref

# External APIs
POKEMON_API_KEY=your-pokemon-api-key-here

# Scraper Configuration
SCRAPER_DELAY=1.0
SCRAPER_MAX_RETRIES=3
SCRAPER_TIMEOUT=30

# Database Configuration
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/app.log

# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
"""
        
        with open(self.root_dir / ".env.example", "w") as f:
            f.write(env_example_content)
        print("✅ Creado: .env.example")
    
    def cleanup_old_structure(self):
        """Limpiar estructura antigua"""
        print("\n🧹 Limpiando estructura antigua...")
        
        # Archivos que ya no necesitamos en scraper/
        old_files = [
            "supabase_setup.py",
            "supabase_apis.py", 
            "supabase_edge_functions.py",
            "test_supabase_connection.py",
            "setup_complete_system.py",
            "tcg_data_loader.py",
            "SUPABASE_APIS_SUMMARY.md",
            "SCRAPING_SUMMARY.md"
        ]
        
        for file in old_files:
            file_path = self.scraper_dir / file
            if file_path.exists():
                file_path.unlink()
                print(f"🗑️ Eliminado: {file}")
        
        # Limpiar archivos de prueba temporales
        temp_files = [
            "final_scraping_results_*.csv",
            "final_scraping_results_*.json",
            "marketplace_accessibility_*.json",
            "test_results_*.json",
            "input_urls_test.csv"
        ]
        
        for pattern in temp_files:
            for file_path in self.scraper_dir.glob(pattern):
                file_path.unlink()
                print(f"🗑️ Eliminado: {file_path.name}")
    
    def reorganize(self):
        """Ejecutar reorganización completa"""
        print("🚀 INICIANDO REORGANIZACIÓN DEL PROYECTO")
        print("=" * 60)
        
        try:
            # 1. Crear estructura de directorios
            self.create_directory_structure()
            
            # 2. Crear archivos __init__.py
            self.create_init_files()
            
            # 3. Mover archivos existentes
            self.move_scraper_files()
            
            # 4. Crear archivos de configuración
            self.create_configuration_files()
            
            # 5. Crear README principal
            self.create_main_readme()
            
            # 6. Crear .env.example
            self.create_env_example()
            
            # 7. Limpiar estructura antigua
            self.cleanup_old_structure()
            
            print("\n🎉 ¡REORGANIZACIÓN COMPLETADA EXITOSAMENTE!")
            print("=" * 60)
            print("")
            print("📋 Resumen de cambios:")
            print("   ✅ Nueva estructura de carpetas creada")
            print("   ✅ Archivos movidos a ubicaciones correctas")
            print("   ✅ Archivos de configuración creados")
            print("   ✅ Documentación actualizada")
            print("   ✅ Estructura antigua limpiada")
            print("")
            print("🚀 Próximos pasos:")
            print("   1. Configura tu archivo .env en la raíz del proyecto")
            print("   2. Ejecuta: python scripts/setup.py")
            print("   3. Ejecuta: python scripts/test.py")
            print("   4. Revisa la documentación en docs/")
            print("")
            print("📚 Estructura final:")
            print("   TCG Web App/")
            print("   ├── .env                    # Variables de entorno")
            print("   ├── backend/                # APIs y servicios")
            print("   ├── scraper/                # Sistema de scraping")
            print("   ├── data_loader/            # Carga de datos")
            print("   ├── docs/                   # Documentación")
            print("   └── scripts/                # Scripts de utilidad")
            
        except Exception as e:
            print(f"\n❌ Error durante la reorganización: {e}")
            return False
        
        return True

def main():
    """Función principal"""
    reorganizer = ProjectReorganizer()
    success = reorganizer.reorganize()
    
    if success:
        print("\n✅ Reorganización completada exitosamente")
        sys.exit(0)
    else:
        print("\n❌ Reorganización falló")
        sys.exit(1)

if __name__ == "__main__":
    main() 