import { Animated, Image, View } from "react-native";
import { useEffect, useRef } from "react";

interface AnimatedLogoProps {
  size?: number;
  duration?: number;
}

export function AnimatedLogo({ size = 100, duration = 2000 }: AnimatedLogoProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Rotation animation (continuous loop)
    const rotationLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      })
    );

    // Scale and opacity animation (entrance)
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Start rotation after entrance animation
    const rotationTimeout = setTimeout(() => {
      rotationLoop.start();
    }, 600);

    return () => {
      clearTimeout(rotationTimeout);
      rotationLoop.stop();
    };
  }, [rotateAnim, scaleAnim, opacityAnim, duration]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Animated.Image
        source={require("@/assets/images/icon.png")}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          {
            transform: [
              { rotate: rotation },
              { scale: scaleAnim },
            ],
            opacity: opacityAnim,
          },
        ]}
      />
    </View>
  );
}
