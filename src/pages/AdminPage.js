import React, { useState, useEffect } from 'react';
import { database, auth } from '../firebase';
import { ref, push, onValue, update, remove } from 'firebase/database';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, deleteUser, getAuth } from 'firebase/auth';
import emailjs from '@emailjs/browser';
import './AdminPage.css';
import WarehouseTab from '../components/WarehouseTab';
import ReportsTab from '../components/ReportsTab';
import WarehouseEditor from '../components/WarehouseEditor';
import InventoryHistory from '../components/InventoryHistory';
import ComponentCategories from '../components/ComponentCategories';
import { useAuth } from '../contexts/AuthContext';
import NomenclatureView from '../components/NomenclatureView';

const AdminPage = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('registrationRequests');
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [auditors, setAuditors] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [newSupplier, setNewSupplier] = useState({
    designation: '',
    fullName: '',
    url: '',
    note: '',
  });
  const [adminName, setAdminName] = useState('');

  // Получаем сегодняшнюю дату в формате yyyy-mm-dd
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const minDate = `${yyyy}-${mm}-${dd}`;

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

  // Добавляем новый useEffect для получения имени текущего администратора
  useEffect(() => {
    if (currentUser) {
      const employeesRef = ref(database, 'employees');
      onValue(employeesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const admin = Object.values(data).find(emp => emp.uid === currentUser.uid);
          if (admin) {
            setAdminName(admin.fullName);
          }
        }
      });
    }
  }, [currentUser]);

  // Добавляем новый useEffect для фильтрации аудиторов
  useEffect(() => {
    const filteredAuditors = employees.filter(employee => employee.role === 'auditor');
    setAuditors(filteredAuditors);
  }, [employees]);

  // Existing handler functions remain unchanged
  const handleApproveRequest = async (request) => {
    try {
      console.log('Начало обработки запроса:', request);
      
      // Проверяем наличие всех необходимых данных
      if (!request.email || !request.password || !request.fullName) {
        throw new Error('Отсутствуют необходимые данные для регистрации');
      }

      // Создаем нового пользователя в Firebase Authentication
      console.log('Создание нового пользователя в Firebase Auth...');
      const userCredential = await createUserWithEmailAndPassword(auth, request.email, request.password);
      const user = userCredential.user;
      console.log('Новый пользователь успешно создан в Firebase Auth:', user);
      
      const employeeData = {
        email: request.email,
        fullName: request.fullName,
        role: request.role || 'auditor',
        uid: user.uid,
        createdAt: new Date().toISOString()
      };
      
      console.log('Подготовка данных для добавления в базу:', employeeData);
      
      // Добавляем данные в базу
      const employeeRef = ref(database, 'employees/');
      const newEmployeeRef = await push(employeeRef, employeeData);
      console.log('Данные работника добавлены в базу с ID:', newEmployeeRef.key);
      
      // Удаляем запрос после успешной обработки
      await remove(ref(database, `registrationRequests/${request.id}`));
      console.log('Запрос удален после успешной обработки');
      
      // Отправляем email уведомление
      try {
        console.log('Подготовка к отправке email на адрес:', request.email);
        
        // Проверяем инициализацию EmailJS
        if (!window.emailjs) {
          throw new Error('EmailJS не инициализирован');
        }

        const templateParams = {
          to_name: request.fullName,
          to_email: request.email,
          message: 'Ваша заявка на регистрацию была одобрена. Теперь вы можете войти в систему, используя свой email и пароль.'
        };

        console.log('Отправка email с параметрами:', templateParams);

        // Повторная инициализация на случай, если предыдущая не сработала
        window.emailjs.init("IMc3jXnlcYkRe7-NI");

        const emailResult = await window.emailjs.send(
          'service_p9brucq',
          'template_zt7tnrm',
          templateParams
        );

        console.log('Email успешно отправлен:', emailResult);
        alert('Email уведомление успешно отправлено!');
      } catch (emailError) {
        console.error('Ошибка отправки email:', emailError);
        alert('Ошибка отправки email: ' + emailError.message);
      }
      
      // Обновляем список запросов
      setRegistrationRequests((prev) => {
        const updated = prev.filter((req) => req.id !== request.id);
        console.log('Обновленный список запросов:', updated);
        return updated;
      });

      alert('Пользователь успешно добавлен в систему!');
    } catch (error) {
      console.error('Ошибка при обработке запроса:', error);
      alert(`Ошибка при создании пользователя: ${error.message}`);
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
      createdBy: adminName,
      createdAt: new Date().toISOString(),
      createdByUid: currentUser.uid
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
        <button
          className={`tab-button ${activeTab === 'viewReports' ? 'active' : ''}`}
          onClick={() => setActiveTab('viewReports')}
        >
          Просмотр отчетов
        </button>
        <button
          className={`tab-button ${activeTab === 'auditHistory' ? 'active' : ''}`}
          onClick={() => setActiveTab('auditHistory')}
        >
          История аудитов
        </button>
        <button
          className={`tab-button ${activeTab === 'componentCategories' ? 'active' : ''}`}
          onClick={() => setActiveTab('componentCategories')}
        >
          Категории компонентов
        </button>
        <div className="dropdown">
          <button
            className={`tab-button ${activeTab === 'suppliers' ? 'active' : ''}`}
          >
            Поставщики
          </button>
          <div className="dropdown-content">
            <button onClick={() => setActiveTab('suppliers')}>Поставщики</button>
          </div>
        </div>
        <div className="dropdown">
          <button
            className={`tab-button ${activeTab === 'warehouse' || activeTab === 'warehouseEditor' || activeTab === 'nomenclatureView' ? 'active' : ''}`}
          >
            Склад
          </button>
          <div className="dropdown-content">
            <button onClick={() => setActiveTab('warehouse')}>Управление складом</button>
            <button onClick={() => setActiveTab('warehouseEditor')}>Редактирование склада</button>
            <button onClick={() => setActiveTab('nomenclatureView')}>Просмотр номенклатуры</button>
          </div>
        </div>
      </div>

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
                      <input type="date" name="sendDate" required min={minDate} />
                    </td>
                    <td>
                      <input type="date" name="finishDate" required min={minDate} />
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
                      <select name="responsible" required className="auditor-select">
                        <option value="">Выберите аудитора</option>
                        {auditors.map(auditor => (
                          <option key={auditor.id} value={auditor.fullName}>
                            {auditor.fullName}
                          </option>
                        ))}
                      </select>
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
                    <th>Создал</th>
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
                      <td>{task.createdBy}</td>
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

        {activeTab === 'warehouse' && <WarehouseTab />}
        {activeTab === 'warehouseEditor' && <WarehouseEditor />}
        {activeTab === 'viewReports' && <ReportsTab />}
        {activeTab === 'auditHistory' && <InventoryHistory isAdmin={true} />}
        {activeTab === 'componentCategories' && <ComponentCategories />}
        {activeTab === 'nomenclatureView' && <NomenclatureView />}
      </div>
    </div>
  );
};

export default AdminPage;