import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './components/app/App.jsx'
import { queryClient } from './service/queryClient.js'
import { applyTheme, storedTheme } from './utils/theme.js'

applyTheme(storedTheme()) // before the first paint, so dark mode doesn't flash light

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
