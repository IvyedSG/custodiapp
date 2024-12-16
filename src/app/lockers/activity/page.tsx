'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Package, Lock, Check, AlertCircle, Ticket } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import type { LockerItem } from "@/types/locker"

interface ActivityEvent {
  type: 'add' | 'remove' | 'emergency';
  lockerId?: number;
  item: LockerItem & { location?: string; description?: string; isEmergency?: boolean };
  timestamp: Date;
}

export default function LockersActivityPage() {
  const [activities, setActivities] = useState<ActivityEvent[]>([])

  useEffect(() => {
    const loadActivities = () => {
      const savedActivities = localStorage.getItem('activities')
      if (savedActivities) {
        const parsedActivities = JSON.parse(savedActivities, (key, value) => {
          if (key === 'timestamp' && value) {
            return new Date(value)
          }
          return value
        })
        setActivities(parsedActivities)
      }
    }

    loadActivities()
    window.addEventListener('storage', loadActivities)
    window.addEventListener('lockersUpdated', loadActivities)

    return () => {
      window.removeEventListener('storage', loadActivities)
      window.removeEventListener('lockersUpdated', loadActivities)
    }
  }, [])

  if (activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center space-y-4"
      >
        <Package className="h-16 w-16 text-purple-200" />
        <h3 className="text-2xl font-semibold text-purple-900">¡Buen Servicio!</h3>
        <p className="text-muted-foreground">
          No hay actividades registradas por el momento
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <ScrollArea className="h-[calc(100vh-200px)] rounded-md border">
        <div className="rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 bg-white">Fecha y Hora</TableHead>
                <TableHead className="sticky top-0 bg-white">Acción</TableHead>
                <TableHead className="sticky top-0 bg-white">Locker</TableHead>
                <TableHead className="sticky top-0 bg-white">Ticket</TableHead>
                <TableHead className="sticky top-0 bg-white">DNI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity, index) => (
                <TableRow key={`${activity.item.ticket}-${index}`}>
                  <TableCell className="whitespace-nowrap">
                    {format(activity.timestamp, "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        activity.type === 'add'
                          ? "bg-green-50 text-green-700 border-green-200"
                          : activity.type === 'remove'
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }
                    >
                      {activity.type === 'add' ? (
                        <>
                          <Lock className="mr-1 h-3 w-3" />
                          Item guardado
                        </>
                      ) : activity.type === 'remove' ? (
                        <>
                          <Check className="mr-1 h-3 w-3" />
                          Item entregado
                        </>
                      ) : (
                        <>
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Registro de emergencia
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>{activity.lockerId ? `#${activity.lockerId}` : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary"
                      className="bg-purple-50 text-purple-700 border-purple-200"
                    >
                      <Ticket className="mr-1 h-3 w-3" />
                      {activity.item.ticket}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{activity.item.dni}</TableCell>
                  {activity.type === 'emergency' && (
                    <>
                      <TableCell>{activity.item.location}</TableCell>
                      <TableCell>{activity.item.description}</TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </motion.div>
  )
}

