// src/components/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../firebase'; // Импортируем auth и database из firebase.js
import { signInWithEmailAndPassword } from 'firebase/auth'; // Импортируем метод для входа
import { ref, onValue } from 'firebase/database'; // Импортируем методы для работы с базой данных
import styles from './Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Вход через Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Получаем данные пользователя из базы данных
      const userRef = ref(database, `employees/`);
      onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        let userData = null;

        // Ищем пользователя по UID
        for (let id in data) {
          if (data[id].uid === user.uid) {
            userData = data[id];
            break;
          }
        }

        if (userData) {
          // Перенаправляем пользователя в зависимости от его роли
          switch (userData.role) {
            case 'admin':
              navigate('/admin');
              break;
            case 'manager':
              navigate('/manager');
              break;
            case 'warehouse':
              navigate('/warehouse');
              break;
            case 'auditor':
              navigate('/auditor');
              break;
            default:
              setError('У вас нет доступа к этой странице');
          }
        } else {
          setError('Пользователь не найден в базе данных');
        }
      });
    } catch (error) {
      setError('Неверный email или пароль');
      console.error('Ошибка входа:', error.message);
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
            type="password"
            placeholder="Введите ваш пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <button type="submit" className={styles.loginButton}>
          Войти
        </button>

        <div className={styles.registerLink}>
          У вас нет аккаунта? <a href="/register">Зарегистрироваться</a>
        </div>
      </form>
    </div>
  );
};

export default Login;