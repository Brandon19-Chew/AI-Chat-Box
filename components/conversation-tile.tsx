import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";

interface ConversationTileProps {
  id: number;
  title: string;
  isActive: boolean;
  onPress: () => void;
  onDelete?: () => void;
  onRename?: () => void;
}

export function ConversationTile({
  id,
  title,
  isActive,
  onPress,
  onDelete,
  onRename,
}: ConversationTileProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: isActive ? colors.primary : colors.surface,
          borderColor: isActive ? colors.primary : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: isActive ? colors.background : colors.foreground,
            },
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>
      </View>

      {(onDelete || onRename) && (
        <View style={styles.actions}>
          {onRename && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onRename();
              }}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
            >
              <Ionicons
                name="pencil"
                size={16}
                color={isActive ? colors.background : colors.muted}
              />
            </Pressable>
          )}
          {onDelete && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
            >
              <Ionicons
                name="trash"
                size={16}
                color={isActive ? colors.background : colors.error}
              />
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 60,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
  },
  actionButtonPressed: {
    opacity: 0.6,
  },
});
