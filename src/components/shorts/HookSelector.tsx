'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { HookPhrase } from '@/types';

interface HookSelectorProps {
  hooks: HookPhrase[];
  onSelect: (hook: HookPhrase) => void;
  disabled?: boolean;
}

export const HookSelector: React.FC<HookSelectorProps> = ({ hooks, onSelect, disabled }) => {
  if (hooks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay frases gancho disponibles. Ve a Configuración para agregar algunas.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {hooks.map(hook => (
        <Card
          key={hook.id}
          className="cursor-pointer transition-all hover:shadow-lg hover:border-primary"
          onClick={() => !disabled && onSelect(hook)}
        >
          <CardContent className="pt-6">
            <p className="text-center text-lg font-medium leading-relaxed">{hook.text}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};