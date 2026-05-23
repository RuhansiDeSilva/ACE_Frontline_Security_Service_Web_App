import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useRoleRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    // If not logged in, redirect to login
    if (!token || !user) {
      navigate('/staff-login', { replace: true });
      return;
    }

    try {
      const userData = JSON.parse(user);
      const role = userData.role || localStorage.getItem('role');

      // Redirect based on role - matches backend Role enum
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

      const currentPath = window.location.pathname;
      const targetRoute = roleRoutes[role];

      // If user is on a non-matching dashboard, redirect them
      if (targetRoute && !currentPath.startsWith(targetRoute) && currentPath !== '/') {
        // Only redirect if they're on a protected route
        const protectedRoutes = Object.values(roleRoutes);
        if (protectedRoutes.some(route => currentPath.startsWith(route)) && !currentPath.startsWith(targetRoute)) {
          navigate(targetRoute, { replace: true });
        }
      }
    } catch (error) {
      console.error('Error parsing user data', error);
      navigate('/staff-login', { replace: true });
    }
  }, [navigate]);
};
