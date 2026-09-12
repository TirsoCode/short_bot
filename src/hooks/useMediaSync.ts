import { useMutation, useQueryClient } from '@tanstack/react-query';

async function syncMedia(): Promise<{ success: boolean; newMediaCount: number; errors: string[] }> {
  const res = await fetch('/api/media/sync', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to sync');
  return res.json();
}

export function useMediaSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}