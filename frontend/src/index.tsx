import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'antd/dist/reset.css';
const container = document.getElementById('root') as HTMLElement;
// 1. 创建根
const root = ReactDOM.createRoot(container);
// 2. 渲染
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// 性能监控（可选）
reportWebVitals();

