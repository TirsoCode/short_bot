import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Spring, spring } from 'remotion';

interface MediaItem {
  id: string;
  type: 'video' | 'image';
  path: string;
  duration?: number;
}

interface MediaSequenceProps {
  media: MediaItem[];
  fromFrame: number;
  toFrame: number;
  width: number;
  height: number;
  fps: number;
}

export const MediaSequence: React.FC<MediaSequenceProps> = ({
  media,
  fromFrame,
  toFrame,
  width,
  height,
  fps,
}) => {
  const frame = useCurrentFrame();

  const mediaTimeline = useMemo(() => {
    let currentFrame = fromFrame;
    return media.map((item) => {
      const duration = (item.duration ?? 4) * fps;
      const startFrame = currentFrame;
      const endFrame = currentFrame + duration;
      currentFrame = endFrame;
      return { item, startFrame, endFrame, duration };
    });
  }, [media, fromFrame, fps]);

  return (
    <AbsoluteFill>
      {mediaTimeline.map(({ item, startFrame, endFrame, duration }) => (
        <MediaPlayer
          key={item.id}
          item={item}
          startFrame={startFrame}
          endFrame={endFrame}
          duration={duration}
          width={width}
          height={height}
          currentFrame={frame}
        />
      ))}
    </AbsoluteFill>
  );
};

interface MediaPlayerProps {
  item: MediaItem;
  startFrame: number;
  endFrame: number;
  duration: number;
  width: number;
  height: number;
  currentFrame: number;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({
  item,
  startFrame,
  endFrame,
  duration,
  width,
  height,
  currentFrame,
}) => {
  const progress = interpolate(currentFrame, [startFrame, endFrame], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const opacity = interpolate(currentFrame, [startFrame, startFrame + 15, endFrame - 15, endFrame], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const scale = item.type === 'image'
    ? interpolate(progress, [0, 1], [1.05, 0.98], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 1;

  const style: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    objectFit: 'cover',
    opacity,
    transform: `scale(${scale})`,
    transformOrigin: 'center center',
  };

  if (item.type === 'video') {
    return (
      <video
        src={item.path}
        style={style}
        autoPlay
        muted
        loop
        playsInline
        // Remotion handles video playback via frame
      />
    );
  }

  return <img src={item.path} style={style} alt="" />;
};