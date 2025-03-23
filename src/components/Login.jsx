// src/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../firebase'; // Импортируем auth и database из firebase.js
import { signInWithEmailAndPassword } from 'firebase/auth'; // Импортируем метод для входа
import { ref, onValue, update } from 'firebase/database'; // Импортируем методы для работы с базой данных
import { MdEmail } from 'react-icons/md';
import { RiLockPasswordLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import styles from './Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('auth-page');
    return () => {
      document.body.classList.remove('auth-page');
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Вход через Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Получаем данные пользователя из базы данных
      const employeesRef = ref(database, 'employees');
      onValue(employeesRef, async (snapshot) => {
        const data = snapshot.val();
        let userData = null;

        // Ищем пользователя по email или UID
        for (let id in data) {
          if (data[id].email === email || data[id].uid === user.uid) {
            userData = data[id];
            break;
          }
        }

        console.log('Найденные данные пользователя:', userData);

        if (userData) {
          // Обновляем uid пользователя, если он изменился
          if (userData.uid !== user.uid) {
            await update(ref(database, `employees/${userData.id}`), {
              uid: user.uid
            });
          }

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
          console.error('Пользователь не найден в базе данных');
          setError('Пользователь не найден в базе данных');
        }
      }, {
        onlyOnce: true
      });
    } catch (error) {
      console.error('Ошибка входа:', error);
      setError('Неверный email или пароль');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Войдите в Saud</h1>
        
        <div className={styles.inputGroup}>
          <div className={styles.inputWrapper}>
            <MdEmail className={styles.inputIcon} />
            <input
              type="email"
              placeholder="Введите вашу электронную почту"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <div className={styles.inputWrapper}>
            <RiLockPasswordLine className={styles.inputIcon} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Введите ваш пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
            />
            <button
              type="button"
              className={styles.showPasswordButton}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
            </button>
          </div>
        </div>

        <div className={styles.forgotPassword}>
          <a href="/reset-password">Забыли пароль</a>
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