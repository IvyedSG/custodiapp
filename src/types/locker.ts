export interface LockerItem {
    dni: string
    ticket: string
    timestamp: Date
  }
  
  export interface Locker {
    id: number
    items: LockerItem[]
  }
  
  export const MAX_ITEMS = 3
  
  