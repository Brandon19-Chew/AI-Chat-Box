import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { startOAuthLogin } from "@/constants/oauth";

export default function LoginScreen() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const colors = useColors();

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace("/");
    }
  }, [isAuthenticated, user]);

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1 items-center justify-center p-6">
      <View className="items-center gap-6 w-full max-w-sm">
        {/* Logo and Title */}
        <View className="items-center gap-3">
          <Text className="text-5xl font-bold text-primary">⚡</Text>
          <Text className="text-3xl font-bold text-foreground">Zrytium AI</Text>
          <Text className="text-base text-muted text-center">
            Your intelligent conversation partner
          </Text>
        </View>

        {/* Features List */}
        <View className="gap-3 w-full">
          <View className="flex-row items-start gap-3">
            <Text className="text-lg text-primary">✓</Text>
            <Text className="text-sm text-foreground flex-1">
              AI-powered conversations
            </Text>
          </View>
          <View className="flex-row items-start gap-3">
            <Text className="text-lg text-primary">✓</Text>
            <Text className="text-sm text-foreground flex-1">
              Smart conversation titles
            </Text>
          </View>
          <View className="flex-row items-start gap-3">
            <Text className="text-lg text-primary">✓</Text>
            <Text className="text-sm text-foreground flex-1">
              Secure Google authentication
            </Text>
          </View>
        </View>

        {/* Login Button */}
        <Pressable
          onPress={() => startOAuthLogin()}
          className="w-full bg-primary rounded-full py-4 items-center justify-center mt-6"
          style={({ pressed }) => [
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text className="text-background font-semibold text-base">
            Sign in with Google
          </Text>
        </Pressable>

        {/* Terms */}
        <Text className="text-xs text-muted text-center">
          By signing in, you agree to our Terms of Service
        </Text>
      </View>
    </ScreenContainer>
  );
}
