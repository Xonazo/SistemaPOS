import { useState } from 'react';

const AgregadoForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      price: parseInt(formData.price)
    });
    setFormData({ name: '', price: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre del agregado
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
          placeholder="Ej: Queso extra"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Precio
        </label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
          placeholder="300"
          min="0"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Creando agregado...' : 'Crear Agregado'}
      </button>
    </form>
  );
};

export default AgregadoForm;