import { View, Text, Pressable, FlatList, ActivityIndicator, TextInput, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { OfflineIndicator } from "@/components/offline-indicator";
import { MessageReactions } from "@/components/MessageReactions";
import { PinnedMessages } from "@/components/PinnedMessages";
import { ImageMessage } from "@/components/ImageMessage";
import { useColors } from "@/hooks/use-colors";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { offlineCache } from "@/lib/offline-cache";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAvoidingView, Platform } from "react-native";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const isOnline = useNetworkStatus();
  const [messageText, setMessageText] = useState("");
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
  const [cachedMessages, setCachedMessages] = useState<any[]>([]);

  const conversationId = id ? parseInt(id, 10) : 0;

  const {
    data: messages,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = trpc.chat.getMessages.useQuery(
    { conversationId },
    { enabled: !!conversationId && isOnline }
  );

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      refetchMessages();
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to send message. Please try again.");
      console.error("Send message error:", error);
    },
  });

  const pinMessageMutation = trpc.chat.pinMessage.useMutation({
    onSuccess: () => {
      refetchPinnedMessages();
    },
  });

  const unpinMessageMutation = trpc.chat.unpinMessage.useMutation({
    onSuccess: () => {
      refetchPinnedMessages();
    },
  });

  const {
    data: pinnedMessagesData,
    refetch: refetchPinnedMessages,
  } = trpc.chat.getPinnedMessages.useQuery(
    { conversationId },
    { enabled: !!conversationId && isOnline }
  );

  // Cache messages when they're fetched
  useEffect(() => {
    if (messages && isOnline) {
      offlineCache.cacheMessages(conversationId, messages);
      setCachedMessages(messages);
    }
  }, [messages, isOnline, conversationId]);

  // Load cached messages when offline
  useEffect(() => {
    if (!isOnline && conversationId) {
      offlineCache.getCachedMessages(conversationId).then(setCachedMessages);
    }
  }, [isOnline, conversationId]);

  useEffect(() => {
    if (pinnedMessagesData) {
      setPinnedMessages(pinnedMessagesData.map((p: any) => p.message));
    }
  }, [pinnedMessagesData]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    if (!isOnline) {
      Alert.alert("Offline", "You cannot send messages while offline.");
      return;
    }

    sendMessageMutation.mutate({
      conversationId,
      message: messageText,
    });
  };

  if (!conversationId) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground">Invalid conversation</Text>
      </ScreenContainer>
    );
  }

  // Use cached messages when offline, otherwise use fetched messages
  const displayMessages = !isOnline && cachedMessages.length > 0 ? cachedMessages : messages || [];

  return (
    <ScreenContainer className="flex-1">
      <OfflineIndicator />

      {/* Header */}
      <View className="pb-4 border-b border-border flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Text className="text-lg font-semibold text-foreground flex-1 ml-2">Chat</Text>
      </View>

      {/* Pinned Messages */}
      {isOnline && (
        <PinnedMessages
          messages={pinnedMessages}
          onUnpin={(messageId) => unpinMessageMutation.mutate({ messageId })}
          onMessagePress={() => {}}
        />
      )}

      {/* Messages List */}
      {isLoadingMessages && isOnline ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : displayMessages.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">No messages yet</Text>
        </View>
      ) : (
        <FlatList
          data={displayMessages}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingVertical: 12 }}
          renderItem={({ item }) => (
            <View
              className={`px-4 mb-4 flex-row ${
                item.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <View className="gap-2">
                <View
                  className={`max-w-xs rounded-lg px-4 py-2 ${
                    item.role === "user"
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                >
                  <Text
                    className={`${
                      item.role === "user"
                        ? "text-background"
                        : "text-foreground"
                    }`}
                  >
                    {item.content}
                  </Text>
                </View>
                <View className={`px-4 ${
                  item.role === "user" ? "items-end" : "items-start"
                }`}>
                  <View className="flex-row gap-2 items-center">
                    {isOnline && (
                      <>
                        <MessageReactions messageId={item.id} />
                        <Pressable
                          onPress={() => pinMessageMutation.mutate({ messageId: item.id, conversationId })}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="pin" size={16} color={colors.muted} />
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View className="border-t border-border p-4 gap-3 flex-row items-end">
        <View className="flex-1 bg-surface border border-border rounded-full px-4 py-2 flex-row items-center">
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor={colors.muted}
            className="flex-1 text-foreground"
            multiline
            maxLength={500}
            editable={!sendMessageMutation.isPending && isOnline}
          />
        </View>
        <Pressable
          onPress={handleSendMessage}
          disabled={!messageText.trim() || sendMessageMutation.isPending || !isOnline}
          className="bg-primary rounded-full p-3 disabled:opacity-50"
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
        >
          {sendMessageMutation.isPending ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <Ionicons name="send" size={20} color={colors.background} />
          )}
        </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
