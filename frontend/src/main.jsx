import React from 'react';//understanding jsx
import ReactDOM from 'react-dom/client';//helps in understanding the routes and for creating virtual dom
import App from './App.jsx'; // import all the paths of login and register pages 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)