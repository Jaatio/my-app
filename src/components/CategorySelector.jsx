import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import styles from './CategorySelector.module.css';

const CategorySelector = ({ onSelect, onClose }) => {
  const [categories, setCategories] = useState({});
  const [collapsedCategories, setCollapsedCategories] = useState({});

  useEffect(() => {
    const categoriesRef = ref(database, 'componentCategories');
    onValue(categoriesRef, (snapshot) => {
      if (snapshot.exists()) {
        setCategories(snapshot.val());
      }
    });
  }, []);

  const toggleCategory = (categoryId) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleSelect = (categoryName, subcategoryName) => {
    onSelect(`${categoryName} - ${subcategoryName}`);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h3>Выберите тип компонента</h3>
        <div className={styles.categoriesList}>
          {Object.entries(categories).map(([categoryId, category]) => (
            <div key={categoryId} className={styles.categoryItem}>
              <div className={styles.categoryHeader}>
                <button
                  onClick={() => toggleCategory(categoryId)}
                  className={styles.collapseButton}
                >
                  {collapsedCategories[categoryId] ? <FaChevronRight /> : <FaChevronDown />}
                  <span className={styles.categoryName}>{category.name}</span>
                </button>
              </div>
              {!collapsedCategories[categoryId] && category.subcategories && (
                <div className={styles.subcategoriesList}>
                  {Object.entries(category.subcategories).map(([subcategoryId, subcategory]) => (
                    <button
                      key={subcategoryId}
                      className={styles.subcategoryButton}
                      onClick={() => handleSelect(category.name, subcategory.name)}
                    >
                      {subcategory.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategorySelector; 