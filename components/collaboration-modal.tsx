import { View, Text, Modal, Pressable, TextInput, ActivityIndicator, Alert, ScrollView, Share } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";

interface CollaborationModalProps {
  visible: boolean;
  onClose: () => void;
  conversationId: number;
  conversationTitle: string;
}

export function CollaborationModal({
  visible,
  onClose,
  conversationId,
  conversationTitle,
}: CollaborationModalProps) {
  const colors = useColors();
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [invitationLink, setInvitationLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const shareConversationMutation = trpc.collaboration.share.useMutation();

  const handleShareConversation = async () => {
    if (!collaboratorEmail.trim()) {
      Alert.alert("Error", "Please enter an email address");
      return;
    }

    setIsLoading(true);
    try {
      const result = await shareConversationMutation.mutateAsync({
        conversationId,
        collaboratorEmail: collaboratorEmail.trim(),
      });

      setInvitationLink(result.invitationLink);
      setCollaboratorEmail("");
      Alert.alert("Success", `Invitation sent to ${collaboratorEmail}`);
    } catch (error) {
      Alert.alert("Error", "Failed to share conversation");
      console.error("Share error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (invitationLink) {
      try {
        await Share.share({
          message: `Join me in this conversation: ${invitationLink}`,
          url: invitationLink,
          title: `Collaborate on: ${conversationTitle}`,
        });
      } catch (error) {
        Alert.alert("Error", "Failed to share link");
        console.error("Share error:", error);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View
          className="bg-background rounded-t-3xl p-6 max-h-[90%]"
          style={{ backgroundColor: colors.background }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-foreground flex-1">
                Collaborate
              </Text>
              <Pressable onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Conversation Title */}
            <View className="mb-6 p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
              <Text className="text-xs text-muted mb-2">Conversation</Text>
              <Text className="text-base font-semibold text-foreground">
                {conversationTitle}
              </Text>
            </View>

            {/* Invitation Link Section */}
            {invitationLink && (
              <View className="mb-6">
                <Text className="text-sm font-semibold text-foreground mb-3">
                  Invitation Link
                </Text>
                <View
                  className="p-4 rounded-lg border border-border flex-row items-center justify-between"
                  style={{ backgroundColor: colors.surface }}
                >
                  <Text
                    className="text-xs text-muted flex-1 mr-2"
                    numberOfLines={1}
                  >
                    {invitationLink}
                  </Text>
                  <Pressable
                    onPress={handleCopyLink}
                    className="p-2"
                    style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                  >
                    <Ionicons name="share-social" size={18} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Email Input Section */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-3">
                Share with Email
              </Text>
              <View
                className="border border-border rounded-lg p-4 flex-row items-center"
                style={{ backgroundColor: colors.surface }}
              >
                <Ionicons name="mail" size={18} color={colors.muted} />
                <TextInput
                  value={collaboratorEmail}
                  onChangeText={setCollaboratorEmail}
                  placeholder="Enter email address"
                  placeholderTextColor={colors.muted}
                  className="flex-1 ml-3 text-foreground"
                  keyboardType="email-address"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Send Button */}
            <Pressable
              onPress={handleShareConversation}
              disabled={isLoading || !collaboratorEmail.trim()}
              className="bg-primary rounded-lg py-4 items-center justify-center disabled:opacity-50 mb-4"
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <Ionicons name="send" size={18} color={colors.background} />
                  <Text className="text-background font-semibold">
                    Send Invitation
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Info Text */}
            <Text className="text-xs text-muted text-center">
              Share this conversation with others by sending them an invitation link or email
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
