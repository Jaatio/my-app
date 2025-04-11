import React, { useState, useEffect } from 'react';
import { ref, onValue, update, push, remove } from 'firebase/database';
import { database } from '../firebase';
import styles from './WarehouseManagement.module.css';
import { FiChevronDown, FiChevronRight, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

const WarehouseManagement = () => {
  const [warehouses, setWarehouses] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [editMode, setEditMode] = useState({});
  const [newWarehouse, setNewWarehouse] = useState({ name: '' });
  const [newSection, setNewSection] = useState({
    warehouseId: '',
    name: '',
    capacity: 0,
    description: '',
    restrictions: '',
  });

  useEffect(() => {
    const warehousesRef = ref(database, 'warehouses');
    onValue(warehousesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setWarehouses(data);
    });
  }, []);

  const toggleSection = (warehouseId, sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [`${warehouseId}-${sectionId}`]: !prev[`${warehouseId}-${sectionId}`]
    }));
  };

  const handleEditSection = async (warehouseId, sectionId, updatedData) => {
    try {
      await update(ref(database, `warehouses/${warehouseId}/sections/${sectionId}`), updatedData);
      setEditMode(prev => ({ ...prev, [`${warehouseId}-${sectionId}`]: false }));
    } catch (error) {
      console.error('Ошибка при обновлении секции:', error);
      alert('Ошибка при обновлении секции');
    }
  };

  const handleAddWarehouse = async () => {
    if (!newWarehouse.name.trim()) return;
    try {
      await push(ref(database, 'warehouses'), {
        name: newWarehouse.name,
        sections: {}
      });
      setNewWarehouse({ name: '' });
    } catch (error) {
      console.error('Ошибка при добавлении склада:', error);
      alert('Ошибка при добавлении склада');
    }
  };

  const handleAddSection = async () => {
    if (!newSection.warehouseId || !newSection.name || newSection.capacity <= 0) return;
    try {
      await push(ref(database, `warehouses/${newSection.warehouseId}/sections`), {
        name: newSection.name,
        capacity: Number(newSection.capacity),
        description: newSection.description,
        restrictions: newSection.restrictions,
        occupied: 0
      });
      setNewSection({
        warehouseId: '',
        name: '',
        capacity: 0,
        description: '',
        restrictions: ''
      });
    } catch (error) {
      console.error('Ошибка при добавлении секции:', error);
      alert('Ошибка при добавлении секции');
    }
  };

  const handleDeleteWarehouse = async (warehouseId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот склад?')) return;
    try {
      await remove(ref(database, `warehouses/${warehouseId}`));
    } catch (error) {
      console.error('Ошибка при удалении склада:', error);
      alert('Ошибка при удалении склада');
    }
  };

  const handleDeleteSection = async (warehouseId, sectionId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту секцию?')) return;
    try {
      await remove(ref(database, `warehouses/${warehouseId}/sections/${sectionId}`));
    } catch (error) {
      console.error('Ошибка при удалении секции:', error);
      alert('Ошибка при удалении секции');
    }
  };

  return (
    <div className={styles.container}>
      <h2>Редактирование складов</h2>
      
      <div className={styles.addForm}>
        <input
          type="text"
          placeholder="Название нового склада"
          value={newWarehouse.name}
          onChange={(e) => setNewWarehouse({ name: e.target.value })}
        />
        <button onClick={handleAddWarehouse}>
          <FiPlus /> Добавить склад
        </button>
      </div>

      {Object.entries(warehouses).map(([warehouseId, warehouse]) => (
        <div key={warehouseId} className={styles.warehouse}>
          <div className={styles.warehouseHeader}>
            <h3>{warehouse.name}</h3>
            <div className={styles.actions}>
              <button onClick={() => handleDeleteWarehouse(warehouseId)}>
                <FiTrash2 />
              </button>
            </div>
          </div>

          <div className={styles.sections}>
            {warehouse.sections && Object.entries(warehouse.sections).map(([sectionId, section]) => (
              <div key={sectionId} className={styles.section}>
                <div 
                  className={styles.sectionHeader}
                  onClick={() => toggleSection(warehouseId, sectionId)}
                >
                  {expandedSections[`${warehouseId}-${sectionId}`] ? 
                    <FiChevronDown /> : <FiChevronRight />}
                  <span>{section.name}</span>
                  <span className={styles.capacity}>
                    {section.occupied || 0}/{section.capacity}
                    <span 
                      className={styles.full}
                      data-filled={section.occupied >= section.capacity}
                    >
                      {section.occupied >= section.capacity ? ' (Да)' : ' (Нет)'}
                    </span>
                  </span>
                </div>

                {expandedSections[`${warehouseId}-${sectionId}`] && (
                  <div className={styles.sectionDetails}>
                    {editMode[`${warehouseId}-${sectionId}`] ? (
                      <div className={styles.editForm}>
                        <input
                          type="text"
                          placeholder="Название секции"
                          value={section.name}
                          onChange={(e) => handleEditSection(warehouseId, sectionId, {
                            ...section,
                            name: e.target.value
                          })}
                        />
                        <input
                          type="number"
                          placeholder="Вместимость"
                          value={section.capacity}
                          onChange={(e) => handleEditSection(warehouseId, sectionId, {
                            ...section,
                            capacity: Number(e.target.value)
                          })}
                        />
                        <input
                          type="text"
                          placeholder="Описание"
                          value={section.description || ''}
                          onChange={(e) => handleEditSection(warehouseId, sectionId, {
                            ...section,
                            description: e.target.value
                          })}
                        />
                        <input
                          type="text"
                          placeholder="Ограничения"
                          value={section.restrictions || ''}
                          onChange={(e) => handleEditSection(warehouseId, sectionId, {
                            ...section,
                            restrictions: e.target.value
                          })}
                        />
                        <button onClick={() => setEditMode(prev => ({
                          ...prev,
                          [`${warehouseId}-${sectionId}`]: false
                        }))}>
                          Сохранить
                        </button>
                      </div>
                    ) : (
                      <>
                        <p><strong>Вместимость:</strong> {section.capacity}</p>
                        <p><strong>Занято:</strong> {section.occupied || 0}</p>
                        <p><strong>Заполнено:</strong> {section.occupied >= section.capacity ? 'Да' : 'Нет'}</p>
                        <p><strong>Описание:</strong> {section.description || 'Нет описания'}</p>
                        <p><strong>Ограничения:</strong> {section.restrictions || 'Нет ограничений'}</p>
                        <div className={styles.sectionActions}>
                          <button onClick={() => setEditMode(prev => ({
                            ...prev,
                            [`${warehouseId}-${sectionId}`]: true
                          }))}>
                            <FiEdit2 />
                          </button>
                          <button onClick={() => handleDeleteSection(warehouseId, sectionId)}>
                            <FiTrash2 />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className={styles.addSectionForm}>
            <input
              type="text"
              placeholder="Название секции"
              value={newSection.warehouseId === warehouseId ? newSection.name : ''}
              onChange={(e) => setNewSection(prev => ({
                ...prev,
                warehouseId,
                name: e.target.value
              }))}
            />
            <input
              type="number"
              placeholder="Вместимость"
              value={newSection.warehouseId === warehouseId ? newSection.capacity : ''}
              onChange={(e) => setNewSection(prev => ({
                ...prev,
                warehouseId,
                capacity: e.target.value
              }))}
            />
            <input
              type="text"
              placeholder="Описание"
              value={newSection.warehouseId === warehouseId ? newSection.description : ''}
              onChange={(e) => setNewSection(prev => ({
                ...prev,
                warehouseId,
                description: e.target.value
              }))}
            />
            <input
              type="text"
              placeholder="Ограничения"
              value={newSection.warehouseId === warehouseId ? newSection.restrictions : ''}
              onChange={(e) => setNewSection(prev => ({
                ...prev,
                warehouseId,
                restrictions: e.target.value
              }))}
            />
            <button onClick={handleAddSection}>
              <FiPlus /> Добавить секцию
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WarehouseManagement; 