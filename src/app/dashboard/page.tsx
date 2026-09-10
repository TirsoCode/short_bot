'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShortCard } from '@/components/shorts/ShortCard';
import { ShortCreator } from '@/components/shorts/ShortCreator';
import { MediaGrid } from '@/components/media/MediaGrid';
import { HookManager } from '@/components/settings/HookManager';
import { useMedia } from '@/hooks/useMedia';
import { useShorts } from '@/hooks/useShorts';
import { useGitHubSync } from '@/hooks/useGitHubSync';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw, Plus, Image, Video, LayoutList, Settings } from 'lucide-react';
import type { Short, MediaItem } from '@/types';

function DashboardContent() {
  const { data: media = [], isLoading: mediaLoading } = useMedia();
  const { shorts, isLoading: shortsLoading, acceptShort, rejectShort, deleteShort } = useShorts();
  const syncMutation = useGitHubSync();
  const { toast } = useToast();
  const router = useRouter();

  const draftShorts = shorts.filter(s => s.status === 'draft');
  const renderedShorts = shorts.filter(s => s.status === 'rendered');
  const acceptedShorts = shorts.filter(s => s.status === 'accepted');
  const publishedShorts = shorts.filter(s => s.status === 'published');
  const rejectedShorts = shorts.filter(s => s.status === 'rejected');
  const failedShorts = shorts.filter(s => s.status === 'failed');
  const allShorts = [...renderedShorts, ...draftShorts, ...failedShorts];

  const handleSync = async () => {
    try {
      const result = await syncMutation.mutateAsync();
      if (result.success) {
        toast({ title: 'Sync completo', description: `${result.newMediaCount} medios nuevos`, variant: 'success' });
      } else {
        toast({ title: 'Sync con errores', description: result.errors.join(', '), variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo sincronizar', variant: 'destructive' });
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await acceptShort(id);
      toast({ title: 'Aceptado', description: 'Subiendo a YouTube...', variant: 'success' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo aceptar', variant: 'destructive' });
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Motivo del rechazo:');
    try {
      await rejectShort(id, reason || '');
      toast({ title: 'Rechazado', description: 'Short eliminado de la cola', variant: 'default' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo rechazar', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este short permanentemente?')) return;
    try {
      await deleteShort(id);
      toast({ title: 'Eliminado', variant: 'default' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
            <h1 className="text-xl font-bold">Short Bot</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
              <Settings className="h-4 w-4 mr-2" /> Configuración
            </Button>
            <Button size="sm" onClick={handleSync} disabled={syncMutation.isPending}>
              {syncMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Sync GitHub
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid gap-4 mb-6 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><Image className="h-5 w-5 text-blue-600" /></div>
              <div><p className="text-2xl font-bold">{media.length}</p><p className="text-xs text-muted-foreground">Medios</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center"><Video className="h-5 w-5 text-yellow-600" /></div>
              <div><p className="text-2xl font-bold">{allShorts.length}</p><p className="text-xs text-muted-foreground">Borradores</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center"><LayoutList className="h-5 w-5 text-green-600" /></div>
              <div><p className="text-2xl font-bold">{publishedShorts.length}</p><p className="text-xs text-muted-foreground">Publicados</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center"><LayoutList className="h-5 w-5 text-red-600" /></div>
              <div><p className="text-2xl font-bold">{rejectedShorts.length}</p><p className="text-xs text-muted-foreground">Rechazados</p></div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="review" className="space-y-6">
          <TabsList>
            <TabsTrigger value="review">Revisar ({allShorts.length})</TabsTrigger>
            <TabsTrigger value="create">Crear Short</TabsTrigger>
            <TabsTrigger value="media">Medios ({media.length})</TabsTrigger>
            <TabsTrigger value="hooks">Frases Gancho</TabsTrigger>
          </TabsList>

          <TabsContent value="review">
            {shortsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : allShorts.length === 0 ? (
              <Card className="py-12 text-center"><CardContent><p className="text-muted-foreground">No hay shorts pendientes. Crea uno nuevo o sincroniza medios.</p></CardContent></Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {allShorts.map(short => (
                  <ShortCard
                    key={short.id}
                    short={short}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onEdit={() => {}}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create">
            <ShortCreator />
          </TabsContent>

          <TabsContent value="media">
            {mediaLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
              <MediaGrid media={media} />
            )}
          </TabsContent>

          <TabsContent value="hooks">
            <HookManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 5000, refetchInterval: 10000 } }
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  );
}