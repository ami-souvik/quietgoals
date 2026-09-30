import { sql } from 'drizzle-orm';
import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const goals = sqliteTable(
  'goals',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    status: text('status', { enum: ['active', 'completed', 'killed'] })
      .notNull()
      .default('active'),
    priority: text('priority', { enum: ['none', 'low', 'medium', 'high'] })
      .notNull()
      .default('none'),
    position: text('position').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    archivedAt: text('archived_at'),
  },
  (table) => [
    index('goals_user_id_status_position_idx').on(
      table.userId,
      table.status,
      table.position,
    ),
    index('goals_user_id_archived_at_idx').on(
      table.userId,
      table.archivedAt,
    ),
  ],
);

export const apiTokens = sqliteTable(
  'api_tokens',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    lastUsedAt: text('last_used_at'),
    revokedAt: text('revoked_at'),
  },
  (table) => [
    index('api_tokens_token_hash_idx').on(table.tokenHash),
    index('api_tokens_user_id_revoked_at_idx').on(table.userId, table.revokedAt),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;

export type ApiToken = typeof apiTokens.$inferSelect;
export type NewApiToken = typeof apiTokens.$inferInsert;

export type GoalStatus = 'active' | 'completed' | 'killed';
export type GoalPriority = 'none' | 'low' | 'medium' | 'high';
