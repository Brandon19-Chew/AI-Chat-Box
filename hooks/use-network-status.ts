import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Hook to detect network connectivity status
 * Returns true if online, false if offline
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Simple online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (Platform.OS === 'web') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // For native platforms, we'll assume online for now
    // In production, you'd use @react-native-community/netinfo
    return undefined;
  }, []);

  return isOnline;
}
