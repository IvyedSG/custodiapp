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
import { Lock, Unlock, Package, Eye, Check, Ticket, Loader2 } from 'lucide-react'
import { LockerDialog } from '@/components/lockers/locker-dialog'
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Locker } from "@/types/locker"
import { getLockerStatus } from "@/lib/utils"
import { useLockers } from "@/hooks/use-lockers"

// Define a proper type for emergency items instead of using 'any'
interface EmergencyItem {
  ticket: string
  dni: string
  location: string
  description: string
  timestamp: string | Date
}

export default function LockersStatusPage() {
  const { lockers, optimisticCheckOut } = useLockers();
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [emergencyItems, setEmergencyItems] = useState<EmergencyItem[]>([])
  const [loadingDeliveries, setLoadingDeliveries] = useState<{[key: string]: boolean}>({})
  const [isAnyDeliveryInProgress, setIsAnyDeliveryInProgress] = useState(false)

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

  const handleMarkAsDelivered = async (lockerId: number, itemIndex: number, isEmergency: boolean = false) => {
    const deliveryKey = isEmergency ? `emergency-${itemIndex}` : `locker-${lockerId}-${itemIndex}`;
    setLoadingDeliveries(prev => ({ ...prev, [deliveryKey]: true }));
    setIsAnyDeliveryInProgress(true);
    
    try {
      if (isEmergency) {
        const updatedEmergencyItems = [...emergencyItems];
        const deliveredItem = updatedEmergencyItems[itemIndex];
        
        const activities = JSON.parse(localStorage.getItem('activities') || '[]');
        activities.unshift({
          type: 'remove',
          item: deliveredItem,
          timestamp: new Date(),
          isEmergency: true
        });
        localStorage.setItem('activities', JSON.stringify(activities));
        
        updatedEmergencyItems.splice(itemIndex, 1);
        setEmergencyItems(updatedEmergencyItems);
        localStorage.setItem('emergencyItems', JSON.stringify(updatedEmergencyItems));
      } else {
        const ticketToCheckout = lockers?.find(locker => locker.id === lockerId)?.lockerDetails[itemIndex]?.ticketCode;
        
        if (!ticketToCheckout) {
          console.error("No se encontró el ticket para hacer checkout");
          return;
        }
        
        // Apply optimistic update first
        optimisticCheckOut(lockerId, ticketToCheckout);
        
        // Store delivered item in activities
        const locker = lockers?.find(l => l.id === lockerId);
        if (locker) {
          const deliveredItem = locker.lockerDetails[itemIndex];
          const activities = JSON.parse(localStorage.getItem('activities') || '[]');
          activities.unshift({
            type: 'remove',
            lockerId: locker.id,
            item: deliveredItem,
            timestamp: new Date()
          });
          localStorage.setItem('activities', JSON.stringify(activities));
        }
        
        // Now perform the actual API call
        const sessionId = localStorage.getItem("sessionId");
        const jwt = localStorage.getItem("jwt");

        if (!sessionId || !jwt) {
          console.error("No sessionId o jwt encontrados");
          return;
        }

        const response = await fetch(
          `https://cdv-custody-api.onrender.com/cdv-custody/api/v1/lockers/${lockerId}/transactions/check-out`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Session-id": sessionId,
              Authorization: `Bearer ${jwt}`,
            },
            body: JSON.stringify([ticketToCheckout]),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error en el checkout:", errorText);
          throw new Error("Error al entregar el item");
        }
        
        // Refresh data in the background to ensure consistency
        setTimeout(() => {
          window.dispatchEvent(new Event('lockersUpdated'));
        }, 1000);
      }
    } catch (error) {
      console.error("Error al entregar el item:", error);
      // Refresh on error to restore correct state
      window.dispatchEvent(new Event('lockersUpdated'));
    } finally {
      setLoadingDeliveries(prev => ({ ...prev, [deliveryKey]: false }));
      setIsAnyDeliveryInProgress(false);
    }
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
            Semi
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
              {(lockers ?? []).map((locker) => {
                const status = getLockerStatus(locker.lockerDetails.length)
                const isLockerDeliveryInProgress = locker.lockerDetails.some((_, itemIndex) => 
                  loadingDeliveries[`locker-${locker.id}-${itemIndex}`]
                );
                
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
                        {locker.lockerDetails.map((item) => (
                          <Badge 
                            key={item.ticketCode} 
                            variant="secondary"
                            className="bg-purple-50 text-purple-700 border-purple-200"
                          >
                            <Ticket className="mr-1 h-3 w-3" />
                            {item.ticketCode}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {locker.lockerDetails.length > 0
                        ? format(
                            new Date(Math.max(...locker.lockerDetails.map(item => new Date(item.inTime).getTime()))),
                            "d 'de' MMMM 'a las' HH:mm",
                            { locale: es }
                          )
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center">
                      {locker.lockerDetails.length > 0 ? (
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
                      <div className="flex flex-wrap justify-center gap-2 min-w-[240px]">
                        {locker.lockerDetails.map((item, itemIndex) => {
                          const deliveryKey = `locker-${locker.id}-${itemIndex}`;
                          const isLoading = loadingDeliveries[deliveryKey];
                          
                          return (
                            <Button
                              key={item.ticketCode}
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsDelivered(locker.id, itemIndex, false)}
                              disabled={isLoading || (isAnyDeliveryInProgress && !isLoading)}
                              className={`bg-green-100 border-green-300 text-green-800 hover:bg-green-200 hover:text-green-900 w-[70px] h-[36px] ${
                                isAnyDeliveryInProgress && !isLoading ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Check className="h-4 w-4" />
                                  <span className="text-xs font-bold">{item.ticketCode}</span>
                                </div>
                              )}
                            </Button>
                          );
                        })}
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
              {emergencyItems.map((item, index) => {
                const deliveryKey = `emergency-${index}`;
                const isLoading = loadingDeliveries[deliveryKey];
                
                return (
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
                        onClick={() => handleMarkAsDelivered(0, index, true)}
                        disabled={isLoading || (isAnyDeliveryInProgress && !isLoading)}
                        className={`text-green-600 hover:text-green-700 hover:bg-green-50 ${
                          isAnyDeliveryInProgress && !isLoading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Entregando...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Entregar
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
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

