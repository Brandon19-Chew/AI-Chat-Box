import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Conversations table for storing chat sessions.
 * Each conversation belongs to a user and has an auto-generated title.
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages table for storing individual chat messages.
 * Each message belongs to a conversation and has a role (user or assistant).
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  isEdited: int("isEdited").default(0).notNull(),
  editedAt: timestamp("editedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Message edits history table for tracking message edits.
 * Stores the original content before edits for audit trail.
 */
export const messageEdits = mysqlTable("messageEdits", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(),
  originalContent: text("originalContent").notNull(),
  editedContent: text("editedContent").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MessageEdit = typeof messageEdits.$inferSelect;
export type InsertMessageEdit = typeof messageEdits.$inferInsert;

/**
 * Message reactions table for storing emoji reactions to messages.
 * Each reaction is tied to a specific message and user.
 */
export const messageReactions = mysqlTable("messageReactions", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(),
  userId: int("userId").notNull(),
  emoji: varchar("emoji", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MessageReaction = typeof messageReactions.$inferSelect;
export type InsertMessageReaction = typeof messageReactions.$inferInsert;

/**
 * Message pins table for storing pinned messages.
 * Each pin is tied to a specific message and conversation.
 */
export const messagePins = mysqlTable("messagePins", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(),
  conversationId: int("conversationId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MessagePin = typeof messagePins.$inferSelect;
export type InsertMessagePin = typeof messagePins.$inferInsert;

/**
 * Message attachments table for storing file uploads.
 * Each attachment is tied to a specific message and stores file metadata.
 */
export const messageAttachments = mysqlTable("messageAttachments", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 50 }).notNull(), // "image", "text", "file"
  fileSize: int("fileSize").notNull(), // in bytes
  mimeType: varchar("mimeType", { length: 100 }).notNull(), // e.g., "image/png", "text/plain"
  fileUrl: text("fileUrl").notNull(), // S3 URL or local storage path
  fileContent: text("fileContent"), // For text files, store content; for images, store base64
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MessageAttachment = typeof messageAttachments.$inferSelect;
export type InsertMessageAttachment = typeof messageAttachments.$inferInsert;


/**
 * Feedback table for storing user feedback and support requests.
 * Each feedback submission is tied to a user and includes category, subject, and message.
 */
export const feedbacks = mysqlTable("feedbacks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  category: mysqlEnum("category", ["bug", "feature_request", "improvement", "other"]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "in_progress", "resolved", "closed"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = typeof feedbacks.$inferInsert;

/**
 * Conversation collaborators table for sharing conversations with other users.
 * Stores invitation links and tracks which users have access to which conversations.
 */
export const conversationCollaborators = mysqlTable("conversationCollaborators", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  userId: int("userId").notNull(), // The user who owns the conversation
  collaboratorEmail: varchar("collaboratorEmail", { length: 320 }).notNull(), // Email of the person being invited
  invitationToken: varchar("invitationToken", { length: 255 }).notNull().unique(), // Unique token for the invitation link
  status: mysqlEnum("status", ["pending", "accepted", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ConversationCollaborator = typeof conversationCollaborators.$inferSelect;
export type InsertConversationCollaborator = typeof conversationCollaborators.$inferInsert;
