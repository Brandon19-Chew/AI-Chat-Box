import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";

interface RenameConversationModalProps {
  visible: boolean;
  currentTitle: string;
  onConfirm: (newTitle: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RenameConversationModal({
  visible,
  currentTitle,
  onConfirm,
  onCancel,
  isLoading = false,
}: RenameConversationModalProps) {
  const colors = useColors();
  const [newTitle, setNewTitle] = useState(currentTitle);

  useEffect(() => {
    setNewTitle(currentTitle);
  }, [currentTitle, visible]);

  const handleConfirm = () => {
    const trimmedTitle = newTitle.trim();
    if (trimmedTitle && trimmedTitle !== currentTitle) {
      onConfirm(trimmedTitle);
    } else {
      onCancel();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View
        className="flex-1 bg-black/50 items-center justify-center"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      >
        <View
          className="bg-background rounded-2xl p-6 w-5/6 gap-4"
          style={{ backgroundColor: colors.background }}
        >
          {/* Header */}
          <View className="gap-2">
            <Text className="text-xl font-bold text-foreground">
              Rename Conversation
            </Text>
            <Text className="text-sm text-muted">
              Enter a new title for this conversation
            </Text>
          </View>

          {/* Input */}
          <TextInput
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="Enter new title..."
            placeholderTextColor={colors.muted}
            className="border border-border rounded-lg px-4 py-3 text-foreground"
            style={{
              borderColor: colors.border,
              color: colors.foreground,
            }}
            maxLength={50}
            editable={!isLoading}
            autoFocus
          />

          {/* Character count */}
          <Text className="text-xs text-muted text-right">
            {newTitle.length}/50
          </Text>

          {/* Buttons */}
          <View className="flex-row gap-3 pt-2">
            <Pressable
              onPress={onCancel}
              disabled={isLoading}
              className="flex-1 border border-border rounded-lg py-3 items-center justify-center disabled:opacity-50"
              style={({ pressed }) => [
                { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text className="text-foreground font-semibold">Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              disabled={isLoading || !newTitle.trim() || newTitle === currentTitle}
              className="flex-1 bg-primary rounded-lg py-3 items-center justify-center disabled:opacity-50 flex-row gap-2"
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color={colors.background} />
                  <Text className="text-background font-semibold">Save</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
