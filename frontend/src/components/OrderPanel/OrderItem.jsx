// components/OrderPanel/OrderItem.js
import React, { useState } from 'react';
import { Minus, Plus, Trash2, Edit3 } from 'lucide-react';
import EditOrderItemModal from './EditOrderItemModal.jsx';

const OrderItem = ({ item, onUpdateQuantity, onRemoveItem, onUpdateNotes = () => { } }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { product, quantity, notes } = item;
  const notesPrice = notes.reduce((sum, note) => sum + (note.price || 0), 0);

  const subtotal = (product.price + notesPrice) * quantity;



  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value);
    if (!isNaN(newQuantity) && newQuantity > 0) {
      onUpdateQuantity(product.id, newQuantity);
    }
  };

  const handleSaveNotes = (productId, newNotes) => {
    onUpdateNotes(productId, newNotes);
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="flex items-center py-3 border-b border-gray-200 last:border-b-0">
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-gray-900">{product.name}</p>

            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              aria-label="Editar producto"
            >
              <Edit3 size={16} className='text-blue-500' />
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-1">
            ${product.price.toLocaleString('es-CL')} x {quantity}
          </p>
          {notes && notes.length > 0 && (
            <div className="text-sm text-gray-600 italic mt-1">
              {notes.map((note, index) => (
                <div key={index}>• {note.name} {note.price ? `(+$${note.price.toLocaleString('es-CL')})` : ''}</div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center">
          <button
            onClick={() => onUpdateQuantity(product.id, quantity - 1)}
            disabled={quantity <= 1}
            className="p-1 text-blue-800 hover:bg-blue-100 rounded-md disabled:text-gray-400 disabled:hover:bg-transparent transition-colors"
          >
            <Minus size={18} className='text-black' />
          </button>

          <input
            type="number"
            min="1"
            value={quantity}
            onChange={handleQuantityChange}
            className="w-12 mx-1 py-1 px-2 text-center border border-gray-300 rounded-md text-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />

          <button
            onClick={() => onUpdateQuantity(product.id, quantity + 1)}
            className="p-1 text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
          >
            <Plus size={18} className='text-black' />
          </button>
        </div>

        <div className="ml-4 flex items-center">
          <span className="font-semibold mr-3 text-gray-900">
            ${subtotal.toLocaleString('es-CL')}
          </span>
          <button
           onClick={() => onRemoveItem(item.uid)}
            className="p-1 text-red-600 hover:bg-red-100 rounded-md transition-colors"
            aria-label="Eliminar producto"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <EditOrderItemModal
        item={item}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNotes}
      />
    </>
  );
};

export default OrderItem;