import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────
// ВАНТАЖНІ ПЕРЕВЕЗЕННЯ — Logistics Transport One-Pager
// Structural DNA: Chapter Gates
// Palette: #0F0F0F (ink), #D4A843 (amber), #F5F2ED (parchment), #1C1C1C (charcoal)
// Fonts: Syne (display), IBM Plex Sans (body), IBM Plex Mono (mono labels)
// ─────────────────────────────────────────────────────────────

const IMAGES = {
  hero: "https://images.unsplash.com/photo-1611938845621-f7d331a14255?w=1920&q=80",
  trucks: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=1400&q=80",
  highway: "https://images.unsplash.com/photo-1622103358651-97d6cb0df332?w=1400&q=80",
  warehouse: "https://images.unsplash.com/photo-1769698821962-dc7ea5f9b2bc?w=1400&q=80",
  fleet: "https://images.unsplash.com/photo-1565891741441-64926e441838?w=1400&q=80",
  team: "https://images.unsplash.com/photo-1560264418-c4445382edbc?w=1400&q=80",
  mountain: "https://images.unsplash.com/photo-1740053045123-2c9ea0f0926e?w=1400&q=80",
  containers: "https://images.unsplash.com/photo-1565742863375-85d007f0ad40?w=1400&q=80",
};

const GOOGLE_MAPS_URL = "https://www.google.com/maps/search/?api=1&query=50.4501,30.5234";
const COMPANY_ADDRESS = "м. Київ, вул. Хрещатик, 22, офіс 301";

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => { setY(window.scrollY); ticking = false; });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return y;
}

/* ───── COUNTER ANIMATION ───── */
function AnimatedCounter({ end, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useInView(0.3);
  const started = useRef(false);

  useEffect(() => {
    if (!visible || started.current) return;
    started.current = true;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export default function LogisticsTransport() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [consultOpen, setConsultOpen] = useState(false);
  const [serviceModal, setServiceModal] = useState(null);
  const scrollY = useScrollY();

  const scrollTo = (id) => {
    setMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  const navItems = [
    { label: "Про нас", id: "about" },
    { label: "Послуги", id: "services" },
    { label: "Кейси", id: "cases" },
    { label: "Переваги", id: "advantages" },
    { label: "Алгоритм", id: "algorithm" },
    { label: "Вакансії", id: "vacancies" },
    { label: "Контакти", id: "contacts" },
  ];

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: "#0F0F0F", background: "#F5F2ED" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: #D4A843; color: #0F0F0F; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-60px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        @keyframes lineGrow { from { width: 0; } to { width: 100%; } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        .anim-fadeUp { opacity: 0; }
        .anim-fadeUp.visible { animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .anim-slideL { opacity: 0; }
        .anim-slideL.visible { animation: slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .anim-slideR { opacity: 0; }
        .anim-slideR.visible { animation: slideInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .anim-scaleIn { opacity: 0; }
        .anim-scaleIn.visible { animation: scaleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        .stagger-1 { animation-delay: 0.1s !important; }
        .stagger-2 { animation-delay: 0.2s !important; }
        .stagger-3 { animation-delay: 0.3s !important; }
        .stagger-4 { animation-delay: 0.4s !important; }
        .stagger-5 { animation-delay: 0.5s !important; }
        .stagger-6 { animation-delay: 0.6s !important; }

        .mono-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .display-font {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          line-height: 0.95;
          letter-spacing: -0.03em;
        }

        .section-pad {
          padding: clamp(4rem, 10vw, 10rem) clamp(1.5rem, 5vw, 6rem);
        }

        .btn-amber {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #D4A843;
          color: #0F0F0F;
          border: none;
          padding: 16px 36px;
          font-family: 'IBM Plex Sans', sans-serif;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        .btn-amber:hover {
          background: #BF9535;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(212, 168, 67, 0.3);
        }

        .btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: transparent;
          color: #F5F2ED;
          border: 1px solid rgba(245, 242, 237, 0.3);
          padding: 16px 36px;
          font-family: 'IBM Plex Sans', sans-serif;
          font-weight: 500;
          font-size: 14px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-outline:hover {
          border-color: #D4A843;
          color: #D4A843;
        }

        .form-input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.2);
          padding: 14px 0;
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 15px;
          color: #F5F2ED;
          outline: none;
          transition: border-color 0.3s;
        }
        .form-input::placeholder { color: rgba(245, 242, 237, 0.4); }
        .form-input:focus { border-color: #D4A843; }

        .form-input-dark {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(15,15,15,0.15);
          padding: 14px 0;
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 15px;
          color: #0F0F0F;
          outline: none;
          transition: border-color 0.3s;
        }
        .form-input-dark::placeholder { color: rgba(15,15,15,0.35); }
        .form-input-dark:focus { border-color: #D4A843; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0F0F0F; }
        ::-webkit-scrollbar-thumb { background: #D4A843; }

        /* Overlay menu */
        .menu-overlay {
          position: fixed;
          inset: 0;
          z-index: 9998;
          background: #0F0F0F;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .menu-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }
        .menu-overlay .menu-item {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: clamp(32px, 5vw, 60px);
          color: #F5F2ED;
          padding: 12px 0;
          cursor: pointer;
          transition: all 0.3s;
          opacity: 0;
          transform: translateY(30px);
          border: none;
          background: none;
          text-align: center;
          display: block;
        }
        .menu-overlay.open .menu-item {
          opacity: 1;
          transform: translateY(0);
        }
        .menu-overlay .menu-item:hover {
          color: #D4A843;
          transform: translateX(20px);
        }

        /* Floating callback */
        .floating-envelope {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 9990;
          width: 60px;
          height: 60px;
          background: #D4A843;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 24px rgba(212, 168, 67, 0.4);
        }
        .floating-envelope:hover {
          transform: scale(1.1);
          box-shadow: 0 8px 40px rgba(212, 168, 67, 0.5);
        }

        /* Callback modal */
        .callback-modal {
          position: fixed;
          bottom: 100px;
          right: 30px;
          z-index: 9991;
          width: 340px;
          background: #1C1C1C;
          padding: 32px;
          opacity: 0;
          pointer-events: none;
          transform: translateY(20px) scale(0.95);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .callback-modal.open {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0) scale(1);
        }

        /* Consult modal */
        .consult-overlay {
          position: fixed;
          inset: 0;
          z-index: 9995;
          background: rgba(15, 15, 15, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.4s;
        }
        .consult-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }
        .consult-modal {
          background: #1C1C1C;
          padding: clamp(32px, 5vw, 56px);
          max-width: 520px;
          width: 90%;
          transform: translateY(30px);
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .consult-overlay.open .consult-modal {
          transform: translateY(0);
        }

        /* Scroll progress */
        .scroll-progress {
          position: fixed;
          top: 0;
          left: 0;
          height: 2px;
          background: #D4A843;
          z-index: 10000;
          transition: width 0.1s linear;
        }

        /* Marquee */
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
        .marquee-track:hover { animation-play-state: paused; }

        @media (max-width: 768px) {
          .hero-stats { flex-direction: column !important; gap: 24px !important; }
          .services-grid { grid-template-columns: 1fr !important; }
          .cases-grid { grid-template-columns: 1fr !important; }
          .advantages-grid { grid-template-columns: 1fr !important; }
          .algo-grid { grid-template-columns: 1fr !important; }
          .contact-grid { grid-template-columns: 1fr !important; }
          .hero-split { flex-direction: column !important; }
          .about-split { flex-direction: column !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ═══ SCROLL PROGRESS ═══ */}
      <div
        className="scroll-progress"
        style={{
          width: `${Math.min(100, (scrollY / (document.documentElement?.scrollHeight - window.innerHeight || 1)) * 100)}%`
        }}
      />

      {/* ═══ HEADER ═══ */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 9997,
        padding: "0 clamp(1.5rem, 4vw, 4rem)",
        height: 80,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrollY > 100 ? "rgba(15,15,15,0.92)" : "transparent",
        backdropFilter: scrollY > 100 ? "blur(12px)" : "none",
        transition: "all 0.4s",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 40, height: 40, background: "#D4A843",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#0F0F0F",
          }}>
            ТР
          </div>
          <div>
            <div style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16,
              color: scrollY > 100 ? "#F5F2ED" : "#F5F2ED", letterSpacing: "0.02em",
            }}>
              ТрансЛогістика
            </div>
            <div className="mono-label" style={{ color: "#D4A843", fontSize: 9 }}>
              Вантажні перевезення
            </div>
          </div>
        </div>

        {/* Right side: info strip + hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }} className="hide-mobile">
            <a href="tel:+380800202011" style={{
              color: "#F5F2ED", textDecoration: "none", fontWeight: 500, fontSize: 14,
              transition: "color 0.3s",
            }}
              onMouseEnter={e => e.target.style.color = "#D4A843"}
              onMouseLeave={e => e.target.style.color = "#F5F2ED"}
            >
              0 800 202 011
            </a>
            <button
              onClick={() => setConsultOpen(true)}
              style={{
                background: "transparent", border: "1px solid rgba(245,242,237,0.3)",
                color: "#F5F2ED", padding: "8px 20px", fontSize: 12, fontWeight: 500,
                letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
                fontFamily: "'IBM Plex Sans', sans-serif",
                transition: "all 0.3s",
              }}
              onMouseEnter={e => { e.target.style.borderColor = "#D4A843"; e.target.style.color = "#D4A843"; }}
              onMouseLeave={e => { e.target.style.borderColor = "rgba(245,242,237,0.3)"; e.target.style.color = "#F5F2ED"; }}
            >
              Консультація
            </button>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              width: 36, height: 24, position: "relative", zIndex: 9999,
            }}
            aria-label="Menu"
          >
            <span style={{
              display: "block", width: 36, height: 2, background: menuOpen ? "#D4A843" : "#F5F2ED",
              position: "absolute", top: menuOpen ? 11 : 2, left: 0,
              transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: menuOpen ? "rotate(45deg)" : "none",
            }} />
            <span style={{
              display: "block", width: 24, height: 2, background: "#F5F2ED",
              position: "absolute", top: 11, left: 0,
              opacity: menuOpen ? 0 : 1,
              transition: "all 0.25s",
            }} />
            <span style={{
              display: "block", width: 36, height: 2, background: menuOpen ? "#D4A843" : "#F5F2ED",
              position: "absolute", top: menuOpen ? 11 : 20, left: 0,
              transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: menuOpen ? "rotate(-45deg)" : "none",
            }} />
          </button>
        </div>
      </header>

      {/* ═══ OVERLAY MENU ═══ */}
      <div className={`menu-overlay ${menuOpen ? "open" : ""}`}>
        <div style={{ position: "absolute", top: 100, left: "clamp(2rem, 5vw, 6rem)" }}>
          <div className="mono-label" style={{ color: "#D4A843", marginBottom: 8 }}>Навігація</div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          {navItems.map((item, i) => (
            <button
              key={item.id}
              className="menu-item"
              style={{ transitionDelay: `${0.1 + i * 0.06}s` }}
              onClick={() => scrollTo(item.id)}
            >
              <span className="mono-label" style={{ fontSize: 10, color: "#D4A843", marginRight: 16 }}>
                0{i + 1}
              </span>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{
          position: "absolute", bottom: 60, left: 0, right: 0,
          display: "flex", justifyContent: "center", gap: 40,
        }}>
          <a href="tel:+380800202011" style={{ color: "rgba(245,242,237,0.5)", textDecoration: "none", fontSize: 13 }}>
            0 800 202 011
          </a>
          <a href={`mailto:info@translogistics.ua`} style={{ color: "rgba(245,242,237,0.5)", textDecoration: "none", fontSize: 13 }}>
            info@translogistics.ua
          </a>
        </div>
      </div>

      {/* ═══ HERO — CHAPTER 1 (DARK) ═══ */}
      <section style={{
        position: "relative", minHeight: "100vh", overflow: "hidden",
        background: "#0F0F0F", display: "flex", flexDirection: "column", justifyContent: "flex-end",
      }}>
        {/* Background image with parallax */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${IMAGES.hero})`,
          backgroundSize: "cover", backgroundPosition: "center",
          transform: `translateY(${scrollY * 0.25}px)`,
          filter: "brightness(0.35) contrast(1.1)",
        }} />
        {/* Grain overlay */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04, mixBlendMode: "overlay",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }} />

        <div style={{ position: "relative", zIndex: 2, padding: "0 clamp(1.5rem, 5vw, 6rem) clamp(4rem, 8vw, 8rem)" }}>
          <div className="hero-split" style={{ display: "flex", alignItems: "flex-end", gap: "clamp(2rem, 5vw, 6rem)" }}>
            <div style={{ flex: "1 1 60%" }}>
              <div className="mono-label" style={{ color: "#D4A843", marginBottom: 24 }}>
                Вантажні перевезення
              </div>
              <h1 className="display-font" style={{
                fontSize: "clamp(42px, 7.5vw, 110px)", color: "#F5F2ED",
                marginBottom: 32,
              }}>
                Доставляємо
                <br />
                <span style={{ color: "#D4A843" }}>вчасно.</span>
                <br />
                Завжди.
              </h1>
            </div>
            <div style={{ flex: "1 1 35%", paddingBottom: 10 }}>
              <p style={{ color: "rgba(245,242,237,0.6)", fontSize: 16, lineHeight: 1.7, marginBottom: 32, maxWidth: 400 }}>
                Надійний логістичний партнер для бізнесу. Власний автопарк 50+ одиниць,
                маршрути по всій Україні та Європі. Повний цикл — від завантаження до доставки.
              </p>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <button className="btn-amber" onClick={() => setConsultOpen(true)}>
                  Отримати розрахунок
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button className="btn-outline" onClick={() => scrollTo("about")}>
                  Про компанію
                </button>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="hero-stats" style={{
            display: "flex", gap: "clamp(2rem, 4vw, 5rem)", marginTop: 60,
            borderTop: "1px solid rgba(245,242,237,0.1)", paddingTop: 32,
          }}>
            {[
              { num: 50, suffix: "+", label: "Автомобілів" },
              { num: 12, suffix: "+", label: "Років досвіду" },
              { num: 8000, suffix: "+", label: "Доставок на рік" },
              { num: 99, suffix: "%", label: "Вчасна доставка" },
            ].map((s, i) => (
              <div key={i}>
                <div className="display-font" style={{ fontSize: "clamp(28px, 4vw, 48px)", color: "#D4A843" }}>
                  <AnimatedCounter end={s.num} suffix={s.suffix} />
                </div>
                <div className="mono-label" style={{ color: "rgba(245,242,237,0.4)", marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MARQUEE DIVIDER ═══ */}
      <div style={{
        background: "#1C1C1C", overflow: "hidden",
        borderTop: "1px solid rgba(212,168,67,0.15)",
        borderBottom: "1px solid rgba(212,168,67,0.15)",
        padding: "16px 0",
      }}>
        <div className="marquee-track">
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 60, paddingRight: 60 }}>
              <span className="mono-label" style={{ color: "rgba(245,242,237,0.4)", whiteSpace: "nowrap" }}>
                Україна та Європа
              </span>
              <span style={{ color: "#D4A843" }}>&#x2022;</span>
              <span className="mono-label" style={{ color: "rgba(245,242,237,0.4)", whiteSpace: "nowrap" }}>
                50+ автомобілів
              </span>
              <span style={{ color: "#D4A843" }}>&#x2022;</span>
              <span className="mono-label" style={{ color: "rgba(245,242,237,0.4)", whiteSpace: "nowrap" }}>
                Платник ПДВ
              </span>
              <span style={{ color: "#D4A843" }}>&#x2022;</span>
              <span className="mono-label" style={{ color: "rgba(245,242,237,0.4)", whiteSpace: "nowrap" }}>
                FTL / LTL перевезення
              </span>
              <span style={{ color: "#D4A843" }}>&#x2022;</span>
              <span className="mono-label" style={{ color: "rgba(245,242,237,0.4)", whiteSpace: "nowrap" }}>
                GPS моніторинг 24/7
              </span>
              <span style={{ color: "#D4A843" }}>&#x2022;</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ ABOUT — CHAPTER 2 (LIGHT) ═══ */}
      <AboutSection scrollTo={scrollTo} setConsultOpen={setConsultOpen} />

      {/* ═══ SERVICES — CHAPTER 3 (DARK) ═══ */}
      <ServicesSection onServiceClick={(service) => setServiceModal(service)} />

      {/* ═══ CASES — CHAPTER 4 (LIGHT) ═══ */}
      <CasesSection />

      {/* ═══ ADVANTAGES — CHAPTER 5 (DARK) ═══ */}
      <AdvantagesSection />

      {/* ═══ ALGORITHM — CHAPTER 6 (LIGHT) ═══ */}
      <AlgorithmSection />

      {/* ═══ VACANCIES — CHAPTER 7 (AMBER ACCENT) ═══ */}
      <VacanciesSection />

      {/* ═══ CONTACTS — CHAPTER 8 (DARK) ═══ */}
      <ContactsSection setConsultOpen={setConsultOpen} />

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        background: "#0A0A0A", padding: "40px clamp(1.5rem, 5vw, 6rem)",
        borderTop: "1px solid rgba(212,168,67,0.15)",
      }}>
        <div className="footer-grid" style={{
          display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 24,
        }}>
          <div className="mono-label" style={{ color: "rgba(245,242,237,0.3)" }}>
            &copy; 2024 ТрансЛогістика
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["Facebook", "Instagram", "LinkedIn"].map(s => (
              <span key={s} className="mono-label" style={{
                color: "rgba(245,242,237,0.4)", cursor: "pointer", transition: "color 0.3s",
              }}
                onMouseEnter={e => e.target.style.color = "#D4A843"}
                onMouseLeave={e => e.target.style.color = "rgba(245,242,237,0.4)"}
              >{s}</span>
            ))}
          </div>
          <div style={{ textAlign: "right" }}>
            <span className="mono-label" style={{ color: "rgba(245,242,237,0.3)" }}>
              Платник ПДВ &middot; ЄДРПОУ 12345678
            </span>
          </div>
        </div>
      </footer>

      {/* ═══ FLOATING ENVELOPE BUTTON ═══ */}
      <button
        className="floating-envelope"
        onClick={() => setCallbackOpen(!callbackOpen)}
        aria-label="Запит на дзвінок"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="5" width="20" height="14" rx="1" stroke="#0F0F0F" strokeWidth="1.5" />
          <path d="M2 5l10 8 10-8" stroke="#0F0F0F" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* ═══ CALLBACK MODAL ═══ */}
      <div className={`callback-modal ${callbackOpen ? "open" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div className="mono-label" style={{ color: "#D4A843" }}>Запит на дзвінок</div>
          <button
            onClick={() => setCallbackOpen(false)}
            style={{ background: "none", border: "none", color: "#F5F2ED", cursor: "pointer", fontSize: 20 }}
          >&times;</button>
        </div>
        <form onSubmit={e => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <input className="form-input" placeholder="Ваше ім'я" />
          <input className="form-input" placeholder="Телефон" type="tel" />
          <button className="btn-amber" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
            Зателефонуйте мені
          </button>
        </form>
      </div>

      {/* ═══ CONSULTATION MODAL ═══ */}
      <div
        className={`consult-overlay ${consultOpen ? "open" : ""}`}
        onClick={e => { if (e.target === e.currentTarget) setConsultOpen(false); }}
      >
        <div className="consult-modal">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div>
              <div className="mono-label" style={{ color: "#D4A843", marginBottom: 8 }}>Консультація</div>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 24, color: "#F5F2ED",
              }}>
                Розрахунок вартості
              </div>
            </div>
            <button
              onClick={() => setConsultOpen(false)}
              style={{ background: "none", border: "none", color: "#F5F2ED", cursor: "pointer", fontSize: 28, lineHeight: 1 }}
            >&times;</button>
          </div>
          <form onSubmit={e => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <input className="form-input" placeholder="Ваше ім'я" />
            <input className="form-input" placeholder="Компанія" />
            <input className="form-input" placeholder="Телефон" type="tel" />
            <input className="form-input" placeholder="Email" type="email" />
            <input className="form-input" placeholder="Маршрут (звідки — куди)" />
            <input className="form-input" placeholder="Тип вантажу" />
            <button className="btn-amber" style={{ width: "100%", justifyContent: "center", marginTop: 12 }}>
              Отримати розрахунок
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
          <p style={{ color: "rgba(245,242,237,0.3)", fontSize: 12, marginTop: 16, textAlign: "center" }}>
            Наш менеджер зв'яжеться з вами протягом 30 хвилин
          </p>
        </div>
      </div>

      {/* ═══ SERVICE REQUEST MODAL ═══ */}
      <div
        className={`consult-overlay ${serviceModal ? "open" : ""}`}
        onClick={e => { if (e.target === e.currentTarget) setServiceModal(null); }}
      >
        <div className="consult-modal">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div>
              <div className="mono-label" style={{ color: "#D4A843", marginBottom: 8 }}>Заявка на послугу</div>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, color: "#F5F2ED",
              }}>
                {serviceModal || ""}
              </div>
            </div>
            <button
              onClick={() => setServiceModal(null)}
              style={{ background: "none", border: "none", color: "#F5F2ED", cursor: "pointer", fontSize: 28, lineHeight: 1 }}
            >&times;</button>
          </div>
          <form onSubmit={e => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <input className="form-input" placeholder="Ваше ім'я" />
            <input className="form-input" placeholder="Компанія" />
            <input className="form-input" placeholder="Телефон" type="tel" />
            <input className="form-input" placeholder="Маршрут (звідки — куди)" />
            <input className="form-input" placeholder="Опис вантажу (тип, вага, об'єм)" />
            <textarea
              className="form-input"
              placeholder="Додаткові побажання"
              rows={3}
              style={{
                resize: "vertical",
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            />
            <button className="btn-amber" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
              Залишити заявку
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
          <p style={{ color: "rgba(245,242,237,0.3)", fontSize: 12, marginTop: 16, textAlign: "center" }}>
            Менеджер зв'яжеться з вами для уточнення деталей
          </p>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   ABOUT SECTION
   ═══════════════════════════════════════════════════════════ */
function AboutSection({ scrollTo, setConsultOpen }) {
  const [ref, vis] = useInView();
  const [ref2, vis2] = useInView();
  return (
    <section id="about" className="section-pad" style={{ background: "#F5F2ED" }}>
      <div ref={ref} className={`anim-fadeUp ${vis ? "visible" : ""}`}>
        <div className="mono-label" style={{ color: "#D4A843", marginBottom: 16 }}>01 / Про компанію</div>
        <h2 className="display-font" style={{ fontSize: "clamp(32px, 5vw, 64px)", marginBottom: 48, maxWidth: 800 }}>
          Спрощена логістика для вашого
          <span style={{ color: "#D4A843" }}> бізнесу</span>
        </h2>
      </div>

      <div className="about-split" ref={ref2} style={{
        display: "flex", gap: "clamp(2rem, 5vw, 6rem)", alignItems: "stretch",
      }}>
        <div className={`anim-slideL ${vis2 ? "visible" : ""}`} style={{ flex: "1 1 55%" }}>
          <div style={{ position: "relative", height: "100%", minHeight: 400 }}>
            <img
              src={IMAGES.fleet}
              alt="Автопарк"
              style={{
                width: "100%", height: "100%", objectFit: "cover", display: "block",
                filter: "saturate(0.85) contrast(1.05)",
              }}
            />
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, padding: "32px",
              background: "linear-gradient(transparent, rgba(15,15,15,0.8))",
            }}>
              <div className="mono-label" style={{ color: "#D4A843" }}>Власний автопарк</div>
            </div>
          </div>
        </div>

        <div className={`anim-slideR ${vis2 ? "visible" : ""}`} style={{ flex: "1 1 45%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{ fontSize: 17, lineHeight: 1.8, color: "#3A3A3A", marginBottom: 28 }}>
            <strong>ТрансЛогістика</strong> — це команда професіоналів з понад 12-річним досвідом
            у вантажних перевезеннях. Ми забезпечуємо повний логістичний цикл: від планування маршруту
            до доставки вантажу в будь-яку точку України та Європи.
          </p>
          <p style={{ fontSize: 17, lineHeight: 1.8, color: "#3A3A3A", marginBottom: 28 }}>
            Наш автопарк налічує понад 50 одиниць техніки різної вантажопідйомності.
            Кожен автомобіль обладнаний GPS-трекером. Ми — офіційний платник ПДВ,
            працюємо з повним комплектом документів.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <button className="btn-amber" onClick={() => setConsultOpen(true)}>
              Безкоштовна консультація
            </button>
          </div>

          {/* Mini fact cards */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 40,
          }}>
            {[
              { icon: "🏢", text: "Ліцензована діяльність" },
              { icon: "📋", text: "Повний пакет документів" },
              { icon: "💳", text: "Платник ПДВ" },
              { icon: "🛡", text: "Страхування вантажу" },
            ].map((f, i) => (
              <div key={i} style={{
                padding: 16, background: "rgba(15,15,15,0.04)",
                borderLeft: "2px solid #D4A843",
              }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{f.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════
   SERVICES SECTION
   ═══════════════════════════════════════════════════════════ */
function ServicesSection({ onServiceClick }) {
  const [ref, vis] = useInView();
  const services = [
    {
      num: "01",
      title: "FTL перевезення",
      desc: "Повне завантаження автомобіля. Оптимальне рішення для великих партій вантажу — прямий маршрут без перевантажень.",
      img: IMAGES.highway,
    },
    {
      num: "02",
      title: "LTL перевезення",
      desc: "Збірні вантажі. Економічний варіант для невеликих партій — консолідація з іншими відправленнями.",
      img: IMAGES.warehouse,
    },
    {
      num: "03",
      title: "Міжнародні перевезення",
      desc: "Доставка по всій Європі. Митне оформлення, TIR-карнети, CMR — повний пакет для міжнародних маршрутів.",
      img: IMAGES.mountain,
    },
    {
      num: "04",
      title: "Складська логістика",
      desc: "Відповідальне зберігання, кросс-докінг, комплектація замовлень. Власні складські площі в Києві.",
      img: IMAGES.containers,
    },
  ];

  return (
    <section id="services" style={{ background: "#0F0F0F" }} className="section-pad">
      <div ref={ref} className={`anim-fadeUp ${vis ? "visible" : ""}`}>
        <div className="mono-label" style={{ color: "#D4A843", marginBottom: 16 }}>02 / Послуги</div>
        <h2 className="display-font" style={{
          fontSize: "clamp(32px, 5vw, 64px)", color: "#F5F2ED", marginBottom: 64, maxWidth: 700,
        }}>
          Повний спектр
          <br />
          логістичних <span style={{ color: "#D4A843" }}>рішень</span>
        </h2>
      </div>

      <div className="services-grid" style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2,
      }}>
        {services.map((s, i) => (
          <ServiceCard key={i} {...s} delay={i * 0.12} onClick={() => onServiceClick(s.title)} />
        ))}
      </div>
    </section>
  );
}

function ServiceCard({ num, title, desc, img, delay, onClick }) {
  const [ref, vis] = useInView(0.2);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      className={`anim-scaleIn ${vis ? "visible" : ""}`}
      style={{ animationDelay: `${delay}s`, position: "relative", overflow: "hidden", cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div style={{
        position: "relative", paddingBottom: "65%", overflow: "hidden",
      }}>
        <img
          src={img}
          alt={title}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover",
            filter: "brightness(0.4) saturate(0.8)",
            transform: hovered ? "scale(1.06)" : "scale(1)",
            transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, transparent 30%, rgba(15,15,15,0.85) 100%)",
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "clamp(24px, 3vw, 40px)",
        }}>
          <div className="mono-label" style={{
            color: "#D4A843", marginBottom: 12,
            transform: hovered ? "translateX(8px)" : "translateX(0)",
            transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}>
            {num}
          </div>
          <h3 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 700,
            fontSize: "clamp(20px, 2.5vw, 28px)", color: "#F5F2ED",
            marginBottom: 12,
          }}>{title}</h3>
          <p style={{
            color: "rgba(245,242,237,0.6)", fontSize: 14, lineHeight: 1.6,
            maxWidth: 380,
            opacity: hovered ? 1 : 0.7,
            transform: hovered ? "translateY(0)" : "translateY(8px)",
            transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          }}>{desc}</p>
          {/* CTA hint */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            marginTop: 16,
            color: "#D4A843", fontSize: 12, fontWeight: 600,
            letterSpacing: "0.06em", textTransform: "uppercase",
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.05s",
          }}>
            Залишити заявку
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="#D4A843" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   CASES SECTION
   ═══════════════════════════════════════════════════════════ */
function CasesSection() {
  const [ref, vis] = useInView();
  const cases = [
    {
      client: "АгроТех Груп",
      route: "Київ → Гданськ, Польща",
      volume: "22 тонни зернових",
      result: "Доставка за 48 годин з повним митним оформленням",
    },
    {
      client: "МеблеМаркет",
      route: "Львів → Мюнхен, Німеччина",
      volume: "120 м³ меблів",
      result: "Збереження 100% товару без пошкоджень",
    },
    {
      client: "Фарма Плюс",
      route: "Одеса → Варшава → Берлін",
      volume: "Температурний режим +2...+8°C",
      result: "Рефрижераторні перевезення з дотриманням GDP",
    },
  ];

  return (
    <section id="cases" className="section-pad" style={{ background: "#F5F2ED" }}>
      <div ref={ref} className={`anim-fadeUp ${vis ? "visible" : ""}`}>
        <div className="mono-label" style={{ color: "#D4A843", marginBottom: 16 }}>03 / Наші кейси</div>
        <h2 className="display-font" style={{
          fontSize: "clamp(32px, 5vw, 64px)", marginBottom: 64, maxWidth: 700,
        }}>
          Результати, які <span style={{ color: "#D4A843" }}>говорять</span> самі за себе
        </h2>
      </div>

      <div className="cases-grid" style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2,
      }}>
        {cases.map((c, i) => (
          <CaseCard key={i} {...c} index={i} />
        ))}
      </div>
    </section>
  );
}

function CaseCard({ client, route, volume, result, index }) {
  const [ref, vis] = useInView(0.2);
  const [hovered, setHovered] = useState(false);
  return (
    <div
      ref={ref}
      className={`anim-fadeUp stagger-${index + 1} ${vis ? "visible" : ""}`}
      style={{
        background: hovered ? "#0F0F0F" : "#1C1C1C",
        padding: "clamp(28px, 3vw, 48px)",
        transition: "background 0.4s",
        cursor: "default",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        minHeight: 360,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div>
        <div className="mono-label" style={{ color: "#D4A843", marginBottom: 24 }}>
          Кейс 0{index + 1}
        </div>
        <h3 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 700,
          fontSize: 22, color: "#F5F2ED", marginBottom: 20,
        }}>{client}</h3>
        <div style={{
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div style={{ display: "flex", gap: 12 }}>
            <span className="mono-label" style={{ color: "#D4A843", minWidth: 70 }}>Маршрут</span>
            <span style={{ color: "rgba(245,242,237,0.6)", fontSize: 14 }}>{route}</span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <span className="mono-label" style={{ color: "#D4A843", minWidth: 70 }}>Вантаж</span>
            <span style={{ color: "rgba(245,242,237,0.6)", fontSize: 14 }}>{volume}</span>
          </div>
        </div>
      </div>

      <div style={{
        borderTop: "1px solid rgba(212,168,67,0.2)", paddingTop: 20, marginTop: 32,
      }}>
        <div className="mono-label" style={{ color: "rgba(245,242,237,0.3)", marginBottom: 8 }}>Результат</div>
        <p style={{ color: "#F5F2ED", fontSize: 15, lineHeight: 1.6, fontWeight: 500 }}>{result}</p>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   ADVANTAGES SECTION
   ═══════════════════════════════════════════════════════════ */
function AdvantagesSection() {
  const [ref, vis] = useInView();
  const advantages = [
    {
      num: "01",
      title: "Власний автопарк",
      desc: "50+ одиниць техніки: тенти, рефрижератори, контейнеровози. Від 1.5 до 22 тонн вантажопідйомності.",
    },
    {
      num: "02",
      title: "GPS-моніторинг 24/7",
      desc: "Відстежуйте ваш вантаж в реальному часі. Автоматичні сповіщення на кожному етапі доставки.",
    },
    {
      num: "03",
      title: "Страхування вантажу",
      desc: "Повне страхове покриття кожного відправлення. Гарантія компенсації у випадку форс-мажору.",
    },
    {
      num: "04",
      title: "Досвідчена команда",
      desc: "Персональний менеджер на кожному проєкті. Логісти з міжнародним досвідом та сертифікацією.",
    },
    {
      num: "05",
      title: "Митне оформлення",
      desc: "Власний митний брокер. Повний пакет документів: CMR, TIR, інвойси, сертифікати — під ключ.",
    },
    {
      num: "06",
      title: "Гнучка цінова політика",
      desc: "Індивідуальний розрахунок для кожного маршруту. Знижки для постійних клієнтів та великих обсягів.",
    },
  ];

  return (
    <section id="advantages" style={{
      background: "#0F0F0F",
      backgroundImage: `url(${IMAGES.trucks})`,
      backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed",
      position: "relative",
    }} className="section-pad">
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(15,15,15,0.88)",
      }} />
      <div style={{ position: "relative", zIndex: 2 }}>
        <div ref={ref} className={`anim-fadeUp ${vis ? "visible" : ""}`}>
          <div className="mono-label" style={{ color: "#D4A843", marginBottom: 16 }}>04 / Переваги</div>
          <h2 className="display-font" style={{
            fontSize: "clamp(32px, 5vw, 64px)", color: "#F5F2ED", marginBottom: 64, maxWidth: 700,
          }}>
            Чому обирають <span style={{ color: "#D4A843" }}>нас</span>
          </h2>
        </div>

        <div className="advantages-grid" style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0,
        }}>
          {advantages.map((a, i) => (
            <AdvantageItem key={i} {...a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AdvantageItem({ num, title, desc, index }) {
  const [ref, vis] = useInView(0.15);
  return (
    <div
      ref={ref}
      className={`anim-fadeUp stagger-${(index % 3) + 1} ${vis ? "visible" : ""}`}
      style={{
        padding: "clamp(24px, 3vw, 44px)",
        borderBottom: "1px solid rgba(212,168,67,0.1)",
        borderRight: (index % 3 !== 2) ? "1px solid rgba(212,168,67,0.1)" : "none",
      }}
    >
      <div style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 800,
        fontSize: 48, color: "rgba(212,168,67,0.12)", lineHeight: 1,
        marginBottom: 20,
      }}>{num}</div>
      <h3 style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 700,
        fontSize: 20, color: "#F5F2ED", marginBottom: 14,
      }}>{title}</h3>
      <p style={{ color: "rgba(245,242,237,0.5)", fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   ALGORITHM SECTION
   ═══════════════════════════════════════════════════════════ */
function AlgorithmSection() {
  const [ref, vis] = useInView();
  const steps = [
    { num: "01", title: "Заявка", desc: "Ви залишаєте заявку на сайті або телефонуєте нам. Описуєте вантаж, маршрут та строки." },
    { num: "02", title: "Розрахунок", desc: "Логіст прораховує оптимальний маршрут, підбирає транспорт та формує комерційну пропозицію." },
    { num: "03", title: "Договір", desc: "Погоджуємо умови, підписуємо договір та страхуємо вантаж. Все офіційно та прозоро." },
    { num: "04", title: "Завантаження", desc: "Автомобіль прибуває на точку навантаження. Водій перевіряє вантаж та оформлює ТТН/CMR." },
    { num: "05", title: "Транспортування", desc: "Вантаж в дорозі під GPS-контролем. Ви отримуєте сповіщення на кожному етапі." },
    { num: "06", title: "Доставка", desc: "Вантаж доставлено. Акт виконаних робіт, фото розвантаження, закриваючі документи." },
  ];

  return (
    <section id="algorithm" className="section-pad" style={{ background: "#F5F2ED" }}>
      <div ref={ref} className={`anim-fadeUp ${vis ? "visible" : ""}`}>
        <div className="mono-label" style={{ color: "#D4A843", marginBottom: 16 }}>05 / Алгоритм роботи</div>
        <h2 className="display-font" style={{
          fontSize: "clamp(32px, 5vw, 64px)", marginBottom: 64, maxWidth: 700,
        }}>
          Від заявки до
          <span style={{ color: "#D4A843" }}> доставки</span>
          <br />за 6 кроків
        </h2>
      </div>

      <div className="algo-grid" style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0,
      }}>
        {steps.map((s, i) => (
          <AlgoStep key={i} {...s} index={i} isLast={i === steps.length - 1} />
        ))}
      </div>
    </section>
  );
}

function AlgoStep({ num, title, desc, index, isLast }) {
  const [ref, vis] = useInView(0.2);
  return (
    <div
      ref={ref}
      className={`anim-fadeUp stagger-${(index % 3) + 1} ${vis ? "visible" : ""}`}
      style={{
        padding: "clamp(24px, 3vw, 44px)",
        borderBottom: index < 3 ? "1px solid rgba(15,15,15,0.08)" : "none",
        borderRight: (index % 3 !== 2) ? "1px solid rgba(15,15,15,0.08)" : "none",
        position: "relative",
      }}
    >
      <div style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 800,
        fontSize: "clamp(56px, 6vw, 80px)",
        color: "rgba(212,168,67,0.1)",
        lineHeight: 1,
        marginBottom: 20,
      }}>{num}</div>
      <h3 style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 700,
        fontSize: 20, marginBottom: 12,
      }}>{title}</h3>
      <p style={{ color: "#5A5A5A", fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
      {!isLast && (index % 3 !== 2) && (
        <div style={{
          position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)",
          color: "#D4A843", fontSize: 20, fontWeight: 300,
        }}>
          &#x2192;
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   VACANCIES SECTION
   ═══════════════════════════════════════════════════════════ */
function VacanciesSection() {
  const [ref, vis] = useInView();
  const vacancies = [
    { title: "Водій-далекобійник (категорія CE)", location: "Київ / Європа", type: "Повна зайнятість" },
    { title: "Логіст-диспетчер", location: "Київ, офіс", type: "Повна зайнятість" },
    { title: "Митний брокер", location: "Київ / віддалено", type: "Повна зайнятість" },
  ];

  return (
    <section id="vacancies" style={{
      background: "#D4A843", padding: "clamp(4rem, 8vw, 8rem) clamp(1.5rem, 5vw, 6rem)",
    }}>
      <div ref={ref} className={`anim-fadeUp ${vis ? "visible" : ""}`}>
        <div className="mono-label" style={{ color: "#0F0F0F", marginBottom: 16, opacity: 0.6 }}>
          06 / Вакансії
        </div>
        <h2 className="display-font" style={{
          fontSize: "clamp(32px, 5vw, 64px)", color: "#0F0F0F", marginBottom: 48, maxWidth: 600,
        }}>
          Приєднуйся до команди
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {vacancies.map((v, i) => (
          <VacancyRow key={i} {...v} index={i} />
        ))}
      </div>
    </section>
  );
}

function VacancyRow({ title, location, type, index }) {
  const [ref, vis] = useInView();
  const [hovered, setHovered] = useState(false);
  return (
    <div
      ref={ref}
      className={`anim-fadeUp stagger-${index + 1} ${vis ? "visible" : ""}`}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "28px 0",
        borderBottom: "1px solid rgba(15,15,15,0.15)",
        cursor: "pointer",
        flexWrap: "wrap", gap: 16,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div>
        <h3 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, color: "#0F0F0F",
          transition: "transform 0.3s",
          transform: hovered ? "translateX(12px)" : "translateX(0)",
        }}>{title}</h3>
        <div className="mono-label" style={{ color: "rgba(15,15,15,0.5)", marginTop: 6 }}>
          {location} &middot; {type}
        </div>
      </div>
      <div style={{
        width: 40, height: 40, background: "#0F0F0F",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "transform 0.3s",
        transform: hovered ? "translateX(-4px)" : "translateX(0)",
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="#D4A843" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   CONTACTS SECTION
   ═══════════════════════════════════════════════════════════ */
function ContactsSection({ setConsultOpen }) {
  const [ref, vis] = useInView();
  return (
    <section id="contacts" className="section-pad" style={{ background: "#0F0F0F" }}>
      <div ref={ref} className={`anim-fadeUp ${vis ? "visible" : ""}`}>
        <div className="mono-label" style={{ color: "#D4A843", marginBottom: 16 }}>07 / Контакти</div>
        <h2 className="display-font" style={{
          fontSize: "clamp(32px, 5vw, 64px)", color: "#F5F2ED", marginBottom: 64, maxWidth: 700,
        }}>
          Зв'яжіться з <span style={{ color: "#D4A843" }}>нами</span>
        </h2>
      </div>

      <div className="contact-grid" style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(2rem, 5vw, 6rem)",
      }}>
        {/* Left — contact info */}
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
            <div>
              <div className="mono-label" style={{ color: "#D4A843", marginBottom: 10 }}>Телефон</div>
              <a href="tel:+380800202011" style={{
                color: "#F5F2ED", textDecoration: "none", fontSize: 24,
                fontFamily: "'Syne', sans-serif", fontWeight: 600,
                transition: "color 0.3s",
              }}
                onMouseEnter={e => e.target.style.color = "#D4A843"}
                onMouseLeave={e => e.target.style.color = "#F5F2ED"}
              >
                0 800 202 011
              </a>
              <div style={{ color: "rgba(245,242,237,0.4)", fontSize: 13, marginTop: 4 }}>
                Безкоштовно по Україні
              </div>
              <div style={{ marginTop: 12 }}>
                <a href="tel:+380442234455" style={{ color: "rgba(245,242,237,0.6)", textDecoration: "none", fontSize: 16 }}>
                  +38 (044) 223-44-55
                </a>
              </div>
            </div>

            <div>
              <div className="mono-label" style={{ color: "#D4A843", marginBottom: 10 }}>Email</div>
              <a href="mailto:info@translogistics.ua" style={{
                color: "#F5F2ED", textDecoration: "none", fontSize: 18,
                transition: "color 0.3s",
              }}
                onMouseEnter={e => e.target.style.color = "#D4A843"}
                onMouseLeave={e => e.target.style.color = "#F5F2ED"}
              >
                info@translogistics.ua
              </a>
            </div>

            <div>
              <div className="mono-label" style={{ color: "#D4A843", marginBottom: 10 }}>Адреса</div>
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#F5F2ED", textDecoration: "none", fontSize: 16, lineHeight: 1.6,
                  display: "flex", alignItems: "flex-start", gap: 10,
                  transition: "color 0.3s",
                }}
                onMouseEnter={e => e.currentTarget.style.color = "#D4A843"}
                onMouseLeave={e => e.currentTarget.style.color = "#F5F2ED"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginTop: 3, flexShrink: 0 }}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span>{COMPANY_ADDRESS}<br />
                  <span className="mono-label" style={{ fontSize: 10, color: "#D4A843" }}>
                    Відкрити на Google Maps &#x2197;
                  </span>
                </span>
              </a>
            </div>

            <div>
              <div className="mono-label" style={{ color: "#D4A843", marginBottom: 10 }}>Графік роботи</div>
              <div style={{ color: "rgba(245,242,237,0.6)", fontSize: 15, lineHeight: 1.8 }}>
                Пн — Пт: 08:00 — 19:00<br />
                Сб: 09:00 — 15:00<br />
                Диспетчерська: цілодобово
              </div>
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div style={{
          background: "#1C1C1C", padding: "clamp(28px, 3vw, 48px)",
        }}>
          <div className="mono-label" style={{ color: "#D4A843", marginBottom: 8 }}>Швидка заявка</div>
          <div style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, color: "#F5F2ED",
            marginBottom: 32,
          }}>
            Отримайте розрахунок вартості
          </div>
          <form onSubmit={e => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label className="mono-label" style={{ color: "rgba(245,242,237,0.3)", display: "block", marginBottom: 4 }}>Ім'я</label>
              <input className="form-input" placeholder="Ваше ім'я" />
            </div>
            <div>
              <label className="mono-label" style={{ color: "rgba(245,242,237,0.3)", display: "block", marginBottom: 4 }}>Телефон</label>
              <input className="form-input" placeholder="+38 (0__) ___-__-__" type="tel" />
            </div>
            <div>
              <label className="mono-label" style={{ color: "rgba(245,242,237,0.3)", display: "block", marginBottom: 4 }}>Маршрут</label>
              <input className="form-input" placeholder="Звідки — Куди" />
            </div>
            <div>
              <label className="mono-label" style={{ color: "rgba(245,242,237,0.3)", display: "block", marginBottom: 4 }}>Коментар</label>
              <input className="form-input" placeholder="Тип вантажу, вага, обсяг..." />
            </div>
            <button className="btn-amber" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
              Надіслати заявку
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Google Maps embed */}
      <div style={{ marginTop: 64, position: "relative", height: 300, overflow: "hidden" }}>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2540.4!2d30.5234!3d50.4501!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTDCsDI3JzAwLjQiTiAzMMKwMzEnMjQuNCJF!5e0!3m2!1suk!2sua!4v1"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            border: "none", display: "block",
            filter: "grayscale(1) contrast(1.1) brightness(0.5)",
          }}
          title="Google Maps"
          loading="lazy"
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, rgba(15,15,15,0.9) 0%, transparent 40%, transparent 60%, rgba(15,15,15,0.9) 100%)",
          pointerEvents: "none",
        }} />
      </div>
    </section>
  );
}
