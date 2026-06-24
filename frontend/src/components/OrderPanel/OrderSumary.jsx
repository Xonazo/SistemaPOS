// components/OrderPanel/OrderSummary.js
import React from 'react';
import OrderItem from './OrderItem';

const OrderSummary = ({ items, onUpdateQuantity, onRemoveItem, onUpdateNotes }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-gray-900 mb-2">No hay productos en el pedido</p>
        <p className="text-sm text-gray-700">Añade productos desde el panel izquierdo</p>
      </div>
    );
  }

  

  return (
    <div className="overflow-y-auto max-h-[calc(100vh-500px)]">
      {/* <h2 className="text-lg font-semibold mb-2 text-black ">Detalle del Pedido</h2> */}
      <div className="bg-white rounded-md shadow-sm p-2">
        {items.map(item => (
          <OrderItem
            key={item.product.id}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            onUpdateNotes={onUpdateNotes} 
          />
        ))}
      </div>
    </div>
  );
};

export default OrderSummary;