'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import LeadModal from './LeadModal'

interface ModalContextType {
  openModal: () => void
  closeModal: () => void
}

const ModalContext = createContext<ModalContextType>({
  openModal: () => {},
  closeModal: () => {},
})

export function useModal() {
  return useContext(ModalContext)
}

export default function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = useCallback(() => setIsOpen(true), [])
  const closeModal = useCallback(() => setIsOpen(false), [])

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {isOpen && <LeadModal onClose={closeModal} />}
    </ModalContext.Provider>
  )
}
