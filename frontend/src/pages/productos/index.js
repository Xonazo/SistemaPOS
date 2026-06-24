import { useState, useEffect } from 'react';
import Head from 'next/head';
import NavBar from '../../components/NavBar';
import { Trash2 } from 'lucide-react';
import ProtectedRoute from '../../components/protectedRoute';

// Components
import Modal from '../../components/ProductsCrudPanel/ModalProducts';
import ProductForm from '../../components/ProductsCrudPanel/Forms/ProductForm';
import CategoryForm from '../../components/ProductsCrudPanel/Forms/CategoryForm';
import AgregadoForm from '../../components/ProductsCrudPanel/Forms/AgregadoForm';
import ProductsTable from '../../components/ProductsCrudPanel/ProductsTable';
import CategoriesTable from '../../components/ProductsCrudPanel/CategoriesTable';
import AgregadosTable from '../../components/ProductsCrudPanel/AgregadosTable';
import Notification from '../../components/Notification';
import { Box, Tag, Plus } from 'lucide-react';

// Services
import apiService from '../../services/api';

export default function ProductosPage() {
  // Estados para los datos
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [agregados, setAgregados] = useState([]);

  // Estado para tabs
  const [activeTab, setActiveTab] = useState('products');

  // Estados para los modales
  const [modals, setModals] = useState({
    product: false,
    category: false,
    agregado: false
  });

  // Estados para loading y notificaciones
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    isVisible: false,
    type: '',
    message: ''
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllData();
      setProducts(data.products || []);
      setCategories(data.categories || []);
      setAgregados(data.agregados || []);
    } catch (error) {
      showNotification('error', 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Función para mostrar notificaciones
  const showNotification = (type, message) => {
    setNotification({
      isVisible: true,
      type,
      message
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  // Funciones para manejar modales
  const openModal = (modalType) => {
    setModals(prev => ({ ...prev, [modalType]: true }));
  };

  const closeModal = (modalType) => {
    setModals(prev => ({ ...prev, [modalType]: false }));
  };

  // Funciones para crear elementos
  const handleCreateProduct = async (productData) => {
    try {
      setLoading(true);
      await apiService.createProduct(productData);
      showNotification('success', 'Producto creado exitosamente');
      closeModal('product');
      fetchAllData();
    } catch (error) {
      showNotification('error', 'Error al crear el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (categoryData) => {
    try {
      setLoading(true);
      await apiService.createCategory(categoryData);
      showNotification('success', 'Categoría creada exitosamente');
      closeModal('category');
      fetchAllData();
    } catch (error) {
      showNotification('error', 'Error al crear la categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgregado = async (agregadoData) => {
    try {
      setLoading(true);
      await apiService.createAgregado(agregadoData);
      showNotification('success', 'Agregado creado exitosamente');
      closeModal('agregado');
      fetchAllData();
    } catch (error) {
      showNotification('error', 'Error al crear el agregado');
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteProduct = async (productId) => {
    try {
      setLoading(true);
      await apiService.deleteProduct(productId);
      showNotification('success', 'Producto eliminado exitosamente');
      fetchAllData();
    } catch (error) {
      showNotification('error', 'Error al eliminar el producto');
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    console.log('Eliminando categoría con ID:', categoryId);
    try {
      setLoading(true);
      await apiService.deleteCategory(categoryId);
      showNotification('success', 'Categoría eliminada exitosamente');
      fetchAllData();
    } catch (error) {
      showNotification('error', 'Error al eliminar la categoría');
    } finally {
      setLoading(false);
    }
  }


  const handleDeleteAgregado = async (agregadoId) => {
    try {
      setLoading(true);
      await apiService.deleteAgregado(agregadoId);
      showNotification('success', 'Agregado eliminado exitosamente');
      fetchAllData();
    } catch (error) {
      showNotification('error', 'Error al eliminar el agregado');
    } finally {
      setLoading(false);
    }
  }





  return (
    <ProtectedRoute>
      <div className=" flex flex-col h-screen bg-blue-900 pt-19 px-4">
        <NavBar />


        <div className="w-full max-w-[1536px] mx-auto bg-gray-100 rounded-xl shadow-2xl  flex flex-col">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Gestión de Productos
              </h1>

            </div>

            {/* Action Buttons */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => openModal('product')}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Box className="mr-2" size={20} />
                  Agregar Producto
                </button>

                <button
                  onClick={() => openModal('category')}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <Tag className="mr-2" size={20} />
                  Agregar Categoría
                </button>

                <button
                  onClick={() => openModal('agregado')}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                >
                  <Plus className="mr-2" size={20} />
                  Agregar Agregado
                </button>

              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <Box className="text-white" size={20} />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-700 truncate">
                          Total Productos
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {products.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <Tag className="text-white" size={20} />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-700 truncate">
                          Categorías
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {categories.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <Plus className="text-white" size={20} />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-700 truncate">
                          Agregados
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {agregados.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="mb-8">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('products')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'products'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    📦 Productos ({products.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('categories')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'categories'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    🏷️ Categorías ({categories.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('agregados')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'agregados'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    ➕ Agregados ({agregados.length})
                  </button>
                </nav>
              </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'products' && (
              <ProductsTable
                products={products}
                categories={categories}
                loading={loading}
                onDeleteProduct={handleDeleteProduct}
              />
            )}

            {activeTab === 'categories' && (
              <CategoriesTable
                categories={categories}
                loading={loading}
                onDeleteCategory={handleDeleteCategory}
              />
            )}

            {activeTab === 'agregados' && (
              <AgregadosTable
                agregados={agregados}
                loading={loading}
                onDeleteAgregado={handleDeleteAgregado}
              />
            )}

            {/* Modales */}
            <Modal
              isOpen={modals.product}
              onClose={() => closeModal('product')}
              title="Crear Nuevo Producto"
            >
              <ProductForm
                categories={categories}
                onSubmit={handleCreateProduct}
                loading={loading}
              />
            </Modal>

            <Modal
              isOpen={modals.category}
              onClose={() => closeModal('category')}
              title="Crear Nueva Categoría"
            >
              <CategoryForm
                onSubmit={handleCreateCategory}
                loading={loading}
              />
            </Modal>

            <Modal
              isOpen={modals.agregado}
              onClose={() => closeModal('agregado')}
              title="Crear Nuevo Agregado"
            >
              <AgregadoForm
                onSubmit={handleCreateAgregado}
                loading={loading}
              />
            </Modal>

            {/* Notification */}
            <Notification
              type={notification.type}
              message={notification.message}
              isVisible={notification.isVisible}
              onClose={hideNotification}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>

  );
}