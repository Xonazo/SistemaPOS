// components/ProductPanel/ProductItem.js
import React from 'react';
import { useState } from 'react';
import { Plus } from 'lucide-react';

const ProductItem = ({ product, onAddToOrder }) => {

  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    setPressed(true);
    if (navigator.vibrate) navigator.vibrate(10);
    onAddToOrder(product);
    setTimeout(() => setPressed(false), 200);
  };
  return (
    <div
      className={`${pressed ? 'scale-95 shadow-sm bg-blue-50' : 'bg-white'
        } rounded-lg shadow-md p-4 transition-all duration-150 hover:shadow-lg hover:-translate-y-1 cursor-pointer h-28`}
      onClick={handleClick}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}

    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-800">{product.name}</h3>
          <p className="font-bold text-blue-800 text-lg">
            ${product.price.toLocaleString('es-CL')}
          </p>
        </div>
        <button
          className="bg-blue-700 hover:bg-blue-800 text-white rounded-full p-1 transition-colors duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onAddToOrder(product);
          }}
          aria-label="Añadir al pedido"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
};

export default ProductItem;