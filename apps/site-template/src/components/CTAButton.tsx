'use client'

import { useModal } from './ModalProvider'

interface CTAButtonProps {
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'outline'
}

export default function CTAButton({ children, className = '', variant = 'primary' }: CTAButtonProps) {
  const { openModal } = useModal()

  const base = 'inline-flex items-center gap-2 px-6 py-4 rounded-full font-medium text-base transition-colors cursor-pointer'
  const variants = {
    primary: 'bg-[#fe4f18] text-white hover:bg-[#e0400e]',
    outline: 'bg-white text-[#090909] hover:bg-gray-100',
  }

  return (
    <button onClick={openModal} className={`${base} ${variants[variant]} ${className}`}>
      {children}
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}
