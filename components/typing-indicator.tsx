import { View, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { useColors } from "@/hooks/use-colors";

export function TypingIndicator() {
  const colors = useColors();
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    animateDot(dot1, 0);
    animateDot(dot2, 150);
    animateDot(dot3, 300);
  }, [dot1, dot2, dot3]);

  const getDotOpacity = (animatedValue: Animated.Value) => {
    return animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    });
  };

  return (
    <View className="flex-row items-center gap-1">
      <Animated.View
        style={{
          opacity: getDotOpacity(dot1),
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.muted,
        }}
      />
      <Animated.View
        style={{
          opacity: getDotOpacity(dot2),
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.muted,
        }}
      />
      <Animated.View
        style={{
          opacity: getDotOpacity(dot3),
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.muted,
        }}
      />
    </View>
  );
}
