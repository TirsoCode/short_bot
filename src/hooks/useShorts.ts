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

async function acceptShort(id: string): Promise<void> {
  const res = await fetch(`/api/shorts/${id}/accept`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to accept short');
}

async function rejectShort(id: string, reason: string): Promise<void> {
  const res = await fetch(`/api/shorts/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rejectReason: reason }),
  });
  if (!res.ok) throw new Error('Failed to reject short');
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

  const acceptMutation = useMutation({
    mutationFn: acceptShort,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shorts'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectShort(id, reason),
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
    acceptShort: (id: string) => acceptMutation.mutateAsync(id),
    rejectShort: (id: string, reason: string) => rejectMutation.mutateAsync({ id, reason }),
    deleteShort: (id: string) => deleteMutation.mutateAsync(id),
  };
}