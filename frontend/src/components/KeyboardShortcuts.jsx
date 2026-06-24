// components/KeyboardShortcuts.js
import React, { useState, useEffect } from 'react';
import { Keyboard } from 'lucide-react';

const KeyboardShortcuts = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors duration-200"
        title="Atajos de teclado (Ctrl+K)"
      >
        <Keyboard size={20} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Atajos de Teclado</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Cerrar atajos de teclado"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-3">
          <ShortcutItem keys={['Ctrl', 'F']} description="Buscar productos" />
          <ShortcutItem keys={['Ctrl', 'M']} description="Ingresar monto recibido" />
          <ShortcutItem keys={['Ctrl', 'P']} description="Imprimir ticket" />
          <ShortcutItem keys={['Ctrl', 'Enter']} description="Confirmar pedido" />
          <ShortcutItem keys={['Ctrl', 'K']} description="Mostrar atajos de teclado" />
          <ShortcutItem keys={['Esc']} description="Cerrar diálogos / Cancelar" />
        </div>
      </div>
    </div>
  );
};

const ShortcutItem = ({ keys, description }) => {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-700">{description}</span>
      <div className="flex space-x-1">
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className="text-gray-400">+</span>}
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
              {key}
            </kbd>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default KeyboardShortcuts;