import React, { useState, useEffect } from "react";
import { database } from "../firebase";
import { ref, onValue, update, remove, push, set, get } from "firebase/database";
import html2canvas from "html2canvas";
import styles from "./AuditorPage.module.css";
import ReportSection from '../components/ReportSection';
import InventoryHistory from '../components/InventoryHistory';
import { useAuth } from '../contexts/AuthContext';
import ReportsTab from "../components/ReportsTab";
import AppDownloadDrawer from '../components/AppDownloadDrawer/AppDownloadDrawer';

const AuditorPage = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("tasks");
  const [tasks, setTasks] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedInventoryItems, setSelectedInventoryItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedInventoryForSave, setSelectedInventoryForSave] = useState(null);
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [reportLink, setReportLink] = useState("");

  // Подписка на данные из базы при монтировании компонента
  useEffect(() => {
    if (!currentUser) return;

    // Загрузка задач
    const tasksRef = ref(database, "tasks/");
    onValue(tasksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const tasksArray = Object.entries(data)
          .map(([id, task]) => ({
            id,
            ...task,
          }))
          .filter((task) => task.responsible === currentUser?.fullName);
        setTasks(tasksArray);
      } else {
        setTasks([]);
      }
    });

    // Загрузка инвентаризаций
    const inventoriesRef = ref(database, "inventories/");
    onValue(inventoriesRef, (snapshot) => {
      const data = snapshot.val();
      setInventoryItems(
        data
          ? Object.entries(data).map(([id, item]) => ({ id, ...item }))
          : []
      );
    });

    // Загрузка товаров (системные данные)
    const productsRef = ref(database, "products/");
    onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      setProducts(
        data
          ? Object.entries(data).map(([id, item]) => ({ id, ...item }))
          : []
      );
    });
  }, [currentUser]);

  // Функция сохранения карточки на ПК
  const handleSaveCard = () => {
    const card = document.getElementById("inventory-card");
    if (card) {
      html2canvas(card)
        .then((canvas) => {
          const link = document.createElement("a");
          link.download = `inventory_card.png`;
          link.href = canvas.toDataURL();
          link.click();
        })
        .catch((error) =>
          console.error("Ошибка сохранения карточки:", error)
        );
    }
  };

  // Функции для обработки задач
  const handleCancelTask = async (id) => {
    const currentTime = new Date().toLocaleString();
    try {
      await update(ref(database, "tasks/" + id), {
        status: "Отменено",
        response: currentTime
      });
    } catch (error) {
      console.error("Ошибка при обновлении задачи:", error);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await remove(ref(database, "tasks/" + id));
    } catch (error) {
      console.error("Ошибка при удалении задачи:", error);
    }
  };

  const handleApproveTask = async (id) => {
    try {
      await update(ref(database, "tasks/" + id), {
        status: "Принято",
        responseDate: new Date().toLocaleDateString()
      });
    } catch (error) {
      console.error("Ошибка при принятии задачи:", error);
    }
  };

  const handleRejectTask = async (id) => {
    try {
      await update(ref(database, "tasks/" + id), {
        status: "Отклонено",
        responseDate: new Date().toLocaleDateString()
      });
    } catch (error) {
      console.error("Ошибка при отклонении задачи:", error);
    }
  };

  // Добавляем функцию для получения следующего номера инвентаризации
  const getNextInventoryNumber = async () => {
    try {
      // Получаем все активные инвентаризации
      const inventoriesRef = ref(database, "inventories/");
      const inventoriesSnapshot = await get(inventoriesRef);
      const activeInventories = inventoriesSnapshot.val() || {};
      
      // Получаем все сохраненные инвентаризации
      const savedInventoriesRef = ref(database, "savedInventories/");
      const savedInventoriesSnapshot = await get(savedInventoriesRef);
      const savedInventories = savedInventoriesSnapshot.val() || {};
      
      // Собираем все номера инвентаризаций
      const allNumbers = [
        ...Object.values(activeInventories).map(inv => inv.inventoryNumber || 0),
        ...Object.values(savedInventories).map(inv => inv.inventoryNumber || 0)
      ];
      
      // Находим максимальный номер
      const maxNumber = Math.max(0, ...allNumbers);
      
      // Возвращаем следующий номер
      return maxNumber + 1;
    } catch (error) {
      console.error("Ошибка при получении следующего номера инвентаризации:", error);
      return inventoryItems.length + 1; // Fallback к старой логике
    }
  };

  // Создание новой инвентаризации
  const handleCreateInventory = async () => {
    const nextNumber = await getNextInventoryNumber();
    const newInventory = {
      inventoryNumber: nextNumber,
      creationDateTime: new Date().toLocaleString(),
      status: "В процессе",
      scannedProducts: {},
      discrepancies: {}
    };

    const newInventoryRef = push(ref(database, "inventories/"));
    await set(newInventoryRef, newInventory);
  };

  // Завершение инвентаризации (перенос данных в историю)
  const handleCompleteInventoryItem = async (id) => {
    try {
      const inventoryRef = ref(database, `inventories/${id}`);
      const historyRef = ref(database, `auditHistory/${id}`);

      onValue(inventoryRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          set(historyRef, {
            ...data,
            completionDate: new Date().toLocaleString()
          });
        }
      });
      await remove(inventoryRef);
    } catch (error) {
      console.error("Ошибка завершения инвентаризации:", error);
    }
  };

  // Отмена инвентаризации
  const handleCancelInventoryItem = async (id) => {
    try {
      await update(ref(database, `inventories/${id}`), {
        status: "Отменено",
        discrepancies: {}
      });
    } catch (error) {
      console.error("Ошибка отмены инвентаризации:", error);
    }
  };

  // Удаление инвентаризации
  const handleDeleteInventoryItem = async (id) => {
    try {
      await remove(ref(database, `inventories/${id}`));
    } catch (error) {
      console.error("Ошибка удаления инвентаризации:", error);
    }
  };

  // Переключение сворачивания/разворачивания элемента инвентаризации
  const toggleInventoryItem = (id) => {
    setInventoryItems(
      inventoryItems.map((item) =>
        item.id === id ? { ...item, expanded: !item.expanded } : item
      )
    );
  };

  // Обработка выбора/снятия выбора инвентаризации (при клике по чекбоксу)
  const handleSelectInventoryItem = (id) => {
    setSelectedInventoryItems((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((itemId) => itemId !== id)
        : [...prevSelected, id]
    );
  };

  // Массовая отмена инвентаризаций
  const handleCancelSelectedInventoryItems = async () => {
    try {
      await Promise.all(
        selectedInventoryItems.map((id) =>
          update(ref(database, `inventories/${id}`), {
            status: "Отменено",
            discrepancies: {}
          })
        )
      );
      setSelectedInventoryItems([]);
    } catch (error) {
      console.error("Ошибка отмены выбранных инвентаризаций:", error);
    }
  };

  // Массовое удаление инвентаризаций
  const handleDeleteSelectedInventoryItems = async () => {
    try {
      await Promise.all(
        selectedInventoryItems.map((id) =>
          remove(ref(database, `inventories/${id}`))
        )
      );
      setSelectedInventoryItems([]);
    } catch (error) {
      console.error("Ошибка удаления выбранных инвентаризаций:", error);
    }
  };

  // Рендер деталей инвентаризации для каждого процесса
  const renderInventoryDetails = (item) => {
    // Преобразуем отсканированные товары из объекта в массив
    const scannedProds = item.scannedProducts
      ? Object.entries(item.scannedProducts).map(([id, prod]) => ({
          id,
          ...prod,
          quantity: Number(prod.quantity),
          price: Number(prod.price)
        }))
      : [];

    // Вычисляем расхождения: для каждого системного товара сравниваем общее количество отсканированных товаров с системным количеством.
    const discrepancies = products.map((prod) => {
      // Суммарное количество отсканированных товаров для данной номенклатуры
      const scannedTotal = scannedProds
        .filter((sp) => sp.nomenclatureCode === prod.nomenclatureCode)
        .reduce((sum, sp) => sum + sp.quantity, 0);
      const systemQuantity = Number(prod.quantity);
      const diff = scannedTotal - systemQuantity;
      return {
        nomenclatureCode: prod.nomenclatureCode,
        scannedQuantity: scannedTotal,
        systemQuantity,
        difference: diff,
        discrepancySum: diff * Number(prod.price),
        price: prod.price
      };
    }).filter((d) => d.difference !== 0);

    // Итоговая сумма расхождений
    const totalDiscrepancySum = discrepancies.reduce(
      (sum, d) => sum + d.discrepancySum,
      0
    );

    return (
      <div id="inventory-card" className={styles.inventoryContent}>
        {/* Левая панель – Отсканированные товары */}
        <div className={styles.inventoryPart}>
          <h4>Отсканированные товары</h4>
          {scannedProds.length > 0 ? (
            scannedProds.map((product) => (
              <div key={product.id} className={styles.productRow}>
                <div>Номенклатура: {product.nomenclatureCode || "—"}</div>
                <div>Цена: {product.price?.toFixed(2) || "0.00"}</div>
                <div>Количество: {product.quantity || "0"}</div>
                <div>
                  Сумма: {(product.price * product.quantity)?.toFixed(2) ||
                    "0.00"}
                </div>
              </div>
            ))
          ) : (
            <div>Нет отсканированных товаров</div>
          )}
        </div>

        {/* Центральная панель – Расхождения */}
        <div className={styles.discrepancySection}>
          <h4>Расхождения</h4>
          {discrepancies.length > 0 ? (
            discrepancies.map((disc, index) => (
              <div key={index} className={styles.discrepancyItem}>
                <div>Номенклатура: {disc.nomenclatureCode}</div>
                <div>Цена: {disc.price}</div>
                <div>Количество: {disc.systemQuantity}</div>
                <div>Сумма: {(disc.price * disc.systemQuantity).toFixed(2)}</div>
              </div>
            ))
          ) : (
            <div className={styles.noDiscrepancies}>Нет расхождений</div>
          )}
          {discrepancies.length > 0 && (
            <div className={styles.discrepancySummary}>
              <strong>Итого расхождение: {totalDiscrepancySum.toFixed(2)}</strong>
            </div>
          )}
        </div>

        {/* Правая панель – Данные системы */}
        <div className={styles.inventoryPart}>
          <h4>Данные системы</h4>
          {products && products.length > 0 ? (
            products.map((product) => (
              <div key={product.id} className={styles.productRow}>
                <div>Номенклатура: {product.nomenclatureCode}</div>
                <div>Цена: {product.price}</div>
                <div>Количество: {product.quantity}</div>
                <div>Сумма: {product.price * product.quantity}</div>
              </div>
            ))
          ) : (
            <div>Нет данных</div>
          )}
        </div>
      </div>
    );
  };

  // Функция для сохранения инвентаризации
  const handleSaveInventory = async (id) => {
    setSelectedInventoryForSave(id);
    setShowSaveModal(true);
  };

  // Функция для подтверждения сохранения инвентаризации
  const handleConfirmSave = async () => {
    if (!currentUser) return;
    if (!reportLink.trim()) {
      alert("Пожалуйста, укажите ссылку на отчет");
      return;
    }

    try {
      const inventoryRef = ref(database, `inventories/${selectedInventoryForSave}`);
      
      onValue(inventoryRef, async (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const savedInventoriesRef = ref(database, "savedInventories");
          const newSavedInventory = {
            ...data,
            savedDate: new Date().toLocaleString(),
            responsiblePerson: currentUser?.fullName,
            reportLink: reportLink,
            status: "Завершено",
            userId: currentUser?.uid
          };
          
          await push(savedInventoriesRef, newSavedInventory);
          await remove(inventoryRef);
        }
      }, { onlyOnce: true });

      setShowSaveModal(false);
      setReportLink("");
      setSelectedInventoryForSave(null);
    } catch (error) {
      console.error("Ошибка при сохранении инвентаризации:", error);
      alert("Произошла ошибка при сохранении инвентаризации");
    }
  };

  return (
    <div className={styles.auditorPage}>
      {/* Строка вкладок */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${
            activeTab === "tasks" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("tasks")}
        >
          Задачи
        </button>
        <div className={styles.dropdown}>
          <button
            className={`${styles.tabButton} ${
              activeTab === "inventory" || activeTab === "inventoryHistory"
                ? styles.activeTab
                : ""
            }`}
          >
            Инвентаризация
          </button>
          <div className={styles.dropdownContent}>
            <button onClick={() => setActiveTab("inventory")}>
              Инвентаризация
            </button>
            <button onClick={() => setActiveTab("inventoryHistory")}>
              История инвентаризации
            </button>
          </div>
        </div>
        <button
          className={`${styles.tabButton} ${activeTab === "reports" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          Отчеты
        </button>
      </div>

      {/* Содержимое выбранной вкладки */}
      <div className={styles.tabContent}>
        {activeTab === "tasks" && (
          <div className={styles.tasksContainer}>
            <h2>Задачи</h2>
            {tasks.length > 0 ? (
              <table className={styles.tasksTable}>
                <thead>
                  <tr>
                    <th>Дата отправки</th>
                    <th>Дата завершения</th>
                    <th>Задача</th>
                    <th>Тема</th>
                    <th>Исполнитель</th>
                    <th>Создал</th>
                    <th>Состояние</th>
                    <th>Дата отклика</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td>{task.sendDate}</td>
                      <td>{task.finishDate || "—"}</td>
                      <td>{task.task}</td>
                      <td>{task.subject}</td>
                      <td>{task.responsible}</td>
                      <td>{task.createdBy || "—"}</td>
                      <td>{task.status}</td>
                      <td>{task.responseDate || "—"}</td>
                      <td>
                        {task.status === "В ожидании" && (
                          <>
                            <button
                              className={styles.actionButton}
                              onClick={() => handleApproveTask(task.id)}
                            >
                              Принять
                            </button>
                            <button
                              className={styles.rejectButton}
                              onClick={() => handleRejectTask(task.id)}
                            >
                              Отклонить
                            </button>
                          </>
                        )}
                        {task.status !== "В ожидании" && (
                          <span className={styles.statusText}>
                            Действия недоступны
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Нет задач</p>
            )}
          </div>
        )}

        {activeTab === "inventory" && (
          <div className={styles.inventoryContainer}>
            <h2>Инвентаризация</h2>
            <div className={styles.inventoryActions}>
              <button onClick={handleCreateInventory}>
                Создать инвентаризацию
              </button>
              <button onClick={handleCancelSelectedInventoryItems}>
                Отменить
              </button>
              <button onClick={handleDeleteSelectedInventoryItems}>
                Удалить
              </button>
            </div>
            {inventoryItems.length > 0 ? (
              <div className={styles.inventoryList}>
                {inventoryItems.map((item) => (
                  <div key={item.id} className={styles.inventoryItem}>
                    <div className={styles.inventoryHeader}>
                      <input
                        type="checkbox"
                        checked={selectedInventoryItems.includes(item.id)}
                        onChange={() => handleSelectInventoryItem(item.id)}
                        className={styles.statusCheckbox}
                      />
                      <button
                        onClick={() => handleCompleteInventoryItem(item.id)}
                        disabled={item.status !== "В процессе"}
                        className={styles.completeButton}
                      >
                        Завершить
                      </button>
                      <span>
                        Инвентаризация №{item.inventoryNumber}
                        <span className={styles.statusBadge}>
                          ({item.status})
                        </span>
                      </span>
                      <span className={styles.creationDate}>
                        {item.creationDateTime}
                      </span>
                      <button
                        className={styles.expandButton}
                        onClick={() => toggleInventoryItem(item.id)}
                      >
                        {item.expanded ? "▾" : "▸"}
                      </button>
                      {item.status === "В процессе" && (
                        <>
                          <button
                            onClick={() => handleCancelInventoryItem(item.id)}
                            className={styles.cancelButton}
                          >
                            Отменить
                          </button>
                          <button
                            onClick={() => handleSaveInventory(item.id)}
                            className={styles.saveButton}
                          >
                            Сохранить
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteInventoryItem(item.id)}
                        className={styles.deleteButton}
                      >
                        Удалить
                      </button>
                    </div>
                    {item.expanded && renderInventoryDetails(item)}
                  </div>
                ))}
              </div>
            ) : (
              <p>Нет инвентаризаций</p>
            )}
            <div className={styles.saveCardContainer}>
              <button onClick={handleSaveCard}>Сохранить карточку</button>
            </div>
          </div>
        )}

        {activeTab === "inventoryHistory" && <InventoryHistory />}

        {activeTab === "reports" && <ReportSection />}
      </div>

      {/* Модальное окно для сохранения инвентаризации */}
      {showSaveModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Сохранение инвентаризации</h3>
            <div className={styles.modalForm}>
              <label>
                Ссылка на отчет:
                <input
                  type="text"
                  value={reportLink}
                  onChange={(e) => setReportLink(e.target.value)}
                  placeholder="Вставьте ссылку на отчет"
                  className={styles.modalInput}
                />
              </label>
            </div>
            <div className={styles.modalButtons}>
              <button onClick={handleConfirmSave}>Сохранить</button>
              <button onClick={() => {
                setShowSaveModal(false);
                setReportLink("");
                setSelectedInventoryForSave(null);
              }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
      <AppDownloadDrawer />
    </div>
  );
};

export default AuditorPage;
