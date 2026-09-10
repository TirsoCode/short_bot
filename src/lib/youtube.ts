import { google, youtube_v3 } from 'googleapis';
import { youtubeTokenQueries, settingsQueries } from '@/lib/db/queries';
import type { Short, YouTubeTokens } from '@/types';

export class YouTubeClient {
  private youtube: youtube_v3.Youtube;
  private tokens: YouTubeTokens;

  constructor(tokens: YouTubeTokens) {
    this.tokens = tokens;
    const settings = settingsQueries.find();
    const clientId = settings?.youtubeClientId ?? process.env.YOUTUBE_CLIENT_ID ?? '';
    const clientSecret = settings?.youtubeClientSecret ?? process.env.YOUTUBE_CLIENT_SECRET ?? '';

    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });

    auth.on('tokens', async (newTokens) => {
      if (newTokens.refresh_token) {
        await youtubeTokenQueries.upsert({
          accessToken: newTokens.access_token!,
          refreshToken: newTokens.refresh_token,
          expiryDate: newTokens.expiry_date!,
        });
      } else if (newTokens.access_token) {
        await youtubeTokenQueries.upsert({
          accessToken: newTokens.access_token,
          refreshToken: tokens.refreshToken,
          expiryDate: newTokens.expiry_date!,
        });
      }
    });

    this.youtube = google.youtube({ version: 'v3', auth });
  }

  async uploadShort(short: Short, filePath: string): Promise<string> {
    const fs = await import('fs');
    const fileStream = fs.createReadStream(filePath);

    const response = await this.youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: short.title,
          description: short.description,
          tags: ['shorts', ...short.tags],
          categoryId: '28',
          defaultLanguage: 'es',
          defaultAudioLanguage: 'es',
        },
        status: {
          privacyStatus: 'private',
          selfDeclaredMadeForKids: false,
          publishAt: undefined,
        },
      },
      media: {
        body: fileStream,
      },
    });

    const videoId = response.data.id!;
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  async getVideoStatus(videoId: string): Promise<{ status: string; privacyStatus: string } | null> {
    try {
      const response = await this.youtube.videos.list({
        part: ['status'],
        id: [videoId],
      });

      const video = response.data.items?.[0];
      if (!video?.status) return null;

      return {
        status: video.status.uploadStatus ?? 'unknown',
        privacyStatus: video.status.privacyStatus ?? 'unknown',
      };
    } catch {
      return null;
    }
  }

  static async createFromStoredTokens(): Promise<YouTubeClient | null> {
    const tokens = await youtubeTokenQueries.find();
    if (!tokens) return null;
    return new YouTubeClient(tokens);
  }
}

export async function getAuthUrl(): Promise<string> {
  const settings = await settingsQueries.find();
  const clientId = settings?.youtubeClientId ?? process.env.YOUTUBE_CLIENT_ID ?? '';
  const clientSecret = settings?.youtubeClientSecret ?? process.env.YOUTUBE_CLIENT_SECRET ?? '';

  if (!clientId || !clientSecret) {
    throw new Error('YouTube OAuth credentials not configured');
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/youtube/callback`
  );

  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.force-ssl',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

export async function exchangeCodeForTokens(code: string): Promise<{ accessToken: string; refreshToken: string; expiryDate: number }> {
  const settings = await settingsQueries.find();
  const clientId = settings?.youtubeClientId ?? process.env.YOUTUBE_CLIENT_ID ?? '';
  const clientSecret = settings?.youtubeClientSecret ?? process.env.YOUTUBE_CLIENT_SECRET ?? '';

  if (!clientId || !clientSecret) {
    throw new Error('YouTube OAuth credentials not configured');
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/youtube/callback`
  );

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token || !tokens.access_token || !tokens.expiry_date) {
    throw new Error('Failed to obtain valid tokens');
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiryDate: tokens.expiry_date,
  };
}