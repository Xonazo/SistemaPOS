
// components/ProductPanel/CategoryFilter.js
import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

const CategoryFilter = ({ activeCategory, onCategoryChange }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCategories();
      
      const allCategories = [
        { id: 'todos', name: 'Todos' }, 
        ...(response.data || response || []) 
      ];
      
      setCategories(allCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // En caso de error, solo mostrar "Todos"
      setCategories([{ id: 'todos', name: 'Todos' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2 text-black">Categorías</h2>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800"></div>
          <span className="text-gray-600 text-sm">Cargando categorías...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold mb-2 text-black">Categorías</h2>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtro de categorías">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            aria-pressed={activeCategory === category.id}
            className={`px-4 py-2 rounded-md transition-colors duration-200 ${
              activeCategory === category.id
                ? 'bg-blue-800 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {category.name || category.label} {/* Soporte para ambos nombres de propiedad */}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;