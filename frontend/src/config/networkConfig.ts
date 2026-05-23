/**
 * Network configuration for QR code generation
 * The QR code needs to work when scanned from mobile devices
 */

let cachedNetworkUrl: string | null = null;

export const getNetworkAccessibleUrl = async (): Promise<string> => {
  // Return cached value if available
  if (cachedNetworkUrl) {
    return cachedNetworkUrl;
  }

  const host = window.location.host;
  const protocol = window.location.protocol;

  // Check if running on localhost
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    // Try to get IP from backend
    try {
      const response = await fetch('/api/auth/network-config');
      if (response.ok) {
        const data = await response.json();
        const config = data.data;
        
        if (config.localIp) {
          const port = window.location.port || (protocol === 'https:' ? 443 : 80);
          cachedNetworkUrl = `${protocol}//${config.localIp}:${port}`;
          return cachedNetworkUrl;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch network config:', error);
    }

    // Check localStorage for previously set IP
    const savedIp = localStorage.getItem('app_network_ip');
    if (savedIp) {
      const port = window.location.port || (protocol === 'https:' ? 443 : 80);
      cachedNetworkUrl = `${protocol}//${savedIp}:${port}`;
      return cachedNetworkUrl;
    }

    // Fallback to origin (will work on same network if hostname is used)
    cachedNetworkUrl = window.location.origin;
    return cachedNetworkUrl;
  }

  // Already on a network-accessible URL
  cachedNetworkUrl = window.location.origin;
  return cachedNetworkUrl;
};

/**
 * Get network URL synchronously (returns stored value or origin as fallback)
 */
export const getNetworkAccessibleUrlSync = (): string => {
  if (cachedNetworkUrl) {
    return cachedNetworkUrl;
  }

  const host = window.location.host;
  const protocol = window.location.protocol;

  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    const savedIp = localStorage.getItem('app_network_ip');
    if (savedIp) {
      const port = window.location.port || (protocol === 'https:' ? 443 : 80);
      return `${protocol}//${savedIp}:${port}`;
    }
  }

  return window.location.origin;
};

/**
 * Set network IP for QR code access (call this from admin settings)
 */
export const setNetworkIp = (ip: string): void => {
  localStorage.setItem('app_network_ip', ip);
  // Invalidate cache
  cachedNetworkUrl = null;
};

/**
 * Get the URL for QR code generation
 */
export const getQRUrl = (path: string): string => {
  // Use sync version for immediate QR generation
  return `${getNetworkAccessibleUrlSync()}${path}`;
};

/**
 * Initialize network config on app load
 */
export const initializeNetworkConfig = async (): Promise<void> => {
  await getNetworkAccessibleUrl();
};
