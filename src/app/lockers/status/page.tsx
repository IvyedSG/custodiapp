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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock, Unlock, Package, Eye, Check, Ticket } from 'lucide-react'
import { LockerDialog } from '@/components/lockers/locker-dialog'
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Locker, LockerItem } from "@/types/locker"
import { getLockerStatus } from "@/lib/utils"

export default function LockersStatusPage() {
  const [lockers, setLockers] = useState<Locker[]>([])
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [emergencyItems, setEmergencyItems] = useState<any[]>([])

  useEffect(() => {
    const loadLockers = () => {
      const savedLockers = localStorage.getItem('lockers')
      if (savedLockers) {
        setLockers(JSON.parse(savedLockers, (key, value) => 
          key === 'timestamp' ? new Date(value) : value
        ))
      }
    }

    loadLockers()
    window.addEventListener('storage', loadLockers)
    window.addEventListener('lockersUpdated', loadLockers)

    return () => {
      window.removeEventListener('storage', loadLockers)
      window.removeEventListener('lockersUpdated', loadLockers)
    }
  }, [])

  useEffect(() => {
    const loadEmergencyItems = () => {
      const savedEmergencyItems = localStorage.getItem('emergencyItems')
      if (savedEmergencyItems) {
        setEmergencyItems(JSON.parse(savedEmergencyItems))
      }
    }

    loadEmergencyItems()
    window.addEventListener('emergencyItemAdded', loadEmergencyItems)

    return () => {
      window.removeEventListener('emergencyItemAdded', loadEmergencyItems)
    }
  }, [])

  const handleMarkAsDelivered = (lockerId: number, itemIndex: number, isEmergency: boolean = false) => {
    if (isEmergency) {
      const updatedEmergencyItems = [...emergencyItems];
      const deliveredItem = updatedEmergencyItems[itemIndex];
      
      // Add to activity log
      const activities = JSON.parse(localStorage.getItem('activities') || '[]');
      activities.unshift({
        type: 'remove',
        item: deliveredItem,
        timestamp: new Date(),
        isEmergency: true
      });
      localStorage.setItem('activities', JSON.stringify(activities));
      
      // Remove item from emergency items
      updatedEmergencyItems.splice(itemIndex, 1);
      setEmergencyItems(updatedEmergencyItems);
      localStorage.setItem('emergencyItems', JSON.stringify(updatedEmergencyItems));
    } else {
      const updatedLockers = lockers.map(locker => {
        if (locker.id === lockerId) {
          const updatedItems = [...locker.items];
          const deliveredItem = updatedItems[itemIndex];
          // Add to activity log
          const activities = JSON.parse(localStorage.getItem('activities') || '[]');
          activities.unshift({
            type: 'remove',
            lockerId: locker.id,
            item: deliveredItem,
            timestamp: new Date()
          });
          localStorage.setItem('activities', JSON.stringify(activities));
          
          // Remove item from locker
          updatedItems.splice(itemIndex, 1);
          return { ...locker, items: updatedItems };
        }
        return locker;
      });

      setLockers(updatedLockers);
      localStorage.setItem('lockers', JSON.stringify(updatedLockers));
    }

    window.dispatchEvent(new Event('lockersUpdated'));
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'empty':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Unlock className="mr-1 h-3 w-3" />
            Vacío
          </Badge>
        )
      case 'semi-full':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Package className="mr-1 h-3 w-3" />
            Semi-lleno
          </Badge>
        )
      case 'full':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <Lock className="mr-1 h-3 w-3" />
            Lleno
          </Badge>
        )
      default:
        return null
    }
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
                <TableHead className="sticky top-0 bg-white w-[100px]">Locker</TableHead>
                <TableHead className="sticky top-0 bg-white">Estado</TableHead>
                <TableHead className="sticky top-0 bg-white">Items</TableHead>
                <TableHead className="sticky top-0 bg-white">Última Actualización</TableHead>
                <TableHead className="sticky top-0 bg-white text-center">Detalles</TableHead>
                <TableHead className="sticky top-0 bg-white text-center">Entregar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lockers.map((locker, index) => {
                const status = getLockerStatus(locker.items.length)
                return (
                  <TableRow key={locker.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>#{locker.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {locker.items.map((item, itemIndex) => (
                          <Badge 
                            key={item.ticket} 
                            variant="secondary"
                            className="bg-purple-50 text-purple-700 border-purple-200"
                          >
                            <Ticket className="mr-1 h-3 w-3" />
                            {item.ticket}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {locker.items.length > 0
                        ? format(
                            new Date(Math.max(...locker.items.map(item => item.timestamp.getTime()))),
                            "d 'de' MMMM 'a las' HH:mm",
                            { locale: es }
                          )
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center">
                      {locker.items.length > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLocker(locker)
                            setIsDialogOpen(true)
                          }}
                          className="gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        >
                          <Eye className="h-4 w-4" />
                          Ver detalles
                        </Button>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {locker.items.map((item, itemIndex) => (
                          <Button
                            key={item.ticket}
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsDelivered(locker.id, itemIndex, false)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 gap-2"
                          >
                            <Check className="h-4 w-4" />
                            Entregar {item.ticket}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>

      {emergencyItems.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold text-red-600">Items de Emergencia</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Fecha de Registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emergencyItems.map((item, index) => (
                <TableRow key={item.ticket}>
                  <TableCell className="font-medium">{item.ticket}</TableCell>
                  <TableCell>{item.dni}</TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{format(new Date(item.timestamp), "d 'de' MMMM 'a las' HH:mm", { locale: es })}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsDelivered(lockers[0].id, index, true)} 
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Entregar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedLocker && (
        <LockerDialog
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          locker={selectedLocker}
          onAddItem={() => {}}
          viewOnly
        />
      )}
    </motion.div>
  )
}

