// pages/informes/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import DateRangeSelector from '../../components/InformePanel/DateRangeSelector';
import SalesSummary from '../../components/InformePanel/SalesSummary';
import SalesTable from '../../components/InformePanel/SalesTable';
import LoadingSpinner from '../../components/InformePanel/LoadingSpinner';
import ErrorMessage from '../../components/InformePanel/ErrorMessage';
import ApiService from '../../services/api';
import NavBar from '../../components/NavBar';
import EditOrderModal  from '../../components/InformePanel/EditOrdenModal';
import ProtectedRoute from '../../components/protectedRoute';



export default function Informes() {
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  });
  

  const formatToMySQLDateTime = (dateStr) => {
    const date = new Date(dateStr);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  };

  useEffect(() => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    setDateRange({
      start_date: lastMonth.toISOString().split('T')[0] + ' 00:00:00',
      end_date: today.toISOString().split('T')[0] + ' 23:59:59'
    });
  }, []);

  const fetchSalesReport = async (startDate, endDate) => {
    if (!startDate || !endDate) return;

    console.log('Fetching sales report from', startDate, 'to', endDate);

    setLoading(true);
    setError(null);

    try {
      const data = await ApiService.getSalesReport(startDate, endDate);
      console.log('start date:', startDate, 'end date:', endDate);
      setSalesData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);

    const start = formatToMySQLDateTime(newDateRange.start_date);
    const end = formatToMySQLDateTime(newDateRange.end_date);

    fetchSalesReport(start, end);
  };

  useEffect(() => {
    if (dateRange.start_date && dateRange.end_date) {
      const start = formatToMySQLDateTime(dateRange.start_date);
      const end = formatToMySQLDateTime(dateRange.end_date);
      fetchSalesReport(start, end);
    }
  }, [dateRange.start_date, dateRange.end_date]);

  const exportToCSV = () => {
    if (!salesData || !salesData.details) return;

    const headers = [
      'ID Orden',
      'UID',
      'Fecha',
      'Producto',
      'Categoría',
      'Cantidad',
      'Precio Unitario',
      'Total Base',
      'Extras',
      'Total con Extras',
      'Agregados',
      'Método Pago',
      'Delivery',
      'Total Orden'
    ];

    const csvContent = [
      headers.join(','),
      ...salesData.details.map(row => [
        row.order_id,
        row.uid,
        new Date(row.timestamp).toLocaleString(),
        `"${row.product_name}"`,
        `"${row.category_name || ''}"`,
        row.quantity,
        row.unit_price,
        row.base_item_total,
        row.extras_total,
        row.item_total_with_extras,
        `"${row.agregados || ''}"`,
        row.payment_method,
        row.delivery ? 'Sí' : 'No',
        row.order_total
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte-ventas-${dateRange.start_date}-${dateRange.end_date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



    const handleOrderUpdated = () => {
    // Recargar los datos después de editar una orden
    if (dateRange.start_date && dateRange.end_date) {
      const start = formatToMySQLDateTime(dateRange.start_date);
      const end = formatToMySQLDateTime(dateRange.end_date);
      fetchSalesReport(start, end);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await ApiService.deleteOrder(orderId);
      // Recargar los datos después de eliminar una orden
      if (dateRange.start_date && dateRange.end_date) {
        const start = formatToMySQLDateTime(dateRange.start_date);
        const end = formatToMySQLDateTime(dateRange.end_date);
        fetchSalesReport(start, end);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error al eliminar la orden:', err);
    }
  };



  return (
        <ProtectedRoute>
    
    <div className='flex flex-col h-screen bg-blue-900 pt-19 px-4'>
      <NavBar/>
    <div className='w-full max-w-[1536px] mx-auto bg-white rounded-xl shadow-2xl  flex flex-col'>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Informes de Ventas
          </h1>
        </div>

        <div className="space-y-6">
          {/* Selector de fechas */}
          <div className="bg-gray-100 rounded-lg shadow-md p-6">
            <DateRangeSelector
              dateRange={dateRange}
              onChange={handleDateRangeChange}
              loading={loading}
            />
          </div>

          {/* Mostrar error si existe */}
          {error && (
            <ErrorMessage message={error} />
          )}

          {/* Mostrar loading */}
          {loading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}

          {/* Contenido principal */}
          {salesData && !loading && (
            <>
              {/* Resumen de ventas */}
              <SalesSummary
                summary={salesData.summary}
                period={salesData.period}

              />

              {/* Tabla de detalles */}
              <div className="bg-gray-100 rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Detalle de Ventas
                    </h2>
                    <button
                      onClick={exportToCSV}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Exportar CSV
                    </button>
                  </div>
                </div>

                <SalesTable 
                details={salesData.details}
                   onOrderUpdated={handleOrderUpdated}
                    onDeleteOrder={handleDeleteOrder}
                 />
              </div>
            </>
          )}

          {/* Mensaje cuando no hay datos */}
          {salesData && salesData.details?.length === 0 && !loading && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay datos para mostrar
              </h3>
              <p className="text-gray-600">
                No se encontraron ventas en el rango de fechas seleccionado.
              </p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
        </ProtectedRoute>
    
  );
}