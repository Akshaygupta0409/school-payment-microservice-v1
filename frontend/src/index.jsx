import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Add code to restore the initial path if navigating directly to a route
if (window.INITIAL_PATH) {
  const initialPath = window.INITIAL_PATH;
  window.INITIAL_PATH = null; // Clear it to avoid repeated redirects
  setTimeout(() => {
    console.log('Restoring initial navigation path:', initialPath);
    window.history.pushState(null, '', initialPath);
    // Trigger a navigation event to ensure React Router picks up the change
    window.dispatchEvent(new Event('popstate'));
  }, 100);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
