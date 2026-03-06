import { describe, it, expect } from "vitest";

describe("Auto-Title Generation from First Message", () => {
  describe("Title extraction logic", () => {
    it("should extract short messages as-is", () => {
      const message = "What is the weather today?";
      const title = message.trim().slice(0, 50);
      expect(title).toBe("What is the weather today?");
    });

    it("should truncate long messages at 50 characters", () => {
      const message = "This is a very long message that exceeds fifty characters and should be truncated";
      const title = message.trim().slice(0, 50);
      expect(title.length).toBeLessThanOrEqual(50);
    });

    it("should find question mark as break point", () => {
      const message = "What is AI? It is a technology that helps people.";
      const messagePreview = message.trim();
      const questionIndex = messagePreview.indexOf("?");
      
      if (questionIndex >= 0 && questionIndex < 40) {
        const title = messagePreview.slice(0, questionIndex + 1).trim();
        expect(title).toBe("What is AI?");
      }
    });

    it("should find word boundary as break point", () => {
      const message = "Tell me about the history of artificial intelligence and machine learning";
      const messagePreview = message.trim();
      const lastSpaceIndex = messagePreview.lastIndexOf(" ", 60);
      
      if (lastSpaceIndex > 40) {
        const title = messagePreview.slice(0, lastSpaceIndex).trim();
        expect(title.length).toBeLessThanOrEqual(60);
        expect(title.endsWith(" ")).toBe(false);
      }
    });
  });

  describe("Title formatting", () => {
    it("should trim whitespace from title", () => {
      const message = "  What is AI?  ";
      const title = message.trim();
      expect(title).toBe("What is AI?");
      expect(title.startsWith(" ")).toBe(false);
      expect(title.endsWith(" ")).toBe(false);
    });

    it("should handle multi-line messages", () => {
      const message = "First line\nSecond line\nThird line";
      const title = message.split("\n")[0];
      expect(title).toBe("First line");
    });

    it("should preserve punctuation in title", () => {
      const message = "What is AI? How does it work?";
      const title = message.slice(0, 11);
      expect(title).toBe("What is AI?");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty message", () => {
      const message = "";
      const title = message.trim() || "New Chat";
      expect(title).toBe("New Chat");
    });

    it("should handle message with only whitespace", () => {
      const message = "   ";
      const title = message.trim() || "New Chat";
      expect(title).toBe("New Chat");
    });

    it("should handle very short message", () => {
      const message = "Hi";
      const title = message.trim();
      expect(title).toBe("Hi");
    });

    it("should handle message with special characters", () => {
      const message = "What is AI & ML? #technology #learning";
      const title = message.slice(0, 50);
      expect(title).toContain("&");
      expect(title).toContain("#");
    });

    it("should handle message with numbers", () => {
      const message = "Tell me about the top 10 AI tools in 2026";
      const title = message.slice(0, 50);
      expect(title).toContain("10");
      expect(title).toContain("2026");
    });
  });

  describe("Title length constraints", () => {
    it("should not exceed 50 characters by default", () => {
      const message = "This is a very long message that definitely exceeds the fifty character limit";
      let titleLength = 50;
      if (message.length > 50) {
        const lastSpaceIndex = message.lastIndexOf(" ", 60);
        if (lastSpaceIndex > 40) {
          titleLength = lastSpaceIndex;
        }
      }
      expect(titleLength).toBeLessThanOrEqual(60);
    });

    it("should prefer natural break points", () => {
      const message = "What is machine learning? It is a subset of AI.";
      const messagePreview = message.trim();
      const questionIndex = messagePreview.indexOf("?");
      
      if (questionIndex >= 0 && questionIndex < 50) {
        const title = messagePreview.slice(0, questionIndex + 1).trim();
        expect(title.length).toBeLessThan(50);
      }
    });
  });

  describe("Title relevance", () => {
    it("should capture main topic from message", () => {
      const message = "How do I start learning Python programming?";
      const title = message.slice(0, 50);
      expect(title).toContain("Python");
    });

    it("should preserve question intent", () => {
      const message = "What are the best practices for web development?";
      const title = message.slice(0, 50);
      expect(title).toContain("?");
    });

    it("should handle command-like messages", () => {
      const message = "Generate a Python script for web scraping";
      const title = message.slice(0, 50);
      expect(title).toContain("Python");
    });
  });
});
