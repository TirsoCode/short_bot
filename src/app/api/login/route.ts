import { NextRequest, NextResponse } from 'next/server';

const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    if (!LOGIN_PASSWORD) {
      return NextResponse.json({ error: 'Login no configurado: define LOGIN_PASSWORD' }, { status: 500 });
    }

    const { password } = await request.json();

    if (password !== LOGIN_PASSWORD) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('session', password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}