import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db.js";
import { invokeLLM } from "./_core/llm.js";
import { performWebSearch, formatSearchResults, shouldPerformWebSearch } from "./_core/web-search.js";
import { generateImages } from "./_core/image-generation.js";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  chat: router({
    listConversations: protectedProcedure.query(({ ctx }) =>
      db.getUserConversations(ctx.user.id)
    ),

    createConversation: protectedProcedure
      .input(z.object({ initialMessage: z.string() }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Use first message as title (first 50-60 characters)
          let initialTitle = "New Chat";
          if (input.initialMessage.trim()) {
            // Extract first 50-60 characters from the message as title
            const messagePreview = input.initialMessage.trim();
            // Find a good break point (sentence end or word boundary)
            let titleLength = 50;
            if (messagePreview.length > 50) {
              // Try to find a sentence end or space near 50 characters
              const periodIndex = messagePreview.indexOf(".", 40);
              const questionIndex = messagePreview.indexOf("?", 40);
              const exclamationIndex = messagePreview.indexOf("!", 40);
              const lastSpaceIndex = messagePreview.lastIndexOf(" ", 60);
              
              if (periodIndex > 40 && periodIndex < 70) {
                titleLength = periodIndex;
              } else if (questionIndex > 40 && questionIndex < 70) {
                titleLength = questionIndex;
              } else if (exclamationIndex > 40 && exclamationIndex < 70) {
                titleLength = exclamationIndex;
              } else if (lastSpaceIndex > 40) {
                titleLength = lastSpaceIndex;
              }
            }
            initialTitle = messagePreview.slice(0, titleLength).trim();
          }
          
          const conversationId = await db.createConversation(ctx.user.id, initialTitle);
          
          // Only add message if initialMessage is provided
          if (input.initialMessage.trim()) {
            await db.addMessage(conversationId, "user", input.initialMessage);
            
            // Generate AI response - non-blocking
            try {
              const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
              const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
              const response = await invokeLLM({
                messages: [
                  { role: "system", content: `You are a helpful AI assistant called Zrytium AI. Today is ${currentDate} at ${currentTime} GMT+8. Provide clear, concise, and helpful responses. When asked about current events, dates, or time-sensitive information, use your knowledge up to your training cutoff and inform the user if you need real-time data.` },
                  { role: "user", content: input.initialMessage },
                ],
              });
              
              const aiContentRaw = response.choices[0]?.message?.content || "I apologize, but I could not generate a response.";
              const aiContent = typeof aiContentRaw === "string" ? aiContentRaw : "I apologize, but I could not generate a response.";
              await db.addMessage(conversationId, "assistant", aiContent);
            } catch (llmError) {
              console.error("[LLM] Failed to generate response:", llmError);
              // Continue anyway - user message is saved
            }

          }
          
          const messages = await db.getConversationMessages(conversationId);
          return { conversationId, messages };
        } catch (error) {
          console.error("[Chat] createConversation failed:", error);
          throw error;
        }
      }),

    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(({ input }) => db.getConversationMessages(input.conversationId)),

    sendMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        message: z.string().min(0),
        file: z.object({
          fileName: z.string(),
          fileType: z.enum(["image", "text", "file"]),
          mimeType: z.string(),
          fileContent: z.string(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        const messageId = await db.addMessage(input.conversationId, "user", input.message || "[File shared]");
        
        if (input.file) {
          await db.addMessageAttachment(
            messageId,
            input.file.fileName,
            input.file.fileType,
            input.file.fileContent.length,
            input.file.mimeType,
            "",
            input.file.fileContent
          );
        }
        
        const history = await db.getConversationMessages(input.conversationId);
        
        const llmMessages = history.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content as string,
        }));
        
        // Build the last user message with file content
        if (llmMessages.length > 0 && llmMessages[llmMessages.length - 1].role === "user") {
          const lastUserMsg = llmMessages[llmMessages.length - 1];
          
          if (input.file) {
            if (input.file.fileType === "image") {
              // For images, create a message with both text and image content
              const messageContent: any[] = [
                { type: "text", text: lastUserMsg.content }
              ];
              
              // Check if fileContent is already base64 or needs encoding
              let imageData = input.file.fileContent;
              if (!imageData.startsWith("data:") && !imageData.startsWith("/9j/") && !imageData.startsWith("iVBORw0KGgo")) {
                // If it looks like a file path or raw data, try to use it as is
                // Assume it's base64 encoded
              }
              
              // Create image URL from base64
              const imageUrl = imageData.startsWith("data:") 
                ? imageData 
                : `data:${input.file.mimeType};base64,${imageData}`;
              
              messageContent.push({
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "auto"
                }
              });
              
              lastUserMsg.content = messageContent as any;
            } else if (input.file.fileType === "text") {
              // For text files, append content to message
              lastUserMsg.content += `\n\n[Text file: ${input.file.fileName}]\n${input.file.fileContent}`;
            } else {
              // For other files, just mention the file
              lastUserMsg.content += `\n\n[File attached: ${input.file.fileName}]`;
            }
          }
        }
        
        const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        
        let searchContext = "";
        if (shouldPerformWebSearch(input.message)) {
          try {
            const searchResults = await performWebSearch(input.message);
            if (searchResults.length > 0) {
              searchContext = `\n\nRecent search results for context:\n${formatSearchResults(searchResults)}`;
            }
          } catch (searchError) {
            console.warn("[Chat] Web search failed, continuing without search context", searchError);
          }
        }
        
        const response = await invokeLLM({
          messages: [
            { role: "system", content: `You are a helpful AI assistant called Zrytium AI. The current date and time is: ${currentDate} at ${currentTime} GMT+8. IMPORTANT: When answering questions about what day of the week it is, always refer to the day name at the beginning of the date above. Provide clear, concise, and helpful responses. When asked about current events, dates, or time-sensitive information, use your knowledge up to your training cutoff and the search results provided below if available.${searchContext}` },
            ...llmMessages,
          ],
        });
        
        const aiContentRaw = response.choices[0]?.message?.content || "I apologize, but I could not generate a response.";
        const aiContent = typeof aiContentRaw === "string" ? aiContentRaw : "I apologize, but I could not generate a response.";
        await db.addMessage(input.conversationId, "assistant", aiContent);
        
        return { role: "assistant" as const, content: aiContent };
      }),

    updateConversationTitle: protectedProcedure
      .input(z.object({ conversationId: z.number(), title: z.string().max(50) }))
      .mutation(({ input }) => db.updateConversationTitle(input.conversationId, input.title)),

    deleteConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(({ input }) => db.deleteConversation(input.conversationId)),

    deleteAllConversations: protectedProcedure.mutation(({ ctx }) =>
      db.deleteAllUserConversations(ctx.user.id)
    ),

    addReaction: protectedProcedure
      .input(z.object({ messageId: z.number(), emoji: z.string().max(10) }))
      .mutation(({ ctx, input }) => db.addReaction(input.messageId, ctx.user.id, input.emoji)),

    getReactions: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .query(({ input }) => db.getMessageReactions(input.messageId)),

    removeReaction: protectedProcedure
      .input(z.object({ messageId: z.number(), emoji: z.string().max(10) }))
      .mutation(({ ctx, input }) => db.removeReaction(input.messageId, ctx.user.id, input.emoji)),
    editMessage: protectedProcedure
      .input(z.object({ messageId: z.number(), newContent: z.string().min(1) }))
      .mutation(async ({ input }) => {
        await db.editMessage(input.messageId, input.newContent);
        const result = await db.deleteFollowingMessages(input.messageId);
        return result;
      }),

    regenerateResponse: protectedProcedure
      .input(z.object({ conversationId: z.number(), messageId: z.number() }))
      .mutation(async ({ input }) => {
        const history = await db.getConversationMessages(input.conversationId);
        
        const messageIndex = history.findIndex((m) => m.id === input.messageId);
        if (messageIndex === -1) {
          throw new Error("Message not found");
        }

        const llmMessages = history
          .slice(0, messageIndex + 1)
          .map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content as string,
          }));

        const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

        let searchContext = "";
        const lastMessage = history[messageIndex];
        if (lastMessage && lastMessage.role === "user" && shouldPerformWebSearch(lastMessage.content)) {
          try {
            const searchResults = await performWebSearch(lastMessage.content);
            if (searchResults.length > 0) {
              searchContext = `\n\nRecent search results for context:\n${formatSearchResults(searchResults)}`;
            }
          } catch (searchError) {
            console.warn("[Chat] Web search failed, continuing without search context", searchError);
          }
        }

        const response = await invokeLLM({
          messages: [
            { role: "system", content: `You are a helpful AI assistant called Zrytium AI. The current date and time is: ${currentDate} at ${currentTime} GMT+8. IMPORTANT: When answering questions about what day of the week it is, always refer to the day name at the beginning of the date above. Provide clear, concise, and helpful responses. When asked about current events, dates, or time-sensitive information, use your knowledge up to your training cutoff and the search results provided below if available.${searchContext}` },
            ...llmMessages,
          ],
        });

        const aiContentRaw = response.choices[0]?.message?.content || "I apologize, but I could not generate a response.";
        const aiContent = typeof aiContentRaw === "string" ? aiContentRaw : "I apologize, but I could not generate a response.";
        await db.addMessage(input.conversationId, "assistant", aiContent);

        return { role: "assistant" as const, content: aiContent };
      }),

    getMessageEditHistory: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .query(({ input }) => db.getMessageEditHistory(input.messageId)),

    cleanupEmptyConversations: protectedProcedure
      .mutation(({ ctx }) => db.deleteEmptyConversations(ctx.user.id)),

    pinMessage: protectedProcedure
      .input(z.object({ messageId: z.number(), conversationId: z.number() }))
      .mutation(({ ctx, input }) => db.pinMessage(input.messageId, input.conversationId, ctx.user.id)),

    unpinMessage: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(({ input }) => db.unpinMessage(input.messageId)),

    getPinnedMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(({ input }) => db.getPinnedMessages(input.conversationId)),

    isMessagePinned: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .query(({ input }) => db.isMessagePinned(input.messageId)),

    generateImage: protectedProcedure
      .input(z.object({ prompt: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const imageUrls = await generateImages({
            prompt: input.prompt,
            size: "1024x1024",
            quality: "standard",
            style: "natural",
            n: 1,
          });
          return {
            success: true,
            imageUrls,
          };
        } catch (error) {
          console.error("[Image Generation] Error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to generate image",
          };
        }
      }),

    addAttachment: protectedProcedure
      .input(z.object({
        messageId: z.number(),
        fileName: z.string(),
        fileType: z.enum(["image", "text", "file"]),
        fileSize: z.number(),
        mimeType: z.string(),
        fileUrl: z.string(),
        fileContent: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const attachmentId = await db.addMessageAttachment(
            input.messageId,
            input.fileName,
            input.fileType,
            input.fileSize,
            input.mimeType,
            input.fileUrl,
            input.fileContent
          );
          return { success: true, attachmentId };
        } catch (error) {
          console.error("[Chat] Failed to add attachment:", error);
          throw error;
        }
      }),

    getAttachments: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .query(({ input }) => db.getMessageAttachments(input.messageId)),

    deleteAttachment: protectedProcedure
      .input(z.object({ attachmentId: z.number() }))
      .mutation(({ input }) => db.deleteMessageAttachment(input.attachmentId)),
  }),

  feedback: router({
    submit: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        email: z.string().email().max(320),
        category: z.enum(["bug", "feature_request", "improvement", "other"]),
        subject: z.string().min(1).max(255),
        message: z.string().min(1).max(5000),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const feedbackId = await db.createFeedback({
            userId: ctx.user.id,
            name: input.name,
            email: input.email,
            category: input.category,
            subject: input.subject,
            message: input.message,
            status: "new",
          });
          return { success: true, feedbackId };
        } catch (error) {
          console.error("[Feedback] Failed to submit feedback:", error);
          throw error;
        }
      }),

    list: protectedProcedure.query(({ ctx }) =>
      db.getUserFeedbacks(ctx.user.id)
    ),

    updateStatus: protectedProcedure
      .input(z.object({
        feedbackId: z.number(),
        status: z.enum(["new", "in_progress", "resolved", "closed"]),
      }))
      .mutation(({ input }) =>
        db.updateFeedbackStatus(input.feedbackId, input.status)
      ),

    delete: protectedProcedure
      .input(z.object({ feedbackId: z.number() }))
      .mutation(({ input }) => db.deleteFeedback(input.feedbackId)),
  }),
});

export type AppRouter = typeof appRouter;
