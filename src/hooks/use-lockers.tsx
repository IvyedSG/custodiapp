"use client"

import { useState, useEffect, useCallback } from "react"
import useSWR from "swr"
import type { Locker, LockerDetail, User } from "@/types/locker"

// Función para generar lockers de placeholder mientras se cargan los reales
const generatePlaceholderLockers = (count: number): Locker[] => {
  return Array(count)
    .fill(null)
    .map((_, index) => ({
      id: index + 1,
      code: `LS-${index + 1}`,
      type: "LOCKER",
      capacity: 3,
      currentItems: 0,
      description: null,
      position: index + 1,
      status: "AVAILABLE",
      campus: "SURCO",
      isActive: true,
      lockerDetails: [],
    }))
}

// Función para cargar lockers desde localStorage si existen
const getLocalLockers = (): Locker[] | null => {
  if (typeof window === "undefined") return null

  const cached = localStorage.getItem("lockers")
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch (e) {
      console.error("Error parsing cached lockers:", e)
    }
  }
  return null
}

// Fetcher para SWR
const fetchLockers = async (): Promise<Locker[]> => {
  const sessionId = localStorage.getItem("sessionId")
  const jwt = localStorage.getItem("jwt")

  if (!sessionId || !jwt) {
    throw new Error("No sessionId or jwt found")
  }

  const response = await fetch(
    "https://cdv-custody-api.onrender.com/cdv-custody/api/v1/lockers/active/with-details?campus=SURCO",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Session-id": sessionId,
        Authorization: `Bearer ${jwt}`,
      },
      // Añadir cache: 'no-store' para evitar el caché del navegador
      cache: "no-store",
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Error response text:", errorText)
    throw new Error("Error fetching lockers")
  }

  const data = await response.json()

  // Guardar en localStorage para acceso rápido en futuras cargas
  localStorage.setItem("lockers", JSON.stringify(data))

  return data
}

// TypeScript interface for check-in item
interface CheckInItem {
  documentNumber: number | string;
  teamCode: string;
  ticketCode: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export function useLockers() {
  // Usar datos locales como fallback inicial
  const [initialData] = useState<Locker[]>(() => getLocalLockers() || generatePlaceholderLockers(24))

  const { data, error, isLoading, isValidating, mutate } = useSWR<Locker[]>("lockers", fetchLockers, {
    fallbackData: initialData,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000, // 5 segundos
    focusThrottleInterval: 10000, // 10 segundos
  })

  // Optimistic updates function
  const optimisticCheckIn = useCallback((lockerId: number, item: CheckInItem) => {
    mutate(
      (currentLockers: Locker[] | undefined) => {
        if (!currentLockers) return currentLockers;
        
        return currentLockers.map(locker => {
          if (locker.id === lockerId) {
            // Create a new locker detail entry that matches LockerDetail type
            const newDetail: LockerDetail = {
              transactionId: Math.floor(Math.random() * 1000000), // Generate a temporary ID
              lockerCode: locker.code,
              teamCode: item.teamCode,
              teamName: item.teamCode,
              itemDescription: null,
              inTime: new Date().toISOString(),
              outTime: null,
              ticketCode: item.ticketCode,
              user: {
                id: 0, // Temporary ID
                documentNumber: typeof item.documentNumber === 'number' 
                  ? item.documentNumber.toString() 
                  : item.documentNumber,
                firstName: item.firstName || "Usuario",
                lastName: item.lastName || "",
                phoneNumber: item.phoneNumber || "",
              },
            };
            
            // Add to locker details and increment currentItems
            return {
              ...locker,
              lockerDetails: [...locker.lockerDetails, newDetail],
              currentItems: (locker.currentItems || locker.lockerDetails.length) + 1
            };
          }
          return locker;
        });
      },
      false // Don't revalidate immediately
    );
    
    // Save to localStorage for persistence
    if (data) {
      const updatedLockers = data.map(locker => {
        if (locker.id === lockerId) {
          const newDetail: LockerDetail = {
            transactionId: Math.floor(Math.random() * 1000000), // Generate a temporary ID
            lockerCode: locker.code,
            teamCode: item.teamCode,
            teamName: item.teamCode,
            itemDescription: null,
            inTime: new Date().toISOString(),
            outTime: null,
            ticketCode: item.ticketCode,
            user: {
              id: 0, // Temporary ID
              documentNumber: typeof item.documentNumber === 'number' 
                ? item.documentNumber.toString() 
                : item.documentNumber,
              firstName: item.firstName || "Usuario",
              lastName: item.lastName || "",
              phoneNumber: item.phoneNumber || "",
            },
          };
          
          return {
            ...locker,
            lockerDetails: [...locker.lockerDetails, newDetail],
            currentItems: (locker.currentItems || locker.lockerDetails.length) + 1
          };
        }
        return locker;
      });
      
      localStorage.setItem("lockers", JSON.stringify(updatedLockers));
    }
  }, [data, mutate]);
  
  const optimisticCheckOut = useCallback((lockerId: number, ticketCode: string) => {
    mutate(
      (currentLockers: Locker[] | undefined) => {
        if (!currentLockers) return currentLockers;
        
        return currentLockers.map(locker => {
          if (locker.id === lockerId) {
            const itemIndex = locker.lockerDetails.findIndex(item => item.ticketCode === ticketCode);
            
            if (itemIndex >= 0) {
              // Remove the item from locker details
              const updatedDetails = [...locker.lockerDetails];
              updatedDetails.splice(itemIndex, 1);
              
              return {
                ...locker,
                lockerDetails: updatedDetails,
                currentItems: Math.max(0, (locker.currentItems || locker.lockerDetails.length) - 1)
              };
            }
          }
          return locker;
        });
      },
      false // Don't revalidate immediately
    );
    
    // Save to localStorage for persistence
    if (data) {
      const updatedLockers = data.map(locker => {
        if (locker.id === lockerId) {
          const itemIndex = locker.lockerDetails.findIndex(item => item.ticketCode === ticketCode);
          
          if (itemIndex >= 0) {
            const updatedDetails = [...locker.lockerDetails];
            updatedDetails.splice(itemIndex, 1);
            
            return {
              ...locker,
              lockerDetails: updatedDetails,
              currentItems: Math.max(0, (locker.currentItems || locker.lockerDetails.length) - 1)
            };
          }
        }
        return locker;
      });
      
      localStorage.setItem("lockers", JSON.stringify(updatedLockers));
    }
  }, [data, mutate]);

  // Escuchar eventos de actualización
  useEffect(() => {
    const handleLockersUpdated = () => {
      mutate();
    }

    window.addEventListener("lockersUpdated", handleLockersUpdated);

    return () => {
      window.removeEventListener("lockersUpdated", handleLockersUpdated);
    }
  }, [mutate]);

  return {
    lockers: data,
    isLoading: isLoading && !data,
    isRefreshing: isValidating,
    error,
    mutate,
    optimisticCheckIn,
    optimisticCheckOut,
  }
}