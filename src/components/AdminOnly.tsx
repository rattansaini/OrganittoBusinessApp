import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AdminOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return null;
  return <>{children}</>;
}
