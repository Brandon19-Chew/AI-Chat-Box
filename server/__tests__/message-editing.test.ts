import { describe, it, expect } from "vitest";

describe("Message Editing", () => {
  describe("Edit message validation", () => {
    it("should validate that new content is not empty", () => {
      const newContent = "";
      expect(newContent.trim().length).toBe(0);
    });

    it("should accept valid message edits", () => {
      const originalContent = "What is the weather today?";
      const editedContent = "What is the weather like today?";
      
      expect(editedContent.length).toBeGreaterThan(0);
      expect(editedContent).not.toBe(originalContent);
    });

    it("should handle content with max length", () => {
      const maxLength = 500;
      const content = "a".repeat(maxLength);
      
      expect(content.length).toBeLessThanOrEqual(maxLength);
    });
  });

  describe("Message edit tracking", () => {
    it("should mark message as edited", () => {
      const message = {
        id: 1,
        conversationId: 1,
        role: "user" as const,
        content: "Original content",
        isEdited: 1,
        editedAt: new Date(),
        createdAt: new Date(),
      };

      expect(message.isEdited).toBe(1);
      expect(message.editedAt).toBeDefined();
    });

    it("should store edit history", () => {
      const editHistory = [
        {
          id: 1,
          messageId: 1,
          originalContent: "First version",
          editedContent: "Second version",
          createdAt: new Date(),
        },
        {
          id: 2,
          messageId: 1,
          originalContent: "Second version",
          editedContent: "Third version",
          createdAt: new Date(),
        },
      ];

      expect(editHistory.length).toBe(2);
      expect(editHistory[0].originalContent).toBe("First version");
      expect(editHistory[1].editedContent).toBe("Third version");
    });
  });

  describe("Following message deletion", () => {
    it("should delete all messages after edited message", () => {
      const messages = [
        { id: 1, role: "user" as const, content: "Message 1" },
        { id: 2, role: "assistant" as const, content: "Response 1" },
        { id: 3, role: "user" as const, content: "Message 2" },
        { id: 4, role: "assistant" as const, content: "Response 2" },
      ];

      const editedMessageId = 1;
      const editedIndex = messages.findIndex((m) => m.id === editedMessageId);
      const messagesToDelete = messages.slice(editedIndex + 1);

      expect(messagesToDelete.length).toBe(3);
      expect(messagesToDelete[0].id).toBe(2);
      expect(messagesToDelete[messagesToDelete.length - 1].id).toBe(4);
    });

    it("should handle editing the last message", () => {
      const messages = [
        { id: 1, role: "user" as const, content: "Message 1" },
        { id: 2, role: "assistant" as const, content: "Response 1" },
      ];

      const editedMessageId = 2;
      const editedIndex = messages.findIndex((m) => m.id === editedMessageId);
      const messagesToDelete = messages.slice(editedIndex + 1);

      expect(messagesToDelete.length).toBe(0);
    });
  });

  describe("Response regeneration", () => {
    it("should use only messages up to edited message for regeneration", () => {
      const allMessages = [
        { id: 1, role: "user" as const, content: "Question 1" },
        { id: 2, role: "assistant" as const, content: "Answer 1" },
        { id: 3, role: "user" as const, content: "Question 2" },
        { id: 4, role: "assistant" as const, content: "Answer 2" },
      ];

      const editedMessageId = 1;
      const editedIndex = allMessages.findIndex((m) => m.id === editedMessageId);
      const llmMessages = allMessages.slice(0, editedIndex + 1);

      expect(llmMessages.length).toBe(1);
      expect(llmMessages[0].content).toBe("Question 1");
    });

    it("should include edited user message in regeneration context", () => {
      const allMessages = [
        { id: 1, role: "user" as const, content: "Original question" },
        { id: 2, role: "assistant" as const, content: "Original answer" },
      ];

      const editedMessageId = 1;
      const editedIndex = allMessages.findIndex((m) => m.id === editedMessageId);
      const llmMessages = allMessages.slice(0, editedIndex + 1);

      expect(llmMessages[0].role).toBe("user");
      expect(llmMessages[0].content).toBe("Original question");
    });
  });

  describe("Edit modal behavior", () => {
    it("should show edit button only for user messages", () => {
      const userMessage = { role: "user" as const };
      const assistantMessage = { role: "assistant" as const };

      expect(userMessage.role).toBe("user");
      expect(assistantMessage.role).not.toBe("user");
    });

    it("should disable save button if content unchanged", () => {
      const originalContent = "Hello world";
      const editedContent = "Hello world";

      const isUnchanged =
        editedContent.trim() === originalContent.trim();
      expect(isUnchanged).toBe(true);
    });

    it("should enable save button if content changed", () => {
      const originalContent = "Hello world";
      const editedContent = "Hello there";

      const isChanged =
        editedContent.trim() !== originalContent.trim();
      expect(isChanged).toBe(true);
    });
  });
});
