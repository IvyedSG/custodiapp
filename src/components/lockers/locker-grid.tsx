'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { LockerButton } from './locker-button';
import type { Locker } from '@/types/locker';

interface LockerGridProps {
  lockers: Locker[];
  onLockerClick: (index: number) => void;
}

export function LockerGrid({ lockers, onLockerClick }: LockerGridProps) {
  return (
    <div className="grid h-full auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {lockers.map((locker, index) => (
        <motion.div
          key={locker.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
          className="h-full"
        >
          <LockerButton 
            locker={locker} 
            onClick={() => onLockerClick(index)} 
          />
        </motion.div>
      ))}
    </div>
  );
}

