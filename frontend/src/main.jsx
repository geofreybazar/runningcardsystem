import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyTheme, storedTheme } from './lib/theme.js'

applyTheme(storedTheme()) // before the first paint, so dark mode doesn't flash light

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
