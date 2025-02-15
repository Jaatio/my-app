import React, { useState } from 'react';
import { auth, database } from './firebase';
import { ref, get } from 'firebase/database';
import { signInWithEmailAndPassword } from 'firebase/auth';
import styles from './AdminAuth.module.css';

const AdminAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const checkAdminRole = async (userId) => {
    const adminRef = ref(database, `admins/${userId}`);
    const snapshot = await get(adminRef);
    return snapshot.exists();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const isAdmin = await checkAdminRole(userCredential.user.uid);
      
      if (!isAdmin) {
        setError('Доступ запрещен: недостаточно прав');
        await auth.signOut();
        return;
      }
      
      // Перенаправление в админ-панель
      console.log('Администратор авторизован');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.modal}>
      <h2>Авторизация администратора</h2>
      <form onSubmit={handleLogin}>
        <div className={styles.formGroup}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Пароль:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <button type="submit" className={styles.loginButton}>
          Войти
        </button>
      </form>
    </div>
  );
};

export default AdminAuth;