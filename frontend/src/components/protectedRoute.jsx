import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/authContext';

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
        return;
      }

    }
  }, [user, loading, router, roles]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Cargando...</div>
      </div>
    );
  }

  if (!user || (roles.length > 0 && !roles.some(role => {
    const userRoles = Array.isArray(user.role) ? user.role : [user.role];
    return userRoles.includes(role);
  }))) {
    return null;
  }

  return children;
}

export function useRequireAuth(redirectTo = '/login') {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  return { user, loading };
}