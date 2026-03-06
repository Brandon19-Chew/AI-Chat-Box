import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

interface PinnedMessage {
  id: number;
  content: string;
  role: "user" | "assistant";
}

interface PinnedMessagesProps {
  messages: PinnedMessage[];
  onUnpin: (messageId: number) => void;
  onMessagePress: (messageId: number) => void;
}

export function PinnedMessages({
  messages,
  onUnpin,
  onMessagePress,
}: PinnedMessagesProps) {
  const colors = useColors();

  if (messages.length === 0) {
    return null;
  }

  return (
    <View className="border-b border-border bg-surface">
      <View className="px-4 py-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Ionicons name="pin" size={16} color={colors.primary} />
          <Text className="text-sm font-semibold text-foreground">
            {messages.length} Pinned {messages.length === 1 ? "Message" : "Messages"}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 pb-3"
      >
        {messages.map((message) => (
          <Pressable
            key={message.id}
            onPress={() => onMessagePress(message.id)}
            className="mr-3 bg-background rounded-lg p-3 max-w-xs border border-border"
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1">
                <Text className="text-xs text-muted mb-1">
                  {message.role === "user" ? "You" : "AI"}
                </Text>
                <Text
                  className="text-sm text-foreground"
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {message.content}
                </Text>
              </View>
              <Pressable
                onPress={() => onUnpin(message.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={16} color={colors.muted} />
              </Pressable>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
