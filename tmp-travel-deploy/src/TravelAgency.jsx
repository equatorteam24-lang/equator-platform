import React, { useState, useEffect, useRef } from "react";

function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

const PHOTOS = {
  hero: "https://images.unsplash.com/photo-1718939048678-61be3fe7e5d6?w=1920&q=80",
  santorini: "https://images.unsplash.com/photo-1775481087475-c9c4c569184f?w=1400&q=80",
  maldives: "https://images.unsplash.com/photo-1609601540898-52ca92508901?w=1400&q=80",
  bali: "https://images.unsplash.com/photo-1604999312965-6c50928b6492?w=1400&q=80",
  safari: "https://images.unsplash.com/photo-1623743423143-23df3234ae5c?w=1400&q=80",
  resort: "https://images.unsplash.com/photo-1769149255670-aa0ad6428dd6?w=1400&q=80",
  villas: "https://images.unsplash.com/photo-1743356174523-b04efcc66b46?w=1400&q=80",
  temple: "https://images.unsplash.com/photo-1766932189780-4dfb44573888?w=1400&q=80",
};

const DESTINATIONS = [
  { name: "Мальдіви", desc: "Райські острови в Індійському океані", price: "від 2 400 $", img: PHOTOS.maldives },
  { name: "Балі", desc: "Духовний острів тисячі храмів", price: "від 1 800 $", img: PHOTOS.bali },
  { name: "Санторіні", desc: "Білосніжні тераси над Егейським морем", price: "від 1 600 $", img: PHOTOS.santorini },
  { name: "Кенія Сафарі", desc: "Дика природа африканської савани", price: "від 3 200 $", img: PHOTOS.safari },
  { name: "Таїланд", desc: "Екзотика, храми та пляжі мрії", price: "від 1 200 $", img: PHOTOS.resort },
  { name: "Єгипет", desc: "Стародавні піраміди та Червоне море", price: "від 900 $", img: PHOTOS.villas },
];

const REVIEWS = [
  { text: "Meridian Travel організували нам медовий місяць на Мальдівах, про який ми мріяли роками. Кожна деталь була продумана — від трансферу до вілли над водою до романтичної вечері на пляжі.", name: "Олена та Дмитро К.", dest: "Мальдіви" },
  { text: "Це була найкраща подорож у моєму житті. Індивідуальний маршрут по Балі дозволив побачити острів з абсолютно нового боку — не туристичного, а справжнього.", name: "Марія С.", dest: "Балі, Індонезія" },
  { text: "Корпоративна поїздка для команди з 30 людей пройшла бездоганно. Від логістики до розважальної програми — все було на вищому рівні. Обов'язково звернемося знову.", name: "Андрій В., CEO", dest: "Санторіні, Греція" },
];

const SERVICES = [
  { title: "Індивідуальні тури", desc: "Персональний маршрут, приватні гіди та унікальні локації, підібрані саме для вас", img: PHOTOS.maldives },
  { title: "Групові подорожі", desc: "Авторські тури у невеликих групах до 12 осіб з досвідченим лідером", img: PHOTOS.bali },
  { title: "Корпоративні поїздки", desc: "Тімбілдінг, конференції та мотиваційні поїздки для вашої команди", img: PHOTOS.safari },
  { title: "Весільні подорожі", desc: "Романтичні медові місяці та весілля за кордоном у казкових локаціях", img: PHOTOS.resort },
];

export default function TravelAgency() {
  const [scrollY, setScrollY] = useState(0);
  const [navSolid, setNavSolid] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", destination: "", budget: "", comment: "" });
  const [formErrors, setFormErrors] = useState({});
  const [formSent, setFormSent] = useState(false);
  const galleryRef = useRef(null);
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0 });

  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY);
      setNavSolid(window.scrollY > 60);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Global observer removed — using useInView hook per component instead

  // Gallery drag scroll
  const onMouseDown = (e) => {
    const g = galleryRef.current;
    if (!g) return;
    dragState.current = { isDown: true, startX: e.pageX - g.offsetLeft, scrollLeft: g.scrollLeft };
    g.style.cursor = "grabbing";
  };
  const onMouseUp = () => {
    dragState.current.isDown = false;
    if (galleryRef.current) galleryRef.current.style.cursor = "grab";
  };
  const onMouseMove = (e) => {
    if (!dragState.current.isDown) return;
    e.preventDefault();
    const g = galleryRef.current;
    const x = e.pageX - g.offsetLeft;
    g.scrollLeft = dragState.current.scrollLeft - (x - dragState.current.startX) * 1.5;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.name.trim()) errs.name = true;
    if (!formData.phone.trim()) errs.phone = true;
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) errs.email = true;
    if (!formData.destination) errs.destination = true;
    setFormErrors(errs);
    if (Object.keys(errs).length === 0) setFormSent(true);
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Archivo:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        html {
          scroll-behavior: smooth;
          --ground: #FAFAF7;
          --ink: #1A1A1A;
          --accent: #2D6A5E;
          --secondary: #C4704B;
          --sand: #EDE8E0;
          --muted: #7A7A72;
          --serif: 'Instrument Serif', Georgia, serif;
          --sans: 'Archivo', system-ui, sans-serif;
          --mono: 'Space Mono', monospace;
        }

        body {
          background: var(--ground);
          color: var(--ink);
          font-family: var(--sans);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        ::selection {
          background: var(--accent);
          color: #fff;
        }

        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: var(--ground); }
        ::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 4px; }

        /* Reveal animations */
        .reveal-clip {
          clip-path: inset(100% 0 0 0);
          transition: clip-path 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .reveal-clip.revealed {
          clip-path: inset(0 0 0 0);
        }

        .reveal-up {
          opacity: 0;
          transform: translateY(50px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .reveal-up.revealed {
          opacity: 1;
          transform: translateY(0);
        }

        .reveal-left {
          opacity: 0;
          transform: translateX(-60px);
          transition: opacity 0.9s ease, transform 0.9s ease;
        }
        .reveal-left.revealed {
          opacity: 1;
          transform: translateX(0);
        }

        .reveal-right {
          opacity: 0;
          transform: translateX(60px);
          transition: opacity 0.9s ease, transform 0.9s ease;
        }
        .reveal-right.revealed {
          opacity: 1;
          transform: translateX(0);
        }

        /* Gallery scrollbar */
        .gallery-scroll::-webkit-scrollbar { height: 4px; }
        .gallery-scroll::-webkit-scrollbar-track { background: transparent; }
        .gallery-scroll::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 2px; }

        /* Grain overlay */
        .grain::after {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 128px 128px;
          pointer-events: none;
          z-index: 2;
        }

        @keyframes scrollHint {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(10px); opacity: 1; }
        }
      `}</style>

      {/* ============ NAV ============ */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "0 48px",
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 56,
          background: navSolid ? "rgba(250,250,247,0.85)" : "transparent",
          backdropFilter: navSolid ? "blur(16px)" : "none",
          borderBottom: navSolid ? "1px solid rgba(26,26,26,0.06)" : "1px solid transparent",
          transition: "all 0.4s ease",
        }}
      >
        <NavLink onClick={() => scrollTo("about")} light={!navSolid}>Про нас</NavLink>
        <NavLink onClick={() => scrollTo("services")} light={!navSolid}>Послуги</NavLink>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--serif)",
            fontSize: 26,
            letterSpacing: "-0.02em",
            color: navSolid ? "var(--ink)" : "#fff",
            transition: "color 0.4s ease",
            padding: "0 24px",
          }}
        >
          Meridian Travel
        </button>
        <NavLink onClick={() => scrollTo("gallery")} light={!navSolid}>Напрямки</NavLink>
        <NavLink onClick={() => scrollTo("contact")} light={!navSolid}>Контакти</NavLink>
      </nav>

      {/* ============ HERO ============ */}
      <section
        className="grain"
        style={{
          position: "relative",
          height: "100vh",
          minHeight: 700,
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${PHOTOS.hero})`,
            backgroundSize: "cover",
            backgroundPosition: "center 30%",
            transform: `translateY(${scrollY * 0.3}px) scale(1.1)`,
            willChange: "transform",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(26,26,26,0.82) 0%, rgba(26,26,26,0.45) 40%, rgba(26,26,26,0.15) 70%, transparent 100%)",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 3,
            textAlign: "center",
            paddingBottom: 100,
            maxWidth: 820,
          }}
        >
          <h1
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(42px, 6vw, 76px)",
              fontWeight: 400,
              lineHeight: 1.08,
              color: "#fff",
              marginBottom: 20,
              letterSpacing: "-0.02em",
              textShadow: "0 2px 20px rgba(0,0,0,0.3)",
            }}
          >
            Подорожуйте з тими,
            <br />
            хто знає світ
          </h1>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontSize: "clamp(16px, 1.6vw, 20px)",
              color: "rgba(255,255,255,0.8)",
              fontWeight: 300,
              marginBottom: 40,
              letterSpacing: "0.01em",
            }}
          >
            Індивідуальні тури від експертів з 15-річним досвідом
          </p>
          <button
            onClick={() => scrollTo("contact")}
            style={{
              fontFamily: "var(--sans)",
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              background: "var(--secondary)",
              color: "#fff",
              border: "none",
              padding: "18px 48px",
              cursor: "pointer",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
            onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 30px rgba(196,112,75,0.35)"; }}
            onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "none"; }}
          >
            Обрати подорож
          </button>
        </div>
        {/* Scroll indicator */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Scroll</span>
          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.4)", animation: "scrollHint 2s ease infinite" }} />
        </div>
      </section>

      {/* ============ ABOUT ============ */}
      <section id="about" style={{ padding: "140px 48px", maxWidth: 1340, margin: "0 auto" }}>
        <MonoLabel>01 — Про нас</MonoLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, marginTop: 48, alignItems: "start" }}>
          {/* Left — text */}
          <div style={{ paddingTop: 20 }}>
            <h2
              style={{
                fontFamily: "var(--serif)",
                fontSize: "clamp(36px, 4vw, 52px)",
                fontWeight: 400,
                lineHeight: 1.12,
                marginBottom: 32,
                letterSpacing: "-0.02em",
              }}
            >
              Meridian Travel —<br />
              ваш компас у світі<br />
              подорожей
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.75, color: "var(--muted)", marginBottom: 24, fontWeight: 300 }}>
              Ми створюємо подорожі, які змінюють перспективу. Кожен маршрут — це авторська історія,
              побудована на глибокому знанні місцевої культури, перевірених партнерах та увазі до найдрібніших деталей.
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.75, color: "var(--muted)", marginBottom: 56, fontWeight: 300 }}>
              Наша команда особисто відвідала кожну локацію, яку ми пропонуємо. Ми не продаємо тури з каталогу —
              ми проектуємо досвід, який залишається з вами назавжди.
            </p>
            {/* Stats */}
            <div style={{ display: "flex", gap: 56 }}>
              {[
                { num: "15+", label: "років досвіду" },
                { num: "2000+", label: "задоволених клієнтів" },
                { num: "50+", label: "країн світу" },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 44, color: "var(--accent)", lineHeight: 1 }}>{s.num}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.06em", marginTop: 8, textTransform: "uppercase" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Right — stacked photos */}
          <AboutPhotos />
        </div>
      </section>

      {/* ============ SERVICES ============ */}
      <section id="services" style={{ padding: "120px 48px", background: "var(--sand)" }}>
        <div style={{ maxWidth: 1340, margin: "0 auto" }}>
          <MonoLabel>02 — Послуги</MonoLabel>
          <h2
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(36px, 4vw, 52px)",
              fontWeight: 400,
              lineHeight: 1.12,
              marginTop: 24,
              marginBottom: 56,
              letterSpacing: "-0.02em",
            }}
          >
            Що ми створюємо
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gridTemplateRows: "280px 280px 320px",
              gap: 20,
            }}
          >
            <ServiceCardInline title={SERVICES[0].title} desc={SERVICES[0].desc} img={SERVICES[0].img} gridStyle={{ gridRow: "1 / 3" }} tall />
            <ServiceCardInline title={SERVICES[1].title} desc={SERVICES[1].desc} img={SERVICES[1].img} gridStyle={{}} />
            <ServiceCardInline title={SERVICES[2].title} desc={SERVICES[2].desc} img={SERVICES[2].img} gridStyle={{}} />
            <ServiceCardInline title={SERVICES[3].title} desc={SERVICES[3].desc} img={SERVICES[3].img} gridStyle={{ gridColumn: "1 / 3" }} />
          </div>
        </div>
      </section>

      {/* ============ GALLERY ============ */}
      <section id="gallery" style={{ padding: "120px 0 120px 48px" }}>
        <div style={{ maxWidth: 1340, margin: "0 auto 0 auto" }}>
          <MonoLabel>03 — Галерея</MonoLabel>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 24, marginBottom: 48, paddingRight: 48 }}>
            <h2
              className=""
              style={{
                fontFamily: "var(--serif)",
                fontSize: "clamp(36px, 4vw, 52px)",
                fontWeight: 400,
                lineHeight: 1.12,
                letterSpacing: "-0.02em",
              }}
            >
              Наші напрямки
            </h2>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", letterSpacing: "0.06em" }}>DRAG TO EXPLORE →</span>
          </div>
        </div>
        <div
          ref={galleryRef}
          className="gallery-scroll"
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onMouseMove={onMouseMove}
          style={{
            display: "flex",
            gap: 24,
            overflowX: "auto",
            paddingBottom: 24,
            paddingRight: 48,
            cursor: "grab",
            userSelect: "none",
          }}
        >
          {DESTINATIONS.map((d, i) => (
            <div
              key={i}
              className=""
              style={{
                minWidth: 380,
                flexShrink: 0,
                position: "relative",
                overflow: "hidden",
                background: "var(--sand)",
                transitionDelay: `${i * 0.1}s`,
              }}
            >
              <div style={{ height: 440, overflow: "hidden" }}>
                <img
                  src={d.img}
                  alt={d.name}
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    transition: "transform 0.6s ease",
                    pointerEvents: "none",
                  }}
                  onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
                  onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                />
              </div>
              <div style={{ padding: "24px 28px 28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <h3 style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 400 }}>{d.name}</h3>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--secondary)", fontWeight: 700 }}>{d.price}</span>
                </div>
                <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5, fontWeight: 300 }}>{d.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ REVIEWS ============ */}
      <section id="reviews" style={{ padding: "120px 48px", background: "var(--sand)" }}>
        <div style={{ maxWidth: 1340, margin: "0 auto" }}>
          <MonoLabel>04 — Відгуки</MonoLabel>
          <h2
            className=""
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(36px, 4vw, 52px)",
              fontWeight: 400,
              lineHeight: 1.12,
              marginTop: 24,
              marginBottom: 64,
              letterSpacing: "-0.02em",
            }}
          >
            Що кажуть клієнти
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 1fr", gap: 40, alignItems: "start" }}>
            {REVIEWS.map((r, i) => (
              <div
                key={i}
                className=""
                style={{
                  background: i === 1 ? "var(--accent)" : "var(--ground)",
                  padding: "48px 40px",
                  marginTop: i === 1 ? 60 : i === 2 ? 30 : 0,
                  transitionDelay: `${i * 0.15}s`,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 80,
                    lineHeight: 0.8,
                    color: i === 1 ? "rgba(255,255,255,0.2)" : "var(--sand)",
                    display: "block",
                    marginBottom: 16,
                  }}
                >
                  &ldquo;
                </span>
                <p
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 19,
                    lineHeight: 1.65,
                    fontStyle: "italic",
                    color: i === 1 ? "#fff" : "var(--ink)",
                    marginBottom: 32,
                  }}
                >
                  {r.text}
                </p>
                <div>
                  <div style={{ fontFamily: "var(--sans)", fontSize: 14, fontWeight: 600, color: i === 1 ? "#fff" : "var(--ink)" }}>{r.name}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: i === 1 ? "rgba(255,255,255,0.6)" : "var(--muted)", marginTop: 4, letterSpacing: "0.04em" }}>{r.dest}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CONTACT ============ */}
      <section id="contact" style={{ padding: "120px 48px", background: "var(--ground)" }}>
        <div style={{ maxWidth: 1340, margin: "0 auto" }}>
          <MonoLabel>05 — Контакти</MonoLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 100, marginTop: 48 }}>
            {/* Left — contact info */}
            <div className="">
              <h2
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: "clamp(36px, 4vw, 52px)",
                  fontWeight: 400,
                  lineHeight: 1.12,
                  marginBottom: 40,
                  letterSpacing: "-0.02em",
                }}
              >
                Давайте
                <br />
                спланує-
                <br />
                мо разом
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <ContactLine label="Телефон" value="+380 44 123 4567" />
                <ContactLine label="Email" value="hello@meridiantravel.ua" />
                <ContactLine label="Адреса" value="Київ, вул. Хрещатик 22, оф. 15" />
                <ContactLine label="Графік" value="Пн—Пт: 09:00—19:00, Сб: 10:00—16:00" />
              </div>
              <div style={{ marginTop: 48, display: "flex", gap: 28 }}>
                {["Instagram", "Facebook", "Telegram", "YouTube"].map((s) => (
                  <a
                    key={s}
                    href="#"
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      textDecoration: "none",
                      transition: "color 0.3s",
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "var(--accent)")}
                    onMouseLeave={(e) => (e.target.style.color = "var(--muted)")}
                  >
                    {s}
                  </a>
                ))}
              </div>
            </div>
            {/* Right — form */}
            <div className="" style={{ background: "var(--sand)", padding: "56px 48px" }}>
              {formSent ? (
                <div style={{ textAlign: "center", padding: "80px 0" }}>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 42, color: "var(--accent)", marginBottom: 16 }}>Дякуємо!</div>
                  <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.6 }}>
                    Вашу заявку отримано. Наш менеджер зв'яжеться
                    <br />
                    з вами протягом 2 годин.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <h3 style={{ fontFamily: "var(--serif)", fontSize: 28, fontWeight: 400, marginBottom: 40 }}>Залишити заявку</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px 28px" }}>
                    <FormField
                      label="Ім'я"
                      error={formErrors.name}
                      value={formData.name}
                      onChange={(v) => setFormData({ ...formData, name: v })}
                    />
                    <FormField
                      label="Телефон"
                      error={formErrors.phone}
                      value={formData.phone}
                      onChange={(v) => setFormData({ ...formData, phone: v })}
                      type="tel"
                    />
                    <FormField
                      label="Email"
                      error={formErrors.email}
                      value={formData.email}
                      onChange={(v) => setFormData({ ...formData, email: v })}
                      type="email"
                      span2
                    />
                    <FormSelect
                      label="Напрямок подорожі"
                      error={formErrors.destination}
                      value={formData.destination}
                      onChange={(v) => setFormData({ ...formData, destination: v })}
                      options={["Мальдіви", "Балі", "Санторіні", "Кенія Сафарі", "Таїланд", "Єгипет", "Інше"]}
                    />
                    <FormSelect
                      label="Бюджет"
                      value={formData.budget}
                      onChange={(v) => setFormData({ ...formData, budget: v })}
                      options={["до 1 000 $", "1 000 — 3 000 $", "3 000 — 5 000 $", "5 000 — 10 000 $", "понад 10 000 $"]}
                    />
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 10 }}>
                        Коментар
                      </label>
                      <textarea
                        value={formData.comment}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        rows={3}
                        style={{
                          width: "100%",
                          background: "transparent",
                          border: "none",
                          borderBottom: "1px solid rgba(26,26,26,0.15)",
                          fontFamily: "var(--sans)",
                          fontSize: 15,
                          padding: "10px 0",
                          color: "var(--ink)",
                          resize: "vertical",
                          outline: "none",
                          transition: "border-color 0.3s",
                        }}
                        onFocus={(e) => (e.target.style.borderBottomColor = "var(--accent)")}
                        onBlur={(e) => (e.target.style.borderBottomColor = "rgba(26,26,26,0.15)")}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    style={{
                      marginTop: 40,
                      fontFamily: "var(--sans)",
                      fontSize: 14,
                      fontWeight: 500,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      background: "var(--secondary)",
                      color: "#fff",
                      border: "none",
                      padding: "18px 52px",
                      cursor: "pointer",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    }}
                    onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 30px rgba(196,112,75,0.3)"; }}
                    onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "none"; }}
                  >
                    Надіслати заявку
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ padding: "60px 48px", borderTop: "1px solid rgba(26,26,26,0.08)" }}>
        <div style={{ maxWidth: 1340, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 22, marginBottom: 8 }}>Meridian Travel</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.04em" }}>
              &copy; 2026 Meridian Travel. Усі права захищені.
            </div>
          </div>
          <div style={{ display: "flex", gap: 40 }}>
            {[
              { label: "Про нас", id: "about" },
              { label: "Послуги", id: "services" },
              { label: "Напрямки", id: "gallery" },
              { label: "Відгуки", id: "reviews" },
              { label: "Контакти", id: "contact" },
            ].map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={(e) => { e.preventDefault(); scrollTo(l.id); }}
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: 13,
                  color: "var(--muted)",
                  textDecoration: "none",
                  transition: "color 0.3s",
                }}
                onMouseEnter={(e) => (e.target.style.color = "var(--accent)")}
                onMouseLeave={(e) => (e.target.style.color = "var(--muted)")}
              >
                {l.label}
              </a>
            ))}
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["IG", "FB", "TG", "YT"].map((s) => (
              <a
                key={s}
                href="#"
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  color: "var(--muted)",
                  textDecoration: "none",
                  transition: "color 0.3s",
                }}
                onMouseEnter={(e) => (e.target.style.color = "var(--accent)")}
                onMouseLeave={(e) => (e.target.style.color = "var(--muted)")}
              >
                {s}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}

/* ============ SUB-COMPONENTS ============ */

function NavLink({ children, onClick, light }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        fontFamily: "var(--sans)",
        fontSize: 13,
        fontWeight: 400,
        letterSpacing: "0.04em",
        color: light ? "rgba(255,255,255,0.85)" : "var(--ink)",
        cursor: "pointer",
        transition: "color 0.3s",
        padding: "4px 0",
      }}
      onMouseEnter={(e) => (e.target.style.color = light ? "#fff" : "var(--accent)")}
      onMouseLeave={(e) => (e.target.style.color = light ? "rgba(255,255,255,0.85)" : "var(--ink)")}
    >
      {children}
    </button>
  );
}

function AboutPhotos() {
  const [ref, vis] = useInView(0.1);
  return (
    <div ref={ref} style={{ position: "relative", height: 620 }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "85%",
          height: 400,
          overflow: "hidden",
          opacity: vis ? 1 : 0,
          transform: vis ? "translateY(0)" : "translateY(30px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        <img src={PHOTOS.santorini} alt="Санторіні" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "55%",
          height: 280,
          overflow: "hidden",
          border: "6px solid var(--ground)",
          opacity: vis ? 1 : 0,
          transform: vis ? "translateY(0)" : "translateY(30px)",
          transition: "opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s",
        }}
      >
        <img src={PHOTOS.temple} alt="Храм на Балі" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    </div>
  );
}

function ServiceCardInline({ title, desc, img, gridStyle, tall }) {
  const [hovered, setHovered] = useState(false);
  const [ref, vis] = useInView(0.05);
  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        opacity: vis ? 1 : 0,
        transform: vis ? "scale(1)" : "scale(0.96)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
        ...gridStyle,
      }}
    >
      <img
        src={img}
        alt={title}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          transition: "transform 0.8s ease",
          transform: hovered ? "scale(1.07)" : "scale(1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: hovered
            ? "linear-gradient(to top, rgba(26,26,26,0.85) 0%, rgba(26,26,26,0.3) 50%, transparent 100%)"
            : "linear-gradient(to top, rgba(26,26,26,0.6) 0%, transparent 60%)",
          transition: "background 0.5s ease",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: tall ? "48px 36px" : "32px 28px",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--serif)",
            fontSize: tall ? 32 : 24,
            color: "#fff",
            fontWeight: 400,
            marginBottom: hovered ? 12 : 0,
            transition: "margin 0.4s ease",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: "var(--sans)",
            fontSize: 14,
            color: "rgba(255,255,255,0.8)",
            lineHeight: 1.5,
            fontWeight: 300,
            maxHeight: hovered ? 100 : 0,
            opacity: hovered ? 1 : 0,
            overflow: "hidden",
            transition: "all 0.5s ease",
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

function MonoLabel({ children }) {
  return (
    <div
      className=""
      style={{
        fontFamily: "var(--mono)",
        fontSize: 12,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--accent)",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function ServiceCard({ title, desc, img, style, tall }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className=""
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        ...style,
      }}
    >
      <img
        src={img}
        alt={title}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          transition: "transform 0.8s ease",
          transform: hovered ? "scale(1.07)" : "scale(1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: hovered
            ? "linear-gradient(to top, rgba(26,26,26,0.85) 0%, rgba(26,26,26,0.3) 50%, transparent 100%)"
            : "linear-gradient(to top, rgba(26,26,26,0.6) 0%, transparent 60%)",
          transition: "background 0.5s ease",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: tall ? "48px 36px" : "32px 28px",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--serif)",
            fontSize: tall ? 32 : 24,
            color: "#fff",
            fontWeight: 400,
            marginBottom: hovered ? 12 : 0,
            transition: "margin 0.4s ease",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: "var(--sans)",
            fontSize: 14,
            color: "rgba(255,255,255,0.8)",
            lineHeight: 1.5,
            fontWeight: 300,
            maxHeight: hovered ? 100 : 0,
            opacity: hovered ? 1 : 0,
            overflow: "hidden",
            transition: "all 0.5s ease",
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, error, type = "text", span2 }) {
  return (
    <div style={{ gridColumn: span2 ? "1 / -1" : undefined }}>
      <label
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: error ? "var(--secondary)" : "var(--muted)",
          display: "block",
          marginBottom: 10,
          transition: "color 0.3s",
        }}
      >
        {label} {error && "*"}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          borderBottom: `1px solid ${error ? "var(--secondary)" : "rgba(26,26,26,0.15)"}`,
          fontFamily: "var(--sans)",
          fontSize: 15,
          padding: "10px 0",
          color: "var(--ink)",
          outline: "none",
          transition: "border-color 0.3s",
        }}
        onFocus={(e) => (e.target.style.borderBottomColor = "var(--accent)")}
        onBlur={(e) => (e.target.style.borderBottomColor = error ? "var(--secondary)" : "rgba(26,26,26,0.15)")}
      />
    </div>
  );
}

function FormSelect({ label, value, onChange, options, error }) {
  return (
    <div>
      <label
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: error ? "var(--secondary)" : "var(--muted)",
          display: "block",
          marginBottom: 10,
        }}
      >
        {label} {error && "*"}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          borderBottom: `1px solid ${error ? "var(--secondary)" : "rgba(26,26,26,0.15)"}`,
          fontFamily: "var(--sans)",
          fontSize: 15,
          padding: "10px 0",
          color: value ? "var(--ink)" : "var(--muted)",
          outline: "none",
          cursor: "pointer",
          appearance: "none",
          borderRadius: 0,
          transition: "border-color 0.3s",
        }}
        onFocus={(e) => (e.target.style.borderBottomColor = "var(--accent)")}
        onBlur={(e) => (e.target.style.borderBottomColor = error ? "var(--secondary)" : "rgba(26,26,26,0.15)")}
      >
        <option value="" disabled>
          Оберіть...
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function ContactLine({ label, value }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 400, color: "var(--ink)" }}>{value}</div>
    </div>
  );
}
