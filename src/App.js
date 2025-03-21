import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import MainPage from './pages/MainPage';
import ManagerPage from './pages/ManagerPage';
import WarehousePage from './pages/WarehousePage';
import AuditorPage from './pages/AuditorPage';
import AdminPage from './pages/AdminPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/main" replace />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/manager" element={<ManagerPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/warehouse" element={<WarehousePage />} />
        <Route path="/auditor" element={<AuditorPage />} />
      </Routes>
    </Router>
  );
};

export default App;