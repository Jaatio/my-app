import React, { useState, useEffect } from 'react';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import { database } from '../firebase';
import styles from './ShipmentHistory.module.css';

const ShipmentHistory = () => {
  const [shipments, setShipments] = useState([]);
  const [filters, setFilters] = useState({
    name: '',
    quantity: '',
    total: ''
  });

  // Загрузка истории отправок
  useEffect(() => {
    const shipmentsRef = query(ref(database, 'shipments'), orderByChild('date'));
    onValue(shipmentsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedShipments = data 
        ? Object.keys(data).map(key => ({
            id: key,
            productName: data[key].productName || 'Без названия',
            shippedQuantity: parseInt(data[key].shippedQuantity) || 0,
            price: parseFloat(data[key].price) || 0,
            date: new Date(data[key].date).toLocaleDateString('ru-RU'),
            total: (parseFloat(data[key].price) * parseInt(data[key].shippedQuantity)).toFixed(2)
          }))
        : [];
      setShipments(loadedShipments.reverse());
    });
  }, []);

  // Фильтрация отправок
  const filteredShipments = shipments.filter(shipment => {
    const matchesName = shipment.productName
      .toLowerCase()
      .includes(filters.name.toLowerCase());
    const matchesQuantity = filters.quantity 
      ? shipment.shippedQuantity >= parseFloat(filters.quantity)
      : true;
    const matchesTotal = filters.total 
      ? shipment.total >= parseFloat(filters.total)
      : true;

    return matchesName && matchesQuantity && matchesTotal;
  });

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>История отправок</h1>
      
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Поиск по названию"
          value={filters.name}
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Мин. количество"
          value={filters.quantity}
          onChange={(e) => setFilters({ ...filters, quantity: e.target.value })}
        />
        <input
          type="number"
          placeholder="Мин. общая сумма"
          value={filters.total}
          onChange={(e) => setFilters({ ...filters, total: e.target.value })}
        />
      </div>

      <div className={styles.shipmentsGrid}>
        {filteredShipments.map(shipment => (
          <div key={shipment.id} className={styles.shipmentCard}>
            <h3>{shipment.productName}</h3>
            <div className={styles.shipmentDetails}>
              <p>Количество: {shipment.shippedQuantity}</p>
              <p>Цена за единицу: {shipment.price.toFixed(2)} ₽</p>
              <p>Общая сумма: {shipment.total} ₽</p>
              <p>Дата отправки: {shipment.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShipmentHistory;