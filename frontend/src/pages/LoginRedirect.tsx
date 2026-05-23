import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';

export default function LoginRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token || !user) {
      navigate('/staff-login', { replace: true });
      return;
    }

    try {
      const userData = JSON.parse(user);
      const role = userData.role || localStorage.getItem('role');

      // Map roles to dashboard routes
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

      const targetRoute = roleRoutes[role] || '/staff-login';
      navigate(targetRoute, { replace: true });
    } catch (error) {
      console.error('Error parsing user data', error);
      navigate('/staff-login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
