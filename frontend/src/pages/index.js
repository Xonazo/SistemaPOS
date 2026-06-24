import { LayoutDashboard, ShoppingCart, Package, FileText, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '../components/protectedRoute';

const menuItems = [
  {
    label: 'Caja',
    href: '/caja',
    icon: <ShoppingCart size={32} />,
    color: 'bg-blue-100 text-blue-800',
  },
  {
    label: 'Productos',
    href: '/productos',
    icon: <Package size={32} />,
    color: 'bg-green-100 text-green-800',
  },
  {
    label: 'Órdenes',
    href: '/ordenes',
    icon: <LayoutDashboard size={32} />,
    color: 'bg-yellow-100 text-yellow-800',
  },
  {
    label: 'Reportes',
    href: '/reportes',
    icon: <FileText size={32} />,
    color: 'bg-purple-100 text-purple-800',
  },
  {
    label: 'Configuración',
    href: '/configuracion',
    icon: <Settings size={32} />,
    color: 'bg-red-100 text-red-800',
  },
  {
    label: 'Usuarios',
    href: '/usuarios',
    icon: <Users size={32} />,
    color: 'bg-pink-100 text-pink-800',
  },
];

export default function Home() {
  return (
    <ProtectedRoute>

      <main className="min-h-screen bg-blue-900 flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-6xl w-full">
          <h1 className="text-3xl font-bold text-blue-900 mb-10 text-center">Sistema de Caja Registradora</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {menuItems.map(({ label, href, icon, color }) => (
              <Link key={href} href={href}>
                <div className={`flex flex-col items-center justify-center p-6 rounded-xl shadow hover:scale-105 transition-transform ${color} cursor-pointer`}>
                  {icon}
                  <span className="mt-4 text-lg font-semibold">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
