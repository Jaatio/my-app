import React from "react";
import { useNavigate } from "react-router-dom";
import "./MainPage.css"; // Стили для главной страницы

const MainPage = () => {
  const navigate = useNavigate();

  return (
    <div className="main-page">
      <h1>Выберите роль</h1>
      <div className="buttons-container">
        <button onClick={() => navigate("/manager")}>Заведующий</button>
        <button onClick={() => navigate("/admin")}>Администратор</button>
        <button onClick={() => navigate("/warehouse")}>Складской оператор</button>
        <button onClick={() => navigate("/auditor")}>Аудитор</button>
      </div>
    </div>
  );
};

export default MainPage;
