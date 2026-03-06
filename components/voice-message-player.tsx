import React, { useEffect, useState } from "react";
import { View, Pressable, Text, ActivityIndicator } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

interface VoiceMessagePlayerProps {
  audioUri: string;
  isUserMessage?: boolean;
}

export function VoiceMessagePlayer({
  audioUri,
  isUserMessage = false,
}: VoiceMessagePlayerProps) {
  const colors = useColors();
  const player = useAudioPlayer(audioUri);
  const playerStatus = useAudioPlayerStatus(player);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (playerStatus.duration) {
      setDuration(Math.floor(playerStatus.duration / 1000));
    }
  }, [playerStatus.duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentTime = 0; // Audio position tracking not directly available
  const isPlaying = playerStatus.playing;

  const handlePlayPause = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleSeek = (position: number) => {
    player.seekTo(position);
  };

  return (
    <View
      className={`flex-row items-center gap-3 px-4 py-3 rounded-2xl ${
        isUserMessage ? "bg-primary" : "bg-surface border border-border"
      }`}
    >
      <Pressable
        onPress={handlePlayPause}
        className="rounded-full p-2"
        style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
      >
        {false ? (
          <ActivityIndicator
            color={isUserMessage ? colors.background : colors.primary}
            size="small"
          />
        ) : (
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={18}
            color={isUserMessage ? colors.background : colors.primary}
          />
        )}
      </Pressable>

      <View className="flex-1">
        <View className="h-1 bg-gray-300 rounded-full overflow-hidden">
          <View
            className={`h-full ${isUserMessage ? "bg-background" : "bg-primary"}`}
            style={{
              width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
            }}
          />
        </View>
      </View>

      <Text
        className={`text-xs font-semibold ${
          isUserMessage ? "text-background" : "text-foreground"
        }`}
      >
        {formatTime(currentTime)} / {formatTime(duration)}
      </Text>
    </View>
  );
}
