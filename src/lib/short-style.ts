export interface ShortStyle {
  background: string;
  hookTextColor: string;
  hookBg: string;
  hookBorder: string;
  hookFontSize: number;
  accent: string;
  outroText: string;
  outroSubtext: string;
}

export const DEFAULT_STYLE: ShortStyle = {
  background: '#000000',
  hookTextColor: '#ffffff',
  hookBg: 'rgba(0, 0, 0, 0.75)',
  hookBorder: 'rgba(255, 255, 255, 0.15)',
  hookFontSize: 52,
  accent: '#3b82f6',
  outroText: '¡Sígueme para más!',
  outroSubtext: 'Suscríbete y activa la campanita 🔔',
};

export function normalizeStyle(input: any, fallback: ShortStyle = DEFAULT_STYLE): ShortStyle {
  if (!input || typeof input !== 'object') return { ...fallback };
  return {
    background: typeof input.background === 'string' ? input.background : fallback.background,
    hookTextColor: typeof input.hookTextColor === 'string' ? input.hookTextColor : fallback.hookTextColor,
    hookBg: typeof input.hookBg === 'string' ? input.hookBg : fallback.hookBg,
    hookBorder: typeof input.hookBorder === 'string' ? input.hookBorder : fallback.hookBorder,
    hookFontSize: Number(input.hookFontSize) > 0 ? Math.round(Number(input.hookFontSize)) : fallback.hookFontSize,
    accent: typeof input.accent === 'string' ? input.accent : fallback.accent,
    outroText: typeof input.outroText === 'string' ? input.outroText : fallback.outroText,
    outroSubtext: typeof input.outroSubtext === 'string' ? input.outroSubtext : fallback.outroSubtext,
  };
}

export function defaultStyleJson(): string {
  return JSON.stringify(DEFAULT_STYLE);
}