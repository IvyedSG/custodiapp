"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, Loader2, CheckCircle, ArrowLeft, AlertCircle, Search } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Service {
  id: number
  name: string
  startTime: string
  endTime: string | null
  status: string
  campus: string
  isActive: boolean
  updatedAt: string
}

interface User {
  id: number
  firstName: string
  lastName: string
  phoneNumber: string
  documentNumber: string
  birthday: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

export function ServiceSelector() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingServices, setIsLoadingServices] = useState(true)
  const [isLoadingUser, setIsLoadingUser] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userError, setUserError] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState("")
  const [dni, setDni] = useState("")
  const [user, setUser] = useState<User | null>(null)
  const [isUserSelected, setIsUserSelected] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoadingServices(true)
      setError(null)

      try {
        const response = await fetch(
          "https://cdv-custody-api.onrender.com/cdv-custody/api/v1/schedules/active?campus=SURCO",
        )

        if (!response.ok) {
          throw new Error("Error al cargar los servicios")
        }

        const data = await response.json()
        setServices(data)
      } catch (err) {
        console.error("Error fetching services:", err)
        setError("No se pudieron cargar los servicios. Por favor, intenta de nuevo.")
      } finally {
        setIsLoadingServices(false)
      }
    }

    fetchServices()
  }, [])

  useEffect(() => {
    
    if (dni.length >= 7) {
      fetchUser(dni)
    } else {
      setUser(null)
      setIsUserSelected(false)
      setUserError(null)
    }
  }, [dni])

  const fetchUser = async (documentNumber: string) => {
    setIsLoadingUser(true)
    setUserError(null)

    try {
      const response = await fetch(
        `https://cdv-custody-api.onrender.com/cdv-custody/api/v1/users/search?searchValue=${documentNumber}`,
      )

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            documentNumber.length === 8
              ? "No se encontró ningún encargado con ese DNI"
              : "No se encontraron coincidencias",
          )
        }
        throw new Error("Error al buscar el encargado")
      }

      const data = await response.json()
      setUser(data)

   
      if (documentNumber.length === 8 && data.documentNumber === documentNumber) {
        setIsUserSelected(true)
      } else {
        setIsUserSelected(false)
      }
    } catch (err) {
      console.error("Error fetching user:", err)
      setUserError((err as Error).message || "No se pudo encontrar el encargado")
      setUser(null)
    } finally {
      setIsLoadingUser(false)
    }
  }

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(":")
      const hour = Number.parseInt(hours)

      if (hour < 12) {
        return `${hour}:${minutes} AM`
      } else if (hour === 12) {
        return `12:${minutes} PM`
      } else {
        return `${hour - 12}:${minutes} PM`
      }
    } catch (e) {
      return timeString
    }
  }

  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value.length <= 8) {
      setDni(value)
    }
  }

  const handleSelectUser = () => {
    setIsUserSelected(true)
  }

  const selectedServiceDetails = services.find((service) => service.id.toString() === selectedService)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(
        `https://cdv-custody-api.onrender.com/cdv-custody/api/v1/schedules/${selectedService}/transactions/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ documentNumber: dni }),
        },
      )

      if (!response.ok) {
        throw new Error("Error al comenzar el servicio")
      }

      const data = await response.json()
      setSessionId(data.sessionId)

    
      localStorage.setItem("sessionId", data.sessionId)
      localStorage.setItem("selectedService", selectedService)


      const serviceName = selectedServiceDetails?.name || ""
      localStorage.setItem("selectedServiceName", serviceName)

      
      localStorage.setItem("selectedStaff", `${user?.firstName} ${user?.lastName}`)

      router.push(`/lockers?service=${serviceName}&staff=${user?.firstName} ${user?.lastName}`)
    } catch (err) {
      console.error("Error submitting form:", err)
      setError("Ocurrió un error al procesar tu solicitud.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="flex h-[calc(100vh-8rem)] w-full max-w-2xl flex-col space-y-4">
        <div className="space-y-2">
          <Progress value={step === 1 ? 50 : 100} className="h-2" />
          <div className="flex justify-between px-1 text-sm text-muted-foreground">
            <span className={step === 1 ? "font-medium text-purple-600" : ""}>Seleccionar Horario</span>
            <span className={step === 2 ? "font-medium text-purple-600" : ""}>Asignar Encargado</span>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
                      {isLoadingServices ? (
                        <div className="flex h-40 items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        </div>
                      ) : services.length === 0 ? (
                        <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                          <AlertCircle className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No hay servicios disponibles en este momento.</p>
                        </div>
                      ) : (
                        <RadioGroup value={selectedService} onValueChange={setSelectedService} className="grid gap-3">
                          {services.map((service, index) => (
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
                                  value={service.id.toString()}
                                  id={`service-${service.id}`}
                                  className="mt-0"
                                />
                                <motion.div
                                  className="ml-4 grid gap-1"
                                  initial={false}
                                  animate={{ opacity: selectedService === service.id.toString() ? 1 : 0.7 }}
                                >
                                  <div className="flex items-center gap-2 font-medium">
                                    <Clock className="h-4 w-4 text-purple-600" />
                                    {service.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Horario: {formatTime(service.startTime)}
                                  </div>
                                </motion.div>
                              </Label>
                            </motion.div>
                          ))}
                        </RadioGroup>
                      )}
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
                        <span>
                          {selectedServiceDetails?.name} -{" "}
                          {selectedServiceDetails?.startTime ? formatTime(selectedServiceDetails.startTime) : ""}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dni">DNI del Encargado</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="dni"
                          value={dni}
                          onChange={handleDniChange}
                          className="bg-white pl-9"
                          placeholder="Ingresa el DNI (7-8 dígitos)"
                          maxLength={8}
                          required
                          disabled={isUserSelected}
                        />
                        {isLoadingUser && (
                          <div className="absolute right-3 top-3">
                            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                          </div>
                        )}
                      </div>

                      {dni.length > 0 && dni.length < 7 && (
                        <p className="mt-1 text-xs text-muted-foreground">Ingresa al menos 7 dígitos para buscar</p>
                      )}

                      {userError && <p className="mt-2 text-sm text-red-500">{userError}</p>}

                      {user && !isUserSelected && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 rounded-lg border bg-white p-3"
                        >
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">DNI: {user.documentNumber}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              {dni.length === 7 && (
                                <p className="mt-1 text-xs text-amber-600">
                                  Coincidencia parcial - Confirma que sea el encargado correcto
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={handleSelectUser}
                              className="bg-purple-600 text-white hover:bg-purple-700"
                            >
                              Seleccionar
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {isUserSelected && user && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-2 rounded-lg bg-green-50 p-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <p className="font-medium text-green-800">
                                  {user.firstName} {user.lastName}
                                </p>
                              </div>
                              <p className="text-sm text-green-700">DNI: {user.documentNumber}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setIsUserSelected(false)
                                setDni("")
                                setUser(null)
                              }}
                              className="h-8 border-green-200 hover:bg-green-100"
                            >
                              Cambiar
                            </Button>
                          </div>
                        </motion.div>
                      )}
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
              disabled={!selectedService || isLoadingServices}
            >
              Siguiente
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="w-full">
              <Button
                type="submit"
                className="w-full bg-purple-600 text-white transition-all hover:bg-purple-700"
                disabled={isLoading || !isUserSelected}
              >
                {isLoading ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando...
                  </motion.div>
                ) : (
                  "Comenzar Servicio"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}