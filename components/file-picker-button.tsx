import { Pressable, ActivityIndicator, View, Modal, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { pickFile, pickImage, FileData } from "@/utils/file-upload";
import { useState } from "react";

export interface FilePickerButtonProps {
  onFileSelected: (file: FileData) => void;
  disabled?: boolean;
}

/**
 * Combined file picker button with menu for selecting files or images
 */
export function FilePickerButton({ onFileSelected, disabled = false }: FilePickerButtonProps) {
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handlePickFile = async () => {
    setShowMenu(false);
    setIsLoading(true);
    try {
      const file = await pickFile();
      if (file) {
        onFileSelected(file);
      }
    } catch (error) {
      console.error("Error picking file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickImage = async () => {
    setShowMenu(false);
    setIsLoading(true);
    try {
      const image = await pickImage();
      if (image) {
        onFileSelected(image);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Main Button */}
      <Pressable
        onPress={() => setShowMenu(true)}
        disabled={disabled || isLoading}
        className="bg-surface border border-border rounded-full p-3 disabled:opacity-50"
        style={({ pressed }) => [{ opacity: pressed && !disabled ? 0.7 : 1 }]}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <Ionicons name="add-circle" size={20} color={colors.primary} />
        )}
      </Pressable>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 items-center justify-center"
          onPress={() => setShowMenu(false)}
        >
          <View
            className="bg-background rounded-2xl p-4 gap-3 w-56 shadow-lg"
            onStartShouldSetResponder={() => true}
          >
            <Text className="text-lg font-bold text-foreground text-center mb-2">
              Upload
            </Text>

            {/* Pick Image Option */}
            <Pressable
              onPress={handlePickImage}
              disabled={isLoading}
              className="flex-row items-center gap-3 p-4 bg-surface rounded-lg border border-border disabled:opacity-50"
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="image" size={24} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  Image
                </Text>
                <Text className="text-xs text-muted">
                  Pick from gallery or camera
                </Text>
              </View>
            </Pressable>

            {/* Pick File Option */}
            <Pressable
              onPress={handlePickFile}
              disabled={isLoading}
              className="flex-row items-center gap-3 p-4 bg-surface rounded-lg border border-border disabled:opacity-50"
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="document" size={24} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  Document
                </Text>
                <Text className="text-xs text-muted">
                  Pick text or file
                </Text>
              </View>
            </Pressable>

            {/* Cancel Button */}
            <Pressable
              onPress={() => setShowMenu(false)}
              className="p-3 mt-2 rounded-lg bg-error/10"
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text className="text-center text-error font-semibold">
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
