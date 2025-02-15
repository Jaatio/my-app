import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainPage from "./MainPage";
import ManagerPage from "./ManagerPage";
import AdminPage from "./AdminPage";
import WarehousePage from "./WarehousePage";
import AuditorPage from "./AuditorPage";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/manager" element={<ManagerPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/warehouse" element={<WarehousePage />} />
        <Route path="/auditor" element={<AuditorPage />} />
      </Routes>
    </Router>
  );
};

export default App;
