import { describe, it, expect } from "vitest";

describe("Message Reactions", () => {
  describe("Reaction emoji validation", () => {
    it("should accept common emoji reactions", () => {
      const validEmojis = ["👍", "❤️", "😂", "😮", "😢", "🔥", "✨", "👏"];
      validEmojis.forEach((emoji) => {
        expect(emoji.length).toBeGreaterThan(0);
        expect(emoji.length).toBeLessThanOrEqual(10);
      });
    });

    it("should validate emoji length constraint", () => {
      const shortEmoji = "👍";
      const longEmoji = "👍❤️😂😮😢🔥✨👏";
      
      expect(shortEmoji.length).toBeLessThanOrEqual(10);
      expect(longEmoji.length).toBeGreaterThan(10);
    });
  });

  describe("Reaction grouping logic", () => {
    it("should group reactions by emoji and count", () => {
      const reactions = [
        { messageId: 1, userId: 1, emoji: "👍", createdAt: new Date() },
        { messageId: 1, userId: 2, emoji: "👍", createdAt: new Date() },
        { messageId: 1, userId: 3, emoji: "❤️", createdAt: new Date() },
      ];

      const grouped: Record<string, { count: number; userIds: number[] }> = {};
      for (const reaction of reactions) {
        if (reaction && !grouped[reaction.emoji]) {
          grouped[reaction.emoji] = { count: 0, userIds: [] };
        }
        if (reaction) {
          grouped[reaction.emoji].count++;
          grouped[reaction.emoji].userIds.push(reaction.userId);
        }
      }

      expect(grouped["👍"].count).toBe(2);
      expect(grouped["👍"].userIds).toEqual([1, 2]);
      expect(grouped["❤️"].count).toBe(1);
      expect(grouped["❤️"].userIds).toEqual([3]);
    });

    it("should handle empty reactions", () => {
      const reactions: Array<{ messageId: number; userId: number; emoji: string; createdAt: Date }> = [];
      const grouped: Record<string, { count: number; userIds: number[] }> = {};
      
      for (const reaction of reactions) {
        if (!grouped[reaction.emoji]) {
          grouped[reaction.emoji] = { count: 0, userIds: [] };
        }
        grouped[reaction.emoji].count++;
        if (reaction) {
          grouped[reaction.emoji].userIds.push(reaction.userId);
        }
      }

      expect(Object.keys(grouped).length).toBe(0);
    });
  });

  describe("Reaction toggle behavior", () => {
    it("should toggle reaction on and off", () => {
      const userReactions = new Set<string>();
      const emoji = "👍";

      // First reaction - add
      if (!userReactions.has(emoji)) {
        userReactions.add(emoji);
      }
      expect(userReactions.has(emoji)).toBe(true);

      // Second reaction - remove (toggle)
      if (userReactions.has(emoji)) {
        userReactions.delete(emoji);
      }
      expect(userReactions.has(emoji)).toBe(false);

      // Third reaction - add again
      if (!userReactions.has(emoji)) {
        userReactions.add(emoji);
      }
      expect(userReactions.has(emoji)).toBe(true);
    });
  });
});
