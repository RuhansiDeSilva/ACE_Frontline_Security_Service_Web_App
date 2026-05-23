import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getUserRole, getAuthToken, getUser } from '@/lib/roleUtils';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
  const token = getAuthToken();
  const user = getUser();
  const userRole = getUserRole();

  // No token or user - redirect to login
  if (!token || !user) {
    return <Navigate to="/staff-login" replace />;
  }

  // No role extracted - something is wrong, go back to login
  if (!userRole) {
    console.warn('Could not extract user role from localStorage');
    return <Navigate to="/staff-login" replace />;
  }

  // If specific roles are required, check them
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(userRole)) {
      console.warn(`User role "${userRole}" not in required roles:`, requiredRoles);
      
      // Redirect to appropriate dashboard based on their role
      const roleRoutes: Record<string, string> = {
        'AREA_MANAGER': '/area-manager',
        'EXECUTIVE_OFFICER': '/executive-officer',
        'OPERATION_MANAGER': '/operational-manager',
        'OPERATIONAL_MANAGER': '/operational-manager',
        'ACCOUNT_EXECUTIVE': '/account-executive',
        'ACCOUNTANT': '/account-executive',
        'DIRECTOR': '/director',
        'CHAIRMAN': '/chairman',
        'SECURITY_OFFICER': '/security-officer',
      };

      const targetRoute = roleRoutes[userRole] || '/staff-login';
      return <Navigate to={targetRoute} replace />;
    }
  }

  return <>{children}</>;
};
