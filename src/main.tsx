import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

const app =
  'EditContext' in window ? (
    <App />
  ) : (
    <p>
      This demo only works in browsers that support the Edit Context API, such
      as Chrome 121+.
    </p>
  )

createRoot(document.getElementById('root')!).render(
  <StrictMode>{app}</StrictMode>
)
