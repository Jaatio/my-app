import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue, remove } from 'firebase/database';
import { FaFilter, FaTrash, FaFileAlt, FaExternalLinkAlt } from 'react-icons/fa';
import styles from './InventoryHistory.module.css';

const InventoryHistory = () => {
  const [savedInventories, setSavedInventories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    responsiblePerson: '',
    discrepancyRange: 'all',
    inventoryNumber: ''
  });
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState(null);

  // Загрузка сохраненных инвентаризаций
  useEffect(() => {
    const savedInventoriesRef = ref(database, 'savedInventories');
    onValue(savedInventoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const inventoriesList = Object.entries(data).map(([id, item]) => ({
          id,
          ...item
        }));
        setSavedInventories(inventoriesList);
      } else {
        setSavedInventories([]);
      }
    });
  }, []);

  // Функция для открытия модального окна с отчетом
  const handleShowReport = (inventory) => {
    setSelectedReport(inventory);
    setShowReportModal(true);
  };

  // Функция удаления инвентаризации
  const handleDelete = async (id) => {
    setSelectedForDelete(id);
    setShowDeleteConfirm(true);
  };

  // Функция подтверждения удаления
  const confirmDelete = async () => {
    try {
      await remove(ref(database, `savedInventories/${selectedForDelete}`));
      setShowDeleteConfirm(false);
      setSelectedForDelete(null);
    } catch (error) {
      console.error("Ошибка при удалении инвентаризации:", error);
      alert("Произошла ошибка при удалении инвентаризации");
    }
  };

  // Функция для применения фильтров
  const getFilteredInventories = () => {
    return savedInventories.filter(inventory => {
      // Фильтр по номеру инвентаризации
      if (filters.inventoryNumber && 
          !inventory.inventoryNumber.toString().includes(filters.inventoryNumber)) {
        return false;
      }

      // Фильтр по дате
      if (filters.dateFrom || filters.dateTo) {
        const inventoryDate = new Date(inventory.savedDate);
        if (filters.dateFrom && new Date(filters.dateFrom) > inventoryDate) {
          return false;
        }
        if (filters.dateTo && new Date(filters.dateTo) < inventoryDate) {
          return false;
        }
      }

      // Фильтр по ответственному лицу
      if (filters.responsiblePerson && 
          !inventory.responsiblePerson.toLowerCase().includes(filters.responsiblePerson.toLowerCase())) {
        return false;
      }

      // Фильтр по расхождениям
      if (filters.discrepancyRange !== 'all') {
        const totalDiscrepancy = Object.values(inventory.discrepancies || {}).reduce(
          (sum, disc) => sum + (disc.discrepancySum || 0),
          0
        );
        if (filters.discrepancyRange === 'positive' && totalDiscrepancy <= 0) {
          return false;
        }
        if (filters.discrepancyRange === 'negative' && totalDiscrepancy >= 0) {
          return false;
        }
      }

      return true;
    });
  };

  // Обработчик изменения фильтров
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filteredInventories = getFilteredInventories();

  return (
    <div className={styles.historyContainer}>
      <div className={styles.headerContainer}>
        <h2>История инвентаризаций</h2>
        <button 
          className={styles.filterButton}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter />
        </button>
      </div>

      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <label>
              Период:
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className={styles.filterInput}
              />
              <span> — </span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className={styles.filterInput}
              />
            </label>
          </div>

          <div className={styles.filterGroup}>
            <label>
              Ответственное лицо:
              <input
                type="text"
                value={filters.responsiblePerson}
                onChange={(e) => handleFilterChange('responsiblePerson', e.target.value)}
                placeholder="Введите ФИО"
                className={styles.filterInput}
              />
            </label>
          </div>

          <div className={styles.filterGroup}>
            <label>
              Номер инвентаризации:
              <input
                type="text"
                value={filters.inventoryNumber}
                onChange={(e) => handleFilterChange('inventoryNumber', e.target.value)}
                placeholder="Введите номер"
                className={styles.filterInput}
              />
            </label>
          </div>

          <div className={styles.filterGroup}>
            <label>
              Расхождения:
              <select
                value={filters.discrepancyRange}
                onChange={(e) => handleFilterChange('discrepancyRange', e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">Все</option>
                <option value="positive">Положительные</option>
                <option value="negative">Отрицательные</option>
              </select>
            </label>
          </div>
        </div>
      )}

      <div className={styles.inventoriesList}>
        {filteredInventories.length > 0 ? (
          filteredInventories.map(inventory => (
            <div key={inventory.id} className={styles.inventoryCard}>
              <div className={styles.inventoryHeader}>
                <h3>Инвентаризация №{inventory.inventoryNumber}</h3>
                <div className={styles.headerButtons}>
                  <button
                    className={styles.reportButton}
                    onClick={() => handleShowReport(inventory)}
                    title="Просмотреть отчет"
                  >
                    <FaFileAlt />
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(inventory.id)}
                    title="Удалить"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className={styles.inventoryDetails}>
                <p>Ответственное лицо: {inventory.responsiblePerson}</p>
                <p>Статус: {inventory.status}</p>
                <p className={styles.savedDate}>Сохранено: {inventory.savedDate}</p>
                {inventory.discrepancies && Object.keys(inventory.discrepancies).length > 0 && (
                  <div className={styles.discrepanciesSummary}>
                    <p>Итоговая сумма расхождений: {
                      Object.values(inventory.discrepancies).reduce(
                        (sum, disc) => sum + (disc.discrepancySum || 0),
                        0
                      ).toFixed(2)
                    }</p>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className={styles.noData}>Нет сохраненных инвентаризаций</p>
        )}
      </div>

      {/* Модальное окно для отображения ссылки на отчет */}
      {showReportModal && selectedReport && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Отчет по инвентаризации №{selectedReport.inventoryNumber}</h3>
            <div className={styles.reportLinkContainer}>
              <p>Ссылка на отчет:</p>
              <div className={styles.reportLink}>
                <a 
                  href={selectedReport.reportLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {selectedReport.reportLink}
                  <FaExternalLinkAlt className={styles.externalLinkIcon} />
                </a>
              </div>
            </div>
            <div className={styles.modalButtons}>
              <button onClick={() => {
                setShowReportModal(false);
                setSelectedReport(null);
              }}>Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Подтверждение удаления</h3>
            <p>Вы действительно хотите удалить эту инвентаризацию из истории?</p>
            <div className={styles.modalButtons}>
              <button onClick={confirmDelete}>Удалить</button>
              <button onClick={() => {
                setShowDeleteConfirm(false);
                setSelectedForDelete(null);
              }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryHistory; 