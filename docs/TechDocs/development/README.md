# Guías de Desarrollo

## Visión General

Esta documentación proporciona las guías y estándares de desarrollo para la Plataforma Agregadora de Precios TCG, incluyendo configuración del entorno, estándares de código, testing y deployment.

## Configuración del Entorno de Desarrollo

### Requisitos Previos

- **Node.js**: Versión 18.0.0 o superior
- **npm**: Versión 9.0.0 o superior
- **Git**: Versión 2.30.0 o superior
- **Supabase CLI**: Versión 1.0.0 o superior
- **Docker**: Opcional, para desarrollo local

### Instalación de Dependencias

```bash
# Clonar el repositorio
git clone https://github.com/your-org/tcg-price-aggregator.git
cd tcg-price-aggregator

# Instalar dependencias del frontend
cd frontend
npm install

# Instalar dependencias del backend
cd ../backend
npm install

# Instalar dependencias compartidas
cd ../shared
npm install
```

### Configuración de Variables de Entorno

```bash
# Copiar archivos de ejemplo
cp .env.example .env.local

# Configurar variables (ver documentación de Supabase)
```

### Configuración de Supabase Local

```bash
# Inicializar Supabase
supabase init

# Iniciar servicios locales
supabase start

# Aplicar migraciones
supabase db push

# Generar tipos TypeScript
supabase gen types typescript --local > types/database.types.ts
```

## Estructura del Proyecto

```
TCG Web App/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   ├── pages/           # Páginas principales
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # Servicios de API
│   │   ├── types/           # Definiciones TypeScript
│   │   ├── utils/           # Utilidades
│   │   └── styles/          # Estilos globales
│   ├── public/              # Assets estáticos
│   └── package.json
├── backend/                  # API Node.js
│   ├── src/
│   │   ├── controllers/     # Controladores de rutas
│   │   ├── services/        # Lógica de negocio
│   │   ├── middleware/      # Middleware personalizado
│   │   ├── routes/          # Definición de rutas
│   │   ├── types/           # Tipos TypeScript
│   │   └── utils/           # Utilidades
│   ├── tests/               # Tests unitarios
│   └── package.json
├── shared/                   # Código compartido
│   ├── types/               # Tipos compartidos
│   ├── utils/               # Utilidades compartidas
│   └── constants/           # Constantes compartidas
└── Documentación/           # Documentación del proyecto
```

## Estándares de Código

### TypeScript

#### Configuración
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

#### Convenciones de Nomenclatura

```typescript
// Interfaces y tipos
interface CardData {
  id: string;
  name: string;
  price: number;
}

type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'DM';

// Enums
enum GameType {
  MTG = 'MTG',
  POKEMON = 'POKEMON',
  LORCANA = 'LORCANA'
}

// Funciones
const calculateAveragePrice = (prices: number[]): number => {
  return prices.reduce((sum, price) => sum + price, 0) / prices.length;
};

// Clases
class CardService {
  private apiClient: APIClient;
  
  constructor(apiClient: APIClient) {
    this.apiClient = apiClient;
  }
  
  async getCardById(id: string): Promise<CardData> {
    // Implementación
  }
}
```

### React

#### Estructura de Componentes

```typescript
// components/Card/Card.tsx
import React from 'react';
import { CardProps } from './Card.types';
import { CardImage } from './CardImage';
import { CardInfo } from './CardInfo';
import { CardActions } from './CardActions';
import './Card.css';

export const Card: React.FC<CardProps> = ({
  card,
  onAddToCollection,
  onAddToWatchlist,
  className = '',
  ...props
}) => {
  const handleAddToCollection = () => {
    onAddToCollection?.(card);
  };

  const handleAddToWatchlist = () => {
    onAddToWatchlist?.(card);
  };

  return (
    <div className={`card ${className}`} {...props}>
      <CardImage src={card.imageUrl} alt={card.name} />
      <CardInfo card={card} />
      <CardActions
        onAddToCollection={handleAddToCollection}
        onAddToWatchlist={handleAddToWatchlist}
      />
    </div>
  );
};
```

#### Custom Hooks

```typescript
// hooks/useCardSearch.ts
import { useState, useEffect, useCallback } from 'react';
import { CardService } from '@/services/CardService';
import { Card, SearchParams } from '@/types';

export const useCardSearch = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const searchCards = useCallback(async (params: SearchParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await CardService.searchCards(params);
      
      if (params.page === 1) {
        setCards(result.data);
      } else {
        setCards(prev => [...prev, ...result.data]);
      }
      
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error searching cards');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    cards,
    loading,
    error,
    hasMore,
    searchCards
  };
};
```

### Node.js/Express

#### Estructura de Controladores

```typescript
// controllers/cardController.ts
import { Request, Response, NextFunction } from 'express';
import { CardService } from '../services/CardService';
import { validateSearchParams } from '../utils/validation';
import { APIError } from '../utils/errors';

export class CardController {
  private cardService: CardService;

  constructor(cardService: CardService) {
    this.cardService = cardService;
  }

  searchCards = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const searchParams = validateSearchParams(req.query);
      const result = await this.cardService.searchCards(searchParams);
      
      res.json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          totalItems: result.totalItems
        }
      });
    } catch (error) {
      next(new APIError(error.message, 400));
    }
  };

  getCardById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const card = await this.cardService.getCardById(id);
      
      if (!card) {
        throw new APIError('Card not found', 404);
      }
      
      res.json({
        success: true,
        data: card
      });
    } catch (error) {
      next(error);
    }
  };
}
```

#### Middleware de Error

```typescript
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { APIError } from '../utils/errors';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  if (error instanceof APIError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: error.code
      }
    });
  }

  // Error interno del servidor
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  });
};
```

## Testing

### Configuración de Testing

```json
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/serviceWorker.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Tests Unitarios

```typescript
// tests/services/CardService.test.ts
import { CardService } from '@/services/CardService';
import { mockCardData } from '../mocks/cardData';

describe('CardService', () => {
  let cardService: CardService;
  let mockAPIClient: jest.Mocked<APIClient>;

  beforeEach(() => {
    mockAPIClient = {
      get: jest.fn(),
      post: jest.fn()
    } as any;
    
    cardService = new CardService(mockAPIClient);
  });

  describe('searchCards', () => {
    it('should search cards successfully', async () => {
      const searchParams = { query: 'sol ring', game: 'MTG' };
      const expectedResponse = { data: mockCardData, total: 1 };
      
      mockAPIClient.get.mockResolvedValue(expectedResponse);
      
      const result = await cardService.searchCards(searchParams);
      
      expect(mockAPIClient.get).toHaveBeenCalledWith('/cards/search', { params: searchParams });
      expect(result).toEqual(expectedResponse);
    });

    it('should handle API errors', async () => {
      const searchParams = { query: 'invalid', game: 'MTG' };
      
      mockAPIClient.get.mockRejectedValue(new Error('API Error'));
      
      await expect(cardService.searchCards(searchParams)).rejects.toThrow('API Error');
    });
  });
});
```

### Tests de Integración

```typescript
// tests/integration/cardSearch.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { setupTestDatabase, teardownTestDatabase } from '../utils/testDatabase';

describe('Card Search API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('GET /api/cards/search', () => {
    it('should return search results', async () => {
      const response = await request(app)
        .get('/api/cards/search')
        .query({ q: 'sol ring', game: 'MTG' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should validate required parameters', async () => {
      const response = await request(app)
        .get('/api/cards/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('query is required');
    });
  });
});
```

### Tests de Componentes

```typescript
// tests/components/Card.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from '@/components/Card/Card';
import { mockCard } from '../mocks/cardData';

describe('Card Component', () => {
  const defaultProps = {
    card: mockCard,
    onAddToCollection: jest.fn(),
    onAddToWatchlist: jest.fn()
  };

  it('should render card information', () => {
    render(<Card {...defaultProps} />);
    
    expect(screen.getByText(mockCard.name)).toBeInTheDocument();
    expect(screen.getByText(mockCard.set)).toBeInTheDocument();
    expect(screen.getByAltText(mockCard.name)).toBeInTheDocument();
  });

  it('should call onAddToCollection when add button is clicked', () => {
    render(<Card {...defaultProps} />);
    
    const addButton = screen.getByRole('button', { name: /add to collection/i });
    fireEvent.click(addButton);
    
    expect(defaultProps.onAddToCollection).toHaveBeenCalledWith(mockCard);
  });

  it('should call onAddToWatchlist when watchlist button is clicked', () => {
    render(<Card {...defaultProps} />);
    
    const watchlistButton = screen.getByRole('button', { name: /add to watchlist/i });
    fireEvent.click(watchlistButton);
    
    expect(defaultProps.onAddToWatchlist).toHaveBeenCalledWith(mockCard);
  });
});
```

## Linting y Formateo

### ESLint Configuración

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "plugins": ["@typescript-eslint", "react-hooks"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "prefer-const": "error",
    "no-var": "error"
  },
  "env": {
    "browser": true,
    "es2020": true,
    "node": true
  }
}
```

### Prettier Configuración

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### Scripts de Desarrollo

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test"
  }
}
```

## Git Workflow

### Convenciones de Commits

```bash
# Formato: type(scope): description
feat(cards): add card search functionality
fix(auth): resolve login redirect issue
docs(api): update API documentation
style(components): format card component
refactor(services): extract price calculation logic
test(cards): add unit tests for card service
chore(deps): update dependencies
```

### Branching Strategy

```bash
# Rama principal
main                    # Código de producción
develop                 # Código de desarrollo

# Ramas de feature
feature/card-search     # Nueva funcionalidad
feature/user-collection # Nueva funcionalidad

# Ramas de hotfix
hotfix/auth-bug         # Corrección urgente

# Ramas de release
release/v1.2.0          # Preparación de release
```

### Pull Request Template

```markdown
## Descripción
Breve descripción de los cambios realizados.

## Tipo de Cambio
- [ ] Bug fix
- [ ] Nueva funcionalidad
- [ ] Breaking change
- [ ] Documentación

## Cambios Realizados
- Lista de cambios específicos

## Testing
- [ ] Tests unitarios pasan
- [ ] Tests de integración pasan
- [ ] Tests manuales realizados

## Checklist
- [ ] Código sigue los estándares del proyecto
- [ ] Documentación actualizada
- [ ] Variables de entorno configuradas
- [ ] No hay console.logs o código de debug
```

## Deployment

### Configuración de Vercel

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key"
  },
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Configuración de Supabase

```bash
# Desplegar Edge Functions
supabase functions deploy

# Desplegar migraciones
supabase db push

# Configurar variables de entorno
supabase secrets set MY_SECRET=value
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## Monitoreo y Debugging

### Logging

```typescript
// utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

export default logger;
```

### Error Tracking

```typescript
// utils/errorTracking.ts
import * as Sentry from '@sentry/nextjs';

export const initErrorTracking = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
};

export const captureError = (error: Error, context?: any) => {
  Sentry.captureException(error, {
    extra: context
  });
};
```

## Performance

### Optimización de Imágenes

```typescript
// next.config.js
const nextConfig = {
  images: {
    domains: ['cards.scryfall.io', 'images.pokemontcg.io'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@mui/material', '@mui/icons-material']
  }
};
```

### Bundle Analysis

```bash
# Analizar bundle
npm run build
npx @next/bundle-analyzer

# Optimizar imports
npm run analyze
```

## Seguridad

### Validación de Entrada

```typescript
// utils/validation.ts
import Joi from 'joi';

export const searchSchema = Joi.object({
  query: Joi.string().min(1).max(200).required(),
  game: Joi.string().valid('MTG', 'POKEMON', 'LORCANA').required(),
  set: Joi.string().max(20).optional(),
  page: Joi.number().min(1).max(1000).default(1),
  limit: Joi.number().min(1).max(100).default(20)
});

export const validateSearchParams = (params: any) => {
  const { error, value } = searchSchema.validate(params);
  if (error) {
    throw new Error(`Validation error: ${error.details[0].message}`);
  }
  return value;
};
```

### Sanitización

```typescript
// utils/sanitization.ts
import DOMPurify from 'dompurify';

export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};

export const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  });
};
``` 