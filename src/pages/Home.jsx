import { useState, useEffect } from 'react'
import Header from '../components/Header.jsx'
import Modal from '../components/Modal.jsx'
import { addApplication } from '../store.js'
import { getContent } from '../content.js'

// ── Figma assets ──────────────────────────────────────────────────────────────
const LOGO_URL        = 'https://www.figma.com/api/mcp/asset/27a5afbe-3022-44d7-b205-43cb233220e7'
// Hero
const HERO_IMG1       = 'https://www.figma.com/api/mcp/asset/8c99f5ed-3ebc-45a7-9ebc-e70ea52d4b20'
const HERO_IMG2       = 'https://www.figma.com/api/mcp/asset/87ee1501-5f0d-4a6f-9423-57375042f801'
const HERO_IMG3       = 'https://www.figma.com/api/mcp/asset/b0b1eb67-ce02-4cb9-81a9-3c169222eb74'
// Video
const VIDEO_BG        = 'https://www.figma.com/api/mcp/asset/0d99f657-76bd-48bc-bcf6-867ca78a4f8d'
const VIDEO_PLAY_ICON = 'https://www.figma.com/api/mcp/asset/75a332b7-04ff-439b-95f0-505210e15cbc'
// About
const ABOUT_IMG1      = 'https://www.figma.com/api/mcp/asset/fd0a68f1-9bb3-4ae3-a6f5-49a8af4ce842'
const ABOUT_IMG2      = 'https://www.figma.com/api/mcp/asset/d52cefff-fdf0-4a8b-bc04-c8749aa4be1a'
const ABOUT_IMG3      = 'https://www.figma.com/api/mcp/asset/d77f3785-fe3e-4152-96cb-d5bfa902a741'
const ABOUT_DOODLE    = 'https://www.figma.com/api/mcp/asset/5247320f-15b3-4213-abf3-0604eb61b768'
const BADGE_ENGL_IC   = 'https://www.figma.com/api/mcp/asset/5e174cab-c158-43c6-a5b7-76d96e5bf816'
const BADGE_MUSIC_IC  = 'https://www.figma.com/api/mcp/asset/55636bab-6a02-4858-a6e9-9cc62f78beda'
const BADGE_SPORT_IC  = 'https://www.figma.com/api/mcp/asset/74496565-f426-46af-89d4-23d0decf5276'
// Why us
const WHYUS_IMG       = 'https://www.figma.com/api/mcp/asset/47269492-9eb3-42d6-9deb-b016597f7c0b'
const WHYUS_ICON1     = 'https://www.figma.com/api/mcp/asset/8c181cc3-a520-4258-9af5-e1f08a7e44fa'   // individual
const WHYUS_ICON2     = 'https://www.figma.com/api/mcp/asset/1366ee4e-562e-4c2b-8af0-64fb0a5c8cbd'   // complex
const WHYUS_ICON3     = 'https://www.figma.com/api/mcp/asset/be8baccd-6e34-486e-818c-cae5640895ab'   // safety
const WHYUS_ICON4     = 'https://www.figma.com/api/mcp/asset/8cb9118d-3e48-4a35-aa92-d7e9b66b63d6'   // school prep
// Programs grid photos
const PROG_IMG1       = 'https://www.figma.com/api/mcp/asset/ff086616-0b0a-4390-9f09-e85690e12208'
const PROG_IMG2       = 'https://www.figma.com/api/mcp/asset/c858ed82-4f87-47a1-9dfa-40f6da314ba1'
const PROG_IMG3       = 'https://www.figma.com/api/mcp/asset/93ef0f59-797c-4663-954c-267986a67e70'
const PROG_IMG4       = 'https://www.figma.com/api/mcp/asset/58967da3-abf6-48d1-952f-fe7da249b6ce'
const PROG_IMG5       = 'https://www.figma.com/api/mcp/asset/89862f5e-105a-4a82-beb4-b5c418a9055d'
const PROG_IMG6       = 'https://www.figma.com/api/mcp/asset/dd695070-80a1-4c76-a4ab-1b1f855bc5a0'
// Reviews
const REV_IMG1        = 'https://www.figma.com/api/mcp/asset/526c9d62-0521-4a42-b4f7-5efadc68581b'
const REV_IMG2        = 'https://www.figma.com/api/mcp/asset/566ce47a-7ff8-4acb-b33e-5b767347702c'
// Contact
const CONTACT_IMG     = 'https://www.figma.com/api/mcp/asset/3c5ca595-bf52-4e49-af93-47f4d28d029f'
const SOCIAL_PHONE    = 'https://www.figma.com/api/mcp/asset/dc859f13-1fad-47fd-b237-c010d21c1f3c'
const SOCIAL_TG       = 'https://www.figma.com/api/mcp/asset/cf29f1bd-6ff9-4889-bf59-37c94464aef9'
const SOCIAL_VIBER    = 'https://www.figma.com/api/mcp/asset/abdb7fef-b736-45c1-9210-c068f200537e'
const ARROW_ICON      = 'https://www.figma.com/api/mcp/asset/a91fd039-7052-4e5d-82c6-6bc947ef8d16'

export default function Home() {
  const [showModal, setShowModal] = useState(false)
  const [content, setContent] = useState(() => getContent())

  useEffect(() => {
    const handler = (e) => setContent(e.detail)
    window.addEventListener('contentUpdated', handler)
    return () => window.removeEventListener('contentUpdated', handler)
  }, [])

  return (
    <div style={{ fontFamily: 'Manrope, sans-serif' }}>
      <Header content={content.header} />
      <HeroSection data={content.hero} onCta={() => setShowModal(true)} />
      <VideoSection />
      <AboutSection id="about" onCta={() => setShowModal(true)} />
      <WhyUsSection id="whyus" onCta={() => setShowModal(true)} />
      <ProgramsSection id="programs" onCta={() => setShowModal(true)} />
      <ReviewsSection id="reviews" />
      <ContactSection id="contact" />
      <Footer data={content.footer} contact={content.contact} />
      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </div>
  )
}

/* ─────────────────────────────── HERO ────────────────────────────────────── */
function HeroSection({ data, onCta }) {
  return (
    <section style={{ background: '#FAFAFA', padding: '60px 0 80px', position: 'relative', overflow: 'hidden' }}>
      <div className="hero-inner" style={{ maxWidth: 1160, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 60 }}>
        {/* Left */}
        <div className="hero-left" style={{ flex: '0 0 460px' }}>
          <h1 className="hero-h1" style={{ fontFamily: "'Balsamiq Sans', cursive", fontSize: 80, fontWeight: 400, lineHeight: 0.96, textTransform: 'uppercase', color: '#090909', marginBottom: 24 }}>
            {data.title.split('\n').map((l, i, a) => <span key={i}>{l}{i < a.length - 1 && <br />}</span>)}
          </h1>
          <div style={{ borderLeft: '3px solid #FF696F', paddingLeft: 20, marginBottom: 32 }}>
            <p style={{ fontWeight: 500, fontSize: 18, lineHeight: 1.6, color: '#3A3A3A' }}>{data.subtitle}</p>
          </div>
          <button className="btn-yellow" onClick={onCta}>{data.ctaText} →</button>
        </div>
        {/* Right – photo collage */}
        <div className="hero-right" style={{ flex: 1, position: 'relative', height: 520, minWidth: 420 }}>
          {/* Картки — БЕЗ overflow:hidden щоб бейджі не обрізались */}
          {/* Top-right purple card */}
          <div style={{ position: 'absolute', top: 0, right: 30, width: 220, height: 280, borderRadius: 32, background: '#C5B8FF', overflow: 'hidden' }}>
            <img src={data.image2 || HERO_IMG2} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 32 }} />
          </div>
          {/* Top-left yellow card */}
          <div style={{ position: 'absolute', top: 40, left: 0, width: 210, height: 250, borderRadius: 32, background: '#FFE98D', overflow: 'hidden' }}>
            <img src={data.image3 || HERO_IMG3} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 32 }} />
          </div>
          {/* Bottom pink card */}
          <div style={{ position: 'absolute', bottom: 30, left: 50, width: 300, height: 200, borderRadius: 32, background: '#FF777B', overflow: 'hidden' }}>
            <img src={data.image1 || HERO_IMG1} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 32 }} />
          </div>

          {/* Всі бейджі — позиціоновані відносно hero-right, поза overflow:hidden блоками */}
          <Chip label={data.badge1} style={{ position: 'absolute', top: 22, left: 168, transform: 'rotate(3deg)', zIndex: 20 }} />
          <Chip label={data.badge2} style={{ position: 'absolute', top: 14, right: 42, transform: 'rotate(-5deg)', zIndex: 20 }} />
          <Chip label={data.badge3} style={{ position: 'absolute', bottom: 14, left: 56, transform: 'rotate(10deg)', zIndex: 20 }} />
          <Chip label={data.badge4} style={{ position: 'absolute', bottom: 85, right: 0, transform: 'rotate(-9deg)', zIndex: 20 }} />
          <Chip label={data.badge5} style={{ position: 'absolute', top: 252, right: 60, transform: 'rotate(2deg)', zIndex: 20 }} />

          {/* Зірочки */}
          <span style={{ position: 'absolute', bottom: 150, left: 20, fontSize: 32, color: '#FFD600', fontWeight: 700, zIndex: 5 }}>✦</span>
          <span style={{ position: 'absolute', top: 80, right: -10, fontSize: 22, color: '#FF696F', zIndex: 5 }}>✦</span>
        </div>
      </div>
      {/* Grid bg */}
      <div style={{ position: 'absolute', right: -100, top: 0, width: 300, height: '100%', backgroundImage: 'linear-gradient(rgba(159,167,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(159,167,255,0.15) 1px,transparent 1px)', backgroundSize: '30px 30px', zIndex: 0, pointerEvents: 'none' }} />
    </section>
  )
}

function Chip({ label, style = {} }) {
  return (
    <div style={{ background: 'white', borderRadius: 60, padding: '7px 13px', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', boxShadow: '0 3px 8px rgba(29,31,37,0.1)', zIndex: 10, ...style }}>
      {label}
    </div>
  )
}

/* ─────────────────────────────── VIDEO ────────────────────────────────────── */
function VideoSection() {
  return (
    <section style={{ position: 'relative', height: 800, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src={VIDEO_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.32)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <img src={VIDEO_PLAY_ICON} alt="Play" style={{ width: 86, height: 86, cursor: 'pointer', display: 'block' }} />
      </div>
    </section>
  )
}

/* ─────────────────────────────── ABOUT ────────────────────────────────────── */
function AboutSection({ id, onCta }) {
  return (
    <section id={id} style={{ background: 'white', padding: '100px 0', borderRadius: '64px 64px 0 0', marginTop: -32, position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 60 }}>
        {/* 3 portrait photos */}
        <div className="about-photos" style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
          {[
            { src: ABOUT_IMG1, badge: 'Англійська', badgePos: { top: 20, left: 16 }, badgeIcon: BADGE_ENGL_IC },
            { src: ABOUT_IMG2, badge: 'Музика та Творчість', badgePos: { bottom: 20, left: 14 }, badgeIcon: BADGE_MUSIC_IC },
            { src: ABOUT_IMG3, badge: 'Спорт', badgePos: { top: 20, left: 16 }, badgeIcon: BADGE_SPORT_IC },
          ].map((p, i) => (
            <div key={i} style={{ width: 209, height: 480, borderRadius: 24, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
              <img src={p.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', background: 'white', borderRadius: 100, padding: '7px 12px 7px 8px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 3px 8px rgba(29,31,37,0.1)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', ...p.badgePos }}>
                {p.badgeIcon && <img src={p.badgeIcon} alt="" style={{ width: 21, height: 21, flexShrink: 0 }} />}
                {p.badge}
              </div>
            </div>
          ))}
        </div>

        {/* Text side */}
        <div style={{ flex: 1, paddingLeft: 32, position: 'relative' }}>
          <h2 style={{ fontFamily: "'Balsamiq Sans', cursive", fontSize: 44, fontWeight: 400, lineHeight: 0.96, color: '#090909', marginBottom: 24 }}>
            Про садочок
          </h2>
          <div style={{ marginBottom: 24 }}>
            <span style={{ display: 'inline-block', background: '#e6ecff', color: '#6d77fc', fontWeight: 500, fontSize: 16, padding: '4px 8px', borderRadius: 4 }}>
              Місце, де дитині добре, а батькам спокійно
            </span>
          </div>
          <p style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.6, color: '#3A3A3A', marginBottom: 40 }}>
            Ми — це дитячий садочок і центр розвитку, де кожна дитина отримує увагу, турботу та можливість розкрити свої здібності.
          </p>
          <button className="btn-yellow" onClick={onCta}>Детальніше</button>
          {/* Decorative doodle */}
          <img src={ABOUT_DOODLE} alt="" style={{ position: 'absolute', bottom: -60, right: -20, width: 200, opacity: 0.8, pointerEvents: 'none' }} />
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────── WHY US ────────────────────────────────────── */
function WhyUsSection({ id, onCta }) {
  const features = [
    { icon: WHYUS_ICON1, label: 'Індивідуальний підхід' },
    { icon: WHYUS_ICON2, label: 'Комплексний розвиток' },
    { icon: WHYUS_ICON3, label: 'Безпека та комфорт' },
    { icon: WHYUS_ICON4, label: 'Підготовка до школи' },
  ]
  return (
    <section id={id} style={{ background: 'white', padding: '64px 0 100px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: 141, alignItems: 'center', marginBottom: 80 }}>
          {/* Left */}
          <div style={{ flex: '0 0 460px' }}>
            <h2 style={{ fontFamily: "'Balsamiq Sans', cursive", fontSize: 44, lineHeight: 0.96, color: '#090909', marginBottom: 16 }}>
              Чому нас обирають
            </h2>
            <div style={{ marginBottom: 20 }}>
              <span style={{ display: 'inline-block', background: '#ffe3e3', color: '#ff696f', fontWeight: 500, fontSize: 16, padding: '4px 8px', borderRadius: 4 }}>
                Чому батьки обирають саме «Дочки та синочки»
              </span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.6, color: '#3A3A3A', marginBottom: 32 }}>
              Програма садочка поєднує все, що необхідно для гармонійного розвитку: підготовку до школи, англійську мову, творчі заняття, музику, танці, спорт і роботу з психологом. Ми не перевантажуємо дітей, а допомагаємо їм розвиватися у комфортному темпі через гру, спілкування та цікаві заняття.
            </p>
            <button className="btn-yellow" onClick={onCta}>Ознайомитись з програмою</button>
          </div>
          {/* Right – photo + quote card */}
          <div style={{ flex: 1, position: 'relative', height: 455 }}>
            <img src={WHYUS_IMG} alt="" style={{ position: 'absolute', top: 0, left: 0, width: 311, height: 340, objectFit: 'cover', borderRadius: 16 }} />
            <div style={{ position: 'absolute', top: 74, left: 189, width: 303, background: 'white', borderRadius: 16, padding: 26, boxShadow: '0 3px 7px rgba(29,31,37,0.1)', transform: 'rotate(8.26deg)', zIndex: 2 }}>
              <div style={{ fontSize: 24, color: '#FF696F', marginBottom: 16, lineHeight: 1 }}>"</div>
              <p style={{ fontFamily: 'Onest, sans-serif', fontWeight: 500, fontSize: 16, lineHeight: 1.2, color: '#090909', marginBottom: 16 }}>
                За 15 років роботи нам довірили своїх дітей сотні сімей...
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: '#575a69' }}>
                Багато батьків повертаються до нас знову — приводять молодших дітей, рекомендують садочок друзям та знайомим.
              </p>
            </div>
          </div>
        </div>

        {/* Feature cards row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
          {features.map(f => (
            <div key={f.label} style={{ background: 'white', border: '2px solid #f4f4ff', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={f.icon} alt="" style={{ width: 56, height: 56, objectFit: 'contain' }} />
              </div>
              <p style={{ fontFamily: "'Balsamiq Sans', cursive", fontSize: 20, fontWeight: 400, color: '#090909', lineHeight: 1.2 }}>{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────── PROGRAMS ────────────────────────────────────── */
function ProgramsSection({ id, onCta }) {
  // 2 rows × 4 cells: alternating photo | color-card
  const row1 = [
    { type: 'photo', src: PROG_IMG1 },
    { type: 'card', color: '#9fa7ff', title: 'Групи денного перебування' },
    { type: 'photo', src: PROG_IMG2 },
    { type: 'card', color: '#ff777b', title: 'Підготовка до школи' },
  ]
  const row2 = [
    { type: 'card', color: '#b3d654', title: 'Англійська мова' },
    { type: 'photo', src: PROG_IMG4 },
    { type: 'card', color: '#ffbb45', title: 'Творчість і майстер-класи' },
    { type: 'photo', src: PROG_IMG6 },
  ]

  return (
    <section id={id} style={{ background: '#6d77fc', padding: '120px 0', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 20px' }}>
        <h2 style={{ fontFamily: "'Balsamiq Sans', cursive", fontSize: 95, fontWeight: 400, color: 'white', textTransform: 'uppercase', lineHeight: 0.96, textAlign: 'center', marginBottom: 64 }}>
          НАШІ ПРОГРАМИ
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[row1, row2].map((row, ri) => (
            <div key={ri} className="prog-grid-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, height: 280 }}>
              {row.map((cell, ci) => (
                cell.type === 'photo'
                  ? <div key={ci} className="prog-cell" style={{ borderRadius: 32, overflow: 'hidden', height: '100%' }}>
                      <img src={cell.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                  : <div key={ci} className="prog-cell" style={{ borderRadius: 32, background: cell.color, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24, position: 'relative', overflow: 'hidden' }}>
                      <p style={{ fontFamily: "'Balsamiq Sans', cursive", fontSize: 24, fontWeight: 400, color: 'white', textAlign: 'center', lineHeight: 1.2, position: 'relative', zIndex: 1 }}>{cell.title}</p>
                      <div style={{ width: 44, height: 44, borderRadius: 44, border: '1.8px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, cursor: 'pointer' }}>
                        <span style={{ color: 'white', fontSize: 18 }}>→</span>
                      </div>
                    </div>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', marginTop: 64 }}>
          <div style={{ marginBottom: 24 }}>
            <span style={{ display: 'inline-block', background: '#e6ecff', color: '#6d77fc', fontWeight: 500, fontSize: 16, padding: '4px 8px', borderRadius: 4 }}>
              Створено з турботою
            </span>
          </div>
          <p style={{ color: 'white', fontWeight: 500, fontSize: 16, lineHeight: 1.6, marginBottom: 32, maxWidth: 560, margin: '0 auto 32px' }}>
            Кожен день у садочку наповнений заняттями, які допомагають дитині гармонійно розвиватися, відкривати свої здібності та із задоволенням пізнавати нове.
          </p>
          <button className="btn-yellow" onClick={onCta} style={{ fontSize: 16 }}>Всі послуги →</button>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────── REVIEWS ────────────────────────────────────── */
function ReviewsSection({ id }) {
  const reviews = [
    { name: 'Анна', img: REV_IMG1, text: 'Це найкращій Садочок, який ми могли обрати! Моя донька відвідувала його 4 роки. Індивідуальний підхід, домашня обстановка, дитина з задоволенням щоранку ходила до садочку і для мене це головне!' },
    { name: 'Анна', img: REV_IMG2, text: 'Дуже любимо цей дитячий садочок. Сюди ходив наш старший син, а тепер із 2-х років із задоволенням відвідує і молодша донька. Це саме те місце, якому повністю довіряєш.' },
    { name: 'Анна', img: REV_IMG2, text: 'Дуже любимо цей дитячий садочок. Сюди ходив наш старший син, а тепер із 2-х років із задоволенням відвідує і молодша донька. Це саме те місце, якому повністю довіряєш.' },
  ]
  return (
    <section id={id} style={{ background: 'white', padding: '100px 0 80px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 20px' }}>
        {/* Header row */}
        <div className="rev-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 44 }}>
          <div style={{ width: 360 }}>
            <span style={{ display: 'inline-block', background: '#e6ecff', color: '#6d77fc', fontWeight: 500, fontSize: 16, padding: '4px 8px', borderRadius: 4 }}>
              Довіра, яку ми цінуємо
            </span>
          </div>
          <div style={{ width: 656 }}>
            <h2 style={{ fontFamily: "'Balsamiq Sans', cursive", fontSize: 44, fontWeight: 400, lineHeight: 0.96, color: '#090909', marginBottom: 16 }}>
              Що говорять батьки
            </h2>
            <p style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.6, color: '#3A3A3A' }}>
              Для нас найважливіше — щоб діти із задоволенням приходили до садочка, а батьки були впевнені, що їхня дитина у турботливих та надійних руках.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="rev-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginBottom: 44 }}>
          {reviews.map((r, i) => (
            <ReviewCard key={i} review={r} />
          ))}
        </div>

        <button className="btn-yellow">Всі відгуки →</button>
      </div>
    </section>
  )
}

function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div style={{ background: 'white', borderRadius: 24, padding: 24, boxShadow: '0 3px 20px rgba(94,97,107,0.1)' }}>
      <div style={{ height: 280, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
        <img src={review.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <p style={{ fontFamily: 'Onest, sans-serif', fontWeight: 500, fontSize: 16, color: '#090909', marginBottom: 8 }}>{review.name}</p>
      <p style={{ fontSize: 16, lineHeight: 1.5, color: '#6a6b76', marginBottom: 16, display: expanded ? 'block' : '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {review.text}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: 15, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <span style={{ fontFamily: 'Onest, sans-serif', fontWeight: 500, fontSize: 16, color: '#090909' }}>Більше</span>
        <span style={{ fontSize: 20, color: '#090909', lineHeight: 1 }}>{expanded ? '−' : '+'}</span>
      </div>
    </div>
  )
}

/* ─────────────────────────────── CONTACT ────────────────────────────────────── */
function ContactSection({ id }) {
  const [form, setForm] = useState({ name: '', phone: '', childAge: '', comment: '' })
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState({})

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = true
    if (!form.phone.trim()) errs.phone = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    addApplication({ name: form.name, phone: form.phone, childAge: form.childAge, message: form.comment, program: 'Не вказано' })
    setSent(true)
  }

  return (
    <section id={id} style={{ background: 'white', padding: '80px 0' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 20px' }}>
        {/* Main contact block */}
        <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 560px', gap: 24, marginBottom: 24, minHeight: 480 }}>
          {/* Photo */}
          <div style={{ borderRadius: 24, overflow: 'hidden' }}>
            <img src={CONTACT_IMG} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* Form card */}
          <div style={{ background: 'white', borderRadius: 24, padding: 32, boxShadow: '0 1px 20px rgba(94,97,107,0.1)' }}>
            <a href="/"><img src={LOGO_URL} alt="Дочки та Синочки" style={{ height: 60, marginBottom: 24 }} /></a>
            <div style={{ marginBottom: 16 }}>
              <span style={{ display: 'inline-block', background: '#ffe3e3', color: '#ff696f', fontWeight: 500, fontSize: 16, padding: '4px 8px', borderRadius: 4 }}>
                Запрошуємо на знайомство
              </span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.6, color: '#3A3A3A', marginBottom: 24 }}>
              Приходьте на екскурсію, щоб побачити атмосферу садочка, познайомитися з вихователями та поставити всі запитання.
            </p>

            {sent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <h3 style={{ fontFamily: 'Onest', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Дякуємо!</h3>
                <p style={{ color: '#6B7280', marginBottom: 20 }}>Ми зв'яжемося з вами найближчим часом</p>
                <button className="btn-yellow" onClick={() => setSent(false)}>Ще одна заявка</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { key: 'name', placeholder: "Ім'я" },
                  { key: 'phone', placeholder: 'Номер телефону' },
                  { key: 'childAge', placeholder: 'Вік дитини', isSelect: true },
                  { key: 'comment', placeholder: 'Ваш коментар' },
                ].map(f => (
                  <div key={f.key} style={{ background: '#f5f5f5', borderRadius: 100, padding: '16px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: errors[f.key] ? '1.5px solid #FF696F' : '1.5px solid transparent' }}>
                    {f.isSelect
                      ? <select value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={{ background: 'none', border: 'none', outline: 'none', flex: 1, fontFamily: 'Onest, sans-serif', fontSize: 14, color: form[f.key] ? '#090909' : '#6e6d73', cursor: 'pointer' }}>
                          <option value="">Вік дитини</option>
                          {['2 роки', '3 роки', '4 роки', '5 років', '6 років'].map(o => <option key={o}>{o}</option>)}
                        </select>
                      : <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} style={{ background: 'none', border: 'none', outline: 'none', flex: 1, fontFamily: 'Onest, sans-serif', fontSize: 14, color: '#090909' }} />
                    }
                  </div>
                ))}
                <button type="submit" className="btn-yellow" style={{ marginTop: 4, width: '100%', justifyContent: 'center', height: 62, fontSize: 16, borderRadius: 90 }}>
                  Записати дитину
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Info cards row */}
        <div className="contact-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
          <InfoCard>
            <p style={{ fontFamily: 'Onest, sans-serif', fontWeight: 500, fontSize: 16, marginBottom: 'auto' }}>+38 (097) 095-00-29</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[SOCIAL_PHONE, SOCIAL_TG, SOCIAL_VIBER].map((ic, i) => (
                <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', background: '#ff777b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <img src={ic} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                </div>
              ))}
            </div>
          </InfoCard>
          <InfoCard>
            <p style={{ fontFamily: 'Onest, sans-serif', fontWeight: 500, fontSize: 16, marginBottom: 'auto' }}>dochkitasinochki@ukr.net</p>
            <a href="mailto:dochkitasinochki@ukr.net" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ff777b', fontFamily: 'Onest, sans-serif', fontWeight: 500, fontSize: 16, textDecoration: 'none' }}>
              Напишіть нам <img src={ARROW_ICON} alt="" style={{ width: 17, height: 21 }} />
            </a>
          </InfoCard>
          <InfoCard>
            <div style={{ fontFamily: 'Onest, sans-serif', fontWeight: 500, fontSize: 16, lineHeight: 1.4, marginBottom: 'auto' }}>
              <p>м. Київ, вул. Квіткова, 5В</p>
              <p>Метро Славутич</p>
              <p style={{ marginTop: 4 }}>Пн–Пт: 09:00–18:00</p>
            </div>
            <a href="https://maps.google.com" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ff777b', fontFamily: 'Onest, sans-serif', fontWeight: 500, fontSize: 16, textDecoration: 'none' }}>
              Дивитись на Google Maps <img src={ARROW_ICON} alt="" style={{ width: 17, height: 21 }} />
            </a>
          </InfoCard>
        </div>
      </div>
    </section>
  )
}

function InfoCard({ children }) {
  return (
    <div style={{ background: 'white', border: '2px solid #eff3f5', borderRadius: 24, padding: 32, height: 200, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {children}
    </div>
  )
}

/* ─────────────────────────────── FOOTER ────────────────────────────────────── */
function Footer({ data, contact }) {
  return (
    <footer style={{ background: '#111', padding: '60px 20px 0' }}>
      <div className="footer-inner" style={{ maxWidth: 1160, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr', gap: 40, paddingBottom: 48 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontFamily: 'Onest, sans-serif', fontWeight: 800, fontSize: 20, color: 'white', marginBottom: 8 }}>{data.name}</div>
          <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.6 }}>{data.description}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            {[['📘', data.facebookUrl], ['📸', data.instagramUrl], ['💬', data.telegramUrl]].map(([icon, url]) => (
              <a key={icon} href={url} style={{ width: 36, height: 36, background: '#222', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 16 }}>{icon}</a>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h4 style={{ fontFamily: 'Onest, sans-serif', color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Навігація</h4>
          {[['Про нас', 'about'], ['Програми', 'programs'], ['Відгуки', 'reviews'], ['Контакти', 'contact']].map(([label, anchor]) => (
            <a key={anchor} href={`#${anchor}`} style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 14 }}>{label}</a>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h4 style={{ fontFamily: 'Onest, sans-serif', color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Контакти</h4>
          {[`📍 ${contact.address}`, `📞 ${contact.phone}`, `📧 ${contact.email}`, `🕐 ${contact.hours}`].map(t => (
            <p key={t} style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.6 }}>{t}</p>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h4 style={{ fontFamily: 'Onest, sans-serif', color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Адмін</h4>
          <a href="/admin" style={{ color: '#9FA7FF', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>→ Адмін-панель</a>
        </div>
      </div>
      <div style={{ borderTop: '1px solid #222', padding: '20px 0', textAlign: 'center', maxWidth: 1160, margin: '0 auto' }}>
        <p style={{ color: '#9CA3AF', fontSize: 13 }}>© 2026 {data.name}. Всі права захищені.</p>
      </div>
    </footer>
  )
}
