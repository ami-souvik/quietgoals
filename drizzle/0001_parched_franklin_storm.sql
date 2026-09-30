CREATE TABLE IF NOT EXISTS `api_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`last_used_at` text,
	`revoked_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `api_tokens_token_hash_idx` ON `api_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `api_tokens_user_id_revoked_at_idx` ON `api_tokens` (`user_id`,`revoked_at`);