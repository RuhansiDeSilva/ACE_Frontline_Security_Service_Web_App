import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthenticatedUser {
  userId: number;
  username: string;
  fullName?: string;
  role: string;
  userType?: string;
  assignedArea?: string;
  basicSalary?: number;
  designation?: string;
  photoUrl?: string;
  email?: string;
}

/**
 * Hook to safely retrieve authenticated user from localStorage
 * Redirects to login if user is not authenticated
 * 
 * @returns { user: AuthenticatedUser | null, isLoading: boolean }
 */
export function useAuthenticatedUser() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');

    // Not authenticated - redirect to login
    if (!token || !userJson) {
      navigate('/staff-login', { replace: true });
      setIsLoading(false);
      return;
    }

    try {
      // Parse and validate user data
      const userData = JSON.parse(userJson) as AuthenticatedUser;
      
      // Validate required fields (fullName is optional)
      if (!userData.userId || !userData.role) {
        console.error('Invalid user data in localStorage:', userData);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        navigate('/staff-login', { replace: true });
        setIsLoading(false);
        return;
      }

      setUser(userData);
    } catch (error) {
      console.error('Failed to parse user data from localStorage:', error);
      // Clear corrupted data and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      navigate('/staff-login', { replace: true });
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  return { user, isLoading };
}
