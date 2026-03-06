import { View, Text, Pressable, Image, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export interface FileAttachmentProps {
  fileName: string;
  fileType: "image" | "text" | "file";
  mimeType: string;
  fileUrl?: string;
  fileContent?: string;
  isLoading?: boolean;
  onPress?: () => void;
}

/**
 * Component to display file attachments in chat messages
 */
export function FileAttachment({
  fileName,
  fileType,
  mimeType,
  fileUrl,
  fileContent,
  isLoading = false,
  onPress,
}: FileAttachmentProps) {
  const colors = useColors();

  // Get appropriate icon based on file type
  const getFileIcon = () => {
    if (fileType === "image") {
      return "image";
    } else if (fileType === "text") {
      return "document-text";
    } else {
      return "document";
    }
  };

  // Get file extension
  const getFileExtension = () => {
    const parts = fileName.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "FILE";
  };

  // Display image preview
  if (fileType === "image" && (fileUrl || fileContent)) {
    return (
      <Pressable
        onPress={onPress}
        className="mb-2 rounded-lg overflow-hidden"
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        {isLoading ? (
          <View className="w-48 h-48 bg-surface rounded-lg items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <Image
            source={{ uri: fileUrl || `data:${mimeType};base64,${fileContent}` }}
            style={{ width: 200, height: 200 }}
            className="rounded-lg"
          />
        )}
      </Pressable>
    );
  }

  // Display file preview for text files
  if (fileType === "text" && fileContent) {
    const preview = fileContent.substring(0, 200);
    const hasMore = fileContent.length > 200;

    return (
      <Pressable
        onPress={onPress}
        className="mb-2 bg-surface rounded-lg p-3 border border-border"
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        <View className="flex-row items-start gap-3">
          <Ionicons name={getFileIcon()} size={24} color={colors.primary} />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
              {fileName}
            </Text>
            <Text className="text-xs text-muted mt-1" numberOfLines={3}>
              {preview}
              {hasMore ? "..." : ""}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  // Display generic file preview
  return (
    <Pressable
      onPress={onPress}
      className="mb-2 bg-surface rounded-lg p-4 border border-border flex-row items-center gap-3"
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
    >
      <View className="w-12 h-12 bg-primary/10 rounded-lg items-center justify-center">
        <Ionicons name={getFileIcon()} size={24} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
          {fileName}
        </Text>
        <Text className="text-xs text-muted mt-1">
          {getFileExtension()} • {mimeType}
        </Text>
      </View>
      {isLoading && <ActivityIndicator color={colors.primary} size="small" />}
    </Pressable>
  );
}
