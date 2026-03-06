import React, { useState } from "react";
import { Image as RNImage, View, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useColors } from "@/hooks/use-colors";

export interface OptimizedImageProps {
  source: string | { uri: string };
  width?: number | string;
  height?: number | string;
  placeholder?: string;
  contentFit?: "cover" | "contain" | "fill" | "scale-down";
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Optimized image component with lazy loading and caching
 * Uses expo-image for better performance and caching
 */
export function OptimizedImage({
  source,
  width = "100%",
  height = 200,
  placeholder,
  contentFit = "cover",
  onLoad,
  onError,
}: OptimizedImageProps) {
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.(new Error("Image failed to load"));
  };

  if (hasError) {
    return (
      <View
        style={{
          width: typeof width === "number" ? width : undefined,
          height: typeof height === "number" ? height : undefined,
          backgroundColor: colors.surface,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <RNImage
          source={require("@/assets/images/icon.png")}
          style={{ width: 40, height: 40, opacity: 0.5 }}
        />
      </View>
    );
  }

  return (
    <View
      style={{
        width: typeof width === "number" ? width : undefined,
        height: typeof height === "number" ? height : undefined,
        position: "relative",
      }}
    >
      <Image
        source={source}
        style={{ width: "100%", height: "100%" }}
        contentFit={contentFit}
        placeholder={placeholder}
        onLoad={handleLoad}
        onError={handleError}
        cachePolicy="memory-disk"
      />
      {isLoading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.surface,
          }}
        >
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
}
