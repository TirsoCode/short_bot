'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { useYouTubeStatus } from '@/hooks/useYouTubeUpload';
import { ArrowLeft, Loader2, Check, X, ExternalLink } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Settings, HookPhrase } from '@/types';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { data: ytStatus } = useYouTubeStatus();
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    githubOwner: '',
    githubRepo: '',
    githubBranch: 'main',
    githubPaths: 'videos,fotos',
    githubToken: '',
    youtubeClientId: '',
    youtubeClientSecret: '',
    syncIntervalMinutes: 30,
    maxShortDuration: 30,
    videoWidth: 1080,
    videoHeight: 1920,
    videoFps: 30,
  });

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      if (data.settings) {
        setSettings({
          githubOwner: data.settings.githubOwner || '',
          githubRepo: data.settings.githubRepo || '',
          githubBranch: data.settings.githubBranch || 'main',
          githubPaths: (data.settings.githubPaths || []).join(','),
          githubToken: data.settings.githubToken || '',
          youtubeClientId: data.settings.youtubeClientId || '',
          youtubeClientSecret: data.settings.youtubeClientSecret || '',
          syncIntervalMinutes: data.settings.syncIntervalMinutes ?? 30,
          maxShortDuration: data.settings.maxShortDuration ?? 30,
          videoWidth: data.settings.videoWidth ?? 1080,
          videoHeight: data.settings.videoHeight ?? 1920,
          videoFps: data.settings.videoFps ?? 30,
        });
      }
    });
  }, []);

  useEffect(() => {
    const ytError = searchParams.get('youtube_error');
    const ytConnected = searchParams.get('youtube_connected');
    if (ytError) toast({ title: 'Error YouTube', description: ytError, variant: 'destructive' });
    if (ytConnected) toast({ title: 'YouTube conectado', description: 'Cuenta vinculada correctamente', variant: 'success' });
  }, [searchParams, toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          githubPaths: settings.githubPaths.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
      toast({ title: 'Guardado', variant: 'success' });
    } catch {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-xl font-bold">Configuración</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>GitHub</CardTitle>
            <CardDescription>Conecta tu repositorio con los vídeos y capturas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Propietario/Equipo</Label><Input value={settings.githubOwner} onChange={e => setSettings({...settings, githubOwner: e.target.value})} placeholder="mi-usuario" /></div>
              <div className="space-y-2"><Label>Repositorio</Label><Input value={settings.githubRepo} onChange={e => setSettings({...settings, githubRepo: e.target.value})} placeholder="mi-repo" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Rama</Label><Input value={settings.githubBranch} onChange={e => setSettings({...settings, githubBranch: e.target.value})} /></div>
              <div className="space-y-2"><Label>Carpetas (separadas por coma)</Label><Input value={settings.githubPaths} onChange={e => setSettings({...settings, githubPaths: e.target.value})} placeholder="videos,screenshots" /></div>
            </div>
            <div className="space-y-2"><Label>Personal Access Token (PAT)</Label><Input type="password" value={settings.githubToken} onChange={e => setSettings({...settings, githubToken: e.target.value})} placeholder="ghp_..." /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              YouTube
              {ytStatus?.connected ? <Badge className="bg-green-500">Conectado</Badge> : <Badge variant="secondary">No conectado</Badge>}
            </CardTitle>
            <CardDescription>Conecta tu canal de YouTube para subir shorts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Client ID</Label><Input value={settings.youtubeClientId} onChange={e => setSettings({...settings, youtubeClientId: e.target.value})} /></div>
            <div className="space-y-2"><Label>Client Secret</Label><Input type="password" value={settings.youtubeClientSecret} onChange={e => setSettings({...settings, youtubeClientSecret: e.target.value})} /></div>
            <Button onClick={() => window.open('/api/youtube/auth', '_blank')} disabled={!settings.youtubeClientId || !settings.youtubeClientSecret}>
              {ytStatus?.connected ? 'Conectar otra cuenta' : 'Conectar con YouTube'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Configuración de Vídeo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Ancho</Label><Input type="number" value={settings.videoWidth} onChange={e => setSettings({...settings, videoWidth: +e.target.value})} /></div>
              <div className="space-y-2"><Label>Alto</Label><Input type="number" value={settings.videoHeight} onChange={e => setSettings({...settings, videoHeight: +e.target.value})} /></div>
              <div className="space-y-2"><Label>FPS</Label><Input type="number" value={settings.videoFps} onChange={e => setSettings({...settings, videoFps: +e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Duración máxima (s)</Label><Input type="number" value={settings.maxShortDuration} onChange={e => setSettings({...settings, maxShortDuration: +e.target.value})} /></div>
              <div className="space-y-2"><Label>Intervalo sync (min)</Label><Input type="number" value={settings.syncIntervalMinutes} onChange={e => setSettings({...settings, syncIntervalMinutes: +e.target.value})} /></div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Guardar Configuración
        </Button>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <React.Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando...</div>}>
        <SettingsContent />
      </React.Suspense>
    </QueryClientProvider>
  );
}