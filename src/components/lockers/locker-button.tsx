'use client'

import React from 'react';
import { Button } from "@/components/ui/button";
import { Lock, Unlock, Package } from 'lucide-react';
import type { Locker } from '@/types/locker';
import { getLockerStatus, getStatusColor } from '@/lib/utils';

interface LockerButtonProps {
  locker: Locker;
  onClick: () => void;
}

export function LockerButton({ locker, onClick }: LockerButtonProps) {
  const status = getLockerStatus(locker.items.length);
  const statusColor = getStatusColor(status);

  return (
    <Button
      className={`h-full w-full text-white font-bold transition-all duration-200 rounded-lg shadow-lg ${statusColor}`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="text-2xl">
          {status === 'empty' ? <Unlock /> : <Lock />}
        </div>
        <div className="text-lg">Locker {locker.id}</div>
        {status !== 'empty' && (
          <div className="text-sm flex items-center">
            <Package size={14} className="mr-1" />
            {locker.items.length} item{locker.items.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </Button>
  );
}

