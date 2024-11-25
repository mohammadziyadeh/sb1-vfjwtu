import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { ExchangeProvider } from './context/ExchangeContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <ExchangeProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/dashboard/*"
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
              </div>
            </BrowserRouter>
          </ExchangeProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;