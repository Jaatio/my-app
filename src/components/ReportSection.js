import React, { useState, useEffect } from "react";
import { database } from "../firebase";
import { ref, onValue, remove, push } from "firebase/database";
import styles from "../pages/WarehousePage.module.css"; // Убедитесь, что путь правильный

const ReportSection = () => {
  const [reports, setReports] = useState([]);
  const [reportForm, setReportForm] = useState({
    author: "",
    title: "",
    reportUrl: ""
  });

  // Загрузка отчетов из Firebase
  useEffect(() => {
    const reportsRef = ref(database, 'reports');
    onValue(reportsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedReports = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })) : [];
      setReports(loadedReports);
    });
  }, []);

  // Обработчик отправки отчета
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportForm.author || !reportForm.title || !reportForm.reportUrl) {
      alert("Все поля обязательны для заполнения!");
      return;
    }

    try {
      await push(ref(database, 'reports'), {
        ...reportForm,
        timestamp: new Date().toISOString()
      });
      setReportForm({ author: "", title: "", reportUrl: "" });
      alert("Отчет успешно отправлен!");
    } catch (error) {
      console.error("Ошибка отправки отчета:", error);
      alert("Ошибка при отправке отчета");
    }
  };

  // Удаление отчета
  const handleDeleteReport = (reportId) => {
    if (window.confirm("Вы уверены, что хотите удалить этот отчет?")) {
      remove(ref(database, `reports/${reportId}`));
    }
  };

  return (
    <div className={styles.nomenclature}>
      {/* Форма отправки отчета */}
      <div className={styles.pdfHeader}>
        <h2>Отправка отчета</h2>
      </div>
      <form onSubmit={handleSubmitReport} className={styles.qrForm}>
        <div className={styles.formField}>
          <label>ФИО ответственного</label>
          <input
            type="text"
            value={reportForm.author}
            onChange={(e) => setReportForm(p => ({...p, author: e.target.value}))}
            required
          />
        </div>
        <div className={styles.formField}>
          <label>Тема отчета</label>
          <input
            type="text"
            value={reportForm.title}
            onChange={(e) => setReportForm(p => ({...p, title: e.target.value}))}
            required
          />
        </div>
        <div className={styles.formField}>
          <label>Ссылка на отчет</label>
          <input
            type="url"
            value={reportForm.reportUrl}
            onChange={(e) => setReportForm(p => ({...p, reportUrl: e.target.value}))}
            required
          />
        </div>
        <div className={styles.formActions}>
          <button type="submit" className={styles.submitButton}>
            Отправить отчет
          </button>
        </div>
      </form>

      {/* История отчетов */}
      <div className={styles.pdfHeader} style={{ marginTop: "40px" }}>
        <h2>История отчетов</h2>
      </div>
      <table className={styles.productsTable}>
        <thead>
          <tr>
            <th>Дата</th>
            <th>Автор</th>
            <th>Тема</th>
            <th>Ссылка</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td>{new Date(report.timestamp).toLocaleDateString()}</td>
              <td>{report.author}</td>
              <td>{report.title}</td>
              <td>
                <a href={report.reportUrl} target="_blank" rel="noopener noreferrer">
                  Открыть отчет
                </a>
              </td>
              <td>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteReport(report.id)}
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportSection;