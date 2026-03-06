CREATE TABLE `messageAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`fileSize` int NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileContent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messageAttachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messageEdits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`originalContent` text NOT NULL,
	`editedContent` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messageEdits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messagePins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`conversationId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messagePins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messageReactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`userId` int NOT NULL,
	`emoji` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messageReactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `messages` ADD `isEdited` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `editedAt` timestamp;