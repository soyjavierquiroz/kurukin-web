import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { VisitorProvider } from './context/VisitorContext.tsx';
import { initPixels, trackPageView } from './lib/analytics.ts';
import './index.css';

void initPixels()
  .then(() => trackPageView())
  .catch((error) => {
    console.error('[analytics] Pixel bootstrap failed', error);
  });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <VisitorProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </VisitorProvider>
  </StrictMode>
);
