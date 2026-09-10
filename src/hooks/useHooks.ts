import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { HookPhrase } from '@/types';

async function fetchHooks(): Promise<HookPhrase[]> {
  const res = await fetch('/api/hooks');
  if (!res.ok) throw new Error('Failed to fetch hooks');
  return res.json();
}

async function createHook(text: string): Promise<HookPhrase> {
  const res = await fetch('/api/hooks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to create hook');
  return res.json();
}

async function updateHook(id: string, data: Partial<HookPhrase>): Promise<void> {
  const res = await fetch(`/api/hooks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update hook');
}

async function deleteHook(id: string): Promise<void> {
  const res = await fetch(`/api/hooks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete hook');
}

export function useHooks() {
  return useQuery({
    queryKey: ['hooks'],
    queryFn: fetchHooks,
  });
}

export function useCreateHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createHook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hooks'] });
    },
  });
}

export function useUpdateHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HookPhrase> }) => updateHook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hooks'] });
    },
  });
}

export function useDeleteHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteHook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hooks'] });
    },
  });
}