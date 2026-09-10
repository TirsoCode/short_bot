'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ShortPlayer } from './ShortPlayer';
import { MediaGrid } from '@/components/media/MediaGrid';
import { HookSelector } from './HookSelector';
import { useMedia } from '@/hooks/useMedia';
import { useHooks } from '@/hooks/useHooks';
import { useShortGeneration } from '@/hooks/useShortGeneration';
import { useToast } from '@/hooks/useToast';
import type { MediaItem, HookPhrase } from '@/types';

export const ShortCreator: React.FC = () => {
  const { data: media = [], isLoading: mediaLoading } = useMedia();
  const { data: hooks = [], isLoading: hooksLoading } = useHooks();
  const { generateShort, isGenerating } = useShortGeneration();
  const { toast } = useToast();

  const [selectedHook, setSelectedHook] = useState<HookPhrase | null>(null);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [step, setStep] = useState<'hook' | 'media' | 'details' | 'preview'>('hook');

  const activeHooks = hooks.filter(h => h.isActive);

  const handleHookSelect = (hook: HookPhrase) => {
    setSelectedHook(hook);
    setStep('media');
  };

  const toggleMedia = (id: string) => {
    setSelectedMediaIds(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!selectedHook || selectedMediaIds.length === 0) {
      toast({ title: 'Error', description: 'Selecciona un hook y al menos un medio', variant: 'destructive' });
      return;
    }

    try {
      await generateShort({
        hookId: selectedHook.id,
        mediaIds: selectedMediaIds,
        title: title || `Short - ${selectedHook.text.slice(0, 30)}`,
        description,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      toast({ title: '¡Éxito!', description: 'Short generado correctamente', variant: 'success' });
      setSelectedHook(null);
      setSelectedMediaIds([]);
      setTitle('');
      setDescription('');
      setTags('');
      setStep('hook');
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo generar el short', variant: 'destructive' });
    }
  };

  const totalDuration = selectedMediaIds.length * 4 + 4;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Crear Short</h2>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Paso {['hook', 'media', 'details', 'preview'].indexOf(step) + 1} de 4</span>
          <div className="flex gap-1">
            {['hook', 'media', 'details', 'preview'].map((s, i) => (
              <div
                key={s}
                className={`w-8 h-1 rounded ${step === s || ['hook', 'media', 'details'].indexOf(step) > i ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {step === 'hook' && (
        <Card>
          <CardHeader>
            <CardTitle>Selecciona una frase gancho</CardTitle>
          </CardHeader>
          <CardContent>
            <HookSelector hooks={activeHooks} onSelect={handleHookSelect} disabled={hooksLoading} />
          </CardContent>
        </Card>
      )}

      {step === 'media' && (
        <Card>
          <CardHeader>
            <CardTitle>Selecciona los medios ({selectedMediaIds.length} seleccionados)</CardTitle>
          </CardHeader>
          <CardContent>
            <MediaGrid
              media={media}
              selectedIds={selectedMediaIds}
              onToggle={toggleMedia}
              multiSelect
              maxSelection={8}
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setStep('details')} disabled={selectedMediaIds.length === 0}>
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'details' && (
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Short</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Mi título genial"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe tu short..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="shorts, tutorial, tips"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('media')}>Atrás</Button>
              <Button onClick={() => setStep('preview')}>Vista previa</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle>Vista previa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Hook: {selectedHook?.text}</h4>
                <p className="text-sm text-muted-foreground">Medios: {selectedMediaIds.length}</p>
                <p className="text-sm text-muted-foreground">Duración estimada: ~{totalDuration}s</p>
              </div>
              <div>
                <ShortPlayer
                  short={{
                    id: 'preview',
                    hookId: selectedHook?.id ?? '',
                    hookText: selectedHook?.text ?? '',
                    mediaIds: selectedMediaIds,
                    title,
                    description,
                    tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                    status: 'draft',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('details')}>Atrás</Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? 'Generando...' : 'Generar Short'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};