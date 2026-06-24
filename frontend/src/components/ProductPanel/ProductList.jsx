// components/ProductPanel/ProductList.js
import React from 'react';
import ProductItem from './ProductItem';

const ProductList = ({ products, onAddToOrder }) => {
  if (!products || products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-md">
        <p className="text-gray-500 text-lg">No se encontraron productos</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[calc(100vh-350px)]">
      {products.map(product => (
        <ProductItem
          key={product.id}
          product={product}
          onAddToOrder={onAddToOrder}
        />
      ))}
    </div>
  );
};

export default ProductList;
