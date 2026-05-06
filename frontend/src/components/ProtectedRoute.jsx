import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getCurrentUser, homePathForRole } from '../services/authService.js';

export default function ProtectedRoute({ roles, children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && roles.length > 0) {
    const user = getCurrentUser();
    if (!user || !roles.includes(user.role)) {
      return <Navigate to={homePathForRole(user?.role)} replace />;
    }
  }

  return children;
}
