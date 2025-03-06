"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Loader2 } from 'lucide-react'
import { assignTicket } from "@/lib/utils"

interface EmergencyRegistrationDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function EmergencyRegistrationDialog({ isOpen, setIsOpen }: EmergencyRegistrationDialogProps) {
  const [dni, setDni] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const ticket = assignTicket()
    if (!ticket) {
      alert("No hay tickets disponibles")
      setIsLoading(false)
      return
    }

    const newItem = {
      dni,
      ticket,
      location,
      description,
      timestamp: new Date(),
      isEmergency: true
    }

  
    const emergencyItems = JSON.parse(localStorage.getItem('emergencyItems') || '[]')
    emergencyItems.push(newItem)
    localStorage.setItem('emergencyItems', JSON.stringify(emergencyItems))

   
    const activities = JSON.parse(localStorage.getItem('activities') || '[]')
    activities.unshift({
      type: 'emergency',
      item: newItem,
      timestamp: new Date()
    })
    localStorage.setItem('activities', JSON.stringify(activities))

   
    await new Promise(resolve => setTimeout(resolve, 1000))

    setIsLoading(false)
    setDni("")
    setLocation("")
    setDescription("")
    setIsOpen(false)

    
    window.dispatchEvent(new Event('emergencyItemAdded'))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Registro de Emergencia
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dni">DNI</Label>
            <Input
              id="dni"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ingrese el DNI"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Ubicación</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ingrese la ubicación"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ingrese una descripción"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Registrar Item de Emergencia"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

