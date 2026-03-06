import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, desc } from "drizzle-orm";
import { InsertUser, users, conversations, messages, messageReactions, messageEdits, messagePins, messageAttachments, feedbacks, conversationCollaborators, InsertConversation, InsertMessage, InsertMessageReaction, InsertMessageEdit, InsertMessagePin, InsertMessageAttachment, InsertFeedback, InsertConversationCollaborator } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: any = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db) {
    try {
      // Try DATABASE_URL first (standard), then DATABASE_DSN (Manus template)
      const dsn = process.env.DATABASE_URL || process.env.DATABASE_DSN;
      if (!dsn) {
        console.warn("[Database] No DATABASE_URL or DATABASE_DSN environment variable set");
        return null;
      }
      
      // Create a connection pool for mysql2
      _pool = mysql.createPool(dsn);
      _db = drizzle(_pool);
      console.log("[Database] Connected successfully");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Conversation queries
export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  } catch (error) {
    console.error("[Database] Failed to get conversations:", error);
    return [];
  }
}

export async function createConversation(userId: number, title: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Insert the conversation
    await db.insert(conversations).values({
      userId,
      title,
    });
    
    // Get the last inserted conversation for this user
    const result = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt))
      .limit(1);
    
    if (!result || result.length === 0) {
      throw new Error("Failed to retrieve created conversation");
    }
    
    const insertId = result[0].id;
    console.log("[Database] Created conversation with ID:", insertId);
    return insertId;
  } catch (error) {
    console.error("[Database] Failed to create conversation:", error);
    throw error;
  }
}

export async function updateConversationTitle(conversationId: number, title: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .update(conversations)
      .set({ title, updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));
  } catch (error) {
    console.error("[Database] Failed to update conversation title:", error);
    throw error;
  }
}

export async function deleteConversation(conversationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.delete(messages).where(eq(messages.conversationId, conversationId));
    await db.delete(conversations).where(eq(conversations.id, conversationId));
  } catch (error) {
    console.error("[Database] Failed to delete conversation:", error);
    throw error;
  }
}

// Message queries
export async function getConversationMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  } catch (error) {
    console.error("[Database] Failed to get messages:", error);
    return [];
  }
}

export async function addMessage(conversationId: number, role: "user" | "assistant", content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(messages).values({
      conversationId,
      role,
      content,
    });
    return (result as any).insertId;
  } catch (error) {
    console.error("[Database] Failed to add message:", error);
    throw error;
  }
}

export async function deleteAllUserConversations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const userConversations = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.userId, userId));

    for (const conv of userConversations) {
      await db.delete(messages).where(eq(messages.conversationId, conv.id));
    }

    await db.delete(conversations).where(eq(conversations.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to delete all user conversations:", error);
    throw error;
  }
}


export async function addReaction(messageId: number, userId: number, emoji: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Check if this user already reacted with this emoji to this message
    const existing = await db
      .select()
      .from(messageReactions)
      .where(
        eq(messageReactions.messageId, messageId) &&
        eq(messageReactions.userId, userId) &&
        eq(messageReactions.emoji, emoji)
      )
      .limit(1);

    if (existing.length > 0) {
      // Already reacted with this emoji, remove it (toggle)
      await db
        .delete(messageReactions)
        .where(
          eq(messageReactions.messageId, messageId) &&
          eq(messageReactions.userId, userId) &&
          eq(messageReactions.emoji, emoji)
        );
      return { added: false };
    } else {
      // Add new reaction
      await db.insert(messageReactions).values({
        messageId,
        userId,
        emoji,
      });
      return { added: true };
    }
  } catch (error) {
    console.error("[Database] Failed to add reaction:", error);
    throw error;
  }
}

export async function getMessageReactions(messageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const reactions = await db
      .select()
      .from(messageReactions)
      .where(eq(messageReactions.messageId, messageId));

    // Group reactions by emoji and count
    const grouped: Record<string, { count: number; userIds: number[] }> = {};
    for (const reaction of reactions) {
      if (!grouped[reaction.emoji]) {
        grouped[reaction.emoji] = { count: 0, userIds: [] };
      }
      grouped[reaction.emoji].count++;
      grouped[reaction.emoji].userIds.push(reaction.userId);
    }

    return grouped;
  } catch (error) {
    console.error("[Database] Failed to get message reactions:", error);
    throw error;
  }
}

export async function removeReaction(messageId: number, userId: number, emoji: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .delete(messageReactions)
      .where(
        eq(messageReactions.messageId, messageId) &&
        eq(messageReactions.userId, userId) &&
        eq(messageReactions.emoji, emoji)
      );
    return { removed: true };
  } catch (error) {
    console.error("[Database] Failed to remove reaction:", error);
    throw error;
  }
}


export async function editMessage(messageId: number, newContent: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Get the original message
    const originalMessage = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (originalMessage.length === 0) {
      throw new Error("Message not found");
    }

    const original = originalMessage[0];

    // Store the edit history
    await db.insert(messageEdits).values({
      messageId,
      originalContent: original.content,
      editedContent: newContent,
    });

    // Update the message
    await db
      .update(messages)
      .set({
        content: newContent,
        isEdited: 1,
        editedAt: new Date(),
      })
      .where(eq(messages.id, messageId));

    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to edit message:", error);
    throw error;
  }
}

export async function deleteFollowingMessages(messageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Get the message to find its conversation and position
    const message = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (message.length === 0) {
      throw new Error("Message not found");
    }

    const conversationId = message[0].conversationId;

    // Get all messages in the conversation ordered by creation time
    const allMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId));

    // Find the index of the edited message
    const editedIndex = allMessages.findIndex((m) => m.id === messageId);

    // Delete all messages after the edited one
    const messagesToDelete = allMessages.slice(editedIndex + 1);
    for (const msg of messagesToDelete) {
      await db.delete(messages).where(eq(messages.id, msg.id));
      // Also delete reactions for deleted messages
      await db
        .delete(messageReactions)
        .where(eq(messageReactions.messageId, msg.id));
    }

    return { deletedCount: messagesToDelete.length };
  } catch (error) {
    console.error("[Database] Failed to delete following messages:", error);
    throw error;
  }
}

export async function getMessageEditHistory(messageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const edits = await db
      .select()
      .from(messageEdits)
      .where(eq(messageEdits.messageId, messageId));

    return edits;
  } catch (error) {
    console.error("[Database] Failed to get message edit history:", error);
    throw error;
  }
}


export async function deleteEmptyConversations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Get all conversations for the user
    const userConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId));

    // For each conversation, check if it has any messages
    for (const conv of userConversations) {
      const messageCount = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conv.id));

      // If conversation has no messages, delete it
      if (messageCount.length === 0) {
        await db
          .delete(conversations)
          .where(eq(conversations.id, conv.id));
      }
    }

    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to delete empty conversations:", error);
    throw error;
  }
}


export async function pinMessage(messageId: number, conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Check if already pinned
    const existing = await db
      .select()
      .from(messagePins)
      .where(eq(messagePins.messageId, messageId));

    if (existing.length > 0) {
      return { success: true, message: "Message already pinned" };
    }

    // Pin the message
    await db.insert(messagePins).values({
      messageId,
      conversationId,
      userId,
    });

    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to pin message:", error);
    throw error;
  }
}

export async function unpinMessage(messageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .delete(messagePins)
      .where(eq(messagePins.messageId, messageId));

    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to unpin message:", error);
    throw error;
  }
}

export async function getPinnedMessages(conversationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const pinnedMessages = await db
      .select({
        pin: messagePins,
        message: messages,
      })
      .from(messagePins)
      .innerJoin(messages, eq(messagePins.messageId, messages.id))
      .where(eq(messagePins.conversationId, conversationId));

    return pinnedMessages;
  } catch (error) {
    console.error("[Database] Failed to get pinned messages:", error);
    throw error;
  }
}

export async function isMessagePinned(messageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db
      .select()
      .from(messagePins)
      .where(eq(messagePins.messageId, messageId));

    return result.length > 0;
  } catch (error) {
    console.error("[Database] Failed to check if message is pinned:", error);
    throw error;
  }
}

// Message attachments queries
export async function addMessageAttachment(
  messageId: number,
  fileName: string,
  fileType: "image" | "text" | "file",
  fileSize: number,
  mimeType: string,
  fileUrl: string,
  fileContent?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(messageAttachments).values({
      messageId,
      fileName,
      fileType,
      fileSize,
      mimeType,
      fileUrl,
      fileContent: fileContent || null,
    });
    return (result as any).insertId;
  } catch (error) {
    console.error("[Database] Failed to add message attachment:", error);
    throw error;
  }
}

export async function getMessageAttachments(messageId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(messageAttachments)
      .where(eq(messageAttachments.messageId, messageId));
  } catch (error) {
    console.error("[Database] Failed to get message attachments:", error);
    return [];
  }
}

export async function deleteMessageAttachment(attachmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .delete(messageAttachments)
      .where(eq(messageAttachments.id, attachmentId));
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to delete message attachment:", error);
    throw error;
  }
}


// Feedback queries
export async function createFeedback(data: InsertFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(feedbacks).values(data);
    return (result as any).insertId;
  } catch (error) {
    console.error("[Database] Failed to create feedback:", error);
    throw error;
  }
}

export async function getUserFeedbacks(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.userId, userId))
      .orderBy(desc(feedbacks.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get user feedbacks:", error);
    return [];
  }
}

export async function getAllFeedbacks() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(feedbacks)
      .orderBy(desc(feedbacks.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get all feedbacks:", error);
    return [];
  }
}

export async function updateFeedbackStatus(feedbackId: number, status: "new" | "in_progress" | "resolved" | "closed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .update(feedbacks)
      .set({ status, updatedAt: new Date() })
      .where(eq(feedbacks.id, feedbackId));
  } catch (error) {
    console.error("[Database] Failed to update feedback status:", error);
    throw error;
  }
}

export async function deleteFeedback(feedbackId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .delete(feedbacks)
      .where(eq(feedbacks.id, feedbackId));
  } catch (error) {
    console.error("[Database] Failed to delete feedback:", error);
    throw error;
  }
}

// Collaboration functions
export async function shareConversation(conversationId: number, userId: number, collaboratorEmail: string, invitationToken: string) {
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db.insert(conversationCollaborators).values({
      conversationId,
      userId,
      collaboratorEmail,
      invitationToken,
      status: "pending",
    });
    return result;
  } catch (error) {
    console.error("[Database] Failed to share conversation:", error);
    return null;
  }
}

export async function getConversationCollaborators(conversationId: number) {
  try {
    const db = await getDb();
    if (!db) return [];

    return await db
      .select()
      .from(conversationCollaborators)
      .where(eq(conversationCollaborators.conversationId, conversationId));
  } catch (error) {
    console.error("[Database] Failed to get collaborators:", error);
    return [];
  }
}

export async function acceptCollaborationInvite(invitationToken: string) {
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db
      .update(conversationCollaborators)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(conversationCollaborators.invitationToken, invitationToken));
    return result;
  } catch (error) {
    console.error("[Database] Failed to accept invitation:", error);
    return null;
  }
}
