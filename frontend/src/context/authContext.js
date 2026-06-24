import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import ApiService from '../services/api'; // Ajusta la ruta según tu estructura

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
    
    const handleAuthLogout = () => {
      console.log('Recibido evento de logout desde ApiService');
      handleLogout();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:logout', handleAuthLogout);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth:logout', handleAuthLogout);
      }
    };
  }, []);

    useEffect(() => {
    if (!loading && user === null && router.pathname !== '/login') {
      router.replace('/login');
    }
  }, [loading, user, router]);

const checkAuthStatus = async () => {
  try {
    const userData = await ApiService.getCurrentUser();
    setUser(userData.user); 
  } catch (error) {
    if (error.response?.status === 401) {
      setUser(null);
    } else {
      console.error('Error verificando estado de autenticación:', error);
      setUser(null);
    }
  } finally {
    setLoading(false);
  }
};
  const login = async (email, password) => {
    try {
      const response = await ApiService.login(email, password);
      setUser(response.user);
      
      try {
       // await checkAuthStatus();
      } catch (error) {
        console.error('Error verificando autenticación después del login:', error);
      }
      
      return response;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    // setUser(null);
    
    // // Solo redirigir si no estamos ya en login y no estamos cargando
    // if (!loading && router.pathname !== '/login') {
    //   router.replace('/login');
    // }
  };

  const logout = async () => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error('Error durante logout:', error);
      // Continuar con logout local incluso si falla el servidor
    }
    
    handleLogout();
  };

  // Función para refrescar token manualmente (útil para testing)
  const refreshToken = async () => {
    try {
      const success = await ApiService.refreshToken();
      if (success) {
        // Verificar usuario actualizado
        await checkAuthStatus();
      }
      return success;
    } catch (error) {
      console.error('Error en refresh manual:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      refreshToken,
      checkAuthStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    console.log('useAuth debe ser usado dentro de AuthProvider');
    //throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
}