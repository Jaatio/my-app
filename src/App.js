import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ResetPassword from './components/ResetPassword';
import MainPage from './pages/MainPage';
import ManagerPage from './pages/ManagerPage';
import WarehousePage from './pages/WarehousePage';
import AuditorPage from './pages/AuditorPage';
import AdminPage from './pages/AdminPage';
import { AuthProvider } from './contexts/AuthContext';
import UserProfile from './components/UserProfile';

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/reset-password'].includes(location.pathname);

  return (
    <div className="app">
      {!isAuthPage && <UserProfile />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/manager" element={<ManagerPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/warehouse" element={<WarehousePage />} />
        <Route path="/auditor" element={<AuditorPage />} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;