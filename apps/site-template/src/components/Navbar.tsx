'use client'

import { useState, useEffect } from 'react'
import { useModal } from './ModalProvider'

const LOGO_TOP = 'https://www.figma.com/api/mcp/asset/bfe0c37b-7671-486d-a6ac-92d91dc43b4e'
const LOGO_WORK = 'https://www.figma.com/api/mcp/asset/cdf4e1d2-6493-47e1-abc1-d735ce5f774b'

const navLinks = [
  { label: 'Про компанію', href: '#about' },
  { label: 'Послуги', href: '#services' },
  { label: 'Наші роботи', href: '#works' },
  { label: 'Знижки для військових', href: '#military' },
  { label: 'Контакти', href: '#contacts' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { openModal } = useModal()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled || menuOpen ? 'bg-[#0d0d0d] shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1160px] mx-auto px-5 lg:px-0 flex items-center justify-between h-[72px] border-b border-white/15">
          {/* Logo */}
          <a href="#" className="relative flex-shrink-0 w-[100px] h-[37px]">
            <img src={LOGO_TOP} alt="Roofing" className="absolute top-0 left-0 h-[23px] w-auto" />
            <img src={LOGO_WORK} alt="Work" className="absolute bottom-0 left-[31px] h-[15px] w-auto" />
          </a>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-10 font-body font-medium text-base text-white">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-[#fe4f18] transition-colors whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <button
            onClick={openModal}
            className="hidden lg:flex items-center gap-2 bg-[#fe4f18] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#e0400e] transition-colors"
          >
            Отримати консультацію
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="lg:hidden flex flex-col gap-1.5 w-9 h-9 items-center justify-center"
            aria-label="Меню"
          >
            <span className={`block h-0.5 w-6 bg-white transition-transform duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-0.5 w-6 bg-white transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-6 bg-white transition-transform duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-[#0d0d0d] pt-[72px] flex flex-col">
          <nav className="flex flex-col gap-0 font-body font-medium text-lg text-white border-t border-white/10">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-6 py-5 border-b border-white/10 hover:text-[#fe4f18] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="px-6 pt-6">
            <button
              onClick={() => { setMenuOpen(false); openModal() }}
              className="w-full bg-[#fe4f18] text-white py-4 rounded-full font-medium text-base hover:bg-[#e0400e] transition-colors"
            >
              Отримати консультацію
            </button>
          </div>
        </div>
      )}
    </>
  )
}
