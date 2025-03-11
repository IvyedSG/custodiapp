'use client'

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Grid2X2, Search, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { TicketStatusDialog } from "@/components/tickets/ticket-status-dialog";
import type { Locker } from '@/types/locker';

interface TicketSearchProps {
  lockers: Locker[];
  onEmergencyRegistration: () => void;
}

export function TicketSearch({ lockers, onEmergencyRegistration }: TicketSearchProps) {
  const [searchValue, setSearchValue] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showStatus, setShowStatus] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchValue) return;

    // Change from padStart to just use the number value directly
    const ticketNumber = searchValue; // Remove padding
    const ticket = `TS-${ticketNumber}`;
    
    setIsSearching(true);
    
    try {
      const sessionId = localStorage.getItem("sessionId");
      const jwt = localStorage.getItem("jwt");

      if (!sessionId || !jwt) {
        console.error("No sessionId or jwt found");
        setAlertMessage("Error: No hay sesión activa");
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
        return;
      }

      // Llamar al API para buscar el ticket
      const response = await fetch(
        `https://cdv-custody-api.onrender.com/cdv-custody/api/v1/tickets/transaction?ticketCode=${ticket}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Session-id": sessionId,
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setAlertMessage(`Ticket ${ticket} no encontrado`);
        } else {
          const errorText = await response.text();
          console.error("Error buscando ticket:", errorText);
          setAlertMessage(`Error al buscar ticket ${ticket}`);
        }
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
        return;
      }

      const data = await response.json();
      
      // Extraer el número de locker del código (LS-1 -> 1)
      const lockerNumber = data.lockerCode.split("-")[1];
      
      setAlertMessage(
        `Ticket ${ticket} encontrado en Locker ${lockerNumber} - DNI: ${data.user.documentNumber}`
      );
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      
    } catch (err) {
      console.error("Error en la búsqueda del ticket:", err);
      setAlertMessage(`Error al buscar ticket ${ticket}`);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } finally {
      setIsSearching(false);
      setSearchValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 3) {
      setSearchValue(value);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-2">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
            ) : (
              <Search className="h-4 w-4 text-purple-400" />
            )}
          </div>
          <div className="absolute inset-y-0 left-9 flex items-center">
            <span className="font-medium text-purple-500">TS-</span>
          </div>
          <Input
            type="text"
            value={searchValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="w-[120px] border-2 border-purple-100 pl-16 font-mono shadow-sm transition-colors placeholder:text-purple-300 focus:border-purple-500 focus:ring-purple-500"
            placeholder="001"
            disabled={isSearching}
          />
        </div>
        <Button 
          onClick={handleSearch}
          disabled={!searchValue || isSearching}
          className="bg-purple-600 font-medium text-white shadow-sm transition-all hover:bg-purple-700"
        >
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Buscando...
            </>
          ) : (
            "Buscar"
          )}
        </Button>
      </div>

      <Button
        variant="outline"
        onClick={() => setShowStatus(true)}
        className="border-2 border-purple-200 font-medium text-purple-700 shadow-sm transition-all hover:bg-purple-50"
      >
        <Grid2X2 className="mr-2 h-4 w-4" />
        Estado de Tickets
      </Button>

      <Button
        variant="outline"
        className="gap-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
        onClick={onEmergencyRegistration}
      >
        <AlertCircle className="h-4 w-4" />
        Registro de Emergencia
      </Button>

      {/* Alert */}
      <Alert
        className={cn(
          "fixed left-1/2 top-4 z-50 w-auto -translate-x-1/2 border-2 border-purple-100 bg-white shadow-lg transition-all duration-300",
          showAlert ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {alertMessage}
      </Alert>

      {/* Status Dialog */}
      <TicketStatusDialog 
        open={showStatus} 
        onOpenChange={setShowStatus}
        lockers={lockers}
      />
    </div>
  )
}

