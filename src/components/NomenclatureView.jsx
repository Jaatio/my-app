import React, { useEffect, useState } from 'react';
import { database } from '../firebase';
import { ref, onValue, remove, push } from 'firebase/database';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import styles from '../pages/WarehousePage.module.css';

const NomenclatureView = () => {
  const [products, setProducts] = useState([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const productsRef = ref(database, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      setProducts(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (productId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;
    try {
      await remove(ref(database, `products/${productId}`));
    } catch (error) {
      alert('Ошибка при удалении товара');
    }
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(products);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Номенклатура');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    saveAs(data, `номенклатура_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        const requiredFields = [
          'componentName', 'nomenclatureCode', 'manufacturer', 'unit', 'quantity', 'price', 'sum', 'arrivalDate', 'location'
        ];
        const isValid = jsonData.every(item => requiredFields.every(field => Object.keys(item).includes(field)));
        if (!isValid) throw new Error('Неверная структура файла');
        const dbRef = ref(database, 'products');
        await Promise.all(jsonData.map(item => push(dbRef, item)));
        alert(`Успешно импортировано ${jsonData.length} записей`);
      } catch (error) {
        alert(error.message || 'Ошибка при обработке файла');
      } finally {
        setImporting(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const totalSum = products.reduce((sum, product) => sum + parseFloat(product.sum || 0), 0);
  const dates = products.map(product => new Date(product.arrivalDate)).filter(date => !isNaN(date));
  const minDate = dates.length > 0 ? new Date(Math.min(...dates)).toLocaleDateString() : 'Нет данных';
  const maxDate = dates.length > 0 ? new Date(Math.max(...dates)).toLocaleDateString() : 'Нет данных';

  return (
    <div className={styles.nomenclature}>
      <div className={styles.pdfHeader}>
        <h2>Номенклатура</h2>
        <div className={styles.exportButtons}>
          <label className={styles.importButton}>
            Импорт Excel
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleImportExcel}
              style={{ display: 'none' }}
              disabled={importing}
            />
          </label>
          <button onClick={handleExportExcel} className={styles.excelButton} disabled={importing}>
            Экспорт Excel
          </button>
        </div>
      </div>
      <div className={styles.summary}>
        <p>Общая сумма: <strong>{totalSum.toFixed(2)} ₽</strong></p>
        <p>Диапазон дат: {minDate} — {maxDate}</p>
      </div>
      <table className={styles.productsTable}>
        <thead>
          <tr>
            <th>Наименование</th>
            <th>Тип компонента</th>
            <th>Код</th>
            <th>Производитель</th>
            <th>Ед. изм.</th>
            <th>Количество</th>
            <th>Цена</th>
            <th>Сумма</th>
            <th>Дата поступления</th>
            <th>Местоположение</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td>{product.componentName}</td>
              <td>{product.componentType}</td>
              <td>{product.nomenclatureCode}</td>
              <td>{product.manufacturer}</td>
              <td>{product.unit}</td>
              <td>{product.quantity}</td>
              <td>{product.price} ₽</td>
              <td>{product.sum} ₽</td>
              <td>{new Date(product.arrivalDate).toLocaleDateString()}</td>
              <td>{product.location}</td>
              <td>
                <button className={styles.deleteButton} onClick={() => handleDelete(product.id)} disabled={importing}>
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NomenclatureView; 