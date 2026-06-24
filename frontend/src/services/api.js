
class ApiService {
  constructor() {
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  async request(endpoint, options = {}) {
    const url = `${process.env.NEXT_PUBLIC_API_URL || API_BASE_URL}${endpoint}`;
    const config = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        if (response.status === 401) {
          const isAuthEndpoint = endpoint.includes('/auth/');
          const isRefreshEndpoint = endpoint.includes('/auth/refresh');

          // Si es el endpoint de refresh y falla, logout inmediato
          if (isRefreshEndpoint) {
            this.handleAuthFailure();
            throw new Error(`Token refresh failed: ${response.status}`);
          }

          // Si NO es un endpoint de auth, intentar refresh
          if (!isAuthEndpoint) {
            if (this.isRefreshing) {
              // Si ya estamos refreshing, agregar a la cola
              return new Promise((resolve, reject) => {
                this.failedQueue.push({
                  resolve: () => resolve(this.request(endpoint, options)),
                  reject,
                });
              });
            }

            const refreshed = await this.handleTokenRefresh();
            if (refreshed) {

              console.log(`Token refreshed successfully for ${endpoint}`);
              return this.request(endpoint, options);
            } else {
              this.handleAuthFailure();
              console.error(`Token refresh failed for ${endpoint}:`, response.status);
              //throw new Error('Token refresh failed');
            }
          }
        }
        //throw new Error(`HTTP error! status: ${response.status}`);
        console.error(`API request failed for ${endpoint}:`, response.status);
      }
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      //throw error;
      console.error(`Error in API request for ${endpoint}:`, error.message);
    }
  }

  async handleTokenRefresh() {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      console.log('Refreshing token...');
      const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('Refresh response:', refreshResponse);


      if (refreshResponse.ok) {
        this.processQueue(null, true);
        return true;
      } else {
      this.processQueue(null, null);
        return false;
      }
    } catch (error) {
      this.processQueue(error, null);
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  handleAuthFailure() {
    // Disparar evento personalizado para que el AuthContext maneje el logout
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  }

  // ✅ MÉTODOS DE AUTENTICACIÓN
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    try {
      return await this.request('/auth/me');
    } catch (error) {
      if (error.status === 401) {
        return null;
      } else {
        console.error('Error obteniendo usuario actual:', error);
        throw error;
      }
    }
  }

    async refreshToken() {
    try {
      console.log('Manual token refresh called');
      
      // Usar la misma lógica de URL que en otros métodos
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ;
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        console.error(`Manual token refresh failed: ${response.status}`);
        return false;
      }

      const data = await response.json();
      console.log('Manual token refresh successful');
      return data;
    } catch (error) {
      console.error('Manual refresh token failed:', error);
      return false;
    }
  }

  // El resto de tus métodos permanecen igual...
  async getProducts() {
    return this.request('/products');
  }

  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });


  }

  // Categories
  async getCategories() {
    return this.request('/categories');
  }

  async getCategory(id) {
    return this.request(`/categories/${id}`);
  }

  async createCategory(categoryData) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(id, categoryData) {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(id) {
    return this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Agregados
  async getAgregados() {
    return this.request('/agregados');
  }

  async getAgregado(id) {
    return this.request(`/agregados/${id}`);
  }

  async createAgregado(agregadoData) {
    return this.request('/agregados', {
      method: 'POST',
      body: JSON.stringify(agregadoData),
    });
  }

  async updateAgregado(id, agregadoData) {
    return this.request(`/agregados/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agregadoData),
    });
  }

  async deleteAgregado(id) {
    return this.request(`/agregados/${id}`, {
      method: 'DELETE',
    });
  }

  // Orders
  async getOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/orders?${queryString}` : '/orders';
    return this.request(endpoint);
  }

  async getOrder(id) {
    return this.request(`/orders/${id}`);
  }

  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrder(id, orderData) {
    return this.request(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  }

  async deleteOrder(id) {
    return this.request(`/orders/${id}`, {
      method: 'DELETE',
    });
  }

  // Sales Reports
  async getSalesReport(startDate, endDate) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    return this.request(`/orders/reports/sales?${params.toString()}`);
  }

  async getDailySales(date) {
    return this.request(`/orders/reports/daily?date=${date}`);
  }

  async getMonthlySales(year, month) {
    return this.request(`/orders/reports/monthly?year=${year}&month=${month}`);
  }

  async getTopProducts(startDate, endDate, limit = 10) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      limit: limit.toString()
    });
    return this.request(`/orders/reports/top-products?${params.toString()}`);
  }

  async getPaymentMethodStats(startDate, endDate) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    return this.request(`/orders/reports/payment-methods?${params.toString()}`);
  }

  // Batch operations
  async getAllData() {
    try {
      const [products, categories, agregados] = await Promise.all([
        this.getProducts(),
        this.getCategories(),
        this.getAgregados(),
      ]);

      return { products, categories, agregados };
    } catch (error) {
      console.error('Failed to fetch all data:', error);
      //throw error;
    }
  }

  // Utility method for handling API errors
  handleApiError(error) {
    if (error.message.includes('404')) {
      return 'Recurso no encontrado';
    } else if (error.message.includes('500')) {
      return 'Error interno del servidor';
    } else if (error.message.includes('400')) {
      return 'Datos inválidos enviados';
    } else if (error.message.includes('Network')) {
      return 'Error de conexión';
    }
    return 'Error desconocido';
  }
}

export default new ApiService();