import React from 'react';
import { AbsoluteFill, interpolate, Spring, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { DEFAULT_STYLE_PROPS, type ShortStyleProps } from '../compositions/Short';

interface HookOverlayProps {
  text: string;
  fromFrame: number;
  toFrame: number;
  width: number;
  height: number;
  style?: Partial<ShortStyleProps>;
}

export const HookOverlay: React.FC<HookOverlayProps> = ({
  text,
  fromFrame,
  toFrame,
  width,
  height,
  style: userStyle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const style: ShortStyleProps = { ...DEFAULT_STYLE_PROPS, ...(userStyle ?? {}) };

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
            background: style.hookBg,
            backdropFilter: 'blur(10px)',
            borderRadius: 24,
            padding: '32px 48px',
            border: `1px solid ${style.hookBorder}`,
            boxShadow: `0 25px 50px -12px ${style.hookBg}`,
          }}
        >
          <span
            style={{
              fontSize: style.hookFontSize,
              fontWeight: 800,
              color: style.hookTextColor,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              textShadow: `0 4px 24px ${style.hookBg}`,
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