'use client'

import { TicketIcon, CheckCircle, XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { Locker } from "@/types/locker"

interface TicketStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lockers: Locker[]
}

export function TicketStatusDialog({ open, onOpenChange, lockers }: TicketStatusDialogProps) {
  const isTicketAssigned = (ticket: string) => {
    return lockers.some(locker => 
      locker.items.some(item => item.ticket === ticket)
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-gradient-to-br from-purple-50/50 to-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-purple-700">
            <TicketIcon className="h-6 w-6" />
            Estado de Tickets
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-10 gap-3 p-6">
          {Array.from({ length: 50 }, (_, i) => {
            const ticket = `T-${String(i + 1).padStart(3, '0')}`
            const assigned = isTicketAssigned(ticket)
            return (
              <div
                key={ticket}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center rounded-lg border-2 text-xs font-mono shadow-sm transition-colors",
                  assigned 
                    ? "border-red-200 bg-red-50" 
                    : "border-emerald-200 bg-emerald-50"
                )}
              >
                <span className={cn(
                  "font-bold",
                  assigned ? "text-red-700" : "text-emerald-700"
                )}>
                  {String(i + 1).padStart(3, '0')}
                </span>
                <div className="absolute right-1 top-1">
                  {assigned ? (
                    <XCircle className="h-3 w-3 text-red-500" />
                  ) : (
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                  )}
                </div>
                <span className={cn(
                  "text-[10px]",
                  assigned ? "text-red-500" : "text-emerald-600"
                )}>
                  {assigned ? 'Ocupado' : 'Libre'}
                </span>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

