CREATE TABLE `messageEdits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`originalContent` text NOT NULL,
	`editedContent` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messageEdits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `messages` ADD `isEdited` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `editedAt` timestamp;