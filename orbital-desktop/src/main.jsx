import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="h-screen w-screen overflow-hidden">
      <App />
    </div>
  </StrictMode>,
);
