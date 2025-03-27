import React, { useState } from 'react';
import styles from './AppDownloadDrawer.module.css';
import { FiSmartphone } from 'react-icons/fi';
import qrCodeImage from '../../assets/qr-code.png';

const AppDownloadDrawer = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={styles.drawer} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`${styles.content} ${isHovered ? styles.expanded : ''}`}>
        <div className={styles.iconContainer}>
          <FiSmartphone className={styles.phoneIcon} />
        </div>
        {isHovered && (
          <div className={styles.qrContainer}>
            <img src={qrCodeImage} alt="QR код для скачивания приложения" className={styles.qrCode} />
            <div className={styles.instruction}>Отсканируйте чтобы получить приложение на телефон</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppDownloadDrawer; 