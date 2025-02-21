import React, { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { database } from "../firebase";
import { ref, onValue, remove, push } from "firebase/database";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import styles from "./WarehousePage.module.css";

const WarehousePage = () => {
  const [selectedOption, setSelectedOption] = useState("generateQR");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [formData, setFormData] = useState({
    componentName: "",
    nomenclatureCode: "",
    manufacturer: "",
    unit: "",
    quantity: "",
    price: "",
    sum: "",
    arrivalDate: "",
    location: "",
  });
  const [qrData, setQrData] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState([]);

  const qrRef = useRef(null);

  // Загрузка данных из Firebase
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

  // Подсчет общей суммы и диапазона дат
  const totalSum = products.reduce((sum, product) => sum + parseFloat(product.sum || 0), 0);
  const dates = products.map(product => new Date(product.arrivalDate)).filter(date => !isNaN(date));
  const minDate = dates.length > 0 ? new Date(Math.min(...dates)).toLocaleDateString() : "Нет данных";
  const maxDate = dates.length > 0 ? new Date(Math.max(...dates)).toLocaleDateString() : "Нет данных";

  // Обработчик изменения полей формы
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    setQrData(JSON.stringify(formData));
    setFormData({
      componentName: "",
      nomenclatureCode: "",
      manufacturer: "",
      unit: "",
      quantity: "",
      price: "",
      sum: "",
      arrivalDate: "",
      location: "",
    });
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
  const handleDelete = (productId) => {
    if (window.confirm("Вы уверены, что хотите удалить этот товар?")) {
      remove(ref(database, `products/${productId}`));
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
          product.nomenclatureCode || "-",
          (product.manufacturer || "-").substring(0, 25),
          product.unit || "-",
          quantity.toLocaleString("ru-RU"),
          `$${price.toFixed(2)}`,
          `$${sum.toFixed(2)}`,
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
          0: { cellWidth: 35 },
          1: { cellWidth: 25 },
          2: { cellWidth: 35 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25, halign: "right" },
          5: { cellWidth: 25, halign: "right" },
          6: { cellWidth: 25, halign: "right" },
          7: { cellWidth: 30 },
          8: { cellWidth: 40 }
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

  return (
    <div className={styles.warehousePage}>
      <div className={styles.centralLine}>
        <div
          className={styles.dropdownContainer}
          onMouseEnter={() => setDropdownVisible(true)}
          onMouseLeave={() => setDropdownVisible(false)}
        >
          <h1 className={styles.pageTitle}>Работа с номенклатурой</h1>
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
            </div>
          )}
        </div>
      </div>

      {selectedOption === "generateQR" && (
        <div className={styles.qrGeneration}>
          {/* QR-код вверху */}
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

          {/* Заголовок над формой */}
          <h2>Генерация QR-кода</h2>

          {/* Форма ввода данных */}
          <form onSubmit={handleCreate} className={styles.qrForm}>
            {Object.entries(formData).map(([key]) => (
              <div key={key} className={styles.formField}>
                <label>
                  {{
                    componentName: "Наименование компонента",
                    nomenclatureCode: "Код номенклатуры",
                    manufacturer: "Производитель",
                    unit: "Единица измерения",
                    quantity: "Количество",
                    price: "Цена",
                    sum: "Сумма",
                    arrivalDate: "Дата поступления",
                    location: "Местоположение"
                  }[key]}
                </label>
                <input
                  type={key.includes("Date") ? "date" : key === "quantity" || key === "price" || key === "sum" ? "number" : "text"}
                  name={key}
                  value={formData[key]}
                  onChange={handleInputChange}
                  required
                  placeholder={key === "unit" ? "шт., кг, м и т.д." : ""}
                />
              </div>
            ))}
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
              <button onClick={handleExportPDF} className={styles.pdfButton}>
                Преобразовать в PDF
              </button>
            </div>
          </div>

          <div className={styles.summary}>
            <p>Общая сумма: <strong>${totalSum.toFixed(2)}</strong></p>
            <p>Диапазон дат: {minDate} — {maxDate}</p>
          </div>

          <table className={styles.productsTable}>
            <thead>
              <tr>
                {[
                  "Наименование",
                  "Код",
                  "Производитель",
                  "Ед. изм.",
                  "Количество",
                  "Цена",
                  "Сумма",
                  "Дата поступления",
                  "Местоположение",
                  "Действия"
                ].map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.componentName}</td>
                  <td>{product.nomenclatureCode}</td>
                  <td>{product.manufacturer}</td>
                  <td>{product.unit}</td>
                  <td>{product.quantity}</td>
                  <td>${product.price}</td>
                  <td>${product.sum}</td>
                  <td>{new Date(product.arrivalDate).toLocaleDateString()}</td>
                  <td>{product.location}</td>
                  <td>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDelete(product.id)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    </div>
  );
};

export default WarehousePage;
