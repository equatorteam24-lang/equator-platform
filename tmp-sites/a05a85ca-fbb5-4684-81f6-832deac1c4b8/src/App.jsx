import { useState, useEffect, useRef, useCallback } from 'react';

const UNSPLASH = (id, w = 1920) => `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

const IMAGES = {
  hero: UNSPLASH('photo-1507525428034-b723cf961d3e', 1920),
  mission: UNSPLASH('photo-1469854523086-cc02fe5d8800', 1200),
  tanzania: UNSPLASH('photo-1516426122078-c23e76319801', 800),
  brazil: UNSPLASH('photo-1483729558449-99ef09a8c325', 800),
  ukraine: UNSPLASH('photo-1555993539-1732b0258235', 800),
  india: UNSPLASH('photo-1524492412937-b28074a5d7da', 800),
  paris: UNSPLASH('photo-1502602898657-3e91760cbb34', 800),
  conference: UNSPLASH('photo-1540575467063-178a50c2df87', 800),
  motivational: UNSPLASH('photo-1530789253388-582c481c54b0', 900),
  topManagement: UNSPLASH('photo-1464822759023-fed622ff2c3b', 900),
  businessTravel: UNSPLASH('photo-1517457373958-b7bdd4587205', 900),
  familyCorp: UNSPLASH('photo-1602002418816-5c0aeef426aa', 900),
  agroTourism: UNSPLASH('photo-1500595046743-cd271d694d30', 900),
  cruise: UNSPLASH('photo-1548574505-5e239809ee19', 900),
  special1: UNSPLASH('photo-1519167758481-83f550bb49b3', 600),
  special2: UNSPLASH('photo-1492684223066-81342ee5ff30', 600),
  special3: UNSPLASH('photo-1414235077428-338989a2e8c0', 600),
  special4: UNSPLASH('photo-1470229722913-7c0e2dbbafd3', 600),
  special5: UNSPLASH('photo-1519225421980-715cb0215aed', 600),
  stats: UNSPLASH('photo-1539635278303-d4002c07eae3', 1400),
  ctaAccent: UNSPLASH('photo-1506905925346-21bda4d32df4', 1920),
  cta: UNSPLASH('photo-1476514525535-07fb3b4ae5f1', 1920),
  cityPanorama: UNSPLASH('photo-1477959858617-67f85cf4f1df', 1920),
};

/* ─── useInView hook ─── */
function useInView(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); obs.unobserve(el); }
    }, { threshold: 0.15, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, isVisible];
}

/* ─── Animated wrapper ─── */
function Animate({ children, delay = 0, direction = 'up', className = '' }) {
  const [ref, isVisible] = useInView();
  const transforms = { up: 'translateY(60px)', down: 'translateY(-60px)', left: 'translateX(-60px)', right: 'translateX(60px)', none: 'none' };
  return (
    <div ref={ref} className={className} style={{
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'none' : transforms[direction],
      transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
    }}>
      {children}
    </div>
  );
}

/* ─── Modal ─── */
function Modal({ isOpen, onClose }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', company: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Вкажіть ім'я";
    if (!form.phone.trim()) e.phone = 'Вкажіть телефон';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Невірний email';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); onClose(); setForm({ name: '', phone: '', email: '', company: '', message: '' }); }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        {submitted ? (
          <div className="modal-success">
            <div className="modal-success-icon">✓</div>
            <h3>Дякуємо за звернення!</h3>
            <p>Ми зв'яжемося з вами найближчим часом</p>
          </div>
        ) : (
          <>
            <h3 className="modal-title">Отримати концепцію</h3>
            <p className="modal-subtitle">Залиште контакти — ми підготуємо індивідуальну пропозицію для вашого бізнесу</p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <input placeholder="Ваше ім'я *" value={form.name} onChange={e => { setForm({...form, name: e.target.value}); setErrors({...errors, name: ''}); }} />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <input placeholder="Телефон *" value={form.phone} onChange={e => { setForm({...form, phone: e.target.value}); setErrors({...errors, phone: ''}); }} />
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>
              <div className="form-group">
                <input placeholder="Email" value={form.email} onChange={e => { setForm({...form, email: e.target.value}); setErrors({...errors, email: ''}); }} />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>
              <div className="form-group">
                <input placeholder="Компанія" value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
              </div>
              <div className="form-group">
                <textarea placeholder="Розкажіть про ваші побажання" rows={3} value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
              </div>
              <button type="submit" className="btn-primary btn-full">Надіслати запит</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Navbar ─── */
function Navbar({ onCta }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const links = [
    ['about', 'Про нас'],
    ['services', 'Послуги'],
    ['cases', 'Кейси'],
    ['research', 'Дослідження'],
    ['contacts', 'Контакти'],
  ];

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="nav-inner">
        <a href="#" className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="logo-event">Event</span><span className="logo-our">our</span>
          <span className="logo-dot">.</span>
        </a>
        <div className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}>
          {links.map(([id, label]) => (
            <a key={id} onClick={() => scrollTo(id)}>{label}</a>
          ))}
          <button className="btn-primary btn-nav" onClick={() => { setMenuOpen(false); onCta(); }}>Отримати концепцію</button>
        </div>
        <button className={`hamburger ${menuOpen ? 'hamburger-open' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}

/* ─── Hero ─── */
function Hero({ onCta }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setLoaded(true), 200); }, []);

  return (
    <section className="hero">
      <div className="hero-media">
        <video className="hero-video" autoPlay muted loop playsInline poster="https://dlsauceqpbkweuzxuvfc.supabase.co/storage/v1/object/public/site-assets/sites/a05a85ca-fbb5-4684-81f6-832deac1c4b8/chat/1776857410294-image.jpg">
          <source src="https://videos.pexels.com/video-files/3015510/3015510-hd_1920_1080_24fps.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className={`hero-title ${loaded ? 'hero-title-visible' : ''}`}>
            Корпоративні подорожі, які <span className="text-accent-light">змінюють бізнес</span> на краще
          </h1>
          <p className={`hero-desc ${loaded ? 'hero-desc-visible' : ''}`}>
            Створюємо індивідуальні бізнес-тури, мотиваційні поїздки та корпоративні івенти по всьому світу — з чітким фокусом на результат: лояльність клієнтів, ефективність команд і зростання показників.
          </p>
          <div className={`hero-actions ${loaded ? 'hero-actions-visible' : ''}`}>
            <button className="btn-primary btn-hero" onClick={onCta}>Отримати концепцію <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: '8px'}}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Intro / Key Idea ─── */
function Intro() {
  return (
    <section className="intro" id="about">
      <div className="container">
        <div className="intro-grid">
          <Animate direction="left" className="intro-left">
            <span className="section-label">Ключова ідея</span>
            <h2 className="intro-heading">
              Ми не організовуємо поїздки.<br />
              <span className="text-accent">Ми створюємо бізнес-результат</span><br />
              через досвід подорожей.
            </h2>
          </Animate>
          <Animate direction="right" delay={0.2} className="intro-right">
            <p className="intro-text">
              Кожна поїздка — це не просто маршрут. Це продуманий сценарій, який впливає на відносини, мотивацію та поведінку людей.
            </p>
            <p className="intro-text">
              Ми створюємо індивідуальні бізнес-тури, мотиваційні поїздки та корпоративні івенти по всьому світу — з чітким фокусом на результат: лояльність клієнтів, ефективність команд і зростання показників.
            </p>
          </Animate>
        </div>
      </div>
    </section>
  );
}

/* ─── Mission ─── */
function Mission() {
  return (
    <section className="mission-v2" id="about">
      <div className="container">
        <Animate>
          <span className="section-label">Наша місія</span>
          <h2 className="section-title">Відкриваємо для людей і бізнесу<br /><span className="text-accent">новий рівень</span> можливостей</h2>
        </Animate>
        <div className="mission-grid">
          <Animate direction="left" className="mission-image-card">
            <img src={IMAGES.mission} alt="Наша місія" />
            <div className="mission-image-overlay" />
            <div className="mission-image-text">
              <span className="mission-image-label">Досвід, який змінює</span>
              <p>Ми віримо, що саме досвід формує довіру, а довіра створює довгостроковий результат.</p>
            </div>
          </Animate>
          <div className="mission-cards">
            <Animate delay={0.15} className="mission-card">
              <div className="mission-card-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3 className="mission-card-title">Подорожі для бізнесу</h3>
              <p className="mission-card-text">Ми допомагаємо компаніям будувати сильні команди, глибокі відносини з клієнтами та досягати бізнес-цілей через трансформаційний досвід подорожей.</p>
            </Animate>
            <Animate delay={0.3} className="mission-card">
              <div className="mission-card-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </div>
              <h3 className="mission-card-title">Індивідуальні подорожі</h3>
              <p className="mission-card-text">Для індивідуальних мандрівників ми створюємо персональні подорожі, що розширюють горизонти, наповнюють новими емоціями та дозволяють проживати світ по-новому.</p>
            </Animate>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Why Us ─── */
function WhyUs() {
  const advantages = [
    { title: 'Досвід і репутація, перевірені роками', desc: 'Понад 15 років експертизи у бізнес-подорожах для клієнтів різних країн і галузей.', img: IMAGES.motivational },
    { title: 'Бізнес-підхід до кожної подорожі', desc: 'Починаємо не з маршруту, а з вашої цілі — що має змінитися після поїздки.', img: IMAGES.conference },
    { title: 'Повний супровід 24/7', desc: 'Персональний тревел-спеціаліст вирішує все в реальному часі — квитки, стиковки, зміни.', img: IMAGES.businessTravel },
    { title: 'Індивідуальні рішення без шаблонів', desc: 'Кожна подорож створюється під конкретну компанію — з урахуванням цілей і очікувань.', img: IMAGES.topManagement },
    { title: 'Продуманий досвід і сильна команда', desc: 'Локальні гіди та експерти створюють глибокий досвід у кожній локації.', img: IMAGES.cruise },
    { title: 'Надійність і контроль на кожному етапі', desc: 'Офіційна робота за договором, перевірені партнери та повний контроль кожної деталі.', img: IMAGES.agroTourism },
  ];

  return (
    <section className="whyus">
      <div className="container">
        <Animate>
          <div className="whyus-quote-block">
            <span className="section-label">Чому з нами</span>
            <h2 className="whyus-quote">Нам <span className="text-accent">довіряє бізнес</span>, тому що ми робимо складне — простим</h2>
            <p className="whyus-quote-sub">Наші клієнти — власники та топ-менеджери — відзначають 6 ключових переваг роботи з нами.</p>
          </div>
        </Animate>
        <div className="whyus-cards">
          {advantages.map((a, i) => (
            <Animate key={i} delay={i * 0.08} className="whyus-photo-card">
              <img src={a.img} alt={a.title} loading="lazy" />
              <div className="whyus-photo-overlay" />
              <div className="whyus-photo-content">
                <h3 className="whyus-photo-title">{a.title}</h3>
                <p className="whyus-photo-desc">{a.desc}</p>
              </div>
            </Animate>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Accent CTA ─── */
function AccentCta({ onCta }) {
  return (
    <section className="accent-cta">
      <div className="accent-cta-bg" style={{ backgroundImage: `url(${IMAGES.ctaAccent})` }} />
      <div className="accent-cta-fade-top" />
      <div className="accent-cta-fade-bottom" />
      <div className="container accent-cta-inner">
        <Animate>
          <h2 className="accent-cta-heading">Ми можемо все — від <span className="text-accent-light">ідеї до реалізації</span></h2>
          <p className="accent-cta-text">Створюємо корпоративні подорожі будь-якого формату, масштабу та складності — з урахуванням ваших бізнес-цілей, аудиторії та очікуваного результату.</p>
          <button className="btn-primary btn-accent-cta" onClick={onCta}>Отримати концепцію</button>
        </Animate>
      </div>
    </section>
  );
}

/* ─── Services ─── */
function Services({ onCta }) {
  const services = [
    { title: 'Корпоративні мотиваційні подорожі', desc: 'Організовуємо поїздки в будь-яку країну та регіон. Допомагаємо обрати ідеальний напрямок і створюємо подію, яка стає однією з ключових у житті компанії.', img: IMAGES.motivational },
    { title: 'Подорожі для топ-менеджменту та партнерів', desc: 'Експедиції, сходження, спортивні активності, вертолітні тури та унікальні маршрути, що поєднуються з відпочинком у преміальних готелях.', img: IMAGES.topManagement },
    { title: 'Бізнес + Подорож', desc: 'Тренінги, стратегічні сесії, тімбілдинг і навчання інтегруються з подорожами, новими локаціями, гастрономією та культурним досвідом.', img: IMAGES.businessTravel },
    { title: 'Сімейний корпоратив', desc: 'Корпоративні поїздки разом із сім\'ями підвищують лояльність співробітників і формують глибший емоційний зв\'язок із компанією.', img: IMAGES.familyCorp },
    { title: 'Агро- та промисловий туризм', desc: 'Організація візитів на провідні підприємства, ферми, виноробні та виробничі об\'єкти по всьому світу.', img: IMAGES.agroTourism },
    { title: 'Морські круїзи', desc: 'Організовуємо корпоративні круїзи з повним рівнем сервісу 5*. Від локальних маршрутів до міжнародних напрямків.', img: IMAGES.cruise },
  ];

  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (i) => {
    setOpenIndex(openIndex === i ? -1 : i);
  };

  return (
    <section className="services" id="services">
      <div className="container">
        <Animate>
          <span className="section-label">Наші послуги</span>
          <h2 className="section-title">Що ми можемо?<br /><span className="text-accent">Можемо — все.</span></h2>
          <p className="section-subtitle">Наша спеціалізація базується на 6 ключових трендах бізнес-подорожей та реальних задачах бізнесу</p>
        </Animate>
        <div className="services-accordion">
          {services.map((s, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="service-accordion-item">
                <button className="service-accordion-header" onClick={() => toggle(i)}>
                  <span className="service-accordion-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="service-accordion-title">{s.title}</span>
                  <span className={`service-accordion-icon ${isOpen ? 'service-accordion-icon-open' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </span>
                </button>
                <div className={`service-accordion-body ${isOpen ? 'service-accordion-body-open' : ''}`}>
                  <div className="service-accordion-content">
                    <div className="service-accordion-img">
                      <img src={s.img} alt={s.title} loading="lazy" />
                    </div>
                    <div className="service-accordion-text">
                      <p className="service-desc">{s.desc}</p>
                      <button className="btn-service" onClick={onCta}>Розрахувати бюджет <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Special Services ─── */
function SpecialServices() {
  const items = [
    { num: '01', title: 'Унікальні ідеї', desc: 'Запропонуємо унікальні ідеї для вашого формату' },
    { num: '02', title: 'Професійна зйомка', desc: 'Знімемо фільм, який збереже цей досвід назавжди' },
    { num: '03', title: 'Шоу-програма', desc: 'Створимо шоу, яке стане кульмінацією події' },
    { num: '04', title: 'Артисти та зірки', desc: 'Запросимо артиста або зірку та влаштуємо несподіваний концерт' },
    { num: '05', title: 'Гала-вечері', desc: 'Організуємо гала-вечерю в локаціях, які неможливо забути' },
  ];

  return (
    <section className="specials">
      <div className="container">
        <Animate>
          <span className="section-label">Додаткові можливості</span>
          <h2 className="section-title">Додаткові<br /><span className="text-accent">можливості</span></h2>
        </Animate>
        <div className="specials-2row">
          {/* Row 1: card — logo — card */}
          <div className="specials-row-top">
            <Animate delay={0} className="specials-card">
              <div className="specials-card-header">
                <h3 className="specials-card-title">{items[0].title}</h3>
                <span className="specials-card-num">{items[0].num}</span>
              </div>
              <p className="specials-card-desc">{items[0].desc}</p>
            </Animate>

            <Animate delay={0.15} className="specials-center">
              <div className="specials-circle">
                <div className="specials-circle-ring" />
                <div className="specials-circle-inner">
                  <span className="specials-center-logo">
                    <span className="logo-event">Event</span><span className="logo-our">our</span>
                    <span className="logo-dot">.</span>
                  </span>
                </div>
              </div>
            </Animate>

            <Animate delay={0.1} className="specials-card">
              <div className="specials-card-header">
                <h3 className="specials-card-title">{items[1].title}</h3>
                <span className="specials-card-num">{items[1].num}</span>
              </div>
              <p className="specials-card-desc">{items[1].desc}</p>
            </Animate>
          </div>

          {/* Row 2: 3 cards */}
          <div className="specials-row-bottom">
            {items.slice(2).map((item, i) => (
              <Animate key={i} delay={0.2 + i * 0.1} className="specials-card">
                <div className="specials-card-header">
                  <h3 className="specials-card-title">{item.title}</h3>
                  <span className="specials-card-num">{item.num}</span>
                </div>
                <p className="specials-card-desc">{item.desc}</p>
              </Animate>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Cases ─── */
function Cases() {
  const [activeCase, setActiveCase] = useState(0);
  const cases = [
    {
      title: 'Конференція + подорож на Індійський океан',
      location: 'Танзанія',
      people: '28 осіб',
      img: IMAGES.tanzania,
      task: 'Розробити та організувати корпоративну поїздку для клієнтів компанії, яка поєднує бізнес-цілі та відпочинок.',
      solution: 'Підбір маршрутів для учасників з різних міст, організація конференції на узбережжі Індійського океану та дводенне сафарі як ключовий емоційний елемент програми.',
    },
    {
      title: 'Бізнес-тур та медичний обмін досвідом',
      location: 'Бразилія',
      people: '26 осіб',
      img: IMAGES.brazil,
      task: 'Організувати бізнес-тур що поєднує конференцію, професійний візит до медичного закладу та відпочинок.',
      solution: 'Авторський маршрут: Ріо-де-Жанейро + водоспади Ігуасу + узбережжя. Офіційний візит до медичного закладу, політ на вертольоті, відпочинок all inclusive.',
    },
    {
      title: 'Бізнес-івент для топ-менеджменту',
      location: 'Україна, Дніпро — Запоріжжя',
      people: '40 директорів',
      img: IMAGES.ukraine,
      task: 'Організувати нестандартний івент для 40 директорів з подорожжю між містами та нетворкінгом.',
      solution: 'Двопалубний теплохід Дніпро — Запоріжжя, welcome-зона з живою музикою, гала-вечеря, екскурсія на острів Хортиця.',
    },
    {
      title: 'Серія конференцій у 4 містах',
      location: 'Київ, Дніпро, Львів, Івано-Франківськ',
      people: '280 осіб',
      img: IMAGES.conference,
      task: 'Організувати паралельні дводенні конференції в 4 містах з єдиним рівнем якості.',
      solution: 'SPA-готелі з конференц-залами, тематичні сценарії (Burlesque та українські вечорниці), гала-вечері та SPA-програми.',
    },
    {
      title: 'Мотиваційний тур для співробітників',
      location: 'Індія + Мальдіви',
      people: '26 осіб',
      img: IMAGES.india,
      task: 'Мотиваційний тур що поєднує культурний досвід та преміальний пляжний відпочинок.',
      solution: 'Авторський тур "Золотий трикутник Індії" з відвідуванням історичних локацій, потім переліт та відпочинок на Мальдівах all inclusive.',
    },
    {
      title: '3-денний бізнес-етикет у Парижі',
      location: 'Париж, Франція',
      people: '20 осіб VIP',
      img: IMAGES.paris,
      task: 'Навчальний інтенсив з бізнес-етикету для VIP-сегменту.',
      solution: 'Серія лекцій та практичних завдань у реальному середовищі Парижа з досвідченим наставником з бізнес-етикету.',
    },
  ];

  return (
    <section className="cases" id="cases">
      <div className="container">
        <Animate>
          <span className="section-label">Кейси</span>
          <h2 className="section-title">Приклади <span className="text-accent">наших робіт</span></h2>
        </Animate>
        <div className="cases-tabs">
          {cases.map((c, i) => (
            <button key={i} className={`case-tab ${activeCase === i ? 'case-tab-active' : ''}`} onClick={() => setActiveCase(i)}>
              {c.location}
            </button>
          ))}
        </div>
        <div className="case-detail">
          <div className="case-img-wrap">
            <img src={cases[activeCase].img} alt={cases[activeCase].title} key={activeCase} />
            <div className="case-img-info">
              <span className="case-people">{cases[activeCase].people}</span>
            </div>
          </div>
          <div className="case-info">
            <h3 className="case-title">{cases[activeCase].title}</h3>
            <p className="case-location">{cases[activeCase].location}</p>
            <div className="case-block">
              <h4>Задача</h4>
              <p>{cases[activeCase].task}</p>
            </div>
            <div className="case-block">
              <h4>Рішення</h4>
              <p>{cases[activeCase].solution}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Research / Stats ─── */
function Research() {
  const stats = [
    { value: '87%', label: 'керівників відзначають зростання залученості' },
    { value: '10-20%', label: 'збільшення доходу після впровадження' },
    { value: '92%', label: 'підвищення лояльності клієнтів' },
    { value: '3x', label: 'ефективніше за грошові бонуси' },
  ];

  return (
    <section className="research" id="research">
      <div className="research-bg" style={{ backgroundImage: `url(${IMAGES.stats})` }} />
      <div className="research-overlay" />
      <div className="container research-inner">
        <Animate>
          <span className="section-label section-label-light">Чому це працює</span>
          <h2 className="research-heading">Подорожі — це не просто враження.<br />Це <span className="text-accent-light">інвестиція</span> з вимірюваним результатом.</h2>
          <p className="research-subtitle">Бізнес по всьому світу вже використовує корпоративні поїздки як стратегічний інструмент. Ось що показують дані глобальних досліджень:</p>
        </Animate>
        <div className="research-stats">
          {stats.map((s, i) => (
            <Animate key={i} delay={i * 0.15} className="research-stat">
              <span className="research-stat-value">{s.value}</span>
              <span className="research-stat-label">{s.label}</span>
            </Animate>
          ))}
        </div>
        <Animate delay={0.3}>
          <p className="research-conclusion">
            Це не абстрактна статистика — це досвід компаній, які перетворили подорожі на частину своєї бізнес-стратегії. І ми допомагаємо зробити те саме.
          </p>
        </Animate>
      </div>
    </section>
  );
}

/* ─── Partnership ─── */
function Partnership() {
  return (
    <section className="partnership">
      <div className="container">
        <div className="partnership-inner">
          <Animate direction="left" className="partnership-left">
            <span className="section-label">Формат взаємодії</span>
            <h2 className="partnership-heading"><span className="text-accent">Партнерські відносини</span><br />без формальностей</h2>
          </Animate>
          <Animate direction="right" delay={0.2} className="partnership-right">
            <p className="partnership-text">
              Ми беремо на себе всю операційну рутину — від планування до координації всіх процесів, щоб ви могли фокусуватись лише на результаті та стратегічних задачах бізнесу.
            </p>
            <div className="partnership-steps">
              <div className="partnership-step">
                <span className="partnership-step-num">01</span>
                <span className="partnership-step-text">Обговорення цілей та формату</span>
              </div>
              <div className="partnership-step">
                <span className="partnership-step-num">02</span>
                <span className="partnership-step-text">Розробка концепції та бюджету</span>
              </div>
              <div className="partnership-step">
                <span className="partnership-step-num">03</span>
                <span className="partnership-step-text">Організація та координація</span>
              </div>
              <div className="partnership-step">
                <span className="partnership-step-num">04</span>
                <span className="partnership-step-text">Супровід 24/7 під час подорожі</span>
              </div>
            </div>
          </Animate>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CtaSection({ onCta }) {
  return (
    <section className="cta-section-v2" id="contacts">
      <div className="cta-v2-bg" style={{ backgroundImage: `url(${IMAGES.cityPanorama})` }} />
      <div className="cta-v2-fade-top" />
      <div className="cta-v2-fade-bottom" />
      <div className="container cta-v2-inner">
        <Animate>
          <h2 className="cta-v2-heading">Готові створити <span className="text-accent-light">подорож</span>,<br />яка змінить ваш бізнес?</h2>
          <p className="cta-v2-text">Залиште заявку — ми підготуємо індивідуальну концепцію під ваші цілі та бюджет</p>
          <button className="btn-primary btn-accent-cta" onClick={onCta}>Отримати концепцію</button>
        </Animate>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <a href="#" className="nav-logo">
              <span className="logo-event">Event</span><span className="logo-our">our</span>
              <span className="logo-dot">.</span>
            </a>
            <p className="footer-desc">Корпоративні подорожі, які створюють бізнес-результат</p>
          </div>
          <div className="footer-links-group">
            <h4>Навігація</h4>
            <a href="#about">Про нас</a>
            <a href="#services">Послуги</a>
            <a href="#cases">Кейси</a>
            <a href="#contacts">Контакти</a>
          </div>
          <div className="footer-links-group">
            <h4>Контакти</h4>
            <a href="https://www.instagram.com/eventour_project/" target="_blank" rel="noopener noreferrer">Instagram</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Eventour Project. Всі права захищені.</p>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════ APP ═══════════════ */
export default function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Unbounded:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --primary: #961b2b;
  --primary-light: #b22a3a;
  --bg: #ffffff;
  --bg-warm: #f2f2f2;
  --bg-dark: #0c0c0c;
  --text: #1a1a1a;
  --text-light: #555;
  --text-muted: #888;
  --font-heading: 'Unbounded', sans-serif;
  --font-body: 'Inter', -apple-system, sans-serif;
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
}

html { scroll-behavior: smooth; font-size: 16px; }
body { font-family: var(--font-body); color: var(--text); background: var(--bg); line-height: 1.7; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
img { display: block; max-width: 100%; }
a { text-decoration: none; color: inherit; cursor: pointer; }
button { cursor: pointer; border: none; background: none; font-family: inherit; }
input, textarea { font-family: inherit; font-size: 1rem; }

.container { max-width: 1280px; margin: 0 auto; padding: 0 40px; }

.section-label {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--primary);
  margin-bottom: 20px;
}
.section-label-light { color: rgba(255,255,255,0.7); }

.section-title {
  font-family: var(--font-heading);
  font-size: clamp(1.8rem, 3.5vw, 2.6rem);
  font-weight: 600;
  line-height: 1.2;
  color: var(--text);
  margin-bottom: 60px;
}

.section-subtitle {
  font-size: 1.1rem;
  color: var(--text-light);
  max-width: 640px;
  line-height: 1.7;
  margin-bottom: 60px;
}
.section-title + .section-subtitle { margin-top: -40px; }

.text-accent { color: var(--primary); }
.text-accent-light { color: var(--primary-light); }

/* ─── Buttons ─── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16px 40px;
  background: var(--primary);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}
.btn-primary:hover { background: #7a1524; transform: translateY(-3px); box-shadow: 0 8px 30px rgba(150,27,43,0.3); }

.btn-outline {
  display: inline-flex;
  align-items: center;
  padding: 12px 28px;
  border: 1px solid var(--primary);
  color: var(--primary);
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  border-radius: 12px;
  transition: all 0.3s ease;
}
.btn-outline:hover { background: var(--primary); color: #fff; transform: translateY(-3px); box-shadow: 0 8px 30px rgba(150,27,43,0.3); }

.btn-full { width: 100%; }

/* ─── Navbar ─── */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 24px 0;
  background: #fff;
  transition: all 0.4s ease;
}
.navbar-scrolled {
  background: #fff;
  backdrop-filter: blur(20px);
  padding: 14px 0;
  box-shadow: 0 1px 0 rgba(0,0,0,0.06);
}
.nav-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-logo {
  font-family: var(--font-heading);
  font-size: 1.6rem;
  font-weight: 600;
  display: flex;
  align-items: baseline;
}
.logo-event { color: var(--primary); }
.logo-our { color: var(--text); }
.logo-dot { color: var(--primary); font-size: 2rem; line-height: 0; }

.nav-links { display: flex; align-items: center; gap: 36px; }
.nav-links a {
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--text-light);
  transition: color 0.3s ease;
  cursor: pointer;
}
.nav-links a:hover { color: var(--primary); }
.btn-nav { padding: 10px 24px; font-size: 0.82rem; }

.hamburger { display: none; flex-direction: column; gap: 5px; padding: 8px; z-index: 1001; }
.hamburger span { display: block; width: 24px; height: 2px; background: var(--text); transition: all 0.3s ease; }
.hamburger-open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
.hamburger-open span:nth-child(2) { opacity: 0; }
.hamburger-open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

/* ─── Hero ─── */
.hero {
  padding: 100px 24px 24px;
  background: #fff;
}
.hero-media {
  position: relative;
  width: 100%;
  height: calc(100vh - 124px);
  min-height: 600px;
  border-radius: 50px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
.hero-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.1) 100%);
}
.hero-content {
  position: relative;
  z-index: 2;
  text-align: left;
  max-width: 70%;
  padding: 60px 60px;
}

.hero-title {
  font-family: var(--font-heading);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  margin-bottom: 24px;
  opacity: 0;
  transform: translateY(30px);
  transition: all 1s var(--ease) 0.3s;
}
.hero-title-visible { opacity: 1; transform: none; }

.hero-desc {
  font-size: clamp(0.95rem, 1.4vw, 1.1rem);
  color: rgba(255,255,255,0.85);
  line-height: 1.7;
  max-width: 90%;
  margin: 0 0 40px;
  opacity: 0;
  transform: translateY(30px);
  transition: all 1s var(--ease) 0.5s;
}
.hero-desc-visible { opacity: 1; transform: none; }

.hero-actions {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.8s var(--ease) 0.7s;
}
.hero-actions-visible { opacity: 1; transform: none; }
.btn-hero { padding: 18px 48px; font-size: 1rem; }

/* ─── Intro ─── */
.intro {
  padding: 100px 0;
  background: var(--bg);
}
.intro-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
}
.intro-heading {
  font-family: var(--font-heading);
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  font-weight: 600;
  line-height: 1.3;
  color: var(--text);
}
.intro-text {
  font-size: 1.05rem;
  color: var(--text-light);
  line-height: 1.8;
  margin-bottom: 20px;
}

/* ─── Mission V2 ─── */
.mission-v2 {
  padding: 100px 0;
  background: var(--bg);
}
.mission-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  align-items: stretch;
}
.mission-image-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  min-height: 420px;
}
.mission-image-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  inset: 0;
}
.mission-image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%);
}
.mission-image-text {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 36px;
  z-index: 2;
}
.mission-image-label {
  display: inline-block;
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 10px;
}
.mission-image-text p {
  font-size: 0.92rem;
  color: rgba(255,255,255,0.8);
  line-height: 1.6;
}
.mission-cards {
  display: flex;
  flex-direction: column;
  gap: 30px;
}
.mission-card {
  flex: 1;
  background: var(--bg-warm);
  border-radius: 20px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: all 0.4s ease;
}
.mission-card:hover {}
.mission-card-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  color: var(--primary);
}
.mission-card-title {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 14px;
  line-height: 1.3;
}
.mission-card-text {
  font-size: 0.92rem;
  color: var(--text-light);
  line-height: 1.7;
}

/* ─── Why Us ─── */
.whyus {
  padding: 100px 0;
  background: var(--bg-warm);
}
.whyus-quote-block {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}
.whyus-quote {
  font-family: var(--font-heading);
  font-size: clamp(1.6rem, 3vw, 2.4rem);
  font-weight: 600;
  line-height: 1.3;
  color: var(--text);
  margin-bottom: 16px;
}
.whyus-quote-sub {
  font-size: 1.05rem;
  color: var(--text-light);
  line-height: 1.7;
  margin-bottom: 60px;
}
.whyus-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.whyus-photo-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  min-height: 340px;
  cursor: default;
}
.whyus-photo-card img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s var(--ease);
}
.whyus-photo-card:hover img { transform: scale(1.05); }
.whyus-photo-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0) 100%);
}
.whyus-photo-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32px;
  z-index: 2;
}
.whyus-photo-title {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
  line-height: 1.3;
}
.whyus-photo-desc {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.75);
  line-height: 1.6;
}

/* ─── Accent CTA ─── */
.accent-cta {
  position: relative;
  padding: 180px 0 140px;
  overflow: hidden;
}
.accent-cta-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center 40%;
}
.accent-cta-fade-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(to bottom, var(--bg-warm) 0%, rgba(242,242,242,0.7) 50%, rgba(242,242,242,0) 100%);
  z-index: 1;
}
.accent-cta-fade-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30%;
  background: linear-gradient(to top, var(--bg) 0%, rgba(255,255,255,0) 100%);
  z-index: 1;
}
.accent-cta-inner {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 760px;
  margin: 0 auto;
}
.accent-cta-heading {
  font-family: var(--font-heading);
  font-size: clamp(1.8rem, 3.5vw, 2.8rem);
  font-weight: 600;
  color: #fff;
  line-height: 1.25;
  margin-bottom: 20px;
  text-shadow: 0 2px 20px rgba(0,0,0,0.4);
}
.accent-cta-text {
  font-size: 1.1rem;
  color: rgba(255,255,255,0.95);
  line-height: 1.8;
  margin-bottom: 40px;
  text-shadow: 0 1px 10px rgba(0,0,0,0.4);
}
.btn-accent-cta {
  background: #fff;
  color: var(--primary);
  padding: 18px 52px;
  font-size: 1rem;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.btn-accent-cta:hover { background: var(--bg-warm); transform: translateY(-3px); box-shadow: 0 10px 40px rgba(0,0,0,0.3); }

/* ─── Services ─── */
.services {
  padding: 100px 0;
  background: var(--bg);
}
.services-accordion {
  display: flex;
  flex-direction: column;
}
.service-accordion-item {
  border-bottom: 1px solid #e0e0e0;
}
.service-accordion-item:first-child {
  border-top: 1px solid #e0e0e0;
}
.service-accordion-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 28px 8px;
  cursor: pointer;
  transition: color 0.3s ease;
  text-align: left;
}
.service-accordion-header:hover { color: var(--primary); }
.service-accordion-num {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-muted);
  min-width: 36px;
}
.service-accordion-title {
  font-family: var(--font-heading);
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text);
  flex: 1;
  line-height: 1.4;
  transition: color 0.3s ease;
}
.service-accordion-header:hover .service-accordion-title { color: var(--primary); }
.service-accordion-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: transform 0.4s var(--ease);
  flex-shrink: 0;
}
.service-accordion-icon-open {
  transform: rotate(180deg);
}
.service-accordion-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.5s var(--ease);
}
.service-accordion-body-open {
  max-height: 600px;
}
.service-accordion-content {
  display: flex;
  align-items: stretch;
  gap: 40px;
  padding: 0 8px 36px;
}
.service-accordion-img {
  width: 50%;
  min-width: 50%;
  height: 240px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}
.service-accordion-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.service-accordion-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-top: 4px;
}
.service-desc {
  font-size: 0.95rem;
  color: var(--text-light);
  line-height: 1.7;
  margin-bottom: 24px;
}
.btn-service {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 12px 28px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 12px;
  transition: all 0.3s ease;
  width: fit-content;
}
.btn-service:hover { background: #7a1524; transform: translateY(-3px); box-shadow: 0 8px 30px rgba(150,27,43,0.3); }

/* ─── Specials (2-row layout) ─── */
.specials {
  padding: 100px 0;
  background: var(--bg-warm);
}
.specials-2row {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.specials-row-top {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 20px;
  align-items: center;
}
.specials-row-bottom {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.specials-card {
  background: #fff;
  border-radius: 20px;
  padding: 32px;
  transition: all 0.4s ease;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.specials-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.08); }
.specials-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.specials-card-title {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
  line-height: 1.3;
}
.specials-card-num {
  font-family: var(--font-heading);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--primary);
  opacity: 0.5;
  flex-shrink: 0;
}
.specials-card-desc {
  font-size: 0.88rem;
  color: var(--text-light);
  line-height: 1.6;
}

.specials-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
}
.specials-circle {
  position: relative;
  width: 260px;
  height: 260px;
  margin-bottom: 28px;
}
.specials-circle-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(150,27,43,0.15);
  animation: specials-ring-pulse 4s ease-in-out infinite;
}
@keyframes specials-ring-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.06); opacity: 0.5; }
}
.specials-circle-inner {
  position: absolute;
  inset: 16px;
  border-radius: 50%;
  border: 1px solid rgba(150,27,43,0.1);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-warm);
}
.specials-center-logo {
  font-family: var(--font-heading);
  font-size: 1.8rem;
  font-weight: 600;
  display: flex;
  align-items: baseline;
}

/* ─── Cases ─── */
.cases {
  padding: 100px 0;
  background: var(--bg);
}
.cases-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 40px 0;
}
.case-tab {
  padding: 10px 20px;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-light);
  border: 1px solid #ddd;
  border-radius: 12px;
  transition: all 0.3s ease;
}
.case-tab:hover { border-color: var(--primary); color: var(--primary); transform: translateY(-3px); box-shadow: 0 8px 30px rgba(150,27,43,0.15); }
.case-tab-active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
.case-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: start;
}
.case-img-wrap {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 4/3;
}
.case-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.5s ease;
}
.case-img-info {
  position: absolute;
  bottom: 20px;
  left: 20px;
}
.case-people {
  background: rgba(0,0,0,0.7);
  color: #fff;
  padding: 6px 16px;
  font-size: 0.82rem;
  font-weight: 500;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}
.case-title {
  font-family: var(--font-heading);
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
  line-height: 1.3;
}
.case-location {
  font-size: 0.9rem;
  color: var(--primary);
  font-weight: 500;
  margin-bottom: 30px;
}
.case-block { margin-bottom: 24px; }
.case-block h4 {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 10px;
}
.case-block p {
  font-size: 0.95rem;
  color: var(--text-light);
  line-height: 1.7;
}

/* ─── Research ─── */
.research {
  position: relative;
  padding: 100px 0;
  overflow: hidden;
}
.research-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}
.research-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(30,0,0,0.8) 100%);
}
.research-inner { position: relative; z-index: 2; text-align: center; }
.research-heading {
  font-family: var(--font-heading);
  font-size: clamp(2rem, 3.5vw, 2.8rem);
  font-weight: 600;
  color: #fff;
  line-height: 1.3;
  margin-bottom: 16px;
}
.research-subtitle {
  font-size: 1.05rem;
  color: rgba(255,255,255,0.6);
  margin-bottom: 60px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}
.research-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
  margin-bottom: 60px;
}
.research-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  transition: all 0.4s ease;
}
.research-stat:hover {
  background: rgba(255,255,255,0.1);
  transform: translateY(-4px);
}
.research-stat-value {
  font-family: var(--font-heading);
  font-size: 2.8rem;
  font-weight: 600;
  color: var(--primary-light);
  margin-bottom: 10px;
}
.research-stat-label {
  font-size: 0.88rem;
  color: rgba(255,255,255,0.7);
  line-height: 1.5;
  text-align: center;
}
.research-conclusion {
  font-size: 1.1rem;
  color: rgba(255,255,255,0.8);
  line-height: 1.8;
  max-width: 800px;
  margin: 0 auto;
  font-style: italic;
}

/* ─── Partnership ─── */
.partnership {
  padding: 100px 0;
  background: var(--bg);
}
.partnership-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: start;
}
.partnership-heading {
  font-family: var(--font-heading);
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  font-weight: 600;
  line-height: 1.3;
  color: var(--text);
}
.partnership-text {
  font-size: 1.05rem;
  color: var(--text-light);
  line-height: 1.8;
  margin-bottom: 40px;
}
.partnership-steps { display: flex; flex-direction: column; gap: 20px; }
.partnership-step {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  background: var(--bg-warm);
  border-radius: 12px;
  transition: all 0.3s ease;
}
.partnership-step:hover { transform: translateX(8px); }
.partnership-step-num {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--primary);
  opacity: 0.5;
  min-width: 36px;
}
.partnership-step-text {
  font-size: 0.95rem;
  color: var(--text);
  font-weight: 500;
}

/* ─── CTA Section V2 (panorama) ─── */
.cta-section-v2 {
  position: relative;
  padding: 180px 0 140px;
  overflow: hidden;
}
.cta-v2-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center 30%;
}
.cta-v2-fade-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to bottom, var(--bg) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%);
  z-index: 1;
}
.cta-v2-fade-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30%;
  background: linear-gradient(to top, var(--bg-dark) 0%, rgba(12,12,12,0) 100%);
  z-index: 1;
}
.cta-v2-inner {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 760px;
  margin: 0 auto;
}
.cta-v2-heading {
  font-family: var(--font-heading);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 600;
  color: #fff;
  line-height: 1.3;
  margin-bottom: 20px;
  text-shadow: 0 2px 20px rgba(0,0,0,0.5);
}
.cta-v2-text {
  font-size: 1.1rem;
  color: rgba(255,255,255,0.9);
  margin-bottom: 40px;
  text-shadow: 0 1px 10px rgba(0,0,0,0.4);
}

/* ─── Footer ─── */
.footer {
  background: var(--bg-dark);
  padding: 80px 0 40px;
}
.footer-top {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 60px;
  padding-bottom: 60px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.footer-desc {
  font-size: 0.9rem;
  color: rgba(255,255,255,0.4);
  margin-top: 16px;
  line-height: 1.6;
}
.footer-links-group h4 {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
  margin-bottom: 20px;
}
.footer-links-group a {
  display: block;
  font-size: 0.9rem;
  color: rgba(255,255,255,0.6);
  margin-bottom: 12px;
  transition: color 0.3s ease;
}
.footer-links-group a:hover { color: #fff; }
.footer .nav-logo .logo-our { color: #fff; }
.footer-bottom {
  padding-top: 30px;
}
.footer-bottom p {
  font-size: 0.82rem;
  color: rgba(255,255,255,0.3);
}

/* ─── Modal ─── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}
.modal-content {
  background: #fff;
  width: 100%;
  max-width: 500px;
  padding: 48px;
  border-radius: 12px;
  position: relative;
  animation: slideUp 0.4s var(--ease);
}
.modal-close {
  position: absolute;
  top: 16px;
  right: 20px;
  font-size: 1.2rem;
  color: var(--text-muted);
  transition: color 0.3s ease;
}
.modal-close:hover { color: var(--text); }
.modal-title {
  font-family: var(--font-heading);
  font-size: 1.6rem;
  font-weight: 600;
  margin-bottom: 8px;
}
.modal-subtitle {
  font-size: 0.9rem;
  color: var(--text-light);
  margin-bottom: 30px;
  line-height: 1.6;
}
.form-group { margin-bottom: 16px; }
.form-group input, .form-group textarea {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  outline: none;
  transition: border-color 0.3s ease;
  background: #fafafa;
}
.form-group input:focus, .form-group textarea:focus {
  border-color: var(--primary);
  background: #fff;
}
.form-group textarea { resize: vertical; }
.form-error {
  display: block;
  font-size: 0.78rem;
  color: var(--primary);
  margin-top: 4px;
}
.modal-success {
  text-align: center;
  padding: 40px 0;
}
.modal-success-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #e8f5e9;
  color: #2e7d32;
  font-size: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}
.modal-success h3 {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  margin-bottom: 8px;
}
.modal-success p {
  color: var(--text-light);
  font-size: 0.95rem;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }

/* ─── Responsive ─── */
@media (max-width: 1024px) {
  .container { padding: 0 30px; }
  .section-title { margin-bottom: 50px; }
  .section-subtitle { margin-bottom: 50px; }
  .section-title + .section-subtitle { margin-top: -30px; }
  .whyus-quote-sub { margin-bottom: 50px; }
  .research-subtitle { margin-bottom: 50px; }
  .whyus-cards { grid-template-columns: repeat(2, 1fr); }
  .service-accordion-img { width: 50%; min-width: 50%; height: 200px; }
  .specials-row-top, .specials-row-bottom { gap: 20px; }
  .specials-circle { width: 220px; height: 220px; }
  .research-stats { grid-template-columns: repeat(2, 1fr); }
  .footer-top { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 768px) {
  .container { padding: 0 20px; }
  .nav-links {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(255,255,255,0.98);
    backdrop-filter: blur(20px);
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 28px;
  }
  .nav-links-open { display: flex; }
  .nav-links a { color: var(--text) !important; font-size: 1.1rem; }
  .hamburger { display: flex; }
  .hamburger-open span { background: var(--text) !important; }

  .hero { padding: 80px 16px 16px; }
  .hero-media { height: calc(100vh - 96px); min-height: 500px; border-radius: 32px; }
  .hero-content { padding: 40px 32px; }

  .intro-grid { grid-template-columns: 1fr; gap: 40px; }
  .mission-grid { grid-template-columns: 1fr; }
  .mission-image-card { min-height: 300px; }
  .whyus-cards { grid-template-columns: 1fr; }
  .service-accordion-content { flex-direction: column; gap: 20px; }
  .service-accordion-img { width: 100%; min-width: 100%; height: 200px; }
  .service-accordion-title { font-size: 1rem; }
  .specials-row-top {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .specials-row-bottom {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .specials-center { order: -1; padding: 20px; }
  .specials-circle { width: 200px; height: 200px; }
  .specials-card { min-height: auto; }
  .case-detail { grid-template-columns: 1fr; gap: 30px; }
  .research-stats { grid-template-columns: 1fr 1fr; gap: 16px; }
  .partnership-inner { grid-template-columns: 1fr; gap: 40px; }
  .footer-top { grid-template-columns: 1fr; gap: 40px; }

  .cases-tabs { gap: 6px; }
  .case-tab { padding: 8px 14px; font-size: 0.75rem; }

  .mission-v2, .research { padding: 80px 0; }
  .accent-cta, .cta-section-v2 { padding: 140px 0 100px; }
  .whyus, .services, .specials, .partnership, .cases { padding: 80px 0; }
  .whyus-photo-card { min-height: 280px; }
  .intro { padding: 80px 0; }

  .section-title { margin-bottom: 50px; }
  .section-subtitle { margin-bottom: 50px; }
  .section-title + .section-subtitle { margin-top: -30px; }
  .whyus-quote-sub { margin-bottom: 50px; }
  .research-subtitle { margin-bottom: 50px; }

  .modal-content { padding: 32px 24px; }
  .research-stat-value { font-size: 2.2rem; }
}

@media (max-width: 480px) {
  .hero { padding: 76px 12px 12px; }
  .hero-media { border-radius: 24px; }
  .hero-content { padding: 32px 24px; }
  .specials-circle { width: 180px; height: 180px; }
  .research-stats { grid-template-columns: 1fr; }
}
      `}</style>

      <Navbar onCta={openModal} />
      <Hero onCta={openModal} />
      <Mission />
      <WhyUs />
      <AccentCta onCta={openModal} />
      <Services onCta={openModal} />
      <SpecialServices />
      <Cases />
      <Research />
      <Partnership />
      <CtaSection onCta={openModal} />
      <Footer />
      <Modal isOpen={modalOpen} onClose={closeModal} />
    </>
  );
}
