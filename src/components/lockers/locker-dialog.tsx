'use client'

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Lock, Unlock, Ticket, Clock } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import type { Locker, LockerItem } from '@/types/locker';
import { getLockerStatus, assignTicket, releaseTicket } from '@/lib/utils';

interface LockerDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  locker: Locker | null;
  onAddItem: (dni: string, ticket: string) => void;
  viewOnly?: boolean;
}

export function LockerDialog({ 
  isOpen, 
  setIsOpen, 
  locker, 
  onAddItem,
  viewOnly = false
}: LockerDialogProps) {
  const [dni, setDni] = useState('');
  const [assignedTicket, setAssignedTicket] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setDni('');
      if (assignedTicket) {
        releaseTicket(assignedTicket);
        setAssignedTicket(null);
      }
    }
  }, [isOpen, assignedTicket]);

  const handleAssignTicket = () => {
    if (dni && locker && locker.items.length < 3 && !assignedTicket) {
      const ticket = assignTicket();
      if (ticket) {
        setAssignedTicket(ticket);
      }
    }
  };

  const handleAddItem = () => {
    if (dni && assignedTicket && locker && locker.items.length < 3) {
 
      const activities = JSON.parse(localStorage.getItem('activities') || '[]')
      activities.unshift({
        type: 'add',
        lockerId: locker.id,
        item: {
          dni,
          ticket: assignedTicket,
          timestamp: new Date()
        },
        timestamp: new Date()
      })
      localStorage.setItem('activities', JSON.stringify(activities))

    
      onAddItem(dni, assignedTicket);
      setDni('');
      setAssignedTicket(null);
    }
  };

  const handleClose = () => {
    if (assignedTicket) {
      releaseTicket(assignedTicket);
      setAssignedTicket(null);
    }
    setIsOpen(false);
  };

  if (!locker) return null;

  const status = getLockerStatus(locker.items.length);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] bg-gradient-to-br from-purple-50 to-indigo-50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-purple-800 flex items-center">
            {status === 'empty' ? <Unlock className="mr-2" /> : <Lock className="mr-2" />}
            Locker {locker.id}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6">
          {!viewOnly && locker.items.length < 3 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-indigo-700">Agregar nuevo item:</h3>
              <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dni" className="text-sm font-medium text-indigo-700">DNI</Label>
                  <Input 
                    id="dni" 
                    value={dni} 
                    onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))} 
                    className="font-mono"
                    placeholder="Ingrese el DNI"
                    maxLength={8}
                  />
                </div>

                <AnimatePresence mode="wait">
                  {dni.length === 8 && !assignedTicket && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div className="rounded-lg bg-purple-50 p-3 space-y-2">
                        <div className="flex items-center gap-2 text-purple-600">
                          <Ticket className="h-4 w-4" />
                          <span className="font-mono">Ticket por asignar</span>
                        </div>
                        <div className="text-xs text-purple-500">
                          Se asignará al generar el ticket
                        </div>
                      </div>

                      <Button
                        onClick={handleAssignTicket}
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                      >
                        Asignar Ticket
                      </Button>
                    </motion.div>
                  )}

                  {assignedTicket && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div className="rounded-lg bg-purple-50 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-purple-600">
                            <Ticket className="h-4 w-4" />
                            <span className="font-mono font-medium">{assignedTicket}</span>
                          </div>
                          <span className="text-sm text-purple-600">DNI: {dni}</span>
                        </div>
                      </div>

                      <Button 
                        onClick={handleAddItem}
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                      >
                        Confirmar Item
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : null}

          <div className={viewOnly ? "col-span-2" : "relative"}>
            {!viewOnly && <Separator orientation="vertical" className="absolute -left-3 h-full" />}
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-indigo-700">Items actuales:</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {locker.items.length === 0 ? (
                  <p className="text-indigo-700">Este casillero está vacío.</p>
                ) : (
                  locker.items.map((item, index) => (
                    <motion.div
                      key={item.ticket}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-3 rounded-lg shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-purple-600">
                          <Ticket className="h-4 w-4" />
                          <span className="font-mono font-medium">{item.ticket}</span>
                        </div>
                        <span className="text-sm text-gray-500">DNI: {item.dni}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(item.timestamp, "d 'de' MMMM 'a las' HH:mm", {
                            locale: es,
                          })}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-indigo-700">
                <Package className="h-4 w-4" />
                <span>Items: {locker.items.length}/3</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

