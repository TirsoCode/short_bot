import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

async function syncGitHub(): Promise<{ success: boolean; newMediaCount: number; errors: string[] }> {
  const res = await fetch('/api/github/sync', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to sync');
  return res.json();
}

export function useGitHubSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncGitHub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}