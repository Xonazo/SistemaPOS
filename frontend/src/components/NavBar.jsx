'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutGrid, PlusCircle, FileText, LogOut  } from 'lucide-react';
import { useAuth } from '../context/authContext'; // Ajusta la ruta según donde esté tu contexto



export default function HeaderNav() {
    const { logout } = useAuth();

  return (
    <div className="bg-blue-900">
      <nav className="fixed top-0 left-0 w-full bg-blue-800 text-white px-4 h-16 z-50">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <h1 className="text-2xl font-bold">Sistema de Caja</h1>
          <div className="flex space-x-4">
            <Link href="/caja" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-700">
              <LayoutGrid size={20} />
              <span>Caja</span>
            </Link>
            <Link href="/productos" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-700">
              <PlusCircle size={20} />
              <span>Nuevo Producto</span>
            </Link>
            <Link href="/informes" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-700">
              <FileText size={20} />
              <span>Reportes</span>
            </Link>
               <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-700"
              type="button"
            >
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}