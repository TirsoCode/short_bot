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
import { ArrowLeft, Loader2, Check, X, ExternalLink, Sparkles } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Settings, HookPhrase } from '@/types';
import { DEFAULT_STYLE } from '@/types';
import { Textarea } from '@/components/ui/textarea';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { data: ytStatus } = useYouTubeStatus();
  const [saving, setSaving] = useState(false);

  const [aiRequest, setAiRequest] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [aiModel, setAiModel] = useState('big-pickle');

  const [settings, setSettings] = useState({
    mediaPaths: 'videos,fotos',
    autoShortsPerDay: 2,
    autoPublish: false,
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
          mediaPaths: (data.settings.mediaPaths || ['videos', 'fotos']).join(','),
          autoShortsPerDay: data.settings.autoShortsPerDay ?? 2,
          autoPublish: !!(data.settings.autoPublish ?? false),
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

  useEffect(() => {
    fetch('/api/zen/style').then(r => r.json()).then(data => {
      setAiConfigured(data.configured ?? false);
      setAiModel(data.model || 'big-pickle');
      if (data.style) setAiResult(JSON.stringify(data.style, null, 2));
    }).catch(() => setAiConfigured(false));
  }, []);

  const handleAiChange = async () => {
    if (!aiRequest.trim() || !aiConfigured) return;
    setAiBusy(true);
    try {
      const res = await fetch('/api/zen/style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: aiRequest }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.style) {
        setAiResult(JSON.stringify(data.style, null, 2));
        toast({ title: 'Estilo generado', description: 'Revisa el JSON y guárdalo para que aplique a los próximos renders', variant: 'success' });
      } else {
        toast({ title: 'La IA no respondió', description: data.error || 'Revisa tu OPENCODE_ZEN_API_KEY', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo contactar con OpenCode Zen', variant: 'destructive' });
    }
    setAiBusy(false);
  };

  const handleAiSave = async (style: string) => {
    let parsed: any = null;
    try { parsed = JSON.parse(style); } catch { toast({ title: 'JSON inválido', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ styleJson: parsed }),
      });
      setAiResult(JSON.stringify(parsed, null, 2));
      toast({ title: 'Estilo guardado', description: 'Se aplicará en los próximos renders', variant: 'success' });
    } catch {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          mediaPaths: settings.mediaPaths.split(',').map(s => s.trim()).filter(Boolean),
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
            <CardTitle>Carpetas locales</CardTitle>
            <CardDescription>Mete aquí los vídeos y fotos (descargados de la web o tuyos) que quieras usar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Carpetas a escanear (separadas por coma)</Label>
              <Input value={settings.mediaPaths} onChange={e => setSettings({...settings, mediaPaths: e.target.value})} placeholder="videos,fotos" />
            </div>
            <div className="flex items-start justify-between gap-4 rounded-lg bg-slate-50 p-4 text-sm">
              <p className="text-muted-foreground">
                El bot busca medios automáticamente cada {settings.syncIntervalMinutes} min y con el botón
                "Importar" del dashboard. Los medios quedan en tu carpeta y se copian a la biblioteca.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Robot diario</CardTitle>
            <CardDescription>El bot crea y renderiza shorts automáticamente con tus frases y medios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Shorts por día</Label>
                <Input type="number" min={1} max={24} value={settings.autoShortsPerDay}
                  onChange={e => setSettings({...settings, autoShortsPerDay: Math.max(1, Math.min(24, +e.target.value || 1))})} />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-4">
                <div>
                  <Label className="text-base">Publicar automáticamente</Label>
                  <p className="text-sm text-muted-foreground">Si está apagado, los shorts quedan listos en "Revisar" para que los subas tú</p>
                </div>
                <Switch checked={settings.autoPublish} onCheckedChange={(v) => setSettings({...settings, autoPublish: v})} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Estilo del vídeo (IA)
            </CardTitle>
            <CardDescription>
              Dile al bot qué quieres cambiar y {aiModel} (modelo de OpenCode Zen) ajustará el estilo de los vídeos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiConfigured === false ? (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                No hay <code className="font-mono">OPENCODE_ZEN_API_KEY</code> configurada. Crea tu API key en
                {' '}<a className="underline" href="https://opencode.ai/zen" target="_blank" rel="noreferrer">opencode.ai/zen</a>{' '}
                y añádela al archivo <code className="font-mono">.env.local</code>.
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>¿Qué quieres cambiar?</Label>
              <Textarea value={aiRequest}
                onChange={e => setAiRequest(e.target.value)}
                placeholder="Ej: el fondo es muy oscuro, acláralo y ponle un toque azul"
                rows={2} />
            </div>
            <Button onClick={handleAiChange} disabled={aiBusy || !aiRequest.trim() || aiConfigured === false}>
              {aiBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Cambiar con {aiModel}
            </Button>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Estilo actual / resultado</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleAiSave(JSON.stringify(DEFAULT_STYLE))} disabled={saving}>
                    Restablecer
                  </Button>
                  <Button size="sm" onClick={() => handleAiSave(aiResult)} disabled={saving || !aiResult.trim()}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                    Guardar estilo
                  </Button>
                </div>
              </div>
              <Textarea value={aiResult} onChange={e => setAiResult(e.target.value)} rows={10}
                className="font-mono text-xs" />
              <p className="text-xs text-muted-foreground">
                Campos: background, hookTextColor, hookBg, hookBorder, hookFontSize (px), accent, outroText, outroSubtext.
                El estilo se aplica en los próximos renders.
              </p>
            </div>
          </CardContent>
        </Card>

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