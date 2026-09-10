import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Short } from '@/types';

async function fetchShorts(): Promise<Short[]> {
  const res = await fetch('/api/shorts');
  if (!res.ok) throw new Error('Failed to fetch shorts');
  return res.json();
}

async function updateStatus(id: string, status: Short['status'], extra?: Partial<Short>): Promise<void> {
  await fetch(`/api/shorts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, ...extra }),
  });
}

async function removeShort(id: string): Promise<void> {
  await fetch(`/api/shorts/${id}`, { method: 'DELETE' });
}

export function useShorts() {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['shorts'], queryFn: fetchShorts, refetchInterval: 5000 });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, extra }: { id: string; status: Short['status']; extra?: Partial<Short> }) => updateStatus(id, status, extra),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shorts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: removeShort,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shorts'] }),
  });

  return {
    shorts: query.data ?? [],
    isLoading: query.isLoading,
    updateShortStatus: (id: string, status: Short['status'], extra?: Partial<Short>) =>
      updateMutation.mutateAsync({ id, status, extra }),
    deleteShort: (id: string) => deleteMutation.mutateAsync(id),
  };
}