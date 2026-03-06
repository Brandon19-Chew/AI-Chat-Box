import { View } from "react-native";
import { AnimatedLogo } from "@/components/animated-logo";
import { useColors } from "@/hooks/use-colors";
import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function SplashScreen() {
  const colors = useColors();
  const router = useRouter();

  useEffect(() => {
    // Auto-navigate to home after 1.5 seconds
    const timer = setTimeout(() => {
      router.replace("/(tabs)");
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: "#000000" }}
    >
      <AnimatedLogo size={120} duration={2000} />
    </View>
  );
}
