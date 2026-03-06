import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { TypingIndicator } from "@/components/typing-indicator";
import { SwipeToDelete } from "@/components/swipe-to-delete";
import { RenameConversationModal } from "@/components/rename-conversation-modal";
import { CollaborationModal } from "@/components/collaboration-modal";
import { MessageAttachmentList } from "@/components/message-attachment-list";
import { ConversationTile } from "@/components/conversation-tile";
import { trpc } from "@/lib/trpc";
import { useEffect, useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useKeyboard } from "@/hooks/use-keyboard";
import { useDraft } from "@/hooks/use-draft";
import { loadDraft, clearDraft } from "@/lib/draft-manager";
import { useFontSize } from "@/lib/font-size-context";
import { useLanguage } from "@/lib/language-provider";
import { useTranslation } from "@/lib/translations";

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = width * 0.75;

export default function HomeScreen() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const colors = useColors();
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameConversationId, setRenameConversationId] = useState<number | null>(null);
  const [renameCurrentTitle, setRenameCurrentTitle] = useState("");
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const sidebarAnim = useRef(new Animated.Value(0)).current;
  const { keyboardHeight, isKeyboardVisible } = useKeyboard();
  const inputBottomAnim = useRef(new Animated.Value(0)).current;
  const { loadDraftForConversation, clearDraftForConversation } = useDraft(activeConversationId, messageText, setMessageText);
  const { fontSizeMultiplier } = useFontSize();
  const { language } = useLanguage();
  const t = useTranslation(language);  
  // Load conversations immediately on mount
  const [shouldLoadConversations, setShouldLoadConversations] = useState(true);

  // Get messages for active conversation
  const {
    data: messages,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = trpc.chat.getMessages.useQuery(
    { conversationId: activeConversationId || 0 },
    { enabled: !!activeConversationId, refetchInterval: 5000, staleTime: 30000, refetchOnWindowFocus: false }
  );

  // Get all conversations - lazy loaded after initial render
  const {
    data: conversations,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = trpc.chat.listConversations.useQuery(
    undefined,
    { enabled: shouldLoadConversations, refetchInterval: 5000, staleTime: 60000, refetchOnWindowFocus: false }
  );

  // Trigger lazy loading of conversations immediately
  useEffect(() => {
    setShouldLoadConversations(true);
  }, []);

  // Animate input box position when keyboard appears/disappears
  useEffect(() => {
    Animated.timing(inputBottomAnim, {
      toValue: isKeyboardVisible ? keyboardHeight : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isKeyboardVisible, keyboardHeight, inputBottomAnim]);

  // Load draft when conversation changes
  useEffect(() => {
    const loadDraftOnChange = async () => {
      if (activeConversationId) {
        const draft = await loadDraft(activeConversationId);
        if (draft) {
          setMessageText(draft);
        }
      } else {
        setMessageText("");
      }
    };
    loadDraftOnChange();
  }, [activeConversationId]);

  // Create new conversation
  const createConversationMutation = trpc.chat.createConversation.useMutation({
    onSuccess: async (data) => {
      setActiveConversationId(data.conversationId);
      setMessageText("");
      setShowSidebar(false);
      // Clear draft after successful conversation creation
      if (data.conversationId) {
        await clearDraft(data.conversationId);
      }
      refetchConversations();
      setTimeout(() => {
        refetchMessages();
      }, 0);
    },
    onError: (error) => {
      console.error("Create conversation error:", error);
    },
  });

  // Send message
  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: async (data) => {
      setMessageText("");
      setSelectedFile(null);
      setIsAtBottom(true);
      if (activeConversationId) {
        await clearDraft(activeConversationId);
      }
      setTimeout(() => {
        refetchMessages();
      }, 0);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    onError: (error) => {
      console.error("Send message error:", error);
    },
  });

  // Conversations are now created only when user sends their first message

  // Animate sidebar
  useEffect(() => {
    Animated.timing(sidebarAnim, {
      toValue: showSidebar ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showSidebar]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messages && messages.length > 0 && isAtBottom) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 50);
    }
  }, [messages, isAtBottom]);

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isBottom = contentOffset.y >= contentSize.height - layoutMeasurement.height - 50;
    setIsAtBottom(isBottom);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      return;
    }

    // If no active conversation, create one first
    if (!activeConversationId) {
      createConversationMutation.mutate({ initialMessage: messageText });
      return;
    }

    sendMessageMutation.mutate({
      conversationId: activeConversationId,
      message: messageText,
    });
  };

  const handleNewChat = () => {
    createConversationMutation.mutate({ initialMessage: "" });
  };

  const handleSelectConversation = (conversationId: number) => {
    setActiveConversationId(conversationId);
    setShowSidebar(false);
  };

  // Update conversation title
  const updateConversationTitleMutation = trpc.chat.updateConversationTitle.useMutation({
    onSuccess: () => {
      setRenameModalVisible(false);
      setRenameConversationId(null);
      refetchConversations();
    },
    onError: (error: any) => {
      console.error("Update title error:", error);
    },
  });

  const deleteConversationMutation = trpc.chat.deleteConversation.useMutation({
    onSuccess: (data, variables) => {
      const deletedConvId = variables.conversationId;
      if (activeConversationId === deletedConvId) {
        setActiveConversationId(null);
        createConversationMutation.mutate({ initialMessage: "" });
      }
      refetchConversations();
    },
    onError: (error: any) => {
      console.error("Delete conversation error:", error);
    },
  });

  const handleDeleteConversation = (conversationId: number) => {
    deleteConversationMutation.mutate({ conversationId });
  };

  const handleRenameConversation = (conversationId: number, currentTitle: string) => {
    setRenameConversationId(conversationId);
    setRenameCurrentTitle(currentTitle);
    setRenameModalVisible(true);
  };

  const handleConfirmRename = (newTitle: string) => {
    if (renameConversationId) {
      updateConversationTitleMutation.mutate({
        conversationId: renameConversationId,
        title: newTitle,
      });
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  // Show UI immediately even if conversations haven't loaded yet
  // This prevents the blocking loading screen on startup
  if (!activeConversationId && conversations && conversations.length > 0) {
    // If we have conversations, select the first one
    setActiveConversationId(conversations[0].id);
  }

  // If no active conversation and we're still loading, show a placeholder UI
  // instead of a blocking loading screen
  if (!activeConversationId) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        enabled={true}
        className="flex-1"
      >
        <View className="flex-1 flex-col">
          {/* Sidebar Overlay */}
          {showSidebar && (
            <Pressable
              className="absolute inset-0 bg-black/50 z-40"
              onPress={() => setShowSidebar(false)}
            />
          )}

          {/* Sidebar */}
          <Animated.View
            style={{
              transform: [{ translateX: sidebarAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-SIDEBAR_WIDTH, 0],
              }) }],
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: SIDEBAR_WIDTH,
              zIndex: 50,
              backgroundColor: colors.background,
            }}
          >
            <View className="flex-1 border-r border-border">
              {/* Sidebar Header */}
              <View className="border-b border-border p-4">
                <Text className="text-lg font-bold text-foreground">{t("chat.chats")}</Text>
              </View>

              {/* New Chat Button */}
              <View className="p-4 border-b border-border">
                <Pressable
                  onPress={handleNewChat}
                  disabled={createConversationMutation.isPending}
                  className="bg-primary rounded-lg py-3 items-center justify-center disabled:opacity-50"
                  style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                >
                  {createConversationMutation.isPending ? (
                    <ActivityIndicator color={colors.background} size="small" />
                  ) : (
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="add" size={20} color={colors.background} />
                      <Text className="text-background font-semibold">{t("chat.newChat")}</Text>
                    </View>
                  )}
                </Pressable>
              </View>

              {/* Conversations List */}
              {isLoadingConversations ? (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator color={colors.primary} size="small" />
                </View>
              ) : conversations && conversations.length > 0 ? (
                <FlatList
                  data={conversations}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={{ paddingVertical: 8 }}
                  renderItem={({ item }) => (
                    <SwipeToDelete
                      onDelete={() => handleDeleteConversation(item.id)}
                      isDeleting={deleteConversationMutation.isPending}
                    >
                      <Pressable
                        onPress={() => handleSelectConversation(item.id)}
                        onLongPress={() => handleRenameConversation(item.id, item.title)}
                        className={`px-4 py-3 border-b border-border ${
                          activeConversationId === item.id ? "bg-surface" : ""
                        }`}
                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            activeConversationId === item.id
                              ? "text-primary"
                              : "text-foreground"
                          }`}
                          numberOfLines={1}
                        >
                          {item.title || t("chat.untitledChat")}
                        </Text>
                        <Text className="text-xs text-muted mt-1">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </Pressable>
                    </SwipeToDelete>
                  )}
                />
              ) : (
                <View className="flex-1 items-center justify-center px-4">
                  <Text className="text-sm text-muted text-center">{t("chat.noConversationsYet")}</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Main Chat Area - Show empty state while loading */}
          <ScreenContainer className="flex-1 relative items-center justify-center">
            <View className="gap-4 items-center px-6">
              <Ionicons name="chatbubbles" size={64} color={colors.primary} />
              <Text className="text-2xl font-bold text-foreground text-center">{t("chat.startConversation")}</Text>
              <Text className="text-base text-muted text-center">
                {isLoadingConversations ? t("chat.loadingChats") : t("chat.beginChatting")}
              </Text>
            </View>
          </ScreenContainer>
        </View>

        {/* Rename Conversation Modal */}
        <CollaborationModal
        visible={showCollaborationModal}
        onClose={() => setShowCollaborationModal(false)}
        conversationId={activeConversationId || 0}
        conversationTitle={conversations?.find(c => c.id === activeConversationId)?.title || "New Chat"}
      />
      <RenameConversationModal
          visible={renameModalVisible}
          currentTitle={renameCurrentTitle}
          onConfirm={handleConfirmRename}
          onCancel={() => setRenameModalVisible(false)}
          isLoading={updateConversationTitleMutation.isPending}
        />
      </KeyboardAvoidingView>
    );
  }

  const sidebarTranslateX = sidebarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SIDEBAR_WIDTH, 0],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      enabled={true}
      className="flex-1"
    >
      <View className="flex-1 flex-col">
        {/* Sidebar Overlay */}
        {showSidebar && (
          <Pressable
            className="absolute inset-0 bg-black/50 z-40"
            onPress={() => setShowSidebar(false)}
          />
        )}

        {/* Sidebar */}
        <Animated.View
          style={{
            transform: [{ translateX: sidebarTranslateX }],
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: SIDEBAR_WIDTH,
            zIndex: 50,
            backgroundColor: colors.background,
          }}
        >
          <View className="flex-1 border-r border-border">
            {/* Sidebar Header */}
            <View className="border-b border-border p-4">
              <Text className="text-lg font-bold text-foreground">{t("chat.chats")}</Text>
            </View>

            {/* New Chat Button */}
            <View className="p-4 border-b border-border">
              <Pressable
                onPress={handleNewChat}
                disabled={createConversationMutation.isPending}
                className="bg-primary rounded-lg py-3 items-center justify-center disabled:opacity-50"
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              >
                {createConversationMutation.isPending ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="add" size={20} color={colors.background} />
                    <Text className="text-background font-semibold">{t("chat.newChat")}</Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Conversations List */}
            {isLoadingConversations ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color={colors.primary} size="small" />
              </View>
            ) : conversations && conversations.length > 0 ? (
              <FlatList
                data={conversations}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingVertical: 8 }}
                renderItem={({ item }) => (
                  <ConversationTile
                    id={item.id}
                    title={item.title || t("chat.untitledChat")}
                    isActive={activeConversationId === item.id}
                    onPress={() => handleSelectConversation(item.id)}
                    onDelete={() => handleDeleteConversation(item.id)}
                    onRename={() => handleRenameConversation(item.id, item.title)}
                  />
                )}
              />
            ) : (
              <View className="flex-1 items-center justify-center px-4">
                <Text className="text-sm text-muted text-center">{t("chat.noConversationsYet")}</Text>
              </View>
            )}

            {/* Free Plan Badge */}
            <View className="border-t border-border p-4">
              <View className="bg-primary/10 border border-primary rounded-lg p-3 items-center">
                <Text className="text-xs font-semibold text-primary">Free Plan</Text>
                <Text className="text-xs text-muted mt-1 text-center">Unlimited conversations</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Main Chat Area */}
        <ScreenContainer className="flex-1 relative">
          <View className="flex-1 flex-col">
            {/* Header */}
            <View className="border-b border-border p-4 flex-row items-center justify-between">
              <Pressable
                onPress={() => setShowSidebar(!showSidebar)}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <Ionicons name="menu" size={24} color={colors.primary} />
              </Pressable>

              <Text className="text-lg font-bold text-foreground flex-1 text-center" numberOfLines={1}>
                {conversations?.find(c => c.id === activeConversationId)?.title || "New Chat"}
              </Text>

              <Pressable
                onPress={() => setShowCollaborationModal(true)}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <Ionicons name="people" size={24} color={colors.primary} />
              </Pressable>
              <Pressable
                onPress={() => router.push("/settings")}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <Ionicons name="settings" size={24} color={colors.primary} />
              </Pressable>
            </View>

            {/* Messages Area */}
            {messages && messages.length > 0 ? (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 12, flexGrow: 1 }}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                renderItem={({ item }) => (
                  <View
                    className={`px-2 mb-4 flex-col ${
                      item.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <View
                      className={`max-w-xs rounded-2xl px-5 py-3 shadow-sm ${
                        item.role === "user"
                          ? "bg-primary"
                          : "bg-surface border border-border"
                      }`}
                    >
                      <Text
                        className={`text-base leading-relaxed ${
                          item.role === "user" ? "text-background" : "text-foreground"
                        }`}
                        style={{ fontSize: 16 * fontSizeMultiplier }}
                      >
                        {item.content}
                      </Text>
                    </View>
                    <MessageAttachmentList messageId={item.id} />
                    <Text className="text-xs text-muted mt-1" style={{ fontSize: 12 * fontSizeMultiplier }}>
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                )}
                ListFooterComponent={
                  sendMessageMutation.isPending ? (
                    <View className="px-4 mb-4 flex-row justify-start">
                      <View className="bg-surface border border-border rounded-2xl px-5 py-3 shadow-sm">
                        <TypingIndicator />
                      </View>
                    </View>
                  ) : null
                }
              />
            ) : (
              <View className="flex-1 items-center justify-center gap-4 px-6">
                <Ionicons name="chatbubbles" size={64} color={colors.primary} />
                <Text className="text-2xl font-bold text-foreground text-center">{t("chat.startConversation")}</Text>
                <Text className="text-base text-muted text-center">
                  Type a message below to begin chatting with Zrytium AI
                </Text>
              </View>
            )}

            {/* Input Area */}
            <Animated.View
              style={[
                { marginBottom: inputBottomAnim },
              ]}
              className="border-t border-border p-4 gap-3 flex-col bg-background"
            >
              <View className="flex-row items-end gap-3">
                <View className="flex-1 bg-surface border border-border rounded-full px-4 py-2 flex-row items-center">
                  <TextInput
                    value={messageText}
                    onChangeText={setMessageText}
                    placeholder={t("chat.typeMessage")}
                    placeholderTextColor={colors.muted}
                    className="flex-1 text-foreground"
                    multiline
                    maxLength={500}
                    editable={!sendMessageMutation.isPending}
                  />
                </View>
                <Pressable
                  onPress={handleSendMessage}
                  disabled={
                    !messageText.trim() ||
                    sendMessageMutation.isPending
                  }
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
            </Animated.View>
          </View>
        </ScreenContainer>
      </View>

      {/* Rename Conversation Modal */}
      <CollaborationModal
        visible={showCollaborationModal}
        onClose={() => setShowCollaborationModal(false)}
        conversationId={activeConversationId || 0}
        conversationTitle={conversations?.find(c => c.id === activeConversationId)?.title || "New Chat"}
      />
      <RenameConversationModal
        visible={renameModalVisible}
        currentTitle={renameCurrentTitle}
        onConfirm={handleConfirmRename}
        onCancel={() => setRenameModalVisible(false)}
        isLoading={updateConversationTitleMutation.isPending}
      />
    </KeyboardAvoidingView>
  );
}
