import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Force light theme — clear any stale dark preference from localStorage
localStorage.setItem('theme', 'light');
document.documentElement.classList.remove('dark');
document.body.classList.remove('dark');

// Developer console branding logs
console.log("%c🍎 An apple a day keeps the doctor away... but DocAI is here when the apple fails! 🤖", "color:#2f7fc1;font-size:14px;font-weight:bold;");
console.log("%c Developed by Likhith Kumar | Coffee  n Code☕ ", "color:#7cc8ff;font-size:13px;");

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
