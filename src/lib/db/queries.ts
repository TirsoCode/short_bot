import { db } from './client';
import { media, hooks, shorts, settings, youtubeTokens } from './schema';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import type { Media, Hook, Short, Settings, YouTubeTokens, NewMedia, NewShort, NewSettings } from './schema';
import type { RenderJob } from '@/types';

export const mediaQueries = {
  async findAll(): Promise<Media[]> {
    return db.select().from(media).orderBy(desc(media.createdAt)).all();
  },

  async findByIds(ids: string[]): Promise<Media[]> {
    if (ids.length === 0) return [];
    return db.select().from(media).where(inArray(media.id, ids)).all();
  },

  async findBySha(sha: string): Promise<Media | undefined> {
    return db.select().from(media).where(eq(media.sha, sha)).get();
  },

  async create(data: NewMedia): Promise<Media> {
    const [result] = await db.insert(media).values(data).returning();
    return result;
  },

  async createMany(data: NewMedia[]): Promise<Media[]> {
    if (data.length === 0) return [];
    return db.insert(media).values(data).returning();
  },

  async updateDownloadedPath(id: string, path: string): Promise<void> {
    await db.update(media).set({ downloadedPath: path, updatedAt: new Date().toISOString() }).where(eq(media.id, id)).run();
  },

  async delete(id: string): Promise<void> {
    await db.delete(media).where(eq(media.id, id)).run();
  },

  async count(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(media).get();
    return result?.count ?? 0;
  },
};

export const hookQueries = {
  async findAll(): Promise<Hook[]> {
    return db.select().from(hooks).orderBy(desc(hooks.createdAt)).all();
  },

  async findActive(): Promise<Hook[]> {
    return db.select().from(hooks).where(eq(hooks.isActive, true)).orderBy(desc(hooks.createdAt)).all();
  },

  async findById(id: string): Promise<Hook | undefined> {
    return db.select().from(hooks).where(eq(hooks.id, id)).get();
  },

  async create(text: string): Promise<Hook> {
    const [result] = await db.insert(hooks).values({ id: crypto.randomUUID(), text, isActive: true }).returning();
    return result;
  },

  async update(id: string, data: Partial<Pick<Hook, 'text' | 'isActive'>>): Promise<void> {
    await db.update(hooks).set(data).where(eq(hooks.id, id)).run();
  },

  async delete(id: string): Promise<void> {
    await db.delete(hooks).where(eq(hooks.id, id)).run();
  },
};

export const shortQueries = {
  async findAll(): Promise<Short[]> {
    return db.select().from(shorts).orderBy(desc(shorts.createdAt)).all();
  },

  async findByStatus(status: Short['status']): Promise<Short[]> {
    return db.select().from(shorts).where(eq(shorts.status, status)).orderBy(desc(shorts.createdAt)).all();
  },

  async findById(id: string): Promise<Short | undefined> {
    return db.select().from(shorts).where(eq(shorts.id, id)).get();
  },

  async create(data: NewShort): Promise<Short> {
    const [result] = await db.insert(shorts).values(data).returning();
    return result;
  },

  async update(id: string, data: Partial<Short>): Promise<void> {
    await db.update(shorts).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(shorts.id, id)).run();
  },

  async updateStatus(id: string, status: Short['status'], extra?: Partial<Short>): Promise<void> {
    await db.update(shorts).set({ status, ...extra, updatedAt: new Date().toISOString() }).where(eq(shorts.id, id)).run();
  },

  async delete(id: string): Promise<void> {
    await db.delete(shorts).where(eq(shorts.id, id)).run();
  },

  async countByStatus(): Promise<Record<string, number>> {
    const results = await db.select({ status: shorts.status, count: sql<number>`count(*)` }).from(shorts).groupBy(shorts.status).all();
    return results.reduce((acc, r) => ({ ...acc, [r.status]: r.count }), {} as Record<string, number>);
  },
};

export const settingsQueries = {
  async find(): Promise<Settings | undefined> {
    return db.select().from(settings).where(eq(settings.id, 'default')).get();
  },

  async update(data: Partial<NewSettings>): Promise<void> {
    await db.update(settings).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(settings.id, 'default')).run();
  },
};

export const youtubeTokenQueries = {
  async find(): Promise<YouTubeTokens | undefined> {
    return db.select().from(youtubeTokens).where(eq(youtubeTokens.id, 'default')).get();
  },

  async upsert(data: { accessToken: string; refreshToken: string; expiryDate: number }): Promise<void> {
    await db.insert(youtubeTokens).values({ id: 'default', ...data }).onConflictDoUpdate({
      target: youtubeTokens.id,
      set: { ...data, updatedAt: new Date().toISOString() },
    }).run();
  },

  async delete(): Promise<void> {
    await db.delete(youtubeTokens).where(eq(youtubeTokens.id, 'default')).run();
  },
};