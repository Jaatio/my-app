import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { MdEmail } from 'react-icons/md';
import styles from './Login.module.css';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('auth-page');
    return () => {
      document.body.classList.remove('auth-page');
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      setError('');
    } catch (error) {
      setError('Ошибка при отправке письма для сброса пароля. Проверьте правильность email.');
      console.error('Ошибка сброса пароля:', error.message);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Восстановление пароля</h1>
        
        {!success ? (
          <>
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

            {error && <div className={styles.errorMessage}>{error}</div>}

            <button type="submit" className={styles.loginButton}>
              Отправить письмо для сброса
            </button>
          </>
        ) : (
          <div className={styles.successMessage}>
            Письмо для сброса пароля отправлено на вашу почту. Проверьте входящие сообщения.
          </div>
        )}

        <div className={styles.registerLink}>
          <a href="/login">Вернуться к входу</a>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword; 