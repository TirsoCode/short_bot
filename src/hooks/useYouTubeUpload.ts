import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Short } from '@/types';

async function uploadShort(shortId: string): Promise<{ url: string }> {
  const res = await fetch('/api/youtube/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shortId }),
  });
  if (!res.ok) throw new Error('Failed to upload');
  return res.json();
}

async function checkYouTubeStatus(): Promise<{ connected: boolean }> {
  const res = await fetch('/api/youtube/upload');
  if (!res.ok) return { connected: false };
  return res.json();
}

export function useYouTubeUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadShort,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shorts'] });
    },
  });
}

export function useYouTubeStatus() {
  return useQuery({
    queryKey: ['youtube', 'status'],
    queryFn: checkYouTubeStatus,
  });
}