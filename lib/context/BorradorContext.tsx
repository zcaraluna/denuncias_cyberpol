'use client'

import { createContext, useContext, useState } from 'react'

interface BorradorContextType {
  /** true cuando el usuario está en nueva-denuncia en paso >= 3 con al menos un denunciante */
  hayBorradorActivo: boolean
  setHayBorradorActivo: (v: boolean) => void
  /** Ruta de destino pendiente cuando el usuario intenta navegar con un borrador activo */
  pendingNavigation: string | null
  setPendingNavigation: (href: string | null) => void
}

const BorradorContext = createContext<BorradorContextType | null>(null)

export function BorradorProvider({ children }: { children: React.ReactNode }) {
  const [hayBorradorActivo, setHayBorradorActivo] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  return (
    <BorradorContext.Provider value={{
      hayBorradorActivo,
      setHayBorradorActivo,
      pendingNavigation,
      setPendingNavigation,
    }}>
      {children}
    </BorradorContext.Provider>
  )
}

export function useBorrador() {
  const ctx = useContext(BorradorContext)
  if (!ctx) throw new Error('useBorrador must be used within a BorradorProvider')
  return ctx
}
