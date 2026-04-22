import React, { useState, useEffect, useRef } from 'react';

const PHONE = '+380 44 123 45 67';
const EMAIL = 'info@stomatdental.ua';
const ADDRESS = 'м. Київ, вул. Хрещатик, 22';

const services = [
  {
    icon: '🦷',
    title: 'Лікування зубів',
    desc: 'Сучасне лікування карієсу, пульпіту та періодонтиту з використанням мікроскопа та біосумісних матеріалів.',
    price: 'від 1 200 ₴',
  },
  {
    icon: '✨',
    title: 'Естетична стоматологія',
    desc: 'Вініри, відбілювання, реставрація — створюємо посмішку вашої мрії з ідеальною формою та кольором.',
    price: 'від 3 500 ₴',
  },
  {
    icon: '🔩',
    title: 'Імплантація',
    desc: 'Встановлення імплантів Straumann та Nobel Biocare з гарантією приживлення та пожиттєвою гарантією.',
    price: 'від 18 000 ₴',
  },
  {
    icon: '👑',
    title: 'Протезування',
    desc: 'Коронки, мости, знімні протези — відновлення функції та естетики зубного ряду будь-якої складності.',
    price: 'від 5 000 ₴',
  },
  {
    icon: '🧹',
    title: 'Професійна гігієна',
    desc: 'Ультразвукове чищення, Air-Flow, полірування — комплексна процедура для здоров\'я ясен та білосніжної посмішки.',
    price: 'від 1 500 ₴',
  },
  {
    icon: '📐',
    title: 'Ортодонтія',
    desc: 'Брекет-системи та елайнери для вирівнювання зубів. Індивідуальний план лікування для дітей та дорослих.',
    price: 'від 25 000 ₴',
  },
];

const doctors = [
  {
    name: 'Олександр Петренко',
    role: 'Головний лікар, хірург-імплантолог',
    exp: '18 років досвіду',
    img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80',
  },
  {
    name: 'Марія Коваленко',
    role: 'Стоматолог-терапевт',
    exp: '12 років досвіду',
    img: 'https://images.unsplash.com/photo-1594824476967-48c8b964c667?w=400&q=80',
  },
  {
    name: 'Андрій Шевченко',
    role: 'Ортодонт',
    exp: '10 років досвіду',
    img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80',
  },
  {
    name: 'Ірина Бондаренко',
    role: 'Стоматолог-ортопед',
    exp: '14 років досвіду',
    img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
  },
];

const reviews = [
  {
    name: 'Олена М.',
    text: 'Дуже задоволена результатом відбілювання! Персонал уважний, все пояснили. Тепер посміхаюсь без сорому. Дякую команді Стомат.Дентал!',
    rating: 5,
  },
  {
    name: 'Ігор К.',
    text: 'Робив імплантацію у доктора Петренка — все пройшло ідеально. Жодного болю, швидке відновлення. Рекомендую цю клініку всім знайомим.',
    rating: 5,
  },
  {
    name: 'Тетяна В.',
    text: 'Нарешті знайшла свого стоматолога! Марія Коваленко — справжній професіонал. Лікування пройшло комфортно і безболісно.',
    rating: 5,
  },
];

const stats = [
  { value: '12 000+', label: 'Задоволених пацієнтів' },
  { value: '15', label: 'Років досвіду' },
  { value: '8', label: 'Лікарів у команді' },
  { value: '98%', label: 'Рекомендують нас' },
];

function useInView(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(el); } },
      { threshold: 0.15, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, isVisible];
}

function AnimatedSection({ children, className = '', delay = 0 }) {
  const [ref, isVisible] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', service: '' });
  const [formErrors, setFormErrors] = useState({});
  const [formSent, setFormSent] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeReview, setActiveReview] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveReview((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Вкажіть ваше ім'я";
    if (!formData.phone.trim()) errors.phone = 'Вкажіть номер телефону';
    else if (!/^[\d\s\+\-\(\)]{10,}$/.test(formData.phone.trim())) errors.phone = 'Невірний формат телефону';
    if (!formData.service) errors.service = 'Оберіть послугу';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setFormSent(true);
      setFormData({ name: '', phone: '', service: '' });
      setTimeout(() => setFormSent(false), 4000);
    }
  };

  const navLinks = [
    ['services', 'Послуги'],
    ['about', 'Про клініку'],
    ['doctors', 'Лікарі'],
    ['reviews', 'Відгуки'],
    ['contacts', 'Контакти'],
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700;800&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
          --primary: #2563EB;
          --primary-dark: #1D4ED8;
          --primary-light: #93C5FD;
          --primary-bg: #EFF6FF;
          --text: #1E293B;
          --text-light: #64748B;
          --white: #FFFFFF;
          --gray-50: #F8FAFC;
          --gray-100: #F1F5F9;
          --gray-200: #E2E8F0;
          --gray-300: #CBD5E1;
          --shadow: 0 4px 24px rgba(37, 99, 235, 0.08);
          --shadow-lg: 0 12px 40px rgba(37, 99, 235, 0.12);
          --radius: 16px;
          --radius-sm: 10px;
        }

        html { scroll-behavior: smooth; }

        body {
          font-family: 'Inter', -apple-system, sans-serif;
          color: var(--text);
          background: var(--white);
          line-height: 1.7;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        /* ===== NAV ===== */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          padding: 20px 0;
          transition: all 0.35s ease;
        }
        .nav.scrolled {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          padding: 12px 0;
          box-shadow: 0 1px 20px rgba(0,0,0,0.06);
        }
        .nav-inner {
          max-width: 1240px; margin: 0 auto; padding: 0 24px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem; font-weight: 800;
          color: var(--primary); text-decoration: none;
          letter-spacing: -0.02em;
        }
        .logo span { color: var(--text); }
        .nav-links { display: flex; gap: 36px; list-style: none; }
        .nav-links a {
          text-decoration: none; color: var(--text-light);
          font-size: 0.9rem; font-weight: 500;
          transition: color 0.3s ease; cursor: pointer;
          position: relative;
        }
        .nav-links a::after {
          content: ''; position: absolute; bottom: -4px; left: 0;
          width: 0; height: 2px; background: var(--primary);
          transition: width 0.3s ease;
        }
        .nav-links a:hover { color: var(--primary); }
        .nav-links a:hover::after { width: 100%; }
        .nav-cta {
          background: var(--primary); color: var(--white);
          border: none; padding: 10px 28px; border-radius: 50px;
          font-size: 0.9rem; font-weight: 600; cursor: pointer;
          transition: all 0.3s ease;
        }
        .nav-cta:hover { background: var(--primary-dark); transform: translateY(-1px); box-shadow: var(--shadow); }
        .burger {
          display: none; flex-direction: column; gap: 5px;
          background: none; border: none; cursor: pointer; padding: 4px;
        }
        .burger span {
          width: 24px; height: 2px; background: var(--text);
          transition: all 0.3s ease; border-radius: 2px;
        }
        .burger.open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
        .burger.open span:nth-child(2) { opacity: 0; }
        .burger.open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

        .mobile-menu {
          display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: var(--white); z-index: 999;
          flex-direction: column; align-items: center; justify-content: center; gap: 32px;
        }
        .mobile-menu.open { display: flex; }
        .mobile-menu a {
          font-size: 1.25rem; font-weight: 600; color: var(--text);
          text-decoration: none; cursor: pointer;
          transition: color 0.3s ease;
        }
        .mobile-menu a:hover { color: var(--primary); }

        /* ===== HERO ===== */
        .hero {
          min-height: 100vh; display: flex; align-items: center;
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, var(--white) 0%, var(--primary-bg) 100%);
        }
        .hero-bg-shape {
          position: absolute; top: -30%; right: -15%;
          width: 800px; height: 800px;
          background: radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%);
          border-radius: 50%;
        }
        .hero-bg-shape-2 {
          position: absolute; bottom: -20%; left: -10%;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(147,197,253,0.1) 0%, transparent 70%);
          border-radius: 50%;
        }
        .hero-inner {
          max-width: 1240px; margin: 0 auto; padding: 120px 24px 80px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
          position: relative; z-index: 1;
          width: 100%;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--white); border: 1px solid var(--gray-200);
          padding: 8px 18px; border-radius: 50px;
          font-size: 0.85rem; color: var(--primary); font-weight: 500;
          margin-bottom: 24px; box-shadow: var(--shadow);
        }
        .hero-badge-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #22C55E; animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
        }
        .hero h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.5rem, 5vw, 3.8rem);
          font-weight: 800; line-height: 1.1;
          letter-spacing: -0.03em; color: var(--text);
          margin-bottom: 24px;
        }
        .hero h1 em {
          font-style: normal; color: var(--primary);
          position: relative;
        }
        .hero h1 em::after {
          content: ''; position: absolute; bottom: 4px; left: 0;
          width: 100%; height: 8px; background: var(--primary-light);
          opacity: 0.3; border-radius: 4px; z-index: -1;
        }
        .hero-text {
          font-size: 1.15rem; color: var(--text-light);
          line-height: 1.8; margin-bottom: 40px; max-width: 500px;
        }
        .hero-actions { display: flex; gap: 16px; flex-wrap: wrap; }
        .btn-primary {
          background: var(--primary); color: var(--white);
          border: none; padding: 16px 36px; border-radius: 50px;
          font-size: 1rem; font-weight: 600; cursor: pointer;
          transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 8px;
        }
        .btn-primary:hover { background: var(--primary-dark); transform: translateY(-2px); box-shadow: var(--shadow-lg); }
        .btn-outline {
          background: transparent; color: var(--text);
          border: 2px solid var(--gray-200); padding: 14px 36px;
          border-radius: 50px; font-size: 1rem; font-weight: 600;
          cursor: pointer; transition: all 0.3s ease;
        }
        .btn-outline:hover { border-color: var(--primary); color: var(--primary); }
        .hero-image {
          position: relative; border-radius: 24px; overflow: hidden;
          aspect-ratio: 4/5; max-height: 560px;
        }
        .hero-image img {
          width: 100%; height: 100%; object-fit: cover;
          display: block;
        }
        .hero-image-overlay {
          position: absolute; bottom: 24px; left: 24px; right: 24px;
          background: rgba(255,255,255,0.92); backdrop-filter: blur(12px);
          border-radius: var(--radius-sm); padding: 20px 24px;
          display: flex; align-items: center; gap: 16px;
        }
        .hero-image-overlay-icon {
          width: 48px; height: 48px; border-radius: 12px;
          background: var(--primary-bg); display: flex;
          align-items: center; justify-content: center; font-size: 1.4rem;
          flex-shrink: 0;
        }
        .hero-image-overlay strong { font-size: 0.95rem; display: block; }
        .hero-image-overlay span { font-size: 0.8rem; color: var(--text-light); }

        /* ===== STATS BAR ===== */
        .stats-bar {
          background: var(--white); padding: 60px 24px;
          border-bottom: 1px solid var(--gray-100);
        }
        .stats-inner {
          max-width: 1240px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px;
        }
        .stat { text-align: center; }
        .stat-value {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 3.5vw, 2.8rem); font-weight: 700;
          color: var(--primary); letter-spacing: -0.02em;
        }
        .stat-label { font-size: 0.9rem; color: var(--text-light); margin-top: 4px; }

        /* ===== SECTIONS COMMON ===== */
        .section { padding: 100px 24px; }
        .section-gray { background: var(--gray-50); }
        .section-inner { max-width: 1240px; margin: 0 auto; }
        .section-header { text-align: center; margin-bottom: 64px; }
        .section-label {
          display: inline-block; font-size: 0.8rem; font-weight: 600;
          color: var(--primary); text-transform: uppercase; letter-spacing: 0.12em;
          margin-bottom: 16px;
        }
        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 3.5vw, 2.8rem); font-weight: 700;
          letter-spacing: -0.02em; color: var(--text);
        }
        .section-subtitle {
          font-size: 1.05rem; color: var(--text-light);
          margin-top: 16px; max-width: 560px; margin-left: auto; margin-right: auto;
        }

        /* ===== SERVICES ===== */
        .services-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
        }
        .service-card {
          background: var(--white); border-radius: var(--radius);
          padding: 40px 32px; border: 1px solid var(--gray-100);
          transition: all 0.35s ease; cursor: default;
          position: relative; overflow: hidden;
        }
        .section-gray .service-card { border-color: var(--gray-200); }
        .service-card:hover {
          transform: translateY(-4px); box-shadow: var(--shadow-lg);
          border-color: var(--primary-light);
        }
        .service-card::before {
          content: ''; position: absolute; top: 0; left: 0;
          width: 100%; height: 3px; background: var(--primary);
          transform: scaleX(0); transition: transform 0.35s ease;
          transform-origin: left;
        }
        .service-card:hover::before { transform: scaleX(1); }
        .service-icon {
          width: 56px; height: 56px; border-radius: 14px;
          background: var(--primary-bg); display: flex;
          align-items: center; justify-content: center;
          font-size: 1.5rem; margin-bottom: 20px;
        }
        .service-card h3 {
          font-size: 1.15rem; font-weight: 700; margin-bottom: 12px;
          letter-spacing: -0.01em;
        }
        .service-card p { font-size: 0.9rem; color: var(--text-light); line-height: 1.7; }
        .service-price {
          display: inline-block; margin-top: 16px; padding: 6px 14px;
          background: var(--primary-bg); border-radius: 50px;
          font-size: 0.85rem; font-weight: 600; color: var(--primary);
        }

        /* ===== ABOUT ===== */
        .about-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
        }
        .about-image {
          border-radius: var(--radius); overflow: hidden;
          aspect-ratio: 4/3;
        }
        .about-image img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .about-content h2 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 700;
          letter-spacing: -0.02em; margin-bottom: 20px;
        }
        .about-content p { color: var(--text-light); margin-bottom: 16px; font-size: 1rem; }
        .features-list { list-style: none; margin-top: 32px; display: flex; flex-direction: column; gap: 16px; }
        .features-list li {
          display: flex; align-items: flex-start; gap: 14px;
          font-size: 0.95rem; font-weight: 500;
        }
        .feature-check {
          width: 28px; height: 28px; border-radius: 8px;
          background: var(--primary-bg); display: flex;
          align-items: center; justify-content: center;
          color: var(--primary); font-size: 0.85rem; flex-shrink: 0;
          font-weight: 700;
        }

        /* ===== DOCTORS ===== */
        .doctors-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;
        }
        .doctor-card {
          border-radius: var(--radius); overflow: hidden;
          background: var(--white); border: 1px solid var(--gray-100);
          transition: all 0.35s ease;
        }
        .doctor-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
        .doctor-photo { aspect-ratio: 3/4; overflow: hidden; }
        .doctor-photo img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.5s ease; display: block;
        }
        .doctor-card:hover .doctor-photo img { transform: scale(1.05); }
        .doctor-info { padding: 20px 24px; }
        .doctor-info h3 { font-size: 1.05rem; font-weight: 700; margin-bottom: 4px; }
        .doctor-info .role { font-size: 0.85rem; color: var(--primary); font-weight: 500; }
        .doctor-info .exp { font-size: 0.8rem; color: var(--text-light); margin-top: 6px; }

        /* ===== REVIEWS ===== */
        .reviews-wrapper { max-width: 720px; margin: 0 auto; text-align: center; }
        .review-card {
          background: var(--white); border-radius: var(--radius);
          padding: 48px 40px; border: 1px solid var(--gray-100);
          box-shadow: var(--shadow); position: relative;
        }
        .review-quote {
          position: absolute; top: 20px; left: 32px;
          font-size: 4rem; color: var(--primary-light); opacity: 0.3;
          font-family: 'Playfair Display', serif; line-height: 1;
        }
        .review-stars { margin-bottom: 20px; font-size: 1.2rem; letter-spacing: 4px; }
        .review-text {
          font-size: 1.1rem; line-height: 1.8; color: var(--text);
          font-style: italic; margin-bottom: 24px;
        }
        .review-author { font-weight: 700; font-size: 1rem; }
        .review-dots { display: flex; gap: 8px; justify-content: center; margin-top: 32px; }
        .review-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: var(--gray-200); border: none; cursor: pointer;
          transition: all 0.3s ease; padding: 0;
        }
        .review-dot.active { background: var(--primary); width: 28px; border-radius: 5px; }

        /* ===== CONTACTS ===== */
        .contacts-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: start;
        }
        .contact-info-block { display: flex; flex-direction: column; gap: 32px; }
        .contact-item { display: flex; gap: 16px; align-items: flex-start; }
        .contact-icon {
          width: 52px; height: 52px; border-radius: 14px;
          background: var(--primary-bg); display: flex;
          align-items: center; justify-content: center;
          font-size: 1.3rem; flex-shrink: 0;
        }
        .contact-item h4 { font-size: 0.85rem; color: var(--text-light); font-weight: 500; margin-bottom: 4px; }
        .contact-item p { font-size: 1rem; font-weight: 600; }
        .contact-item a { color: var(--text); text-decoration: none; transition: color 0.3s; }
        .contact-item a:hover { color: var(--primary); }
        .schedule-badge {
          display: inline-flex; gap: 8px; align-items: center;
          background: var(--primary-bg); border-radius: var(--radius-sm);
          padding: 16px 24px; margin-top: 8px;
        }
        .schedule-badge span { font-size: 0.9rem; color: var(--text); }

        /* ===== FORM ===== */
        .contact-form {
          background: var(--white); border-radius: var(--radius);
          padding: 40px; border: 1px solid var(--gray-100);
          box-shadow: var(--shadow);
        }
        .contact-form h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem; font-weight: 700; margin-bottom: 8px;
        }
        .contact-form > p { font-size: 0.9rem; color: var(--text-light); margin-bottom: 28px; }
        .form-group { margin-bottom: 20px; }
        .form-group label {
          display: block; font-size: 0.85rem; font-weight: 600;
          margin-bottom: 8px; color: var(--text);
        }
        .form-group input, .form-group select {
          width: 100%; padding: 14px 18px; border: 1.5px solid var(--gray-200);
          border-radius: var(--radius-sm); font-size: 0.95rem;
          font-family: inherit; transition: border-color 0.3s ease;
          background: var(--white); color: var(--text);
          outline: none;
        }
        .form-group input:focus, .form-group select:focus {
          border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .form-group input.error, .form-group select.error { border-color: #EF4444; }
        .form-error { color: #EF4444; font-size: 0.8rem; margin-top: 6px; }
        .form-submit {
          width: 100%; padding: 16px; background: var(--primary);
          color: var(--white); border: none; border-radius: var(--radius-sm);
          font-size: 1rem; font-weight: 600; cursor: pointer;
          transition: all 0.3s ease; font-family: inherit;
        }
        .form-submit:hover { background: var(--primary-dark); }
        .form-success {
          text-align: center; padding: 24px;
          color: #16A34A; font-weight: 600; font-size: 1.05rem;
        }

        /* ===== FOOTER ===== */
        .footer {
          background: var(--text); color: rgba(255,255,255,0.7);
          padding: 60px 24px 32px;
        }
        .footer-inner {
          max-width: 1240px; margin: 0 auto;
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 20px;
        }
        .footer-logo {
          font-family: 'Playfair Display', serif; font-size: 1.3rem;
          font-weight: 800; color: var(--white);
        }
        .footer-logo span { color: var(--primary-light); }
        .footer-links { display: flex; gap: 28px; list-style: none; }
        .footer-links a {
          color: rgba(255,255,255,0.6); text-decoration: none;
          font-size: 0.85rem; transition: color 0.3s; cursor: pointer;
        }
        .footer-links a:hover { color: var(--white); }
        .footer-copy {
          width: 100%; text-align: center;
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 24px; margin-top: 32px;
          font-size: 0.8rem;
        }

        /* ===== CTA BANNER ===== */
        .cta-banner {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          padding: 80px 24px; text-align: center;
        }
        .cta-banner h2 {
          font-family: 'Playfair Display', serif; color: var(--white);
          font-size: clamp(1.8rem, 3.5vw, 2.6rem); font-weight: 700;
          margin-bottom: 16px;
        }
        .cta-banner p { color: rgba(255,255,255,0.85); font-size: 1.05rem; margin-bottom: 32px; }
        .btn-white {
          background: var(--white); color: var(--primary);
          border: none; padding: 16px 40px; border-radius: 50px;
          font-size: 1rem; font-weight: 700; cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-white:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.2); }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1024px) {
          .hero-inner { grid-template-columns: 1fr; gap: 40px; text-align: center; }
          .hero-text { margin: 0 auto 40px; }
          .hero-actions { justify-content: center; }
          .hero-image { max-height: 400px; max-width: 400px; margin: 0 auto; }
          .services-grid { grid-template-columns: repeat(2, 1fr); }
          .about-grid { grid-template-columns: 1fr; gap: 40px; }
          .doctors-grid { grid-template-columns: repeat(2, 1fr); }
          .contacts-grid { grid-template-columns: 1fr; }
          .stats-inner { grid-template-columns: repeat(2, 1fr); gap: 32px; }
        }
        @media (max-width: 768px) {
          .nav-links, .nav-cta { display: none; }
          .burger { display: flex; }
          .section { padding: 72px 20px; }
          .services-grid { grid-template-columns: 1fr; }
          .doctors-grid { grid-template-columns: 1fr; }
          .hero h1 { font-size: 2.2rem; }
          .hero-inner { padding: 100px 20px 60px; }
          .review-card { padding: 32px 24px; }
          .contact-form { padding: 28px; }
          .footer-inner { flex-direction: column; text-align: center; }
          .footer-links { flex-wrap: wrap; justify-content: center; }
        }
      `}</style>

      {/* NAV */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <a className="logo" onClick={() => scrollTo('hero')} style={{ cursor: 'pointer' }}>
            Стомат<span>.Дентал</span>
          </a>
          <ul className="nav-links">
            {navLinks.map(([id, label]) => (
              <li key={id}><a onClick={() => scrollTo(id)}>{label}</a></li>
            ))}
          </ul>
          <button className="nav-cta" onClick={() => scrollTo('contacts')}>Записатись</button>
          <button className={`burger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        {navLinks.map(([id, label]) => (
          <a key={id} onClick={() => scrollTo(id)}>{label}</a>
        ))}
        <button className="btn-primary" onClick={() => scrollTo('contacts')}>Записатись</button>
      </div>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-bg-shape" />
        <div className="hero-bg-shape-2" />
        <div className="hero-inner">
          <div>
            <AnimatedSection>
              <div className="hero-badge">
                <div className="hero-badge-dot" />
                Працюємо щодня з 9:00 до 21:00
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <h1>Здорова посмішка —<br />ваша <em>найкраща</em><br />візитівка</h1>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <p className="hero-text">
                Сучасна стоматологічна клініка з 15-річним досвідом. Безболісне лікування,
                передове обладнання та команда професіоналів для вашої ідеальної посмішки.
              </p>
            </AnimatedSection>
            <AnimatedSection delay={0.3}>
              <div className="hero-actions">
                <button className="btn-primary" onClick={() => scrollTo('contacts')}>
                  Записатись на прийом →
                </button>
                <button className="btn-outline" onClick={() => scrollTo('services')}>
                  Наші послуги
                </button>
              </div>
            </AnimatedSection>
          </div>
          <AnimatedSection delay={0.2}>
            <div className="hero-image">
              <img
                src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80"
                alt="Стоматологічна клініка"
              />
              <div className="hero-image-overlay">
                <div className="hero-image-overlay-icon">🏆</div>
                <div>
                  <strong>Топ-10 клінік Києва</strong>
                  <span>за версією пацієнтів 2025</span>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-bar">
        <div className="stats-inner">
          {stats.map((s, i) => (
            <AnimatedSection key={i} delay={i * 0.1} className="stat">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="section section-gray" id="services">
        <div className="section-inner">
          <AnimatedSection>
            <div className="section-header">
              <div className="section-label">Послуги</div>
              <h2 className="section-title">Повний спектр стоматологічних послуг</h2>
              <p className="section-subtitle">
                Від профілактичного огляду до складної імплантації — ми дбаємо про ваші зуби на кожному етапі
              </p>
            </div>
          </AnimatedSection>
          <div className="services-grid">
            {services.map((s, i) => (
              <AnimatedSection key={i} delay={i * 0.08}>
                <div className="service-card">
                  <div className="service-icon">{s.icon}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                  <div className="service-price">{s.price}</div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="section" id="about">
        <div className="section-inner">
          <div className="about-grid">
            <AnimatedSection>
              <div className="about-image">
                <img
                  src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80"
                  alt="Сучасне обладнання клініки"
                />
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.15}>
              <div className="about-content">
                <div className="section-label">Про клініку</div>
                <h2>Ми створюємо посмішки,<br />яким довіряють</h2>
                <p>
                  Клініка Стомат.Дентал — це місце, де передові технології поєднуються
                  з індивідуальним підходом до кожного пацієнта. Ми працюємо з 2011 року
                  і за цей час допомогли понад 12 000 пацієнтів.
                </p>
                <p>
                  Наші лікарі регулярно проходять навчання у провідних європейських клініках
                  та використовують лише сертифіковані матеріали.
                </p>
                <ul className="features-list">
                  <li><div className="feature-check">✓</div> Цифровий 3D-томограф для точної діагностики</li>
                  <li><div className="feature-check">✓</div> Дентальний мікроскоп для мікрохірургії</li>
                  <li><div className="feature-check">✓</div> Безболісна анестезія STA-система</li>
                  <li><div className="feature-check">✓</div> Гарантія на всі види робіт до 5 років</li>
                </ul>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* DOCTORS */}
      <section className="section section-gray" id="doctors">
        <div className="section-inner">
          <AnimatedSection>
            <div className="section-header">
              <div className="section-label">Команда</div>
              <h2 className="section-title">Наші лікарі</h2>
              <p className="section-subtitle">
                Кожен спеціаліст — професіонал із багаторічним досвідом та сотнями вдячних пацієнтів
              </p>
            </div>
          </AnimatedSection>
          <div className="doctors-grid">
            {doctors.map((d, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="doctor-card">
                  <div className="doctor-photo">
                    <img src={d.img} alt={d.name} />
                  </div>
                  <div className="doctor-info">
                    <h3>{d.name}</h3>
                    <div className="role">{d.role}</div>
                    <div className="exp">{d.exp}</div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="section" id="reviews">
        <div className="section-inner">
          <AnimatedSection>
            <div className="section-header">
              <div className="section-label">Відгуки</div>
              <h2 className="section-title">Що кажуть наші пацієнти</h2>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <div className="reviews-wrapper">
              <div className="review-card">
                <div className="review-quote">"</div>
                <div className="review-stars">{'★'.repeat(reviews[activeReview].rating)}</div>
                <p className="review-text">{reviews[activeReview].text}</p>
                <div className="review-author">{reviews[activeReview].name}</div>
              </div>
              <div className="review-dots">
                {reviews.map((_, i) => (
                  <button
                    key={i}
                    className={`review-dot ${i === activeReview ? 'active' : ''}`}
                    onClick={() => setActiveReview(i)}
                    aria-label={`Відгук ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="cta-banner">
        <AnimatedSection>
          <h2>Запишіться на безкоштовну консультацію</h2>
          <p>Перший огляд та план лікування — безкоштовно. Зробіть перший крок до здорової посмішки.</p>
          <button className="btn-white" onClick={() => scrollTo('contacts')}>
            Записатись зараз →
          </button>
        </AnimatedSection>
      </section>

      {/* CONTACTS */}
      <section className="section section-gray" id="contacts">
        <div className="section-inner">
          <AnimatedSection>
            <div className="section-header">
              <div className="section-label">Контакти</div>
              <h2 className="section-title">Зв'яжіться з нами</h2>
              <p className="section-subtitle">
                Оберіть зручний спосіб зв'язку або заповніть форму — ми зателефонуємо вам
              </p>
            </div>
          </AnimatedSection>
          <div className="contacts-grid">
            <AnimatedSection>
              <div className="contact-info-block">
                <div className="contact-item">
                  <div className="contact-icon">📍</div>
                  <div>
                    <h4>Адреса</h4>
                    <p>{ADDRESS}</p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">📞</div>
                  <div>
                    <h4>Телефон</h4>
                    <p><a href={`tel:${PHONE.replace(/\s/g, '')}`}>{PHONE}</a></p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">✉️</div>
                  <div>
                    <h4>Email</h4>
                    <p><a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
                  </div>
                </div>
                <div className="schedule-badge">
                  <span>🕐</span>
                  <span><strong>Пн — Нд:</strong> 9:00 — 21:00 (без вихідних)</span>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.15}>
              <form className="contact-form" onSubmit={handleSubmit}>
                <h3>Онлайн запис</h3>
                <p>Залиште заявку і ми зв'яжемось з вами протягом 15 хвилин</p>
                {formSent ? (
                  <div className="form-success">
                    ✅ Дякуємо! Ми зв'яжемось з вами найближчим часом.
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Ваше ім'я</label>
                      <input
                        type="text"
                        placeholder="Іван Петренко"
                        className={formErrors.name ? 'error' : ''}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                      {formErrors.name && <div className="form-error">{formErrors.name}</div>}
                    </div>
                    <div className="form-group">
                      <label>Телефон</label>
                      <input
                        type="tel"
                        placeholder="+380 XX XXX XX XX"
                        className={formErrors.phone ? 'error' : ''}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                      {formErrors.phone && <div className="form-error">{formErrors.phone}</div>}
                    </div>
                    <div className="form-group">
                      <label>Послуга</label>
                      <select
                        className={formErrors.service ? 'error' : ''}
                        value={formData.service}
                        onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      >
                        <option value="">Оберіть послугу</option>
                        {services.map((s, i) => (
                          <option key={i} value={s.title}>{s.title}</option>
                        ))}
                        <option value="Консультація">Консультація</option>
                      </select>
                      {formErrors.service && <div className="form-error">{formErrors.service}</div>}
                    </div>
                    <button type="submit" className="form-submit">
                      Записатись на прийом
                    </button>
                  </>
                )}
              </form>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo">Стомат<span>.Дентал</span></div>
          <ul className="footer-links">
            {navLinks.map(([id, label]) => (
              <li key={id}><a onClick={() => scrollTo(id)}>{label}</a></li>
            ))}
          </ul>
          <div className="footer-copy">
            © {new Date().getFullYear()} Стомат.Дентал. Всі права захищені.
          </div>
        </div>
      </footer>
    </>
  );
}
