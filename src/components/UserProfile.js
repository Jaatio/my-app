import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaUser } from 'react-icons/fa';
import styles from './UserProfile.module.css';

const UserProfile = () => {
  const { currentUser } = useAuth();

  // Не отображаем компонент, если нет пользователя или это страница авторизации
  if (!currentUser) {
    return null;
  }

  // Определяем имя для отображения
  const displayName = currentUser.fullName || currentUser.email?.split('@')[0] || 'Гость';

  return (
    <div className={styles.userProfile}>
      <FaUser className={styles.userIcon} />
      <span className={styles.userName}>{displayName}</span>
    </div>
  );
};

export default UserProfile; 