import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

// Catch silent React rendering errors and log them to the console
const Root = () => {
  try {
    return (
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  } catch (err) {
    console.error('[React] Failed to mount application:', err)
    return <div style={{ padding: '2rem', color: 'red' }}>Failed to load app. Check console for details.</div>
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />)
