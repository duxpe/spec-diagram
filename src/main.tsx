import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/500.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@/styles/global.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root container not found')
}

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
