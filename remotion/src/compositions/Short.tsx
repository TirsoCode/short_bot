import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, useVideoConfig, Spring, spring, Easing } from 'remotion';
import { HookOverlay } from '../components/HookOverlay';
import { MediaSequence } from '../components/MediaSequence';

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
}

export const ShortComposition: React.FC<ShortCompositionProps> = ({
  hookText,
  media,
  width,
  height,
  fps,
  durationInFrames,
}) => {
  const videoConfig = useVideoConfig();

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
    <AbsoluteFill style={{ background: 'black' }}>
      <HookOverlay
        text={hookText}
        fromFrame={0}
        toFrame={hookDurationFrames}
        width={width}
        height={height}
      />

      <MediaSequence
        media={media}
        fromFrame={mediaStartFrame}
        toFrame={mediaEndFrame}
        width={width}
        height={height}
        fps={fps}
      />

      <Outro fromFrame={mediaEndFrame} toFrame={adjustedDurationInFrames} width={width} height={height} />
    </AbsoluteFill>
  );
};

const Outro: React.FC<{
  fromFrame: number;
  toFrame: number;
  width: number;
  height: number;
}> = ({ fromFrame, toFrame, width, height }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [fromFrame, fromFrame + 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        background: 'rgba(0,0,0,0.8)',
      }}
    >
      <div style={{ textAlign: 'center', color: 'white', padding: 40 }}>
        <h1 style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 16 }}>¡Sígueme para más!</h1>
        <p style={{ fontSize: 28, opacity: 0.8 }}>Suscríbete y activa la campanita 🔔</p>
      </div>
    </AbsoluteFill>
  );
};

import { useCurrentFrame } from 'remotion';