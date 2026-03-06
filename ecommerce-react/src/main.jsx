import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter} from 'react-router'
import './index.css'
import App from './App.jsx'

// Debug: Log environment variables
console.log('🔍 VITE_API_URL:', import.meta.env.VITE_API_URL)
console.log('🔍 All env vars:', import.meta.env)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
