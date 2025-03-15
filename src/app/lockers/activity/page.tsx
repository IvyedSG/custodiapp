'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { format, isEqual, isValid, startOfDay, endOfDay, parse } from 'date-fns'
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
import { Package, Lock, Check, AlertCircle, Ticket, ArrowDownToLine, ArrowUpFromLine, ClipboardList, Calendar } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { LockerDetail } from "@/types/locker"

interface ActivityEvent {
  type: 'add' | 'remove' | 'emergency';
  lockerId?: number;
  item?: LockerDetail & { location?: string; description?: string; isEmergency?: boolean };
  timestamp: Date;
}

function LockersActivityPage() {
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityEvent[]>([])
  const [activeTab, setActiveTab] = useState<string>("all")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    const loadActivities = () => {
      const savedActivities = localStorage.getItem('activities')
      if (savedActivities) {
        try {
          const parsedActivities = JSON.parse(savedActivities, (key, value) => {
            if (key === 'timestamp' && value) {
              return new Date(value)
            }
            return value
          })
          // Sort activities with newest first
          parsedActivities.sort((a: ActivityEvent, b: ActivityEvent) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          setActivities(parsedActivities)
        } catch (error) {
          console.error("Error parsing activities:", error)
          setActivities([])
        }
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

  // Filter activities based on active tab and selected date
  useEffect(() => {
    let filtered = [...activities]
    
    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter(activity => activity.type === activeTab.replace('check-in', 'add').replace('check-out', 'remove'))
    }
    
    // Filter by date if selected
    if (selectedDate && isValid(selectedDate)) {
      const startDate = startOfDay(selectedDate)
      const endDate = endOfDay(selectedDate)
      
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.timestamp)
        return activityDate >= startDate && activityDate <= endDate
      })
    }
    
    setFilteredActivities(filtered)
  }, [activities, activeTab, selectedDate])

  const handleClearDateFilter = () => {
    setSelectedDate(null)
  }

  if (activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center h-[calc(100vh-220px)] text-center space-y-4"
      >
        <ClipboardList className="h-16 w-16 text-purple-200" />
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
      className="space-y-4 h-[calc(100vh-220px)] flex flex-col overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-1">
        <h2 className="text-xl font-semibold text-purple-900">
          Registro de Actividad
          <Badge className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-200">
            {filteredActivities.length} de {activities.length} registros
          </Badge>
        </h2>
        
        <div className="flex flex-wrap gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={`flex h-9 text-xs sm:text-sm ${selectedDate ? 'bg-purple-50 border-purple-200' : ''}`}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es }) : "Filtrar por fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={selectedDate || undefined}
                onSelect={(day) => setSelectedDate(day || null)}
                locale={es}
              />
            </PopoverContent>
          </Popover>
          
          {selectedDate && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearDateFilter}
              className="h-9 px-2 text-xs sm:text-sm"
            >
              Limpiar filtro
            </Button>
          )}
          
          <Tabs defaultValue="all" className="w-full sm:w-auto" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full sm:w-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                Todos
              </TabsTrigger>
              <TabsTrigger value="check-in" className="text-xs sm:text-sm">
                Ingresos
              </TabsTrigger>
              <TabsTrigger value="check-out" className="text-xs sm:text-sm">
                Salidas
              </TabsTrigger>
              <TabsTrigger value="emergency" className="text-xs sm:text-sm">
                Emergencias
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <ScrollArea className="flex-1 rounded-md border">
        <div className="rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 bg-white">Fecha y Hora</TableHead>
                <TableHead className="sticky top-0 bg-white">Acción</TableHead>
                <TableHead className="sticky top-0 bg-white">Locker</TableHead>
                <TableHead className="sticky top-0 bg-white">Ticket</TableHead>
                <TableHead className="sticky top-0 bg-white">DNI</TableHead>
                <TableHead className="sticky top-0 bg-white">Equipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity, index) => (
                  <TableRow 
                    key={`${activity.item?.ticketCode || index}-${index}`}
                    className={
                      activity.type === 'add'
                        ? "bg-green-50/30 hover:bg-green-50/50"
                        : activity.type === 'remove'
                        ? "bg-blue-50/30 hover:bg-blue-50/50"
                        : "bg-red-50/30 hover:bg-red-50/50"
                    }
                  >
                    <TableCell className="whitespace-nowrap font-medium">
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
                            <ArrowDownToLine className="mr-1 h-3 w-3" />
                            Item guardado
                          </>
                        ) : activity.type === 'remove' ? (
                          <>
                            <ArrowUpFromLine className="mr-1 h-3 w-3" />
                            Item entregado
                          </>
                        ) : (
                          <>
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Emergencia
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>{activity.lockerId ? `#${activity.lockerId}` : 'N/A'}</TableCell>
                    <TableCell>
                      {activity.item?.ticketCode && (
                        <Badge 
                          variant="secondary"
                          className={
                            activity.type === 'add'
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : activity.type === 'remove'
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          <Ticket className="mr-1 h-3 w-3" />
                          {activity.item.ticketCode}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">
                      {activity.item?.user?.documentNumber || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {activity.item?.teamCode ? (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700">
                          {activity.item.teamCode}
                        </Badge>
                      ) : 'N/A'}
                    </TableCell>
                    {activity.type === 'emergency' && (
                      <>
                        <TableCell>{activity.item?.location || 'N/A'}</TableCell>
                        <TableCell>{activity.item?.description || 'N/A'}</TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No se encontraron registros para los filtros seleccionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </motion.div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center">
        <div className="text-purple-600 animate-pulse">Cargando registros...</div>
      </div>
    }>
      <LockersActivityPage />
    </Suspense>
  );
}