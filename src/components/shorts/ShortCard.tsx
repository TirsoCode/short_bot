'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShortPlayer } from './ShortPlayer';
import { formatDuration, formatBytes } from '@/lib/utils';
import type { Short } from '@/types';

interface ShortCardProps {
  short: Short;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (short: Short) => void;
  onDelete: (id: string) => void;
  isRendering?: boolean;
}

const statusColors: Record<Short['status'], string> = {
  draft: 'bg-gray-500',
  rendering: 'bg-blue-500',
  rendered: 'bg-yellow-500',
  accepted: 'bg-green-500',
  rejected: 'bg-red-500',
  uploading: 'bg-purple-500',
  published: 'bg-emerald-500',
  failed: 'bg-red-500',
};

const statusLabels: Record<Short['status'], string> = {
  draft: 'Borrador',
  rendering: 'Renderizando',
  rendered: 'Listo',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  uploading: 'Subiendo',
  published: 'Publicado',
  failed: 'Error',
};

export const ShortCard: React.FC<ShortCardProps> = ({
  short,
  onAccept,
  onReject,
  onEdit,
  onDelete,
  isRendering,
}) => {
  const statusColor = statusColors[short.status];
  const statusLabel = statusLabels[short.status];

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate text-lg">{short.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{short.description}</p>
          </div>
          <Badge className={statusColor} variant="default">
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <ShortPlayer short={short} />

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {short.mediaIds.length} medios
          </span>
          {short.duration && (
            <span className="flex items-center gap-1">
              {formatDuration(short.duration)}
            </span>
          )}
          {short.renderedPath && (
            <span className="flex items-center gap-1">
              {short.errorMessage && '⚠️ '}{short.errorMessage ? 'Error' : 'Renderizado'}
            </span>
          )}
        </div>

        {short.rejectReason && (
          <p className="mt-2 text-sm text-red-500 bg-red-50 p-2 rounded">
            Motivo: {short.rejectReason}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex-wrap gap-2">
        {short.status === 'draft' && (
          <Button size="sm" onClick={() => onEdit(short)} variant="outline">
            Editar
          </Button>
        )}

        {short.status === 'draft' && (
          <Button size="sm" onClick={() => onAccept(short.id)} disabled={isRendering}>
            {isRendering ? 'Renderizando...' : 'Generar y Aceptar'}
          </Button>
        )}

        {short.status === 'rendered' && (
          <>
            <Button size="sm" onClick={() => onAccept(short.id)} className="bg-green-600 hover:bg-green-700">
              Aceptar y Subir
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onReject(short.id)}>
              Rechazar
            </Button>
          </>
        )}

        {short.status === 'accepted' && (
          <Button size="sm" variant="secondary" disabled>
            Subiendo...
          </Button>
        )}

        {short.status === 'published' && (
          <Button size="sm" variant="secondary" disabled className="bg-emerald-100 text-emerald-800">
            ✓ Publicado
          </Button>
        )}

        {short.status === 'rejected' && (
          <Button size="sm" variant="ghost" onClick={() => onAccept(short.id)}>
            Reconsiderar
          </Button>
        )}

        {short.status === 'failed' && (
          <Button size="sm" variant="outline" onClick={() => onAccept(short.id)}>
            Reintentar
          </Button>
        )}

        <Button size="sm" variant="ghost" onClick={() => onDelete(short.id)} className="text-red-500 hover:text-red-700">
          Eliminar
        </Button>
      </CardFooter>
    </Card>
  );
};