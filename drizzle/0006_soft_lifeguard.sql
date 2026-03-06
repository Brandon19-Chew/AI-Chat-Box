DROP TABLE `messageAttachments`;--> statement-breakpoint
DROP TABLE `messageEdits`;--> statement-breakpoint
DROP TABLE `messagePins`;--> statement-breakpoint
DROP TABLE `messageReactions`;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `isEdited`;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `editedAt`;