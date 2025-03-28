// src/components/Register.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../firebase'; // Импортируем database из firebase.js
import { ref, push } from 'firebase/database'; // Импортируем методы для работы с базой данных
import { MdEmail, MdPerson } from 'react-icons/md';
import { RiLockPasswordLine, RiEyeLine, RiEyeOffLine, RiUserSettingsLine } from 'react-icons/ri';
import styles from './Login.module.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('auditor'); // Значение по умолчанию - Аудитор
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('auth-page');
    return () => {
      document.body.classList.remove('auth-page');
    };
  }, []);

  const validateForm = () => {
    const errors = {};
    
    if (!email) {
      errors.email = 'Пожалуйста, введите email';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Пожалуйста, введите корректный email';
    }

    if (!fullName) {
      errors.fullName = 'Пожалуйста, введите ваше ФИО';
    }

    if (!password) {
      errors.password = 'Пожалуйста, введите пароль';
    } else if (password.length < 7) {
      errors.password = 'Пароль должен содержать минимум 7 символов';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

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
        <h1 className={styles.title}>Регистрация в Saud</h1>

        <div className={styles.inputGroup}>
          <div className={styles.inputWrapper}>
            <MdEmail className={styles.inputIcon} />
            <input
              type="email"
              placeholder="Введите вашу электронную почту"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${styles.input} ${validationErrors.email ? styles.inputError : ''}`}
            />
          </div>
          {validationErrors.email && (
            <div className={styles.errorMessage}>{validationErrors.email}</div>
          )}
        </div>

        <div className={styles.inputGroup}>
          <div className={styles.inputWrapper}>
            <MdPerson className={styles.inputIcon} />
            <input
              type="text"
              placeholder="Введите ваше ФИО"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`${styles.input} ${validationErrors.fullName ? styles.inputError : ''}`}
            />
          </div>
          {validationErrors.fullName && (
            <div className={styles.errorMessage}>{validationErrors.fullName}</div>
          )}
        </div>

        <div className={styles.inputGroup}>
          <div className={styles.inputWrapper}>
            <RiUserSettingsLine className={styles.inputIcon} />
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
        </div>

        <div className={styles.inputGroup}>
          <div className={styles.inputWrapper}>
            <RiLockPasswordLine className={styles.inputIcon} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Введите ваш пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${styles.input} ${validationErrors.password ? styles.inputError : ''}`}
            />
            <button
              type="button"
              className={styles.showPasswordButton}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
            </button>
          </div>
          {validationErrors.password && (
            <div className={styles.errorMessage}>{validationErrors.password}</div>
          )}
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <button type="submit" className={styles.loginButton}>
          Зарегистрироваться
        </button>

        <div className={styles.registerLink}>
          Уже есть аккаунт? <a href="/login">Войти</a>
        </div>
      </form>
    </div>
  );
};

export default Register;