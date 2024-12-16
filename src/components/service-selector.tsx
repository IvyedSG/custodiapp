'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, Loader2, User, CheckCircle, ArrowLeft } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"

const SERVICES = [
  { id: "1", name: "Primer Servicio", time: "8:00 AM" },
  { id: "2", name: "Segundo Servicio", time: "9:30 AM" },
  { id: "3", name: "Tercer Servicio", time: "11:30 AM" },
  { id: "4", name: "Cuarto Servicio", time: "1:30 PM" },
  { id: "5", name: "Quinto Servicio", time: "7:00 PM" },
]

export function ServiceSelector() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedService, setSelectedService] = useState("")
  const [staffName, setStaffName] = useState("")
  const router = useRouter()

  const selectedServiceDetails = SERVICES.find(service => service.id === selectedService)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    router.push(`/lockers?service=${selectedService}&staff=${staffName}`)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] w-full max-w-2xl flex-col space-y-4">
      <div className="space-y-2">
        <Progress value={step === 1 ? 50 : 100} className="h-2" />
        <div className="flex justify-between px-1 text-sm text-muted-foreground">
          <span className={step === 1 ? "font-medium text-purple-600" : ""}>
            Seleccionar Horario
          </span>
          <span className={step === 2 ? "font-medium text-purple-600" : ""}>
            Asignar Encargado
          </span>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden border-none bg-white/90 shadow-lg backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-white/50 pb-4 pt-3">
          <CardTitle className="text-lg font-medium">
            {step === 1 ? "Selecciona un Horario" : "Asignar Encargado"}
          </CardTitle>
          {step === 2 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(1)}
              className="h-8 px-2 text-muted-foreground hover:text-purple-600"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Regresar
            </Button>
          )}
        </CardHeader>

        <CardContent className="relative flex-1 p-0">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <ScrollArea className="h-[calc(100vh-20rem)]">
                  <div className="space-y-3 p-6">
                    <RadioGroup
                      value={selectedService}
                      onValueChange={setSelectedService}
                      className="grid gap-3"
                    >
                      {SERVICES.map((service, index) => (
                        <motion.div
                          key={service.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Label
                            htmlFor={`service-${service.id}`}
                            className="group relative flex cursor-pointer items-center rounded-lg border bg-white p-4 hover:bg-purple-50 [&:has(:checked)]:border-purple-600 [&:has(:checked)]:bg-purple-50"
                          >
                            <RadioGroupItem
                              value={service.id}
                              id={`service-${service.id}`}
                              className="mt-0"
                            />
                            <motion.div
                              className="ml-4 grid gap-1"
                              initial={false}
                              animate={{ opacity: selectedService === service.id ? 1 : 0.7 }}
                            >
                              <div className="flex items-center gap-2 font-medium">
                                <Clock className="h-4 w-4 text-purple-600" />
                                {service.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Horario: {service.time}
                              </div>
                            </motion.div>
                          </Label>
                        </motion.div>
                      ))}
                    </RadioGroup>
                  </div>
                </ScrollArea>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full p-6"
              >
                <div className="flex h-full flex-col gap-6">
                  <div className="rounded-lg bg-purple-50 p-4">
                    <h3 className="mb-2 font-medium">Servicio Seleccionado</h3>
                    <div className="flex items-center gap-2 text-sm text-purple-700">
                      <CheckCircle className="h-4 w-4" />
                      <span>{selectedServiceDetails?.name} - {selectedServiceDetails?.time}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff">Nombre del Encargado</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="staff"
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        className="bg-white pl-9"
                        placeholder="Ingresa el nombre del encargado"
                        required
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        {step === 1 ? (
          <Button
            type="button"
            className="w-full bg-purple-600 text-white transition-all hover:bg-purple-700 disabled:opacity-50"
            onClick={() => setStep(2)}
            disabled={!selectedService}
          >
            Siguiente
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="w-full">
            <Button
              type="submit"
              className="w-full bg-purple-600 text-white transition-all hover:bg-purple-700"
              disabled={isLoading || !staffName}
            >
              {isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </motion.div>
              ) : (
                "Continuar a Casilleros"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

