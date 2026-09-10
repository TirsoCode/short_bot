'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MediaCard } from './MediaCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShortPlayer } from '@/components/shorts/ShortPlayer';
import { X } from 'lucide-react';
import type { MediaItem } from '@/types';

interface MediaGridProps {
  media: MediaItem[];
  selectedIds?: string[];
  onToggle?: (id: string) => void;
  multiSelect?: boolean;
  maxSelection?: number;
  onPreview?: (media: MediaItem) => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  media,
  selectedIds = [],
  onToggle,
  multiSelect = false,
  maxSelection = 10,
  onPreview,
}) => {
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);

  if (media.length === 0) {
    return (
      <Card className="py-12 text-center">
        <CardContent>
          <p className="text-muted-foreground">No hay medios disponibles. Haz sync desde GitHub.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {media.map(item => (
          <MediaCard
            key={item.id}
            media={item}
            selected={selectedIds.includes(item.id)}
            onToggle={onToggle ?? (() => {})}
            onPreview={onPreview}
          />
        ))}
      </div>

      <Dialog open={!!previewMedia} onOpenChange={open => !open && setPreviewMedia(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewMedia?.name}</DialogTitle>
          </DialogHeader>
          {previewMedia && (
            <ShortPlayer
              short={{
                id: 'preview',
                hookId: '',
                hookText: '',
                mediaIds: [previewMedia.id],
                title: previewMedia.name,
                description: '',
                tags: [],
                status: 'draft',
                renderedPath: previewMedia.downloadedPath,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};