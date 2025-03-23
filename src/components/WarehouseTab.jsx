import React, { useEffect, useState } from 'react';
import { database } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { FiFilter, FiX } from 'react-icons/fi';
import styles from './WarehouseTab.module.css';

const WarehouseTab = () => {
  const [products, setProducts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minPrice: '',
    maxPrice: '',
    minSum: '',
    maxSum: '',
    searchTerm: ''
  });

  useEffect(() => {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedProducts = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })) : [];
      setProducts(loadedProducts);
    });
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      minPrice: '',
      maxPrice: '',
      minSum: '',
      maxSum: '',
      searchTerm: ''
    });
  };

  const filteredProducts = products.filter(product => {
    const arrivalDate = new Date(product.arrivalDate);
    const start = filters.startDate ? new Date(filters.startDate) : null;
    const end = filters.endDate ? new Date(filters.endDate) : null;
    
    const matchesDate = (!start || arrivalDate >= start) && 
                       (!end || arrivalDate <= end);
    
    const matchesPrice = (!filters.minPrice || product.price >= parseFloat(filters.minPrice)) &&
                        (!filters.maxPrice || product.price <= parseFloat(filters.maxPrice));
    
    const matchesSum = (!filters.minSum || product.sum >= parseFloat(filters.minSum)) &&
                      (!filters.maxSum || product.sum <= parseFloat(filters.maxSum));
    
    // Исправление здесь:
    const searchTerm = filters.searchTerm?.toLowerCase() || '';
    const componentName = product.componentName?.toLowerCase() || '';
    const matchesSearch = componentName.includes(searchTerm);
  
    return matchesDate && matchesPrice && matchesSum && matchesSearch;
  });
 

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Склад радиоэлектронных компонентов</h2>
        <div className={styles.filterContainer}>
          <button 
            className={styles.filterButton}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? <FiX size={20} /> : <FiFilter size={20} />}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGroup}>
            <input
              type="text"
              placeholder="Поиск по названию"
              name="searchTerm"
              value={filters.searchTerm}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <label>Дата поступления:</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
            <span>—</span>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label>Цена за ед.:</label>
              <input
                type="number"
                placeholder="От"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
              />
              <span>—</span>
              <input
                type="number"
                placeholder="До"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Общая сумма:</label>
              <input
                type="number"
                placeholder="От"
                name="minSum"
                value={filters.minSum}
                onChange={handleFilterChange}
              />
              <span>—</span>
              <input
                type="number"
                placeholder="До"
                name="maxSum"
                value={filters.maxSum}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          <button 
            className={styles.resetButton}
            onClick={resetFilters}
          >
            Сбросить фильтры
          </button>
        </div>
      )}

      <div className={styles.grid}>
        {filteredProducts.map(product => (
          <div key={product.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>{product.componentName}</h3>
              <span className={styles.quantity}>{product.quantity} шт.</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.infoRow}>
                <span>Код:</span>
                <span>{product.nomenclatureCode}</span>
              </div>
              <div className={styles.infoRow}>
                <span>Производитель:</span>
                <span>{product.manufacturer}</span>
              </div>
              <div className={styles.infoRow}>
                <span>Цена за ед.:</span>
                <span>{product.price} ₽</span>
              </div>
              <div className={styles.infoRow}>
                <span>Общая сумма:</span>
                <span>{product.sum} ₽</span>
              </div>
              <div className={styles.infoRow}>
                <span>Место:</span>
                <span>{product.location}</span>
              </div>
              <div className={styles.infoRow}>
                <span>Поступил:</span>
                <span>{new Date(product.arrivalDate).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WarehouseTab;