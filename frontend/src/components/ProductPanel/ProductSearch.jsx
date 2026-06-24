// components/ProductPanel/ProductSearch.js
import React from 'react';
import { Search } from 'lucide-react';

const ProductSearch = ({ searchQuery, onSearchChange }) => {
  return (
    <div className="mb-4 relative">
      <h2 className="text-lg font-semibold mb-2 text-black">Buscar Productos</h2>
      <div className="relative flex items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar Productos... (Ctrl + F)"
          className="w-full py-3 pl-10 pr-4 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Search size={18} />
        </div>
      </div>
    </div>
  );
};

export default ProductSearch;