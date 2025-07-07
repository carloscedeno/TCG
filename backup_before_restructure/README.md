# MTG TCG Web App

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
