# Frontend Geekorium TCG Web App

## Stack
- React + Vite + TypeScript
- TailwindCSS (paleta Geekorium)
- Testing: Jest + React Testing Library

## Estructura de Carpetas
- `src/components`: Componentes reutilizables
- `src/pages`: Vistas principales
- `src/styles`: Estilos globales y utilidades
- `src/hooks`: Custom hooks
- `src/utils`: Utilidades generales
- `src/tests`: Tests unitarios y de integración

## Paleta de Colores (tailwind.config.js)
- Primarios: `#E1306C` (Rojo Héroe), `#405DE6` (Azul Eléctrico)
- Secundarios: `#833AB4` (Púrpura Vibrante), `#F77737` (Naranja Cálido)
- Acento: `#FCAF45` (Amarillo), `#00FF85` (Verde Neón)
- Neutros: Blanco, negro, grises, modo oscuro

## Buenas Prácticas
- Componentes pequeños, reutilizables y tipados
- Mobile-first, accesible, responsivo
- Testing obligatorio para componentes clave
- Código limpio, comentarios útiles, sin dead code

## Scripts
- `npm run dev`: Desarrollo
- `npm run build`: Build producción
- `npm test`: Ejecutar tests

## Integración
- Preparado para consumir API MCP/Supabase
- Mock de datos en el grid inicial

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
