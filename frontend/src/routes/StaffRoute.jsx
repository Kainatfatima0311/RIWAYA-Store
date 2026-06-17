import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectIsStaff, selectIsAuthenticated } from '@/store/slices/authSlice';

export function StaffRoute({ children }) {
  const isAuth = useAppSelector(selectIsAuthenticated);
  const isStaff = useAppSelector(selectIsStaff);
  const location = useLocation();

  if (!isAuth) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isStaff) return <Navigate to="/" replace />;
  return children;
}
