import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ViewerProvider } from './context/ViewerContext.jsx';
import App from './App.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ViewerProvider>
          <App />
        </ViewerProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
