import { type ShortStyle, normalizeStyle } from '@/lib/short-style';

const ZEN_URL = 'https://opencode.ai/zen/v1/chat/completions';
const ZEN_MODEL = process.env.OPENCODE_ZEN_MODEL || 'big-pickle';

export function hasZenKey(): boolean {
  return !!process.env.OPENCODE_ZEN_API_KEY;
}

export interface ShortIdea {
  hook: string;
  title: string;
  description: string;
  tags: string[];
}

export async function applyStyleRequest(request: string, current: ShortStyle): Promise<ShortStyle | null> {
  const apiKey = process.env.OPENCODE_ZEN_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(ZEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: ZEN_MODEL,
      temperature: 0.7,
      max_tokens: 250,
      messages: [
        {
          role: 'system',
          content: `Eres un diseñador de plantillas para YouTube Shorts verticales. El usuario te da un objeto de estilos JSON y te pide cambiar algo visual. Modifica SOLO lo necesario, respetando la MISMA estructura de claves. Responde SOLO con JSON válido (sin markdown, sin backticks). Tipos esperados: background (color hex), hookTextColor (hex), hookBg (hex o rgba), hookBorder (hex o rgba), hookFontSize (entero en px), accent (hex), outroText (string), outroSubtext (string). Si el usuario pide algo que no afecta a estas claves, explica brevemente en outroSubtext qué no puede cambiar. Devuelve SIEMPRE todas las claves.`,
        },
        {
          role: 'user',
          content: `Estilo actual:\n${JSON.stringify(current)}\n\nPetición del usuario: "${request}"\n\nDevuelve el nuevo JSON de estilos completo.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    console.error('[AI] Zen API error:', res.status);
    return null;
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';
  if (!content) return null;

  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(content.slice(start, end + 1));
    return normalizeStyle(parsed, current);
  } catch {
    return null;
  }
}

export async function generateShortContent(mediaNames?: string[]): Promise<ShortIdea | null> {
  const apiKey = process.env.OPENCODE_ZEN_API_KEY;
  if (!apiKey) return null;

  const mediaHint = mediaNames?.length
    ? `Los medios disponibles incluyen: ${mediaNames.slice(0, 5).join(', ')}`
    : 'Aún no sé qué medios hay; igualmente crea contenido que encaje en shorts verticales.';

  const res = await fetch(ZEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: ZEN_MODEL,
      temperature: 0.85,
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: `Eres un creador de contenido viral para YouTube Shorts en español. Responde SOLO con JSON válido (sin markdown, sin backticks) con esta estructura exacta:
{"hook":"frase gancho corta de máximo 80 caracteres para enganchar en los primeros 2 segundos","title":"título optimizado para YouTube de máximo 100 caracteres","description":"descripción de 2-3 oraciones con hashtags al final","tags":["tag1","tag2","tag3","tag4","tag5"]}
Sé creativo, directo y usa lenguaje que detenga el scroll. El contenido es para shorts verticales (9:16).`,
        },
        {
          role: 'user',
          content: `Crea el contenido para un YouTube Short nuevo. ${mediaHint}. Genera un hook sorprendente que haga que la gente no pase de largo.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    console.error('[AI] Zen API error:', res.status);
    return null;
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';
  return parseIdea(content);
}

function parseIdea(raw: string): ShortIdea | null {
  if (!raw) return null;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1));
    if (!parsed.hook) return null;
    return {
      hook: String(parsed.hook).slice(0, 80),
      title: String(parsed.title || 'Short').slice(0, 100),
      description: String(parsed.description || ''),
      tags: Array.isArray(parsed.tags) ? parsed.tags.map((t: any) => String(t).slice(0, 30)).slice(0, 10) : [],
    };
  } catch {
    return null;
  }
}