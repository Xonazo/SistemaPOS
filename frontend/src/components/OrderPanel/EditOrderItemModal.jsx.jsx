import React, { useState, useEffect, use } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import apiService from '../../services/api';

// const commonModifications = [
//   { name: 'Sin tomate', price: 0 },
//   { name: 'Sin cebolla', price: 0 },
//   { name: 'Sin lechuga', price: 0 },
//   { name: 'Sin mayonesa', price: 0 },
//   { name: 'Extra queso', price: 500 },
//   { name: 'Extra tomate', price: 300 },
//   { name: 'Para llevar', price: 0 },
//   { name: 'Bien cocido', price: 0 }
// ];

const EditOrderItemModal = ({ item, onClose, onSave, isOpen }) => {
  const [notes, setNotes] = useState([]);
  const [customNote, setCustomNote] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [commonModifications, setCommonModifications] = useState([]);



  const fetchCommonModifications = async () => {
    try {
      const response = await apiService.getAgregados();
      setCommonModifications(response);
    } catch (error) {
      console.error('Error fetching common modifications:', error);
      setCommonModifications([]);
    }
  };



  useEffect(() => {
    fetchCommonModifications();
  }, []);





  useEffect(() => {
    setNotes(item?.notes || []);
  }, [item]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleToggleModification = (mod) => {
    const exists = notes.find(note => note.name === mod.name);
    if (exists) {
      setNotes(current => current.filter(note => note.name !== mod.name));
    } else {
      setNotes(current => [...current, mod]);
    }
  };

  const handleAddCustomNote = () => {
    const name = customNote.trim();
    const price = parseInt(customPrice) || 0;

    if (name) {
      setNotes(current => [...current, { name, price }]);
      setCustomNote('');
      setCustomPrice('');
    }
  };


  const handleSave = () => {
    onSave(item.product.id, notes);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen || !item) return null;

  const totalExtra = notes.reduce((acc, mod) => acc + (mod.price || 0), 0);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-white/50 dark:bg-black/50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyPress}
      tabIndex={-1}
    >
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Editar {item.product.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-1 rounded-md hover:bg-gray-100"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Modificaciones comunes */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Modificaciones comunes
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(commonModifications || []).map(mod => (
                <button
                  key={mod.name}
                  onClick={() => handleToggleModification(mod)}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${notes.find(note => note.name === mod.name)
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {notes.find(note => note.name === mod.name) ? (
                    <Minus size={16} className="inline mr-1" />
                  ) : (
                    <Plus size={16} className="inline mr-1" />
                  )}
                  {mod.name} {mod.price > 0 && `(+$${mod.price})`}
                </button>
              ))}
            </div>
          </div>

          {/* Nota personalizada */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Agregar nota..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            <input
              type="number"
              min="0"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              placeholder="Precio"
              className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            <button
              onClick={handleAddCustomNote}
              disabled={!customNote.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              aria-label="Agregar nota personalizada"
            >
              <Plus size={20} />
            </button>
          </div>


          {/* Notas actuales */}
          {notes.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Notas actuales
              </h3>
              <ul className="space-y-1">
                {notes.map((note, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-md"
                  >
                    <span className="text-gray-900">
                      {note.name} {note.price > 0 && `(+$${note.price})`}
                    </span>
                    <button
                      onClick={() =>
                        setNotes(current => current.filter((_, i) => i !== index))
                      }
                      className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-100 transition-colors"
                      aria-label={`Eliminar nota: ${note.name}`}
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-right text-sm text-gray-600 mt-2">
                Total extras: ${totalExtra}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditOrderItemModal;
