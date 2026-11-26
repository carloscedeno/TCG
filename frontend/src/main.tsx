import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeProvider'
import { registerSW } from 'virtual:pwa-register'

// Register self-destroying SW so existing browsers unregister legacy PWA caches cleanly
registerSW({
  immediate: true,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark">
      <App />
    </ThemeProvider>
  </StrictMode>,
)

