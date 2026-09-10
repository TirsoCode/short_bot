import { google, youtube_v3 } from 'googleapis';
import { youtubeTokenQueries, settingsQueries } from '@/lib/db/queries';

export class YouTubeClient {
  private youtube: youtube_v3.Youtube;
  private refreshToken: string;

  constructor(tokens: { accessToken: string; refreshToken: string }) {
    this.refreshToken = tokens.refreshToken;
    const settings = settingsQueries.find();
    const clientId = settings?.youtube_client_id ?? process.env.YOUTUBE_CLIENT_ID ?? '';
    const clientSecret = settings?.youtube_client_secret ?? process.env.YOUTUBE_CLIENT_SECRET ?? '';

    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken });

    auth.on('tokens', async (newTokens) => {
      if (newTokens.access_token) {
        await youtubeTokenQueries.upsert({
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token || this.refreshToken,
          expiryDate: newTokens.expiry_date!,
        });
      }
    });

    this.youtube = google.youtube({ version: 'v3', auth });
  }

  async uploadShort(short: any, filePath: string): Promise<string> {
    const fs = await import('fs');
    const response = await this.youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: { title: short.title, description: short.description, tags: ['shorts', ...(short.tags || [])], categoryId: '28', defaultLanguage: 'es' },
        status: { privacyStatus: 'private', selfDeclaredMadeForKids: false },
      },
      media: { body: fs.createReadStream(filePath) },
    });
    return `https://www.youtube.com/watch?v=${response.data.id}`;
  }

  static async createFromStoredTokens() {
    const tokens = await youtubeTokenQueries.find();
    if (!tokens) return null;
    return new YouTubeClient(tokens);
  }
}

export async function getAuthUrl() {
  const s = await settingsQueries.find();
  const clientId = s?.youtube_client_id ?? process.env.YOUTUBE_CLIENT_ID ?? '';
  const clientSecret = s?.youtube_client_secret ?? process.env.YOUTUBE_CLIENT_SECRET ?? '';
  if (!clientId) throw new Error('YouTube Client ID not configured');
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/youtube/callback`);
  return oauth2Client.generateAuthUrl({ access_type: 'offline', scope: ['https://www.googleapis.com/auth/youtube.upload'], prompt: 'consent' });
}

export async function exchangeCodeForTokens(code: string) {
  const s = await settingsQueries.find();
  const clientId = s?.youtube_client_id ?? process.env.YOUTUBE_CLIENT_ID ?? '';
  const clientSecret = s?.youtube_client_secret ?? process.env.YOUTUBE_CLIENT_SECRET ?? '';
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/youtube/callback`);
  const { tokens } = await oauth2Client.getToken(code);
  return { accessToken: tokens.access_token!, refreshToken: tokens.refresh_token!, expiryDate: tokens.expiry_date! };
}