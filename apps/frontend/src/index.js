import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// DEVELOPMENT FIX: Detect if running inside Electron
// StrictMode causes double-mount/unmount rendering in dev, creating visible flickering in Electron
const isElectron = () => {
  return (
    typeof window !== 'undefined' &&
    typeof window.process === 'object' &&
    window.process.type === 'renderer'
  );
};

// Add global error handlers to catch all unhandled errors
window.addEventListener('error', (event) => {
  console.error('🔴 GLOBAL ERROR:', event.error);
  console.error('Stack:', event.error?.stack);
  console.error('Message:', event.message);
  console.error('Filename:', event.filename);
  console.error('Line:', event.lineno, 'Col:', event.colno);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🔴 UNHANDLED PROMISE REJECTION:', event.reason);
  if (event.reason?.stack) {
    console.error('Stack:', event.reason.stack);
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));

// DEVELOPMENT FIX: Disable StrictMode in Electron to prevent flickering
// StrictMode is disabled only for Electron dev - production and web dev use StrictMode normally
if (isElectron()) {
  root.render(<App />);
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
