// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';



const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Элемент с id 'root' не найден в public/index.html");
}