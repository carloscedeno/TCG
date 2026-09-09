import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeProvider'
import { registerSW } from 'virtual:pwa-register'

// Automatically check for new versions every 60s and reload seamlessly
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, r) {
    if (r) {
      setInterval(async () => {
        if (!(!r.installing && navigator)) {
          if (('onLine' in navigator) && !navigator.onLine) return;
          try {
            await r.update();
          } catch {
            // Network error during background check
          }
        }
      }, 60 * 1000);
    }
  },
  onNeedRefresh() {
    // When a new build is deployed, automatically activate it
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark">
      <App />
    </ThemeProvider>
  </StrictMode>,
)

