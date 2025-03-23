import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue, push, remove, update } from 'firebase/database';
import { AiOutlinePlus, AiOutlineDelete } from 'react-icons/ai';
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from 'react-icons/md';
import { BiSearch } from 'react-icons/bi';
import './WarehouseEditor.css';

const WarehouseEditor = () => {
  const [warehouses, setWarehouses] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [collapsedWarehouses, setCollapsedWarehouses] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const warehousesRef = ref(database, 'warehouses');
    onValue(warehousesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setWarehouses(data);
    });
  }, []);

  const handleAddWarehouse = async () => {
    const warehousesRef = ref(database, 'warehouses');
    const newWarehouseRef = await push(warehousesRef, {
      name: 'Новый склад',
      sections: {}
    });
    setEditingId(newWarehouseRef.key);
    setEditingText('Новый склад');
  };

  const handleAddSection = async (warehouseId) => {
    const sectionsRef = ref(database, `warehouses/${warehouseId}/sections`);
    const newSectionRef = await push(sectionsRef, {
      name: 'Новая секция'
    });
    setEditingId(newSectionRef.key);
    setEditingText('Новая секция');
  };

  const handleDelete = async (path) => {
    if (window.confirm('Вы уверены, что хотите удалить этот элемент?')) {
      const itemRef = ref(database, path);
      await remove(itemRef);
    }
  };

  const handleStartEdit = (id, currentName) => {
    setEditingId(id);
    setEditingText(currentName);
  };

  const handleFinishEdit = async (path) => {
    if (editingId) {
      const itemRef = ref(database, path);
      await update(itemRef, { name: editingText });
      setEditingId(null);
      setEditingText('');
    }
  };

  const toggleWarehouseCollapse = (warehouseId) => {
    setCollapsedWarehouses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(warehouseId)) {
        newSet.delete(warehouseId);
      } else {
        newSet.add(warehouseId);
      }
      return newSet;
    });
  };

  const filteredWarehouses = Object.entries(warehouses).filter(([_, warehouse]) => 
    warehouse.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderWarehouseItem = (id, item, path) => {
    const isEditing = editingId === id;
    const isCollapsed = collapsedWarehouses.has(id);
    const hasSections = item.sections && Object.keys(item.sections).length > 0;

    return (
      <div key={id} className="warehouse-item">
        <div className="item-content">
          <div className="warehouse-name">
            {hasSections && (
              <button 
                className="collapse-button"
                onClick={() => toggleWarehouseCollapse(id)}
                title={isCollapsed ? "Развернуть" : "Свернуть"}
              >
                {isCollapsed ? <MdKeyboardArrowRight /> : <MdKeyboardArrowDown />}
              </button>
            )}
            {isEditing ? (
              <input
                type="text"
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={() => handleFinishEdit(`${path}/${id}`)}
                onKeyPress={(e) => e.key === 'Enter' && handleFinishEdit(`${path}/${id}`)}
                autoFocus
                onFocus={(e) => e.target.select()}
              />
            ) : (
              <span onDoubleClick={() => handleStartEdit(id, item.name)}>
                {item.name}
              </span>
            )}
          </div>
          <div className="item-actions">
            <button 
              className="action-button"
              onClick={() => handleAddSection(id)}
              title="Добавить секцию"
            >
              <AiOutlinePlus />
            </button>
            <button 
              className="action-button"
              onClick={() => handleDelete(`${path}/${id}`)}
              title="Удалить"
            >
              <AiOutlineDelete />
            </button>
          </div>
        </div>
        {item.sections && !isCollapsed && (
          <div className="sections-container">
            {Object.entries(item.sections).map(([sectionId, section]) => (
              <div key={sectionId} className="section-item">
                {editingId === sectionId ? (
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onBlur={() => handleFinishEdit(`${path}/${id}/sections/${sectionId}`)}
                    onKeyPress={(e) => e.key === 'Enter' && handleFinishEdit(`${path}/${id}/sections/${sectionId}`)}
                    autoFocus
                    onFocus={(e) => e.target.select()}
                  />
                ) : (
                  <span onDoubleClick={() => handleStartEdit(sectionId, section.name)}>
                    {section.name}
                  </span>
                )}
                <button 
                  className="action-button"
                  onClick={() => handleDelete(`${path}/${id}/sections/${sectionId}`)}
                  title="Удалить секцию"
                >
                  <AiOutlineDelete />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="warehouse-editor">
      <div className="editor-header">
        <h2>Редактирование складов</h2>
        <div className="header-actions">
          <div className="search-container">
            <BiSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Поиск склада..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="add-warehouse-button" onClick={handleAddWarehouse}>
            Добавить склад
          </button>
        </div>
      </div>
      <div className="warehouses-container">
        {filteredWarehouses.map(([id, warehouse]) => 
          renderWarehouseItem(id, warehouse, 'warehouses')
        )}
        {filteredWarehouses.length === 0 && searchQuery && (
          <div className="no-results">
            Складов с таким названием не найдено
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseEditor; 