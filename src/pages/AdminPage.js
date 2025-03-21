import React, { useState, useEffect } from 'react';
import { database, auth } from '../firebase';
import { ref, push, onValue, update, remove } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import './AdminPage.css';
import WarehouseTab from '../components/WarehouseTab'; // Import the new component
import ReportsTab from '../components/ReportsTab';


const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('registrationRequests');
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [newSupplier, setNewSupplier] = useState({
    designation: '',
    fullName: '',
    url: '',
    note: '',
  });

  // Existing useEffect hooks remain unchanged
  useEffect(() => {
    const requestsRef = ref(database, 'registrationRequests/');
    onValue(requestsRef, (snapshot) => {
      const data = snapshot.val();
      let requestsArray = [];
      for (let id in data) {
        if (data[id].status === 'pending') {
          requestsArray.push({ id, ...data[id] });
        }
      }
      setRegistrationRequests(requestsArray);
    });
  }, []);

  useEffect(() => {
    const employeesRef = ref(database, 'employees/');
    onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      let employeesArray = [];
      for (let id in data) {
        employeesArray.push({ id, ...data[id] });
      }
      setEmployees(employeesArray);
    });
  }, []);

  useEffect(() => {
    const tasksRef = ref(database, 'tasks/');
    onValue(tasksRef, (snapshot) => {
      const data = snapshot.val();
      let tasksArray = [];
      for (let id in data) {
        tasksArray.push({ id, ...data[id] });
      }
      setTasks(tasksArray);
    });
  }, []);

  useEffect(() => {
    const suppliersRef = ref(database, 'suppliers/');
    onValue(suppliersRef, (snapshot) => {
      const data = snapshot.val();
      let suppliersArray = [];
      for (let id in data) {
        suppliersArray.push({ id, ...data[id] });
      }
      setSuppliers(suppliersArray);
    });
  }, []);

  // Existing handler functions remain unchanged
  const handleApproveRequest = async (request) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, request.email, request.password);
      const user = userCredential.user;
      const employeeData = {
        email: request.email,
        fullName: request.fullName,
        role: request.role,
        uid: user.uid,
      };
      await push(ref(database, 'employees/'), employeeData);
      await update(ref(database, `registrationRequests/${request.id}`), { status: 'approved' });
      setRegistrationRequests((prev) => prev.filter((req) => req.id !== request.id));
    } catch (error) {
      console.error('Ошибка при создании пользователя:', error);
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      await update(ref(database, `registrationRequests/${id}`), { status: 'rejected' });
      setRegistrationRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (error) {
      console.error('Ошибка при отклонении запроса:', error);
    }
  };

  const handleDeleteEmployee = async (id) => {
    try {
      await remove(ref(database, `employees/${id}`));
    } catch (error) {
      console.error('Ошибка при удалении работника:', error);
    }
  };

  const handleTaskSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const newTask = {
      sendDate: formData.get('sendDate'),
      finishDate: formData.get('finishDate'),
      task: formData.get('task'),
      subject: formData.get('subject'),
      responsible: formData.get('responsible'),
      status: formData.get('status') || 'В ожидании',
    };
    try {
      await push(ref(database, 'tasks/'), newTask);
      event.target.reset();
    } catch (error) {
      console.error('Ошибка при сохранении задачи:', error);
    }
  };

  const handleCancel = async (id) => {
    const currentTime = new Date();
    const responseTime = currentTime.toLocaleTimeString();
    const responseDate = currentTime.toLocaleDateString();
    try {
      await update(ref(database, 'tasks/' + id), {
        status: 'Отменено',
        responseTime: responseTime,
        responseDate: responseDate,
      });
    } catch (error) {
      console.error('Ошибка при обновлении задачи:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await remove(ref(database, 'tasks/' + id));
    } catch (error) {
      console.error('Ошибка при удалении задачи:', error);
    }
  };

  const handleSupplierInputChange = (e) => {
    const { name, value } = e.target;
    setNewSupplier((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!newSupplier.designation || !newSupplier.fullName || !newSupplier.url) {
      alert('Заполните обязательные поля: Обозначение, Полное наименование и URL.');
      return;
    }
    try {
      await push(ref(database, 'suppliers/'), newSupplier);
      setNewSupplier({ designation: '', fullName: '', url: '', note: '' });
    } catch (error) {
      console.error('Ошибка при добавлении поставщика:', error);
    }
  };

  const handleDeleteSupplier = async (id) => {
    try {
      await remove(ref(database, 'suppliers/' + id));
    } catch (error) {
      console.error('Ошибка при удалении поставщика:', error);
    }
  };

  return (
    <div className="admin-page">
      {/* Tabs Navigation */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'registrationRequests' ? 'active' : ''}`}
          onClick={() => setActiveTab('registrationRequests')}
        >
          Запросы на регистрацию
        </button>
        <button
          className={`tab-button ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          Работники
        </button>
        <button
          className={`tab-button ${activeTab === 'createTask' ? 'active' : ''}`}
          onClick={() => setActiveTab('createTask')}
        >
          Создание задачи
        </button>
        <div className="dropdown">
          <button
            className={`tab-button ${activeTab === 'suppliers' || activeTab === 'ordersHistory' ? 'active' : ''}`}
          >
            Поставщики
          </button>
          <div className="dropdown-content">
            <button onClick={() => setActiveTab('suppliers')}>Поставщики</button>
            <button onClick={() => setActiveTab('ordersHistory')}>История заказов</button>
          </div>
        </div>
        {/* New Warehouse Tab */}
        <button
          className={`tab-button ${activeTab === 'warehouse' ? 'active' : ''}`}
          onClick={() => setActiveTab('warehouse')}
        >
          Склад
        </button>
      </div>

      <button
        className={`tab-button ${activeTab === 'viewReports' ? 'active' : ''}`}
        onClick={() => setActiveTab('viewReports')}
      >
        Просмотр отчетов
      </button>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'registrationRequests' && (
          <div className="registration-requests">
            <h2>Запросы на регистрацию</h2>
            <table className="requests-table">
              <thead>
                <tr>
                  <th>ФИО</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {registrationRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.fullName}</td>
                    <td>{request.email}</td>
                    <td>{request.role}</td>
                    <td>
                      <button onClick={() => handleApproveRequest(request)}>Принять</button>
                      <button onClick={() => handleRejectRequest(request.id)}>Отклонить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="employees-tab">
            <h2>Работники</h2>
            <table className="employees-table">
              <thead>
                <tr>
                  <th>ФИО</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.fullName}</td>
                    <td>{employee.email}</td>
                    <td>{employee.role}</td>
                    <td>
                      <button onClick={() => handleDeleteEmployee(employee.id)}>Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'createTask' && (
          <div className="create-task">
            <h2>Создание задачи</h2>
            <form onSubmit={handleTaskSubmit}>
              <table className="task-table">
                <thead>
                  <tr>
                    <th>Дата отправки</th>
                    <th>Дата завершения</th>
                    <th>Задача</th>
                    <th>Тема</th>
                    <th>Ответственный исполнитель</th>
                    <th>Состояние</th>
                    <th>Сохранить</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <input type="date" name="sendDate" required />
                    </td>
                    <td>
                      <input type="date" name="finishDate" required />
                    </td>
                    <td>
                      <textarea
                        name="task"
                        placeholder="Описание задачи"
                        className="expandable-field"
                        rows={3}
                        required
                      />
                    </td>
                    <td>
                      <textarea
                        name="subject"
                        placeholder="Тема"
                        className="expandable-field"
                        rows={3}
                        required
                      />
                    </td>
                    <td>
                      <input type="text" name="responsible" placeholder="Исполнитель" required />
                    </td>
                    <td>
                      <select name="status" required>
                        <option value="">Выбрать</option>
                        <option value="В ожидании">В ожидании</option>
                        <option value="В процессе">В процессе</option>
                        <option value="Завершено">Завершено</option>
                      </select>
                    </td>
                    <td>
                      <button type="submit">Сохранить</button>
                    </td>
                  </tr>
                </tbody>
              </table>

              <h2>Список задач</h2>
              <table className="task-table">
                <thead>
                  <tr>
                    <th>Дата отправки</th>
                    <th>Дата завершения</th>
                    <th>Задача</th>
                    <th>Тема</th>
                    <th>Исполнитель</th>
                    <th>Состояние</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td>{task.sendDate}</td>
                      <td>{task.finishDate}</td>
                      <td>{task.task}</td>
                      <td>{task.subject}</td>
                      <td>{task.responsible}</td>
                      <td>{task.status}</td>
                      <td>
                        <button onClick={() => handleCancel(task.id)}>Отменить</button>
                        <button onClick={() => handleDelete(task.id)}>Удалить</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </form>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="suppliers-tab">
            <h2>Поставщики</h2>
            <form onSubmit={handleAddSupplier}>
              <table className="supplier-table">
                <thead>
                  <tr>
                    <th>Обозначение</th>
                    <th>Полное наименование</th>
                    <th>URL</th>
                    <th>Примечание</th>
                    <th>Добавить</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <input
                        type="text"
                        name="designation"
                        value={newSupplier.designation}
                        onChange={handleSupplierInputChange}
                        placeholder="Обозначение"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="fullName"
                        value={newSupplier.fullName}
                        onChange={handleSupplierInputChange}
                        placeholder="Полное наименование"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="url"
                        name="url"
                        value={newSupplier.url}
                        onChange={handleSupplierInputChange}
                        placeholder="URL"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="note"
                        value={newSupplier.note}
                        onChange={handleSupplierInputChange}
                        placeholder="Примечание"
                      />
                    </td>
                    <td>
                      <button type="submit">Добавить</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </form>

            <h2>Список поставщиков</h2>
            <table className="supplier-table">
              <thead>
                <tr>
                  <th>Обозначение</th>
                  <th>Полное наименование</th>
                  <th>URL</th>
                  <th>Примечание</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.designation}</td>
                    <td>{supplier.fullName}</td>
                    <td>{supplier.url}</td>
                    <td>{supplier.note}</td>
                    <td>
                      <button onClick={() => handleDeleteSupplier(supplier.id)}>Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'ordersHistory' && (
          <div className="orders-history">
            <p>История заказов (будет реализовано позже).</p>
          </div>
        )}

        {/* Render WarehouseTab when selected */}
        {activeTab === 'warehouse' && <WarehouseTab />}
        {activeTab === 'viewReports' && <ReportsTab />}
      </div>
    </div>
  );
};

export default AdminPage;