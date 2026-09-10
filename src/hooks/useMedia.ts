import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MediaItem } from '@/types';

async function fetchMedia(): Promise<MediaItem[]> {
  const res = await fetch('/api/media');
  if (!res.ok) throw new Error('Failed to fetch media');
  return res.json();
}

async function deleteMedia(id: string): Promise<void> {
  const res = await fetch(`/api/media?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete media');
}

export function useMedia() {
  return useQuery({
    queryKey: ['media'],
    queryFn: fetchMedia,
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}