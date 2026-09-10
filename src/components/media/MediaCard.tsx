'use client';

import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Play, Video, Image } from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import type { MediaItem } from '@/types';

interface MediaCardProps {
  media: MediaItem;
  selected: boolean;
  onToggle: (id: string) => void;
  onPreview?: (media: MediaItem) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({ media, selected, onToggle, onPreview }) => {
  const isVideo = media.type === 'video';

  return (
    <Card className={`relative transition-all ${selected ? 'ring-2 ring-primary border-primary' : ''}`}>
      <div className="relative aspect-video overflow-hidden bg-muted">
        {media.downloadedPath ? (
          isVideo ? (
            <video
              src={media.downloadedPath}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
          ) : (
            <img
              src={media.downloadedPath}
              alt={media.name}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            {isVideo ? <Video className="h-12 w-12" /> : <Image className="h-12 w-12" />}
          </div>
        )}

        <div className="absolute top-2 right-2">
          <Button
            variant={selected ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => onToggle(media.id)}
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>

        {onPreview && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8 bg-black/50 text-white hover:bg-black/70"
            onClick={() => onPreview(media)}
          >
            <Play className="h-4 w-4" />
          </Button>
        )}

        <span className="absolute bottom-2 left-2 px-2 py-1 text-xs rounded bg-black/50 text-white">
          {isVideo ? 'VIDEO' : 'IMAGEN'}
        </span>
      </div>

      <CardContent className="p-3">
        <p className="text-sm font-medium truncate" title={media.name}>{media.name}</p>
        <p className="text-xs text-muted-foreground">{formatBytes(media.size)}</p>
      </CardContent>

      <CardFooter className="flex items-center justify-between p-3 pt-0">
        <span className="text-xs text-muted-foreground">{new Date(media.createdAt).toLocaleDateString()}</span>
      </CardFooter>
    </Card>
  );
};