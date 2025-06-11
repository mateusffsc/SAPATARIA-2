import React from 'react';
import SapatariaGestao from './components/SapatariaGestao';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/shared/ToastContainer';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ToastProvider>
          <SapatariaGestao />
        </ToastProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;