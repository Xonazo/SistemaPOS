// components/informes/DateRangeSelector.js
import { useState } from 'react';

export default function DateRangeSelector({ dateRange, onChange, loading }) {
  const [localDateRange, setLocalDateRange] = useState(dateRange);


    const toBackendFormat = (datetime) => datetime.replace('T', ' ') + ':00';


      const formatForInput = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const handleInputChange = (field, value) => {
    const newRange = { ...localDateRange, [field]: value };
    setLocalDateRange(newRange);
  };

   const handleApply = () => {
    if (localDateRange.start_date && localDateRange.end_date) {
      onChange({
        start_date: toBackendFormat(localDateRange.start_date),
        end_date: toBackendFormat(localDateRange.end_date),
      });
    }
  };

  const setPresetRange = (days) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(end.getDate() - days);
    start.setHours(0, 0, 0, 0);

    const localRange = {
      start_date: formatForInput(start),
      end_date: formatForInput(end),
    };

    setLocalDateRange(localRange);
    onChange({
      start_date: toBackendFormat(localRange.start_date),
      end_date: toBackendFormat(localRange.end_date),
    });
  };
  const isValidRange =
    localDateRange.start_date &&
    localDateRange.end_date &&
    new Date(localDateRange.start_date) <= new Date(localDateRange.end_date);

  return (
    <div className="space-y-4  ">
      <div className="flex flex-wrap items-center gap-4">
        {/* Botones de rango predefinido */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPresetRange(7)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            Últimos 7 días
          </button>
          <button
            onClick={() => setPresetRange(30)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            Últimos 30 días
          </button>
          <button
            onClick={() => setPresetRange(90)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            Últimos 3 meses
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        {/* Fecha de inicio */}
        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de inicio
          </label>
          <input
            type="datetime-local"
            value={localDateRange.start_date}
            onChange={(e) => handleInputChange('start_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {/* Fecha de fin */}
        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de fin
          </label>
          <input
            type="datetime-local"
            value={localDateRange.end_date}
            onChange={(e) => handleInputChange('end_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {/* Botón aplicar */}
        <div>
          <button
            onClick={handleApply}
            disabled={loading || !isValidRange}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cargando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Consultar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Validación de rango */}
      {localDateRange.start_date && localDateRange.end_date &&
        new Date(localDateRange.start_date) > new Date(localDateRange.end_date) && (
          <div className="text-red-600 text-sm">
            La fecha de inicio debe ser anterior o igual a la fecha de fin
          </div>
        )}
    </div>
  );
}