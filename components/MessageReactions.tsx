import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Modal, FlatList } from "react-native";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

// Common emoji reactions
const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "✨", "👏"];

interface MessageReactionsProps {
  messageId: number;
  onClose?: () => void;
}

export function MessageReactions({ messageId, onClose }: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);

  // Fetch reactions for this message
  const { data: reactions = {} } = trpc.chat.getReactions.useQuery(
    { messageId },
    { enabled: !!messageId }
  );

  // Add reaction mutation
  const addReactionMutation = trpc.chat.addReaction.useMutation({
    onSuccess: () => {
      setShowPicker(false);
    },
  });

  // Remove reaction mutation
  const removeReactionMutation = trpc.chat.removeReaction.useMutation();

  const handleEmojiPress = (emoji: string) => {
    if (reactions[emoji]) {
      removeReactionMutation.mutate({ messageId, emoji });
    } else {
      addReactionMutation.mutate({ messageId, emoji });
    }
  };

  const handleAddReaction = (emoji: string) => {
    addReactionMutation.mutate({ messageId, emoji });
  };

  return (
    <View className="gap-2">
      {/* Display existing reactions */}
      {Object.keys(reactions).length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {Object.entries(reactions).map(([emoji, data]) => {
            const reactionData = data as { count: number; userIds: number[] };
            return (
              <Pressable
                key={emoji}
                onPress={() => handleEmojiPress(emoji)}
                className="px-2 py-1 rounded-full flex-row items-center gap-1 bg-surface border border-border"
              >
                <Text className="text-base">{emoji}</Text>
                <Text className="text-xs text-muted">{reactionData.count}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Add reaction button */}
      <Pressable
        onPress={() => setShowPicker(!showPicker)}
        className="px-3 py-2 rounded-full bg-surface border border-border flex-row items-center gap-2 w-fit"
      >
        <Text className="text-lg">😊</Text>
        <Text className="text-xs text-muted">React</Text>
      </Pressable>

      {/* Emoji picker modal */}
      <Modal
        visible={showPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setShowPicker(false)}
        >
          <Pressable
            className="bg-background rounded-2xl p-4 gap-3 w-11/12"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-lg font-semibold text-foreground">
              React with emoji
            </Text>

            <View className="flex-row flex-wrap gap-2 justify-center">
              {EMOJI_REACTIONS.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => handleAddReaction(emoji)}
                  className="w-12 h-12 rounded-lg bg-surface border border-border items-center justify-center active:opacity-70"
                >
                  <Text className="text-2xl">{emoji}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => setShowPicker(false)}
              className="px-4 py-2 rounded-lg bg-primary items-center"
            >
              <Text className="text-background font-semibold">Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
