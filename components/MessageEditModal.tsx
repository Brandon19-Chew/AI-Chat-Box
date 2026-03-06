import React, { useState } from "react";
import { View, Text, Pressable, Modal, TextInput, ActivityIndicator } from "react-native";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

interface MessageEditModalProps {
  visible: boolean;
  messageId: number;
  conversationId: number;
  originalContent: string;
  onClose: () => void;
  onSave?: () => void;
}

export function MessageEditModal({
  visible,
  messageId,
  conversationId,
  originalContent,
  onClose,
  onSave,
}: MessageEditModalProps) {
  const [editedContent, setEditedContent] = useState(originalContent);
  const colors = useColors();

  const editMessageMutation = trpc.chat.editMessage.useMutation({
    onSuccess: () => {
      // After editing, regenerate the AI response
      regenerateResponseMutation.mutate({ conversationId, messageId });
    },
    onError: (error) => {
      console.error("Edit message error:", error);
    },
  });

  const regenerateResponseMutation = trpc.chat.regenerateResponse.useMutation({
    onSuccess: () => {
      setEditedContent(originalContent);
      onClose();
      onSave?.();
    },
    onError: (error) => {
      console.error("Regenerate response error:", error);
    },
  });

  const handleSave = () => {
    if (!editedContent.trim()) {
      return;
    }

    if (editedContent.trim() === originalContent.trim()) {
      onClose();
      return;
    }

    editMessageMutation.mutate({
      messageId,
      newContent: editedContent.trim(),
    });
  };

  const isLoading =
    editMessageMutation.isPending || regenerateResponseMutation.isPending;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-center items-center p-4"
        onPress={onClose}
      >
        <Pressable
          className="bg-background rounded-2xl p-6 gap-4 w-full max-w-md"
          onPress={(e) => e.stopPropagation()}
        >
          <Text className="text-xl font-semibold text-foreground">
            Edit Message
          </Text>

          <View className="bg-surface border border-border rounded-lg p-4">
            <TextInput
              value={editedContent}
              onChangeText={setEditedContent}
              placeholder="Edit your message..."
              placeholderTextColor={colors.muted}
              className="text-foreground text-base"
              multiline
              maxLength={500}
              editable={!isLoading}
              style={{ minHeight: 100 }}
            />
          </View>

          <Text className="text-xs text-muted">
            Editing this message will delete all following messages and regenerate the AI response.
          </Text>

          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-lg bg-surface border border-border items-center disabled:opacity-50"
            >
              <Text className="text-foreground font-semibold">Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={
                isLoading ||
                !editedContent.trim() ||
                editedContent.trim() === originalContent.trim()
              }
              className="flex-1 px-4 py-3 rounded-lg bg-primary items-center disabled:opacity-50"
            >
              {isLoading ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text className="text-background font-semibold">Save & Regenerate</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
