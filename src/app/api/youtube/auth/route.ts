import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl, exchangeCodeForTokens } from '@/lib/youtube';
import { youtubeTokenQueries } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const baseUrl = request.nextUrl.origin;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/settings?youtube_error=access_denied', request.url));
  }

  if (code) {
    try {
      const tokens = await exchangeCodeForTokens(code, baseUrl);
      await youtubeTokenQueries.upsert(tokens);
      return NextResponse.redirect(new URL('/settings?youtube_connected=true', request.url));
    } catch (err) {
      console.error('Token exchange failed:', err);
      return NextResponse.redirect(new URL('/settings?youtube_error=token_exchange_failed', request.url));
    }
  }

  try {
    const url = await getAuthUrl(baseUrl);
    return NextResponse.redirect(url);
  } catch (err) {
    console.error('Auth URL generation failed:', err);
    return NextResponse.redirect(new URL('/settings?youtube_error=config_missing', request.url));
  }
}