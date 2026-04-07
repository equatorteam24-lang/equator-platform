import { useState } from 'react'
import Modal from './Modal.jsx'

const LOGO_URL = 'https://www.figma.com/api/mcp/asset/27a5afbe-3022-44d7-b205-43cb233220e7'

export default function Header({ content = {} }) {
  const [showModal, setShowModal] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const phone = content.phone || '+38 (097) 095-00-29'
  const telegramUrl = content.telegramUrl || 'https://t.me/'
  const callbackBtnText = content.callbackBtnText || 'Передзвоніть мені'

  function scrollTo(id) {
    setMenuOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <header style={S.header}>
        <div style={S.inner}>
          {/* Logo */}
          <div style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={LOGO_URL} alt="Дочки та Синочки" style={{ height: 70, objectFit: 'contain', display: 'block' }} />
          </div>

          {/* Nav desktop */}
          <nav className="header-nav" style={S.nav}>
            {[['about','Про нас'],['programs','Програми'],['reviews','Відгуки'],['contact','Контакти']].map(([id,label]) => (
              <button key={id} style={S.navLink} onClick={() => scrollTo(id)}
                onMouseEnter={e => e.currentTarget.style.color = '#7B6EF6'}
                onMouseLeave={e => e.currentTarget.style.color = '#090909'}>
                {label}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="header-actions" style={S.actions}>
            <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} style={{ display: 'inline-flex', textDecoration: 'none' }} title="Зателефонувати">
              <span style={{ ...S.iconCircle, background: '#A9D13D' }}><PhoneIcon /></span>
            </a>
            <a href={telegramUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', textDecoration: 'none' }} title="Telegram">
              <span style={{ ...S.iconCircle, background: '#FF696F' }}><TelegramIcon /></span>
            </a>
            <button className="btn-outline" onClick={() => setShowModal(true)}>{callbackBtnText}</button>
          </div>

          {/* Burger */}
          <button className="header-burger" style={S.burger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Меню">
            <span style={{ ...S.burgerLine, transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
            <span style={{ ...S.burgerLine, opacity: menuOpen ? 0 : 1 }} />
            <span style={{ ...S.burgerLine, transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
          </button>
        </div>

        {/* Mobile menu */}
        <div className="header-mobile-menu" style={{ ...S.mobileMenu, display: menuOpen ? 'flex' : 'none' }}>
          {[['about','Про нас'],['programs','Програми'],['reviews','Відгуки'],['contact','Контакти']].map(([id,label]) => (
            <button key={id} style={S.mobileLink} onClick={() => scrollTo(id)}>{label}</button>
          ))}
          <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} style={{ ...S.mobileLink, color: '#7B6EF6', fontWeight: 700, textDecoration: 'none' }}>{phone}</a>
          <button className="btn-yellow" onClick={() => { setMenuOpen(false); setShowModal(true) }} style={{ marginTop: 8 }}>{callbackBtnText}</button>
        </div>
      </header>

      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </>
  )
}

function PhoneIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
}

function TelegramIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
}

const S = {
  header: { position: 'sticky', top: 0, zIndex: 100, background: 'white', boxShadow: '0 1px 0 rgba(0,0,0,0.08)' },
  inner: { maxWidth: 1160, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 88, gap: 32 },
  nav: { display: 'flex', gap: 32, flexGrow: 1, justifyContent: 'center' },
  navLink: { background: 'none', border: 'none', fontFamily: 'Onest, sans-serif', fontWeight: 500, fontSize: 16, color: '#090909', cursor: 'pointer', padding: '4px 0', transition: 'color 0.2s' },
  actions: { display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 },
  iconCircle: { width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  burger: { display: 'none', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 4 },
  burgerLine: { display: 'block', width: 24, height: 2, background: '#090909', borderRadius: 2, transition: 'all 0.3s' },
  mobileMenu: { flexDirection: 'column', gap: 4, padding: '16px 20px 24px', borderTop: '1px solid #eee', background: 'white' },
  mobileLink: { background: 'none', border: 'none', fontFamily: 'Onest, sans-serif', fontWeight: 500, fontSize: 17, color: '#090909', cursor: 'pointer', textAlign: 'left', padding: '12px 0', borderBottom: '1px solid #F9FAFB', width: '100%' },
}
