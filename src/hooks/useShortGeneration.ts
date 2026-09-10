import { useMutation, useQueryClient } from '@tanstack/react-query';

async function createShort(data: {
  hookId: string;
  mediaIds: string[];
  title: string;
  description: string;
  tags: string[];
}) {
  const res = await fetch('/api/shorts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create short');
  return res.json();
}

async function renderShort(shortId: string) {
  const res = await fetch('/api/shorts/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shortId }),
  });
  if (!res.ok) throw new Error('Failed to start render');
}

export function useShortGeneration() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({ mutationFn: createShort });
  const renderMutation = useMutation({ mutationFn: renderShort });

  const generateShort = async (data: Parameters<typeof createShort>[0]) => {
    const short = await createMutation.mutateAsync(data);
    await renderMutation.mutateAsync(short.id);
    queryClient.invalidateQueries({ queryKey: ['shorts'] });
    return short;
  };

  return {
    generateShort,
    isGenerating: createMutation.isPending || renderMutation.isPending,
  };
}