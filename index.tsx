import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // 引入主程式 App.tsx
// 如果您未來改用 npm 安裝 Tailwind，這裡需要 import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
