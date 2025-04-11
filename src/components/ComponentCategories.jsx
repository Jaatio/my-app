import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue, push, remove, update } from 'firebase/database';
import { FaPlus, FaTrash, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import styles from './ComponentCategories.module.css';

const ComponentCategories = () => {
  const [categories, setCategories] = useState({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState({});

  useEffect(() => {
    const categoriesRef = ref(database, 'componentCategories');
    onValue(categoriesRef, (snapshot) => {
      if (snapshot.exists()) {
        setCategories(snapshot.val());
      }
    });
  }, []);

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const categoriesRef = ref(database, 'componentCategories');
      const newCategoryRef = push(categoriesRef);
      update(newCategoryRef, {
        name: newCategoryName.trim(),
        subcategories: {}
      });
      setNewCategoryName('');
    }
  };

  const handleAddSubcategory = (categoryId) => {
    const name = prompt('Введите название подкатегории:');
    if (name && name.trim()) {
      const subcategoriesRef = ref(database, `componentCategories/${categoryId}/subcategories`);
      push(subcategoriesRef, {
        name: name.trim()
      });
    }
  };

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту категорию?')) {
      const categoryRef = ref(database, `componentCategories/${categoryId}`);
      remove(categoryRef);
    }
  };

  const handleDeleteSubcategory = (categoryId, subcategoryId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту подкатегорию?')) {
      const subcategoryRef = ref(database, `componentCategories/${categoryId}/subcategories/${subcategoryId}`);
      remove(subcategoryRef);
    }
  };

  const toggleCategory = (categoryId) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.addCategory}>
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Название новой категории"
          className={styles.input}
        />
        <button onClick={handleAddCategory} className={styles.addButton}>
          Добавить компонент
        </button>
      </div>

      <div className={styles.categoriesList}>
        {Object.entries(categories).map(([categoryId, category]) => (
          <div key={categoryId} className={styles.categoryItem}>
            <div className={styles.categoryHeader}>
              <div className={styles.categoryTitle}>
                <button
                  onClick={() => toggleCategory(categoryId)}
                  className={styles.collapseButton}
                >
                  {collapsedCategories[categoryId] ? <FaChevronRight /> : <FaChevronDown />}
                </button>
                <span className={styles.categoryName}>{category.name}</span>
              </div>
              <div className={styles.categoryActions}>
                <button
                  onClick={() => handleAddSubcategory(categoryId)}
                  className={styles.actionButton}
                  title="Добавить подкатегорию"
                >
                  <FaPlus />
                </button>
                <button
                  onClick={() => handleDeleteCategory(categoryId)}
                  className={styles.actionButton}
                  title="Удалить категорию"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            {!collapsedCategories[categoryId] && category.subcategories && (
              <div className={styles.subcategoriesList}>
                {Object.entries(category.subcategories).map(([subcategoryId, subcategory]) => (
                  <div key={subcategoryId} className={styles.subcategoryItem}>
                    <span className={styles.subcategoryName}>{subcategory.name}</span>
                    <button
                      onClick={() => handleDeleteSubcategory(categoryId, subcategoryId)}
                      className={styles.actionButton}
                      title="Удалить подкатегорию"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComponentCategories; 