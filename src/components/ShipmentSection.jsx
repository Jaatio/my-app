import React, { useState, useEffect } from 'react';
import { ref, onValue, update, push, remove } from 'firebase/database';
import { database } from '../firebase';
import styles from './ShipmentSection.module.css';
import { useAuth } from '../contexts/AuthContext';

const ShipmentSection = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    name: '',
    maxPrice: '',
    minQuantity: ''
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [shipQuantity, setShipQuantity] = useState('');
  const [recipient, setRecipient] = useState('');

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
            nomenclatureCode: data[key].nomenclatureCode || `N${String(key).padStart(6, '0')}`,
            componentType: data[key].componentType || 'Неизвестный тип',
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

  // Выдача товара
  const handleIssueProduct = async () => {
    if (!selectedProduct || !shipQuantity || !recipient.trim()) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    const newQuantity = selectedProduct.quantity - parseInt(shipQuantity);
    if (newQuantity < 0) {
      alert('Недостаточно товара');
      return;
    }

    try {
      // Проверяем наличие всех необходимых полей
      if (!selectedProduct.nomenclatureCode) {
        console.error('Отсутствует код номенклатуры:', selectedProduct);
        alert('Ошибка: отсутствует код номенклатуры');
        return;
      }

      const newShipment = {
        productId: selectedProduct.id,
        componentName: selectedProduct.componentName,
        nomenclatureCode: selectedProduct.nomenclatureCode,
        quantity: Number(shipQuantity),
        price: selectedProduct.price,
        total: selectedProduct.price * Number(shipQuantity),
        date: new Date().toISOString(),
        recipient: recipient,
        issuedBy: currentUser.fullName,
        userId: currentUser.uid
      };

      // Проверяем данные перед отправкой
      console.log('Отправляемые данные:', newShipment);

      // Запись в историю
      await push(ref(database, 'shipments'), newShipment);

      if (newQuantity === 0) {
        // Если товар полностью выдан, удаляем его из базы данных
        await remove(ref(database, `products/${selectedProduct.id}`));
        
        // Обновляем локальное состояние
        setProducts(prevProducts =>
          prevProducts.filter(product => product.id !== selectedProduct.id)
        );
      } else {
        // Обновляем количество в базе данных
        await update(ref(database, `products/${selectedProduct.id}`), {
          quantity: newQuantity,
        });

        // Обновляем локальное состояние
        setProducts(prevProducts =>
          prevProducts.map(product =>
            product.id === selectedProduct.id
              ? { ...product, quantity: newQuantity }
              : product
          )
        );
      }

      setSelectedProduct(null);
      setShipQuantity('');
      setRecipient('');
    } catch (error) {
      console.error("Ошибка при выдаче товара:", error);
      console.error("Данные товара:", selectedProduct);
      alert("Произошла ошибка при выдаче товара");
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
          placeholder="Макс. цена (₽)"
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
          <div key={`${product.id}-${product.nomenclatureCode}`} className={styles.productCard}>
            <h3>{product.componentName}</h3>
            <div className={styles.productInfo}>
              <p>Код номенклатуры: {product.nomenclatureCode}</p>
              <p>Тип компонента: {product.componentType}</p>
              <p>Количество: {product.quantity} {product.unit}</p>
              <p>Цена: {product.price.toFixed(2)} ₽</p>
              <p>Местоположение: {product.location}</p>
            </div>
            {product.quantity > 0 ? (
              <button
                className={styles.issueButton}
                onClick={() => setSelectedProduct(product)}
              >
                Выдать
              </button>
            ) : (
              <div className={styles.outOfStock}>Отсутствует</div>
            )}
          </div>
        ))}
      </div>

      {/* Модальное окно выдачи */}
      {selectedProduct && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Выдача: {selectedProduct.componentName}</h3>
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
              <label>
                Получатель:
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Введите ФИО получателя"
                  required
                />
              </label>
              <div className={styles.modalActions}>
                <button onClick={() => {
                  setSelectedProduct(null);
                  setShipQuantity('');
                  setRecipient('');
                }}>
                  Отмена
                </button>
                <button
                  onClick={handleIssueProduct}
                  disabled={!shipQuantity || shipQuantity < 1 || !recipient.trim()}
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