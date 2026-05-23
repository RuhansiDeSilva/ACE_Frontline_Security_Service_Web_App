/**
 * Extract user role from various formats and return as uppercase string
 * Handles: string, object with 'name' or 'value' properties, enum-like structures
 */
export function extractUserRole(roleData: any): string {
  if (!roleData) return '';
  
  // If it's already a string, return uppercase
  if (typeof roleData === 'string') {
    const normalized = roleData.toUpperCase().trim();
    // Support legacy or server role names
    if (normalized === 'EXECUTIVE_MANAGER' || normalized === 'EXECUTIVE MANAGER') {
      return 'EXECUTIVE_OFFICER';
    }
    if (normalized === 'OPERATIONAL_MANAGER') {
      return 'OPERATION_MANAGER';
    }
    if (normalized === 'ACCOUNT EXECUTIVE' || normalized === 'ACCOUNTANT') {
      return 'ACCOUNT_EXECUTIVE';
    }
    return normalized;
  }
  
  // If it's an object, try to extract the role name
  if (typeof roleData === 'object') {
    // Try common property names
    const roleValue = roleData.name || roleData.value || roleData.role || '';
    if (typeof roleValue === 'string') {
      const normalized = roleValue.toUpperCase().trim();
      if (normalized === 'EXECUTIVE_MANAGER' || normalized === 'EXECUTIVE MANAGER') {
        return 'EXECUTIVE_OFFICER';
      }
      if (normalized === 'OPERATIONAL_MANAGER') {
        return 'OPERATION_MANAGER';
      }
      if (normalized === 'ACCOUNT EXECUTIVE' || normalized === 'ACCOUNTANT') {
        return 'ACCOUNT_EXECUTIVE';
      }
      return normalized;
    }
  }
  
  return '';
}

/**
 * Get the user's current role from localStorage
 * Returns the role as an uppercase string, or empty string if not found
 */
export function getUserRole(): string {
  const storedRole = localStorage.getItem('role');
  if (storedRole) {
    return extractUserRole(storedRole);
  }
  
  // Fallback: try to extract from user object
  const userJson = localStorage.getItem('user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      return extractUserRole(user.role);
    } catch (e) {
      console.error('Failed to parse user object:', e);
    }
  }
  
  return '';
}

/**
 * Get the user object from localStorage
 */
export function getUser(): any {
  const userJson = localStorage.getItem('user');
  if (userJson) {
    try {
      return JSON.parse(userJson);
    } catch (e) {
      console.error('Failed to parse user object:', e);
      return null;
    }
  }
  return null;
}

/**
 * Get the auth token from localStorage
 */
export function getAuthToken(): string {
  return localStorage.getItem('token') || '';
}

/**
 * Clear all auth data from localStorage
 */
export function clearAuthData(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('role');
  localStorage.removeItem('userId');
  localStorage.removeItem('user');
}
