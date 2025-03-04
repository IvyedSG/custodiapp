import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Locker } from "@/types/locker"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const TOTAL_TICKETS = 50;

// Initialize tickets from localStorage or create new arrays
function initializeTickets() {
  if (typeof window !== "undefined") { // ✅ Verifica que se ejecuta en el cliente
    const savedState = localStorage.getItem('ticketState');
    if (savedState) {
      const { available, assigned } = JSON.parse(savedState);
      return { availableTickets: available, assignedTickets: assigned };
    }
  }

  return {
    availableTickets: Array.from({ length: TOTAL_TICKETS }, (_, i) => `T-${String(i + 1).padStart(3, '0')}`),
    assignedTickets: []
  };
}


let { availableTickets, assignedTickets } = initializeTickets();

function saveTicketState() {
  localStorage.setItem('ticketState', JSON.stringify({
    available: availableTickets,
    assigned: assignedTickets
  }));
}

export function assignTicket(): string | null {
  if (availableTickets.length === 0) return null;
  const ticket = availableTickets.shift()!;
  assignedTickets.push(ticket);
  saveTicketState();
  console.log('Ticket assigned:', ticket);
  return ticket;
}

export function releaseTicket(ticket: string): void {
  const index = assignedTickets.indexOf(ticket);
  if (index !== -1) {
    assignedTickets.splice(index, 1);
    availableTickets.unshift(ticket);
    saveTicketState();
    console.log('Ticket released:', ticket);
  }
}

export function syncTicketsWithLockers(lockers: Locker[]) {
  console.log('Syncing tickets with lockers...');
  // Reset tickets
  availableTickets = Array.from({ length: TOTAL_TICKETS }, (_, i) => `T-${String(i + 1).padStart(3, '0')}`);
  assignedTickets = [];

  // Mark tickets as assigned based on locker data
  lockers.forEach(locker => {
    locker.items.forEach(item => {
      const ticketIndex = availableTickets.indexOf(item.ticket);
      if (ticketIndex !== -1) {
        const ticket = availableTickets.splice(ticketIndex, 1)[0];
        assignedTickets.push(ticket);
      }
    });
  });

  saveTicketState();
  console.log('Sync complete. Available tickets:', availableTickets.length, 'Assigned tickets:', assignedTickets.length);
}

export function getLockerStatus(itemCount: number) {
  if (itemCount === 0) return "empty";
  if (itemCount < 3) return "semi-full";
  return "full";
}

export function getStatusColor(status: string) {
  switch (status) {
    case "empty":
      return "bg-gradient-to-br from-[#2ECC71] to-[#27AE60]";
    case "semi-full":
      return "bg-gradient-to-br from-[#F1C40F] to-[#F39C12]";
    case "full":
      return "bg-gradient-to-br from-[#E74C3C] to-[#C0392B]";
    default:
      return "bg-gradient-to-br from-gray-400 to-gray-600";
  }
}

