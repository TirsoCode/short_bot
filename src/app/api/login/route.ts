import { NextRequest, NextResponse } from 'next/server';
import { settingsQueries } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const settings = await settingsQueries.find();

    if (!settings) {
      return NextResponse.json({ error: 'Primero configura el token en .env', status: 'no_settings' }, { status: 400 });
    }

    const valid = password && settings.githubToken === password;
    if (!valid) {
      return NextResponse.json({ error: 'Token incorrecto' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('session', password, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}