// components/ProductPanel/ProductPanel.js
import React, { useState, useMemo } from 'react';
import CategoryFilter from './CategoryFilter';
import ProductSearch from './ProductSearch';
import ProductList from './ProductList';

const ProductPanel = ({ products, onAddToOrder }) => {
  const [activeCategory, setActiveCategory] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {

    if (!products || products.length === 0) return [];


    return products.filter(product => {
      const categoryMatch = activeCategory === 'todos' || product.category_id === Number(activeCategory);

    // Busqueda por nombre o por precio (ambos convertidos a minusculas y string)
    const lowerSearch = searchQuery.toLowerCase();
    const nameMatch = product.name.toLowerCase().includes(lowerSearch);
    const priceMatch = product.price.toString().includes(lowerSearch);

    const searchMatch = nameMatch || priceMatch;

    return categoryMatch && searchMatch;
    });
  }, [products, activeCategory, searchQuery]);

  return (
    <div className="bg-gray-100 rounded-lg p-4 h-full">
      <h1 className="text-2xl font-bold mb-4 text-blue-900">Productos</h1>

      <ProductSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <CategoryFilter
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <ProductList
        products={filteredProducts}
        onAddToOrder={onAddToOrder}
      />
    </div>
  );
};

export default ProductPanel;