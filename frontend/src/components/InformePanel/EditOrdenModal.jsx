// components/EditOrderModal.js
import { useState, useEffect } from 'react';
import ApiService from '../../services/api';

export default function EditOrderModal({ isOpen, onClose, order, onOrderUpdated }) {
  const [formData, setFormData] = useState({
    uid: '',
    amount_received: 0,
    change_amount: 0,
    delivery: false,
    delivery_cost: 0,
    subtotal: 0,
    total: 0,
    payment_method: 'efectivo'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Función para resetear el formulario
  const resetForm = () => {
    setFormData({
      uid: '',
      amount_received: 0,
      change_amount: 0,
      delivery: false,
      delivery_cost: 0,
      subtotal: 0,
      total: 0,
      payment_method: 'efectivo'
    });
    setError('');
  };

  // Cargar datos iniciales cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      resetForm(); // Resetear antes de cargar nuevos datos
    } else {
      // También resetear cuando se cierra
      resetForm();
    }
  }, [isOpen]);

  // Poblar el formulario con datos de la orden
  useEffect(() => {
    if (order && isOpen) {
      console.log('Datos de la orden recibidos:', order); // Para debug
      
      const parseNumber = (value) => {
        if (value === null || value === undefined || value === '') return 0;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      };

      setFormData({
        uid: order.uid || '',
        amount_received: parseNumber(order.amount_received),
        change_amount: parseNumber(order.change_amount),
        delivery: order.delivery === 1 || order.delivery === true || order.delivery === '1',
        delivery_cost: parseNumber(order.delivery_cost),
        subtotal: parseNumber(order.subtotal),
        total: parseNumber(order.total),
        payment_method: order.payment_method || 'efectivo'
      });
    }
  }, [order?.id, isOpen]);

  const handleInputChange = (field, value) => {
    // Para campos numéricos, asegurar que sea un número válido
    const numericFields = ['amount_received', 'change_amount', 'delivery_cost', 'subtotal', 'total'];
    
    if (numericFields.includes(field)) {
      const numValue = value === '' ? 0 : parseFloat(value);
      value = isNaN(numValue) ? 0 : numValue;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calcular vuelto automáticamente cuando cambie el monto recibido o el total
  useEffect(() => {
    if (formData.payment_method === 'efectivo') {
      const amountReceived = parseFloat(formData.amount_received) || 0;
      const total = parseFloat(formData.total) || 0;
      if (amountReceived > total) {
        const changeAmount = amountReceived - total;
        setFormData(prev => ({
          ...prev,
          change_amount: Math.round(changeAmount * 100) / 100
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          change_amount: 0
        }));
      }
    }
  }, [formData.amount_received, formData.total, formData.payment_method]);

  const validateForm = () => {
    // Validar totales
    if (formData.total <= 0) {
      console.log('Total de la orden:', formData.total);
      //throw new Error('El total de la orden debe ser mayor a 0');
    }

    if (formData.payment_method === 'efectivo' && formData.amount_received < formData.total) {
      console.log('Monto recibido:', formData.amount_received, 'Total de la orden:', formData.total);
      //throw new Error('El monto recibido no puede ser menor al total de la orden');
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      validateForm();

      const orderData = {
        ...formData,
        delivery: formData.delivery ? 1 : 0
        // No enviamos items, el backend no los modificará
      };

      await ApiService.updateOrder(order.id, orderData);
      
      if (onOrderUpdated) {
        onOrderUpdated();
      }
      
      onClose();
    } catch (err) {
      setError(err.message || 'Error al actualizar la orden');
      console.error('Error updating order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  // Manejar cambio de delivery
  const handleDeliveryChange = (checked) => {
    setFormData(prev => ({
      ...prev,
      delivery: checked,
      delivery_cost: checked ? (prev.delivery_cost || 0) : 0
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Editar Orden #{order?.id}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              type="button"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{error}</span>
              <button
                type="button"
                onClick={() => setError('')}
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
              >
                <span className="sr-only">Cerrar</span>
                ×
              </button>
            </div>
          )}

          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UID</label>
              <input
                type="text"
                value={formData.uid}
                onChange={(e) => handleInputChange('uid', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Identificador único"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
              <select
                value={formData.payment_method}
                onChange={(e) => handleInputChange('payment_method', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Recibido</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount_received || ''}
                onChange={(e) => handleInputChange('amount_received', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={formData.payment_method !== 'efectivo'}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vuelto</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.change_amount || ''}
                onChange={(e) => handleInputChange('change_amount', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                readOnly={formData.payment_method === 'efectivo'}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Delivery */}
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.delivery}
                onChange={(e) => handleDeliveryChange(e.target.checked)}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Es delivery</span>
            </label>

            {formData.delivery && (
              <div className="ml-7">
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo de Delivery</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.delivery_cost || ''}
                  onChange={(e) => handleInputChange('delivery_cost', e.target.value)}
                  className="max-w-xs border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            )}
          </div>

          {/* Productos (Solo visualización) */}
          {/* {order?.items && order.items.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Productos en la orden</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                    <div>
                      <span className="font-medium text-gray-900">{item.name || `Producto ID: ${item.product_id}`}</span>
                      <span className="text-gray-600 ml-2">x{item.quantity}</span>
                      {item.agregados && item.agregados.length > 0 && (
                        <div className="text-sm text-gray-500 mt-1">
                          Extras: {item.agregados.map(extra => extra.name).join(', ')}
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-gray-900">
                      ${((parseFloat(item.price) || 0) * parseInt(item.quantity)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <strong>Nota:</strong> Los productos no pueden ser editados desde esta ventana. 
                Para modificar productos, crea una nueva orden.
              </div>
            </div>
          )} */}

          {/* Totales */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-3">Resumen</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal:</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.subtotal}
                  onChange={(e) => handleInputChange('subtotal', parseFloat(e.target.value) || 0)}
                  className="w-32 text-right border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {formData.delivery && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery:</span>
                  <span className="font-medium">${(formData.delivery_cost || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.total}
                  onChange={(e) => handleInputChange('total', parseFloat(e.target.value) || 0)}
                  className="w-32 text-right border border-gray-300 rounded px-2 py-1 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {formData.payment_method === 'efectivo' && formData.change_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Vuelto:</span>
                  <span className="font-medium">${(formData.change_amount || 0).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors duration-200"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? 'Actualizando...' : 'Actualizar Orden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}