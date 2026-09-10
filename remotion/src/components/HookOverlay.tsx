import React from 'react';
import { AbsoluteFill, interpolate, Spring, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface HookOverlayProps {
  text: string;
  fromFrame: number;
  toFrame: number;
  width: number;
  height: number;
}

export const HookOverlay: React.FC<HookOverlayProps> = ({
  text,
  fromFrame,
  toFrame,
  width,
  height,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeInFrames = 30;
  const fadeOutFrames = 30;
  const holdFrames = (toFrame - fromFrame) - fadeInFrames - fadeOutFrames;

  const opacity = Spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 150 },
    from: fromFrame,
    to: toFrame,
    range: [0, 1],
  });

  const scale = interpolate(
    frame,
    [fromFrame, fromFrame + fadeInFrames, toFrame - fadeOutFrames, toFrame],
    [0.8, 1, 1, 0.8],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const yOffset = interpolate(
    frame,
    [fromFrame, fromFrame + fadeInFrames, toFrame - fadeOutFrames, toFrame],
    [50, 0, 0, -50],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 80,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          transform: `translateY(${yOffset}px) scale(${scale})`,
          opacity: opacity.current,
          textAlign: 'center',
          maxWidth: width * 0.85,
        }}
      >
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            borderRadius: 24,
            padding: '32px 48px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <span
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              textShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            {text}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};