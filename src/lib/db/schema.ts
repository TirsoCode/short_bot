import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const media = sqliteTable('media', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  path: text('path').notNull(),
  type: text('type', { enum: ['video', 'image'] }).notNull(),
  size: integer('size').notNull(),
  sha: text('sha').notNull().unique(),
  url: text('url').notNull(),
  downloadedPath: text('downloaded_path'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  shaIdx: index('media_sha_idx').on(table.sha),
  typeIdx: index('media_type_idx').on(table.type),
}));

export const hooks = sqliteTable('hooks', {
  id: text('id').primaryKey(),
  text: text('text').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const shorts = sqliteTable('shorts', {
  id: text('id').primaryKey(),
  hookId: text('hook_id').notNull().references(() => hooks.id),
  hookText: text('hook_text').notNull(),
  mediaIds: text('media_ids', { mode: 'json' }).$type<string[]>().notNull().default([]),
  title: text('title').notNull(),
  description: text('description').notNull(),
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default([]),
  status: text('status', {
    enum: ['draft', 'rendering', 'rendered', 'accepted', 'rejected', 'uploading', 'published', 'failed'],
  }).default('draft').notNull(),
  renderedPath: text('rendered_path'),
  duration: integer('duration'),
  youtubeVideoId: text('youtube_video_id'),
  youtubeUrl: text('youtube_url'),
  errorMessage: text('error_message'),
  rejectReason: text('reject_reason'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  statusIdx: index('shorts_status_idx').on(table.status),
  hookIdx: index('shorts_hook_idx').on(table.hookId),
}));

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  githubOwner: text('github_owner').default('').notNull(),
  githubRepo: text('github_repo').default('').notNull(),
  githubBranch: text('github_branch').default('main').notNull(),
  githubPaths: text('github_paths', { mode: 'json' }).$type<string[]>().notNull().default(['videos', 'screenshots']),
  githubToken: text('github_token').default('').notNull(),
  youtubeClientId: text('youtube_client_id').default('').notNull(),
  youtubeClientSecret: text('youtube_client_secret').default('').notNull(),
  youtubeRefreshToken: text('youtube_refresh_token'),
  syncIntervalMinutes: integer('sync_interval_minutes').default(30).notNull(),
  maxShortDuration: integer('max_short_duration').default(30).notNull(),
  videoWidth: integer('video_width').default(1080).notNull(),
  videoHeight: integer('video_height').default(1920).notNull(),
  videoFps: integer('video_fps').default(30).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const youtubeTokens = sqliteTable('youtube_tokens', {
  id: text('id').primaryKey(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiryDate: integer('expiry_date').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type Hook = typeof hooks.$inferSelect;
export type NewHook = typeof hooks.$inferInsert;
export type Short = typeof shorts.$inferSelect;
export type NewShort = typeof shorts.$inferInsert;
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
export type YouTubeTokens = typeof youtubeTokens.$inferSelect;
export type NewYouTubeTokens = typeof youtubeTokens.$inferInsert;