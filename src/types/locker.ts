export interface LockerItem {
    dni: string
    ticket: string
    timestamp: Date
  }
  
  export interface User {
    id: number
    firstName: string
    lastName: string
    phoneNumber: string
    documentNumber: string
  }
  
  export interface LockerDetail {
    id: number
    teamName: string
    itemDescription: string | null
    inTime: string
    outTime: string | null
    ticketCode: string
    user: User
  }
  
  export interface Locker {
    id: number
    code: string
    type: string
    capacity: number
    currentItems: number
    description: string | null
    position: number
    status: string
    campus: string
    isActive: boolean
    lockerDetails: LockerDetail[]
  }
  
  export const MAX_ITEMS = 3

