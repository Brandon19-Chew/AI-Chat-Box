import React, { useRef, useState } from "react";
import {
  View,
  Animated,
  PanResponder,
  Pressable,
  Text,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = 8;
const DELETE_BUTTON_WIDTH = 15;

interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function SwipeToDelete({
  children,
  onDelete,
  isDeleting = false,
}: SwipeToDeleteProps) {
  const colors = useColors();
  const pan = useRef(new Animated.ValueXY()).current;
  const [isOpen, setIsOpen] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx < 0) {
          const moveX = Math.max(gestureState.dx, -DELETE_BUTTON_WIDTH);
          pan.x.setValue(moveX);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
          Animated.timing(pan.x, {
            toValue: -DELETE_BUTTON_WIDTH,
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            setIsOpen(true);
          });
        } else {
          Animated.timing(pan.x, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            setIsOpen(false);
          });
        }
      },
    })
  ).current;

  const handleDelete = () => {
    setIsOpen(false);
    Animated.timing(pan.x, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      onDelete();
    });
  };

  return (
    <View className="relative overflow-hidden">
      {/* Delete Button Background */}
      <View className="absolute inset-0 bg-error flex-row items-center justify-end pr-4">
        <Ionicons name="trash" size={20} color={colors.background} />
      </View>

      {/* Swipeable Content */}
      <Animated.View
        style={[
          {
            transform: [{ translateX: pan.x }],
          },
        ]}
        {...panResponder.panHandlers}
        className="bg-background"
      >
        {children}
      </Animated.View>

      {/* Delete Button Overlay - Only render when open */}
      {isOpen && (
        <Pressable
          onPress={handleDelete}
          disabled={isDeleting}
          className="absolute inset-0 flex-row items-center justify-end pr-4 bg-error"
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
        >
          <Ionicons
            name="trash"
            size={20}
            color={colors.background}
          />
        </Pressable>
      )}
    </View>
  );
}
