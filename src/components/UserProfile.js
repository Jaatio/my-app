import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import styles from './UserProfile.module.css';

const UserProfile = () => {
  const { currentUser } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  let timeoutId = null;

  const handleMouseEnter = useCallback(() => {
    if (timeoutId) clearTimeout(timeoutId);
    setShowDropdown(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutId = setTimeout(() => {
      setShowDropdown(false);
    }, 300); // Задержка в 300мс
  }, []);

  // Не отображаем компонент, если нет пользователя или это страница авторизации
  if (!currentUser) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Очищаем сессию
      sessionStorage.clear();
      localStorage.clear();
      navigate('/login');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  // Определяем имя для отображения
  const displayName = currentUser.fullName || currentUser.email?.split('@')[0] || 'Гость';

  return (
    <div 
      className={styles.userProfile}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.userInfo}>
        <FaUser className={styles.userIcon} />
        <span className={styles.userName}>{displayName}</span>
      </div>
      
      <div className={`${styles.dropdown} ${showDropdown ? styles.show : ''}`}>
        <button 
          className={styles.dropdownItem}
          onClick={handleLogout}
        >
          <FaSignOutAlt className={styles.itemIcon} />
          <span>Выйти</span>
        </button>
      </div>
    </div>
  );
};

export default UserProfile; 