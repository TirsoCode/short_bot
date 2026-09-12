import { NextResponse } from 'next/server';
import { settingsQueries } from '@/lib/db/queries';
import { hasZenKey, applyStyleRequest } from '@/lib/ai';
import { DEFAULT_STYLE, normalizeStyle } from '@/lib/short-style';

export async function GET() {
  const settings = await settingsQueries.find();
  return NextResponse.json({
    configured: hasZenKey(),
    model: process.env.OPENCODE_ZEN_MODEL || 'big-pickle',
    style: settings?.styleJson ?? DEFAULT_STYLE,
  });
}

export async function POST(request: Request) {
  if (!hasZenKey()) {
    return NextResponse.json({ error: 'OPENCODE_ZEN_API_KEY no está configurado' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const prompt = String(body?.request ?? '').trim();
  if (!prompt) {
    return NextResponse.json({ error: 'Falta la petición' }, { status: 400 });
  }

  const settings = await settingsQueries.find();
  const current = settings?.styleJson ?? DEFAULT_STYLE;
  const newStyle = await applyStyleRequest(prompt, normalizeStyle(current, DEFAULT_STYLE));

  if (!newStyle) {
    return NextResponse.json({ error: 'La IA no devolvió un estilo válido' }, { status: 502 });
  }

  return NextResponse.json({ ok: true, style: newStyle });
}