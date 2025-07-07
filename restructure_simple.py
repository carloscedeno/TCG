#!/usr/bin/env python3
"""
Simplified Project Restructuring Script
Reorganizes the MTG TCG Web App following industry best practices
"""

import os
import shutil
from pathlib import Path
from datetime import datetime

class SimpleProjectRestructurer:
    def __init__(self):
        self.root = Path.cwd()
        self.backup_dir = self.root / "backup_before_restructure"
        
        # Define new structure
        self.new_structure = {
            "src": {
                "api": {"routes": {}, "middleware": {}, "controllers": {}, "services": {}, "models": {}, "schemas": {}, "utils": {}},
                "core": {"config": {}, "database": {"migrations": {}, "seeds": {}, "models": {}, "repositories": {}}, "services": {}, "utils": {}},
                "features": {"auth": {}, "cards": {}, "prices": {}, "collections": {}, "users": {}, "analytics": {}},
                "shared": {"constants": {}, "types": {}, "exceptions": {}, "decorators": {}}
            },
            "frontend": {
                "src": {"components": {"ui": {}, "cards": {}, "prices": {}, "collections": {}, "layout": {}}, "pages": {}, "hooks": {}, "services": {}, "utils": {}, "types": {}, "styles": {}, "assets": {}},
                "public": {},
                "tests": {}
            },
            "infrastructure": {
                "supabase": {"functions": {}, "policies": {}, "triggers": {}, "config": {}},
                "deployment": {"docker": {}, "kubernetes": {}, "terraform": {}, "scripts": {}},
                "monitoring": {"logs": {}, "metrics": {}, "alerts": {}}
            },
            "data": {
                "scrapers": {"cardmarket": {}, "tcgplayer": {}, "cardkingdom": {}, "trollandtoad": {}, "shared": {}},
                "loaders": {},
                "processors": {},
                "validators": {},
                "exports": {}
            },
            "docs": {
                "api": {},
                "architecture": {},
                "deployment": {},
                "development": {},
                "user-guides": {},
                "tcg-structures": {}
            },
            "tests": {
                "unit": {},
                "integration": {},
                "e2e": {},
                "fixtures": {},
                "mocks": {}
            },
            "tools": {
                "scripts": {},
                "mcp": {},
                "migrations": {},
                "utilities": {}
            },
            "config": {
                "environments": {},
                "templates": {},
                "secrets": {}
            }
        }

    def create_backup(self):
        """Create backup of current structure."""
        print("Creating backup of current structure...")
        if self.backup_dir.exists():
            shutil.rmtree(self.backup_dir)
        
        # Copy important directories and files
        important_items = [
            "backend", "frontend", "supabase", "scraper", 
            "scripts", "tests", "Documentación", "data_loader",
            "mcp_server.py", "requirements.txt", "pyproject.toml",
            "README.md", ".gitignore"
        ]
        
        for item in important_items:
            source = self.root / item
            if source.exists():
                dest = self.backup_dir / item
                if source.is_dir():
                    shutil.copytree(source, dest)
                else:
                    shutil.copy2(source, dest)
        
        print(f"Backup created at: {self.backup_dir}")

    def create_directory_structure(self):
        """Create the new directory structure."""
        print("Creating new directory structure...")
        
        def create_dirs(base_path, structure):
            for dir_name, sub_structure in structure.items():
                dir_path = base_path / dir_name
                dir_path.mkdir(parents=True, exist_ok=True)
                print(f"Created: {dir_path}")
                
                if sub_structure:
                    create_dirs(dir_path, sub_structure)
        
        create_dirs(self.root, self.new_structure)

    def move_existing_files(self):
        """Move existing files to their new locations."""
        print("Moving existing files to new structure...")
        
        # Move backend files
        if (self.root / "backend").exists():
            backend_files = list((self.root / "backend").rglob("*"))
            for file_path in backend_files:
                if file_path.is_file():
                    relative_path = file_path.relative_to(self.root / "backend")
                    new_path = self.root / "src" / "api" / relative_path
                    new_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(file_path), str(new_path))
                    print(f"Moved: {file_path} -> {new_path}")
        
        # Move scraper files
        if (self.root / "scraper").exists():
            scraper_files = list((self.root / "scraper").rglob("*"))
            for file_path in scraper_files:
                if file_path.is_file():
                    relative_path = file_path.relative_to(self.root / "scraper")
                    new_path = self.root / "data" / "scrapers" / "shared" / relative_path
                    new_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(file_path), str(new_path))
                    print(f"Moved: {file_path} -> {new_path}")
        
        # Move documentation
        if (self.root / "Documentación").exists():
            docs_files = list((self.root / "Documentación").rglob("*"))
            for file_path in docs_files:
                if file_path.is_file():
                    relative_path = file_path.relative_to(self.root / "Documentación")
                    new_path = self.root / "docs" / relative_path
                    new_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(file_path), str(new_path))
                    print(f"Moved: {file_path} -> {new_path}")
        
        # Move MCP server files
        mcp_files = ["mcp_server.py", "setup_mcp_server.py", "deploy_mcp_server.py", 
                    "test_mcp_server.py", "example_mcp_usage.py", "quick_start_mcp.py",
                    "MCP_SERVER_README.md", "mcp_config.json"]
        
        for file_name in mcp_files:
            file_path = self.root / file_name
            if file_path.exists():
                new_path = self.root / "tools" / "mcp" / file_name
                shutil.move(str(file_path), str(new_path))
                print(f"Moved: {file_path} -> {new_path}")

    def create_modern_config_files(self):
        """Create modern configuration files."""
        print("Creating modern configuration files...")
        
        # Create pyproject.toml
        pyproject_content = '''[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "mtg-tcg-web-app"
version = "1.0.0"
description = "Advanced TCG price aggregation and analysis platform"
authors = [
    {name = "Your Name", email = "your.email@example.com"}
]
readme = "README.md"
requires-python = ">=3.8"
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.8",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
]
dependencies = [
    "fastapi>=0.104.0",
    "uvicorn[standard]>=0.24.0",
    "sqlalchemy>=2.0.0",
    "alembic>=1.12.0",
    "pydantic>=2.5.0",
    "httpx>=0.25.0",
    "beautifulsoup4>=4.12.0",
    "pandas>=2.1.0",
    "numpy>=1.24.0",
    "python-dotenv>=1.0.0",
    "supabase>=2.0.0",
    "pytest>=7.4.0",
    "pytest-asyncio>=0.21.0",
    "black>=23.0.0",
    "isort>=5.12.0",
    "flake8>=6.0.0",
    "mypy>=1.7.0",
]

[project.optional-dependencies]
dev = [
    "pytest-cov>=4.1.0",
    "pytest-mock>=3.11.0",
    "black[jupyter]>=23.0.0",
    "pre-commit>=3.5.0",
]

[project.urls]
Homepage = "https://github.com/yourusername/mtg-tcg-web-app"
Documentation = "https://mtg-tcg-web-app.readthedocs.io"
Repository = "https://github.com/yourusername/mtg-tcg-web-app"
"Bug Tracker" = "https://github.com/yourusername/mtg-tcg-web-app/issues"

[tool.setuptools.packages.find]
where = ["src"]

[tool.black]
line-length = 88
target-version = ['py38']

[tool.isort]
profile = "black"
multi_line_output = 3
line-length = 88

[tool.mypy]
python_version = "3.8"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py", "*_test.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = [
    "--strict-markers",
    "--strict-config",
    "--cov=src",
    "--cov-report=term-missing",
    "--cov-report=html",
    "--cov-report=xml",
]
markers = [
    "slow: marks tests as slow (deselect with '-m \"not slow\"')",
    "integration: marks tests as integration tests",
    "unit: marks tests as unit tests",
]
'''
        
        with open(self.root / "pyproject.toml", "w") as f:
            f.write(pyproject_content)
        
        # Create .env.example
        env_example_content = '''# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/mtg_tcg_db
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true
API_WORKERS=1

# Scraping Configuration
SCRAPING_DELAY=1
SCRAPING_TIMEOUT=30
SCRAPING_MAX_RETRIES=3
SCRAPING_USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36

# External APIs
SCRYFALL_API_URL=https://api.scryfall.com
POKEMON_API_URL=https://api.pokemontcg.io/v2
POKEMON_API_KEY=your-pokemon-api-key

# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s

# Development
DEBUG=true
ENVIRONMENT=development
'''
        
        with open(self.root / ".env.example", "w") as f:
            f.write(env_example_content)
        
        # Create docker-compose.yml
        docker_compose_content = '''version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/mtg_tcg_db
    depends_on:
      - db
    volumes:
      - ./src:/app/src
      - ./logs:/app/logs
    command: uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=mtg_tcg_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
'''
        
        with open(self.root / "docker-compose.yml", "w") as f:
            f.write(docker_compose_content)

    def create_main_readme(self):
        """Create main README file."""
        print("Creating main README...")
        
        readme_content = '''# MTG TCG Web App

Advanced Trading Card Game price aggregation and analysis platform supporting multiple TCGs including Magic: The Gathering, Pokemon, Yu-Gi-Oh!, Lorcana, Flesh and Blood, Wixoss, and One Piece.

## Features

- **Multi-TCG Support**: Comprehensive support for 7 major TCGs
- **Price Aggregation**: Real-time price data from multiple marketplaces
- **Advanced Analytics**: Price trends, market analysis, and portfolio tracking
- **Collection Management**: Import, track, and analyze your card collections
- **Modern Architecture**: Built with FastAPI, Supabase, and React
- **Scalable Infrastructure**: Docker, Kubernetes, and cloud-ready

## Architecture

```
src/
├── api/          # FastAPI application
├── core/         # Core business logic
├── features/     # Feature modules
└── shared/       # Shared utilities

frontend/         # React application
infrastructure/   # Deployment and infrastructure
data/            # Data processing and scraping
docs/            # Documentation
tests/           # Test suite
```

## Tech Stack

### Backend
- **FastAPI**: Modern, fast web framework
- **SQLAlchemy**: ORM and database management
- **Supabase**: Backend-as-a-Service
- **Alembic**: Database migrations
- **Pydantic**: Data validation

### Frontend
- **React**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **React Query**: Data fetching

### Infrastructure
- **Docker**: Containerization
- **Kubernetes**: Orchestration
- **Nginx**: Reverse proxy
- **Redis**: Caching

## Installation

### Prerequisites
- Python 3.8+
- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 15+

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mtg-tcg-web-app.git
   cd mtg-tcg-web-app
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker**
   ```bash
   docker-compose up -d
   ```

4. **Or run locally**
   ```bash
   # Backend
   pip install -e .
   uvicorn src.api.main:app --reload

   # Frontend
   cd frontend
   npm install
   npm run dev
   ```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src

# Run specific test types
pytest tests/unit/
pytest tests/integration/
pytest tests/e2e/
```

## Documentation

- [API Documentation](docs/api/)
- [Architecture Guide](docs/architecture/)
- [Development Guide](docs/development/)
- [Deployment Guide](docs/deployment/)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- [Issues](https://github.com/yourusername/mtg-tcg-web-app/issues)
- [Discussions](https://github.com/yourusername/mtg-tcg-web-app/discussions)
- [Documentation](docs/)

---

**Built with love for the TCG community**
'''
        
        with open(self.root / "README.md", "w", encoding="utf-8") as f:
            f.write(readme_content)

    def create_initial_app_files(self):
        """Create initial application files."""
        print("Creating initial application files...")
        
        # Create main FastAPI app
        main_app_content = '''"""Main FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="MTG TCG Web App",
    description="Advanced TCG price aggregation and analysis platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": "2025-01-28T00:00:00Z"}

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to MTG TCG Web App",
        "version": "1.0.0",
        "docs": "/docs"
    }
'''
        
        main_app_path = self.root / "src" / "api" / "main.py"
        main_app_path.parent.mkdir(parents=True, exist_ok=True)
        with open(main_app_path, "w") as f:
            f.write(main_app_content)
        
        # Create config
        config_content = '''"""Configuration settings."""

from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    """Application settings."""
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/mtg_tcg_db"
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_RELOAD: bool = True
    API_WORKERS: int = 1
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    JWT_SECRET_KEY: str = "your-jwt-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Environment
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    class Config:
        env_file = ".env"

settings = Settings()
'''
        
        config_path = self.root / "src" / "core" / "config.py"
        config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(config_path, "w") as f:
            f.write(config_content)

    def create_structure_documentation(self):
        """Create documentation for the new project structure."""
        print("Creating project structure documentation...")
        
        structure_doc_content = '''# Project Structure

This document describes the new project structure following industry best practices.

## Directory Structure

```
mtg-tcg-web-app/
├── src/                    # Main application source code
│   ├── api/               # FastAPI application
│   │   ├── routes/        # API route definitions
│   │   ├── middleware/    # Custom middleware
│   │   ├── controllers/   # Request/response handlers
│   │   ├── services/      # Business logic services
│   │   ├── models/        # Data models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── utils/         # API utilities
│   ├── core/              # Core application logic
│   │   ├── config/        # Configuration management
│   │   ├── database/      # Database related code
│   │   │   ├── migrations/ # Database migrations
│   │   │   ├── seeds/     # Database seed data
│   │   │   ├── models/    # SQLAlchemy models
│   │   │   └── repositories/ # Data access layer
│   │   ├── services/      # Core business services
│   │   └── utils/         # Core utilities
│   ├── features/          # Feature modules
│   │   ├── auth/          # Authentication
│   │   ├── cards/         # Card management
│   │   ├── prices/        # Price tracking
│   │   ├── collections/   # Collection management
│   │   ├── users/         # User management
│   │   └── analytics/     # Analytics and reporting
│   └── shared/            # Shared components
│       ├── constants/     # Application constants
│       ├── types/         # Type definitions
│       ├── exceptions/    # Custom exceptions
│       └── decorators/    # Custom decorators
├── frontend/              # React frontend application
│   ├── src/               # Frontend source code
│   │   ├── components/    # React components
│   │   │   ├── ui/        # Reusable UI components
│   │   │   ├── cards/     # Card-related components
│   │   │   ├── prices/    # Price-related components
│   │   │   ├── collections/ # Collection components
│   │   │   └── layout/    # Layout components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services
│   │   ├── utils/         # Frontend utilities
│   │   ├── types/         # TypeScript types
│   │   ├── styles/        # CSS/styling
│   │   └── assets/        # Static assets
│   ├── public/            # Public assets
│   └── tests/             # Frontend tests
├── infrastructure/         # Infrastructure and deployment
│   ├── supabase/          # Supabase configuration
│   │   ├── functions/     # Edge functions
│   │   ├── policies/      # Row Level Security
│   │   ├── triggers/      # Database triggers
│   │   └── config/        # Supabase config
│   ├── deployment/        # Deployment configuration
│   │   ├── docker/        # Docker configuration
│   │   ├── kubernetes/    # Kubernetes manifests
│   │   ├── terraform/     # Infrastructure as Code
│   │   └── scripts/       # Deployment scripts
│   └── monitoring/        # Monitoring and observability
│       ├── logs/          # Log configuration
│       ├── metrics/       # Metrics collection
│       └── alerts/        # Alerting rules
├── data/                  # Data processing
│   ├── scrapers/          # Web scraping modules
│   │   ├── cardmarket/    # Cardmarket scraper
│   │   ├── tcgplayer/     # TCGPlayer scraper
│   │   ├── cardkingdom/   # Card Kingdom scraper
│   │   ├── trollandtoad/  # Troll and Toad scraper
│   │   └── shared/        # Shared scraping utilities
│   ├── loaders/           # Data loading utilities
│   ├── processors/        # Data processing pipelines
│   ├── validators/        # Data validation
│   └── exports/           # Data export utilities
├── docs/                  # Documentation
│   ├── api/               # API documentation
│   ├── architecture/      # Architecture documentation
│   ├── deployment/        # Deployment guides
│   ├── development/       # Development guides
│   ├── user-guides/       # User documentation
│   └── tcg-structures/    # TCG structure documentation
├── tests/                 # Test suite
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   ├── e2e/               # End-to-end tests
│   ├── fixtures/          # Test fixtures
│   └── mocks/             # Test mocks
├── tools/                 # Development tools
│   ├── scripts/           # Utility scripts
│   ├── mcp/               # MCP server files
│   ├── migrations/        # Migration utilities
│   └── utilities/         # Development utilities
├── config/                # Configuration files
│   ├── environments/      # Environment-specific configs
│   ├── templates/         # Configuration templates
│   └── secrets/           # Secret management
├── logs/                  # Application logs
├── .github/               # GitHub configuration
│   └── workflows/         # CI/CD workflows
├── .venv/                 # Python virtual environment
├── .git/                  # Git repository
├── .gitignore            # Git ignore rules
├── .env.example          # Environment variables template
├── docker-compose.yml     # Docker Compose configuration
├── pyproject.toml        # Python project configuration
├── requirements.txt       # Python dependencies
└── README.md             # Project documentation
```

### Benefits of This Structure

1. Separation of Concerns: Clear separation between API, core logic, and features. Each module has a specific responsibility. Easy to locate and modify specific functionality.
2. Scalability: Modular design allows easy addition of new features. Infrastructure is separate from application code. Database migrations and seeds are organized.
3. Maintainability: Consistent naming conventions. Clear file organization. Easy to understand project structure.
4. Testing: Dedicated test directory with different test types. Fixtures and mocks are organized. Easy to run specific test suites.
5. Development Experience: Tools directory for development utilities. Pre-commit hooks for code quality. Comprehensive documentation structure.
6. Deployment: Infrastructure as Code with Terraform. Docker and Kubernetes configurations. Monitoring and observability setup.

### Migration Guide

From Old Structure:
1. Backend files → src/api/
2. Scraper files → data/scrapers/
3. Documentation → docs/
4. MCP files → tools/mcp/
5. Tests → tests/

New Files Created:
1. Configuration: Modern Python project configuration
2. Docker: Containerization setup
3. CI/CD: GitHub Actions workflows
4. Development: Pre-commit hooks and linting
5. Documentation: Comprehensive documentation structure

Next Steps:
1. Update imports in existing files to match new structure
2. Configure environment variables
3. Set up database with new migrations
4. Test the application with new structure
5. Deploy using new infrastructure setup

---

This structure follows industry best practices and provides a solid foundation for a scalable, maintainable application.
'''
        doc_path = self.root / "PROJECT_STRUCTURE.md"
        doc_path.parent.mkdir(parents=True, exist_ok=True)
        with open(doc_path, "w", encoding="utf-8") as f:
            f.write(structure_doc_content)

    def run(self):
        """Execute the complete restructuring process."""
        print("Starting project restructuring...")
        print("=" * 60)
        
        # Create backup
        self.create_backup()
        
        # Create new structure
        self.create_directory_structure()
        
        # Move existing files
        self.move_existing_files()
        
        # Create modern configuration files
        self.create_modern_config_files()
        
        # Create main README
        self.create_main_readme()
        
        # Create initial application files
        self.create_initial_app_files()
        
        # Create documentation
        self.create_structure_documentation()
        
        print("\n" + "=" * 60)
        print("Project restructuring completed successfully!")
        print("\nSummary of changes:")
        print("✅ Created modern directory structure")
        print("✅ Moved existing files to new locations")
        print("✅ Created comprehensive configuration files")
        print("✅ Set up development tools and CI/CD")
        print("✅ Created Docker and deployment configurations")
        print("✅ Added comprehensive documentation")
        
        print("\nNext steps:")
        print("1. Review the new structure in PROJECT_STRUCTURE.md")
        print("2. Update import statements in existing files")
        print("3. Configure environment variables")
        print("4. Test the application with new structure")
        print("5. Commit changes and push to repository")
        
        print(f"\nBackup created at: {self.backup_dir}")
        print("You can restore the old structure if needed.")

if __name__ == "__main__":
    restructurer = SimpleProjectRestructurer()
    restructurer.run() 