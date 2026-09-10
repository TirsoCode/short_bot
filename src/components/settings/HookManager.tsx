'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useHooks, useCreateHook, useUpdateHook, useDeleteHook } from '@/hooks/useHooks';
import { useToast } from '@/hooks/useToast';
import { Plus, Trash2, Loader2 } from 'lucide-react';

export function HookManager() {
  const { hooks, isLoading } = useHooks();
  const createHook = useCreateHook();
  const updateHook = useUpdateHook();
  const deleteHook = useDeleteHook();
  const { toast } = useToast();
  const [newText, setNewText] = useState('');

  const handleAdd = async () => {
    if (!newText.trim()) return;
    try {
      await createHook.mutateAsync(newText.trim());
      setNewText('');
      toast({ title: 'Creado', variant: 'success' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await updateHook.mutateAsync({ id, data: { isActive } });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar frase gancho?')) return;
    try {
      await deleteHook.mutateAsync(id);
      toast({ title: 'Eliminado', variant: 'default' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Frases Gancho</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Nueva frase gancho..."
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={!newText.trim() || createHook.isPending}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {hooks.map(hook => (
            <div key={hook.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <Switch checked={hook.isActive} onCheckedChange={v => handleToggle(hook.id, v)} />
              <span className="flex-1 text-sm">{hook.text}</span>
              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(hook.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}