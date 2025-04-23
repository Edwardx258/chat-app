import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppRoutes from './routes';
import reportWebVitals from './reportWebVitals';
import 'antd/dist/reset.css';
import { AuthProvider } from './context/AuthContext';

const container = document.getElementById('root') as HTMLElement;
// 1. Create Root
const root = ReactDOM.createRoot(container);
// 2. Color Root
root.render(
    <React.StrictMode>
        <AuthProvider>
            {/* Router setup */}
            <AppRoutes />
        </AuthProvider>
    </React.StrictMode>
);


reportWebVitals();

