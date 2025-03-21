import React, { useState, useEffect } from "react";
import { database } from "../firebase";
import { ref, onValue } from "firebase/database";
import styles from "./ReportsTab.module.css";

const ReportsTab = () => {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({
    title: "",
    author: "",
    startDate: "",
    endDate: ""
  });

  // Загрузка отчетов
  useEffect(() => {
    const reportsRef = ref(database, "reports");
    onValue(reportsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedReports = data 
        ? Object.keys(data).map(key => ({ id: key, ...data[key] })) 
        : [];
      setReports(loadedReports);
    });
  }, []);

  // Фильтрация данных
  const filteredReports = reports.filter(report => {
    const matchesTitle = report.title.toLowerCase().includes(filters.title.toLowerCase());
    const matchesAuthor = report.author.toLowerCase().includes(filters.author.toLowerCase());
    
    // Фильтр по дате
    const reportDate = new Date(report.timestamp);
    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : null;
    
    const matchesDate = 
      (!startDate || reportDate >= startDate) && 
      (!endDate || reportDate <= endDate);

    return matchesTitle && matchesAuthor && matchesDate;
  });

  // Обработчик изменений фильтров
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Сброс фильтров
  const resetFilters = () => {
    setFilters({
      title: "",
      author: "",
      startDate: "",
      endDate: ""
    });
  };

  return (
    <div className={styles.reportsTab}>
      <h2>Просмотр отчетов</h2>

      {/* Фильтры */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <input
            type="text"
            placeholder="Поиск по теме"
            name="title"
            value={filters.title}
            onChange={handleFilterChange}
          />
          <input
            type="text"
            placeholder="Поиск по ФИО"
            name="author"
            value={filters.author}
            onChange={handleFilterChange}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Дата от:</label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
          <label>Дата до:</label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
          <button onClick={resetFilters} className={styles.resetButton}>
            Сбросить
          </button>
        </div>
      </div>

      {/* Таблица отчетов */}
      <table className={styles.reportsTable}>
        <thead>
          <tr>
            <th>Дата</th>
            <th>Автор</th>
            <th>Тема</th>
            <th>Ссылка</th>
          </tr>
        </thead>
        <tbody>
          {filteredReports.map(report => (
            <tr key={report.id}>
              <td>{new Date(report.timestamp).toLocaleDateString()}</td>
              <td>{report.author}</td>
              <td>{report.title}</td>
              <td>
                <a href={report.reportUrl} target="_blank" rel="noopener noreferrer">
                  Открыть
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportsTab;