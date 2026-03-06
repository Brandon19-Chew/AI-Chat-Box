import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

export interface ImageMessageProps {
  imageUrls: string[];
  prompt: string;
  isLoading?: boolean;
  error?: string;
}

export function ImageMessage({
  imageUrls,
  prompt,
  isLoading = false,
  error,
}: ImageMessageProps) {
  const colors = useColors();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (isLoading) {
    return (
      <View className="flex-row items-center gap-2 p-3 bg-surface rounded-lg">
        <ActivityIndicator size="small" color={colors.primary} />
        <Text className="text-sm text-muted flex-1">Generating image...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="p-3 bg-red-50 rounded-lg border border-error">
        <Text className="text-sm font-semibold text-error mb-1">Image Generation Failed</Text>
        <Text className="text-xs text-error opacity-75">{error}</Text>
      </View>
    );
  }

  if (!imageUrls || imageUrls.length === 0) {
    return null;
  }

  const selectedImage = imageUrls[selectedImageIndex];

  return (
    <View className="gap-2">
      <View className="rounded-lg overflow-hidden bg-surface border border-border">
        <Image
          source={{ uri: selectedImage }}
          style={{ width: "100%", height: 300 }}
          contentFit="cover"
          placeholder={{ blurhash: "L2PZfQi_.AyE_3t757oJodS$IVof" }}
        />
      </View>

      <View className="px-2">
        <Text className="text-xs text-muted mb-1">Prompt:</Text>
        <Text className="text-sm text-foreground leading-relaxed">{prompt}</Text>
      </View>

      {imageUrls.length > 1 && (
        <View className="flex-row gap-2 px-2">
          {imageUrls.map((_, index) => (
            <Pressable
              key={index}
              onPress={() => setSelectedImageIndex(index)}
              className={cn(
                "flex-1 py-2 rounded-md border-2 items-center justify-center",
                selectedImageIndex === index
                  ? "bg-primary border-primary"
                  : "bg-surface border-border"
              )}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                className={cn(
                  "text-xs font-semibold",
                  selectedImageIndex === index ? "text-background" : "text-foreground"
                )}
              >
                {index + 1}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {imageUrls.length > 1 && (
        <Text className="text-xs text-muted text-center">
          Image {selectedImageIndex + 1} of {imageUrls.length}
        </Text>
      )}
    </View>
  );
}
