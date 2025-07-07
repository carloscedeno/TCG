# Project Structure

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
