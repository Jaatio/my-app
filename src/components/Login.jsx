// src/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../firebase'; // Импортируем auth и database из firebase.js
import { signInWithEmailAndPassword } from 'firebase/auth'; // Импортируем метод для входа
import { ref, get } from 'firebase/database'; // Импортируем методы для работы с базой данных
import { MdEmail } from 'react-icons/md';
import { RiLockPasswordLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { useAuth } from '../contexts/AuthContext';
import styles from './Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { getTargetPage } = useAuth();

  useEffect(() => {
    document.body.classList.add('auth-page');
    
    // Проверяем наличие сохраненной сессии
    const savedSession = sessionStorage.getItem('userSession');
    if (savedSession) {
      const { role } = JSON.parse(savedSession);
      navigate(getTargetPage(role));
    }

    return () => {
      document.body.classList.remove('auth-page');
    };
  }, [navigate, getTargetPage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Получаем данные пользователя из базы данных
      const employeesRef = ref(database, 'employees');
      const snapshot = await get(employeesRef);
      const data = snapshot.val();
      
      if (data) {
        const employeeData = Object.values(data).find(emp => emp.email === email);
        
        if (employeeData) {
          // Перенаправляем пользователя на соответствующую страницу
          navigate(getTargetPage(employeeData.role));
        } else {
          setError('Пользователь не найден в базе данных');
        }
      } else {
        setError('Ошибка получения данных');
      }
    } catch (error) {
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