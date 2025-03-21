import React, { useState, useEffect } from 'react';
import { ref, onValue, update, push } from 'firebase/database';
import { database } from '../firebase';
import styles from './ShipmentSection.module.css';

const ShipmentSection = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    name: '',
    maxPrice: '',
    minQuantity: ''
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [shipQuantity, setShipQuantity] = useState('');

  // Загрузка товаров с нормализацией данных
  useEffect(() => {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedProducts = data 
        ? Object.keys(data).map(key => ({
            id: key,
            componentName: data[key].componentName || 'Без названия',
            price: parseFloat(data[key].price) || 0,
            quantity: parseInt(data[key].quantity) || 0,
            unit: data[key].unit || 'шт.',
            location: data[key].location || 'Не указано',
          }))
        : [];
      setProducts(loadedProducts);
    });
  }, []);

  // Фильтрация товаров
  const filteredProducts = products.filter(product => {
    const matchesName = product.componentName
      .toLowerCase()
      .includes(filters.name.toLowerCase());
    const matchesPrice = filters.maxPrice 
      ? product.price <= parseFloat(filters.maxPrice)
      : true;
    const matchesQuantity = filters.minQuantity 
      ? product.quantity >= parseFloat(filters.minQuantity)
      : true;

    return matchesName && matchesPrice && matchesQuantity;
  });

  // Отправка товара
  const handleSendProduct = async () => {
    if (!selectedProduct || !shipQuantity) return;

    const newQuantity = selectedProduct.quantity - parseInt(shipQuantity);
    if (newQuantity < 0) return alert('Недостаточно товара');

    try {
      // Обновление в Firebase и локальном состоянии
      await update(ref(database, `products/${selectedProduct.id}`), {
        quantity: newQuantity,
      });

      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === selectedProduct.id
            ? { ...product, quantity: newQuantity }
            : product
        )
      );

      // Запись в историю
      push(ref(database, 'shipments'), {
        productId: selectedProduct.id,
        productName: selectedProduct.componentName,
        shippedQuantity: shipQuantity,
        price: selectedProduct.price,
        date: new Date().toISOString()
      });

      setSelectedProduct(null);
      setShipQuantity('');
    } catch (error) {
      alert('Ошибка отправки: ' + error.message);
    }
  };

  return (
    <div className={styles.shipmentSection}>
      {/* Фильтры */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Поиск по названию"
          value={filters.name}
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Макс. цена ($)"
          value={filters.maxPrice}
          onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
        />
        <input
          type="number"
          placeholder="Мин. количество"
          value={filters.minQuantity}
          onChange={(e) => setFilters({ ...filters, minQuantity: e.target.value })}
        />
      </div>

      {/* Список товаров */}
      <div className={styles.productGrid}>
        {filteredProducts.map(product => (
          <div key={product.id} className={styles.productCard}>
            <h3>{product.componentName}</h3>
            <div className={styles.productInfo}>
              <p>Количество: {product.quantity} {product.unit}</p>
              <p>Цена: ${product.price.toFixed(2)}</p>
              <p>Местоположение: {product.location}</p>
            </div>
            {product.quantity > 0 ? (
              <button
                className={styles.sendButton}
                onClick={() => setSelectedProduct(product)}
              >
                Отправить
              </button>
            ) : (
              <div className={styles.outOfStock}>Отсутствует</div>
            )}
          </div>
        ))}
      </div>

      {/* Модальное окно отправки */}
      {selectedProduct && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Отправка: {selectedProduct.componentName}</h3>
            <div className={styles.modalBody}>
              <label>
                Доступно: {selectedProduct.quantity} {selectedProduct.unit}
                <input
                  type="number"
                  value={shipQuantity}
                  onChange={(e) => 
                    setShipQuantity(Math.min(selectedProduct.quantity, e.target.value))
                  }
                  min="1"
                  max={selectedProduct.quantity}
                />
              </label>
              <div className={styles.modalActions}>
                <button onClick={() => setSelectedProduct(null)}>Отмена</button>
                <button
                  onClick={handleSendProduct}
                  disabled={!shipQuantity || shipQuantity < 1}
                >
                  Подтвердить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentSection;