import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, useVideoConfig, useCurrentFrame } from 'remotion';
import { HookOverlay } from '../components/HookOverlay';
import { MediaSequence } from '../components/MediaSequence';

export interface ShortStyleProps {
  background: string;
  hookTextColor: string;
  hookBg: string;
  hookBorder: string;
  hookFontSize: number;
  accent: string;
  outroText: string;
  outroSubtext: string;
}

export const DEFAULT_STYLE_PROPS: ShortStyleProps = {
  background: '#000000',
  hookTextColor: '#ffffff',
  hookBg: 'rgba(0, 0, 0, 0.75)',
  hookBorder: 'rgba(255, 255, 255, 0.15)',
  hookFontSize: 52,
  accent: '#3b82f6',
  outroText: '¡Sígueme para más!',
  outroSubtext: 'Suscríbete y activa la campanita 🔔',
};

interface ShortCompositionProps {
  hookText: string;
  media: Array<{
    id: string;
    type: 'video' | 'image';
    path: string;
    duration?: number;
  }>;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  style?: Partial<ShortStyleProps>;
}

export const ShortComposition: React.FC<ShortCompositionProps> = ({
  hookText,
  media,
  width,
  height,
  fps,
  durationInFrames,
  style: userStyle,
}) => {
  const videoConfig = useVideoConfig();
  const style: ShortStyleProps = { ...DEFAULT_STYLE_PROPS, ...(userStyle ?? {}) };

  const hookDurationFrames = 3 * fps;
  const outroDurationFrames = 1 * fps;
  const mediaStartFrame = hookDurationFrames;
  const mediaEndFrame = durationInFrames - outroDurationFrames;

  const totalMediaDuration = useMemo(() => {
    return media.reduce((acc, m) => acc + (m.duration ?? 4), 0);
  }, [media]);

  const adjustedDurationInFrames = Math.max(
    durationInFrames,
    hookDurationFrames + totalMediaDuration * fps + outroDurationFrames
  );

  return (
    <AbsoluteFill style={{ background: style.background }}>
      <HookOverlay
        text={hookText}
        fromFrame={0}
        toFrame={hookDurationFrames}
        width={width}
        height={height}
        style={style}
      />

      <MediaSequence
        media={media}
        fromFrame={mediaStartFrame}
        toFrame={mediaEndFrame}
        width={width}
        height={height}
        fps={fps}
      />

      <Outro fromFrame={mediaEndFrame} toFrame={adjustedDurationInFrames} width={width} height={height} style={style} />
    </AbsoluteFill>
  );
};

const Outro: React.FC<{
  fromFrame: number;
  toFrame: number;
  width: number;
  height: number;
  style: ShortStyleProps;
}> = ({ fromFrame, toFrame, style }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [fromFrame, fromFrame + 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        background: style.accent,
      }}
    >
      <div style={{ textAlign: 'center', color: style.hookTextColor, padding: 40 }}>
        <h1 style={{ fontSize: 52, fontWeight: 'bold', marginBottom: 16, textShadow: `0 4px 20px ${style.hookBg}` }}>
          {style.outroText}
        </h1>
        <p style={{ fontSize: 30, opacity: 0.85, color: style.accent }}>{style.outroSubtext}</p>
      </div>
    </AbsoluteFill>
  );
};