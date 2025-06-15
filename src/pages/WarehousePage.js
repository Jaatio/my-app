import React, { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { database } from "../firebase";
import { ref, onValue, remove, push } from "firebase/database";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import styles from "./WarehousePage.module.css";
import ShipmentSection from '../components/ShipmentSection';
import ShipmentHistory from '../components/ShipmentHistory';
import ReportSection from '../components/ReportSection';
import AppDownloadDrawer from '../components/AppDownloadDrawer/AppDownloadDrawer';
import CategorySelector from '../components/CategorySelector';
import { FaSearch } from 'react-icons/fa';

// Список единиц измерения для радиоэлектронных компонентов
const UNITS = [
  "шт.", // штуки
  "м", // метры
  "см", // сантиметры
  "мм", // миллиметры
  "кг", // килограммы
  "г", // граммы
  "мг", // миллиграммы
  "л", // литры
  "мл", // миллилитры
  "В", // вольты
  "мВ", // милливольты
  "А", // амперы
  "мА", // миллиамперы
  "Ом", // омы
  "кОм", // килоомы
  "МОм", // мегаомы
  "Гц", // герцы
  "кГц", // килогерцы
  "МГц", // мегагерцы
  "Ф", // фарады
  "мкФ", // микрофарады
  "нФ", // нанофарады
  "пФ", // пикофарады
  "Гн", // генри
  "мГн", // миллигенри
  "мкГн", // микрогенри
];

const WarehousePage = () => {
  const [selectedOption, setSelectedOption] = useState("shipment");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [formData, setFormData] = useState({
    componentName: "",
    componentType: "",
    nomenclatureCode: "",
    manufacturer: "",
    unit: UNITS[0],
    quantity: "",
    price: "",
    sum: "",
    arrivalDate: "",
    warehouseId: "",
    sectionId: "",
  });
  const [qrData, setQrData] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState({});
  const [nextNomenclatureCode, setNextNomenclatureCode] = useState(1);

  const qrRef = useRef(null);

  // Загрузка данных из Firebase
  useEffect(() => {
    // Загрузка продуктов
    const productsRef = ref(database, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data === null) {
        setProducts([]); // Если данных нет, устанавливаем пустой массив
        return;
      }
      const loadedProducts = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      setProducts(loadedProducts);
      
      // Определение следующего кода номенклатуры на основе последней записи
      if (loadedProducts.length > 0) {
        // Сортируем продукты по коду номенклатуры в порядке убывания
        const sortedProducts = [...loadedProducts].sort((a, b) => {
          const aNum = parseInt(a.nomenclatureCode?.replace(/[^0-9]/g, '') || '0');
          const bNum = parseInt(b.nomenclatureCode?.replace(/[^0-9]/g, '') || '0');
          return bNum - aNum;
        });
        
        // Берем код последней номенклатуры и увеличиваем на 1
        const lastCode = parseInt(sortedProducts[0]?.nomenclatureCode?.replace(/[^0-9]/g, '') || '0');
        setNextNomenclatureCode(lastCode + 1);
      }
    });

    // Загрузка складов
    const warehousesRef = ref(database, 'warehouses');
    const unsubscribeWarehouses = onValue(warehousesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setWarehouses(data);
    });

    // Отписываемся от слушателей при размонтировании компонента
    return () => {
      unsubscribe();
      unsubscribeWarehouses();
    };
  }, []);

  // Подсчет общей суммы и диапазона дат
  const totalSum = products.reduce((sum, product) => sum + parseFloat(product.sum || 0), 0);
  const dates = products.map(product => new Date(product.arrivalDate)).filter(date => !isNaN(date));
  const minDate = dates.length > 0 ? new Date(Math.min(...dates)).toLocaleDateString() : "Нет данных";
  const maxDate = dates.length > 0 ? new Date(Math.max(...dates)).toLocaleDateString() : "Нет данных";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'price' || name === 'quantity') {
        const price = parseFloat(newData.price) || 0;
        const quantity = parseFloat(newData.quantity) || 0;
        newData.sum = (price * quantity).toFixed(2);
      }
      return newData;
    });
  };

  const handleWarehouseChange = (e) => {
    const warehouseId = e.target.value;
    setFormData(prev => ({
      ...prev,
      warehouseId,
      sectionId: '', // Сброс выбранной секции при смене склада
    }));
  };

  const handleSectionChange = (e) => {
    const sectionId = e.target.value;
    setFormData(prev => ({
      ...prev,
      sectionId,
    }));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    
    // Формирование местоположения из выбранного склада и секции
    const selectedWarehouse = warehouses[formData.warehouseId];
    const selectedSection = selectedWarehouse?.sections?.[formData.sectionId];
    const location = selectedWarehouse && selectedSection
      ? `${selectedWarehouse.name} - ${selectedSection.name}`
      : '';

    // Создаем объект с данными для QR-кода
    const productData = {
      ...formData,  // Здесь включается componentType из formData
      nomenclatureCode: `N${String(nextNomenclatureCode).padStart(6, '0')}`,
      location,
    };

    // Преобразуем объект в JSON для QR-кода
    setQrData(JSON.stringify(productData));
    setIsModalOpen(true);

    // Очищаем форму
    setFormData({
      componentName: "",
      componentType: "", // Сбрасываем тип компонента
      nomenclatureCode: "",
      manufacturer: "",
      unit: UNITS[0],
      quantity: "",
      price: "",
      sum: "",
      arrivalDate: "",
      warehouseId: "",
      sectionId: "",
    });

    // Увеличиваем счетчик для следующего кода номенклатуры
    setNextNomenclatureCode(prev => prev + 1);
  };

  // Функция для сохранения QR-кода как PNG
  const handleSaveQR = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.download = "qr-code.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  // Функция для открытия/закрытия модального окна
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  // Удаление продукта
  const handleDelete = async (productId) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот товар?")) {
      return;
    }

    try {
      const productRef = ref(database, `products/${productId}`);
      await remove(productRef);
      
      // Обновляем локальное состояние без перезагрузки всех данных
      setProducts(prevProducts => {
        const updatedProducts = prevProducts.filter(product => product.id !== productId);
        
        // Обновляем номер следующей номенклатуры если нужно
        if (updatedProducts.length > 0) {
          const sortedProducts = [...updatedProducts].sort((a, b) => {
            const aNum = parseInt(a.nomenclatureCode?.replace(/[^0-9]/g, '') || '0');
            const bNum = parseInt(b.nomenclatureCode?.replace(/[^0-9]/g, '') || '0');
            return bNum - aNum;
          });
          const lastCode = parseInt(sortedProducts[0]?.nomenclatureCode?.replace(/[^0-9]/g, '') || '0');
          setNextNomenclatureCode(lastCode + 1);
        }
        
        return updatedProducts;
      });
    } catch (error) {
      console.error("Ошибка при удалении товара:", error);
      alert("Произошла ошибка при удалении товара");
    }
  };

  const handleExportPDF = () => {
    try {
      if (!products || products.length === 0) {
        alert("Нет данных для экспорта");
        return;
      }

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);

      const headers = [
        "Наименование",
        "Тип компонента",
        "Код",
        "Производитель",
        "Ед. изм.",
        "Количество",
        "Цена",
        "Сумма",
        "Дата поступления",
        "Местоположение"
      ];

      const data = products.map(product => {
        // Обработка числовых значений
        const quantity = Number(product.quantity) || 0;
        const price = Number(product.price) || 0;
        const sum = Number(product.sum) || 0;

        // Обработка даты
        const date = product.arrivalDate
          ? new Date(product.arrivalDate)
          : null;

        return [
          (product.componentName || "-").substring(0, 25),
          (product.componentType || "-").substring(0, 25),
          product.nomenclatureCode || "-",
          (product.manufacturer || "-").substring(0, 25),
          product.unit || "-",
          quantity.toLocaleString("ru-RU"),
          `${price.toFixed(2)} ₽`,
          `${sum.toFixed(2)} ₽`,
          date ? date.toLocaleDateString("ru-RU") : "-",
          (product.location || "-").substring(0, 30)
        ];
      });

      // Генерация таблицы
      doc.autoTable({
        head: [headers],
        body: data,
        startY: 20,
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 10,
          cellPadding: 3,
          lineColor: [44, 62, 80],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
          halign: "center"
        },
        bodyStyles: {
          halign: "left",
          valign: "middle"
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 30 },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20, halign: "right" },
          6: { cellWidth: 20, halign: "right" },
          7: { cellWidth: 20, halign: "right" },
          8: { cellWidth: 25 },
          9: { cellWidth: 35 }
        },
        margin: { top: 20, right: 10, left: 10 },
        pageBreak: "auto",
        tableWidth: "wrap"
      });

      doc.save(`отчет_${new Date().toISOString().slice(0,10)}.pdf`);

    } catch (error) {
      console.error("Ошибка генерации PDF:", error);
      alert("Ошибка при создании документа. Проверьте данные.");
    }
  };

  // Экспорт в Excel
  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(products);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Номенклатура");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    saveAs(data, `номенклатура_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // Импорт из Excel
  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Валидация структуры
        const requiredFields = [
          'componentName',
          'nomenclatureCode',
          'manufacturer',
          'unit',
          'quantity',
          'price',
          'sum',
          'arrivalDate',
          'location'
        ];

        const isValid = jsonData.every(item =>
          requiredFields.every(field => Object.keys(item).includes(field))
        );

        if (!isValid) throw new Error("Неверная структура файла");

        // Запись в базу данных
        const dbRef = ref(database, 'products');
        await Promise.all(jsonData.map(item => push(dbRef, item)));

        alert(`Успешно импортировано ${jsonData.length} записей`);
      } catch (error) {
        console.error("Ошибка импорта:", error);
        alert(error.message || "Ошибка при обработке файла");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSelectCategory = (category) => {
    setFormData(prev => ({
      ...prev,
      componentType: category
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.centralLine}>
        <div
          className={styles.dropdownContainer}
          onMouseEnter={() => setDropdownVisible(true)}
          onMouseLeave={() => setDropdownVisible(false)}
        >
          <h1 className={styles.pageTitle}>Выбор действия</h1>
          {dropdownVisible && (
            
            <div className={styles.dropdownContent}>
              <button
                className={`${styles.dropdownButton} ${
                  selectedOption === "generateQR" ? styles.active : ""
                }`}
                onClick={() => setSelectedOption("generateQR")}
              >
                Генерация QR-кода
              </button>
              <button
                className={`${styles.dropdownButton} ${
                  selectedOption === "nomenclature" ? styles.active : ""
                }`}
                onClick={() => setSelectedOption("nomenclature")}
              >
                Номенклатура
              </button>
              <button
                className={`${styles.dropdownButton} ${
                  selectedOption === "shipment" ? styles.active : ""
                }`}
                onClick={() => setSelectedOption("shipment")}
              >
                Выдача товара
              </button>
              <button
                className={`${styles.dropdownButton} ${
                  selectedOption === "shipmentHistory" ? styles.active : ""
                }`}
                onClick={() => setSelectedOption("shipmentHistory")}
              >
                История выдачи
              </button>
              <button
                className={`${styles.dropdownButton} ${
                  selectedOption === "sendReport" ? styles.active : ""
                }`}
                onClick={() => setSelectedOption("sendReport")}
              >
                Отправка отчета
              </button>
              
            </div>
          )}
        </div>
      </div>

      {selectedOption === "generateQR" && (
        <div className={styles.qrSection}>
          <h2>Генерация QR-кода</h2>
          {qrData && (
            <div className={styles.qrCode}>
              <div className={styles.qrContainer} onClick={toggleModal}>
                <QRCodeSVG
                  ref={qrRef}
                  value={qrData}
                  size={256}
                  includeMargin={true}
                />
              </div>
              <button onClick={handleSaveQR} className={styles.saveButton}>
                Сохранить как PNG
              </button>
            </div>
          )}
          <form onSubmit={handleCreate} className={styles.qrForm}>
            <div className={styles.formField}>
              <label>Наименование компонента и параметры</label>
              <textarea
                name="componentName"
                value={formData.componentName}
                onChange={handleInputChange}
                required
                style={{resize: 'both', minHeight: '40px'}}
              />
            </div>
            <div className={styles.formField}>
              <label>Тип компонента</label>
              <div className={styles.categoryField}>
                <input
                  type="text"
                  name="componentType"
                  value={formData.componentType}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className={styles.categoryButton}
                  onClick={() => setIsCategorySelectorOpen(true)}
                >
                  <FaSearch />
                </button>
              </div>
            </div>
            <div className={styles.formField}>
              <label>Код номенклатуры</label>
              <input
                type="text"
                value={`N${String(nextNomenclatureCode).padStart(6, '0')}`}
                disabled
              />
            </div>
            <div className={styles.formField}>
              <label>Производитель</label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className={styles.formField}>
              <label>Единица измерения</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                required
              >
                {UNITS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            <div className={styles.formField}>
              <label>Количество</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className={styles.formField}>
              <label>Цена</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className={styles.formField}>
              <label>Сумма</label>
              <input
                type="number"
                value={formData.sum}
                disabled
              />
            </div>
            <div className={styles.formField}>
              <label>Дата поступления</label>
              <input
                type="date"
                name="arrivalDate"
                value={formData.arrivalDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className={styles.formField}>
              <label>Склад</label>
              <select
                name="warehouseId"
                value={formData.warehouseId}
                onChange={handleWarehouseChange}
                required
              >
                <option value="">Выберите склад</option>
                {Object.entries(warehouses).map(([id, warehouse]) => (
                  <option key={id} value={id}>{warehouse.name}</option>
                ))}
              </select>
            </div>
            {formData.warehouseId && (
              <div className={styles.formField}>
                <label>Секция</label>
                <select
                  name="sectionId"
                  value={formData.sectionId}
                  onChange={handleSectionChange}
                  required
                >
                  <option value="">Выберите секцию</option>
                  {Object.entries(warehouses[formData.warehouseId].sections || {}).map(([id, section]) => (
                    <option key={id} value={id}>{section.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitButton}>
                Создать
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedOption === "nomenclature" && (
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
                />
              </label>
              <button onClick={handleExportExcel} className={styles.excelButton}>
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
                {["Наименование","Тип компонента","Код","Производитель","Ед. изм.","Количество","Цена","Сумма","Дата поступления","Местоположение"].map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOption === "shipment" && <ShipmentSection />}
      {selectedOption === "shipmentHistory" && <ShipmentHistory />} 
      {selectedOption === "sendReport" && <ReportSection />}
      {selectedOption === "reportHistory" && <ReportSection />}
      {isCategorySelectorOpen && (
        <CategorySelector
          onSelect={handleSelectCategory}
          onClose={() => setIsCategorySelectorOpen(false)}
        />
      )}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={toggleModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <QRCodeSVG value={qrData} size={512} includeMargin={true} />
            <button className={styles.closeButton} onClick={toggleModal}>
              ×
            </button>
          </div>
        </div>
      )}
      <AppDownloadDrawer />
    </div>
  );
};

export default WarehousePage;
