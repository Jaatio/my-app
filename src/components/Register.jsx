// src/components/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../firebase'; // Импортируем database из firebase.js
import { ref, push } from 'firebase/database'; // Импортируем методы для работы с базой данных
import styles from './Login.module.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('auditor'); // Значение по умолчанию - Аудитор
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Отправляем запрос на регистрацию в базу данных
      const registrationRequest = {
        email,
        fullName,
        role,
        password,
        status: 'pending' // Статус запроса: pending (ожидает), approved (одобрено), rejected (отклонено)
      };

      // Сохраняем запрос в базе данных
      await push(ref(database, 'registrationRequests/'), registrationRequest);

      // После успешной отправки перенаправляем на страницу логина
      navigate('/login');
      setError('');
    } catch (error) {
      setError('Ошибка регистрации: ' + error.message);
      console.error('Ошибка регистрации:', error.message);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <input
            type="email"
            placeholder="Введите вашу электронную почту"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Введите ваше ФИО"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup}>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={styles.input}
          >
            <option value="auditor">Аудитор</option>
            <option value="warehouse">Складской оператор</option>
            <option value="admin">Администратор</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <input
            type="password"
            placeholder="Введите ваш пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <button type="submit" className={styles.loginButton}>
          Зарегистрироваться
        </button>

        <div className={styles.registerLink}>
          Уже есть аккаунт? <span onClick={() => navigate('/login')} style={{ cursor: 'pointer', color: '#007bff' }}>Войти</span>
        </div>
      </form>
    </div>
  );
};

export default Register;