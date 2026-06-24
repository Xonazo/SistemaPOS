// components/GuestRoute.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/authContext';

export default function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/caja');
    }
  }, [user, loading, router]);

  if (loading) return null;
  if (user) return null;

  return children;
}
