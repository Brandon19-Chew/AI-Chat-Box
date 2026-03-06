import { View, Text } from 'react-native';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useColors } from '@/hooks/use-colors';

/**
 * Offline Indicator Component
 * Displays a banner when the app is offline
 */
export function OfflineIndicator() {
  const isOnline = useNetworkStatus();
  const colors = useColors();

  if (isOnline) {
    return null;
  }

  return (
    <View
      className="w-full px-4 py-2 bg-warning flex-row items-center justify-center"
      style={{ backgroundColor: colors.warning }}
    >
      <Text className="text-sm font-semibold text-white">
        📡 Offline - Showing cached messages
      </Text>
    </View>
  );
}
