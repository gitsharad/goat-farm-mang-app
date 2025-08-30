import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../services/logger';

/**
 * Higher-Order Component for protecting routes that require authentication
 */
export const withAuth = (WrappedComponent) => {
  return (props) => {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        logger.warn('Unauthorized access attempt', {
          path: location.pathname,
          timestamp: new Date().toISOString(),
        });
        navigate('/login', { 
          state: { from: location },
          replace: true 
        });
      }
    }, [isAuthenticated, loading, navigate, location]);

    if (loading) {
      return <div>Loading authentication status...</div>;
    }

    return isAuthenticated ? <WrappedComponent {...props} /> : null;
  };
};

/**
 * Hook to check user roles and permissions
 */
export const usePermission = (requiredRole) => {
  const { user } = useAuth();
  
  const hasPermission = useCallback(() => {
    if (!user || !user.roles) return false;
    return user.roles.includes(requiredRole);
  }, [user, requiredRole]);

  return { hasPermission: hasPermission() };
};

/**
 * Component to conditionally render content based on permissions
 */
export const RequirePermission = ({ role, children }) => {
  const { hasPermission } = usePermission(role);
  return hasPermission ? children : null;
};

// Usage in components:
// 1. Protect route: export default withAuth(MyComponent);
// 2. Check permission: const { hasPermission } = usePermission('admin');
// 3. Conditional render: <RequirePermission role="admin"><AdminPanel /></RequirePermission>
