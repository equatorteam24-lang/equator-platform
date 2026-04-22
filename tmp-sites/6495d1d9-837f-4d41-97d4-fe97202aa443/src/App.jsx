import { useState, useEffect, useRef } from 'react';

const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1645400379459-f6fd3d963fd4?w=1920&q=80',
  polishing: 'https://images.unsplash.com/photo-1658244500543-47f32dc51dc2?w=800&q=80',
  ceramic: 'https://images.unsplash.com/photo-1678383407784-41d006e088c5?w=800&q=80',
  interior: 'https://images.unsplash.com/photo-1705079483667-844c6e5c6085?w=800&q=80',
  film: 'https://images.unsplash.com/photo-1714348938045-0c74379cd4d9?w=800&q=80',
  gallery1: 'https://images.unsplash.com/photo-1714348938323-534552cbfad9?w=800&q=80',
  gallery2: 'https://images.unsplash.com/photo-1658244546876-d82cbf1a1c9e?w=800&q=80',
  gallery3: 'https://images.unsplash.com/photo-1678383407712-1f7d90a4ccf5?w=800&q=80',
  gallery4: 'https://images.unsplash.com/photo-1705442198571-a58b8ae35ebb?w=800&q=80',
  gallery5: 'https://images.unsplash.com/photo-1665604739519-4b251582d436?w=800&q=80',
  gallery6: 'https://images.unsplash.com/photo-1770327715007-278f383f104c?w=800&q=80',
  about: 'https://images.unsplash.com/photo-1706476111193-7b02c8f351bd?w=1200&q=80',
};

function useInView(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.15, ...options });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}

function AnimatedSection({ children, className = '', delay = 0 }) {
  const [ref, isVisible] = useInView();
  return (
    <div
      ref={ref}
      className={`animated-section ${isVisible ? 'visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', service: '', message: '' });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [activeGallery, setActiveGallery] = useState(null);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setTimeout(() => setHeroLoaded(true), 200);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [menuOpen]);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Вкажіть ваше ім'я";
    if (!formData.phone.trim()) errors.phone = 'Вкажіть номер телефону';
    else if (!/^[\d\s\+\-\(\)]{10,}$/.test(formData.phone.trim())) errors.phone = 'Невірний формат номера';
    if (!formData.service) errors.service = 'Оберіть послугу';
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length === 0) {
      setFormSubmitted(true);
      setFormData({ name: '', phone: '', service: '', message: '' });
      setTimeout(() => setFormSubmitted(false), 5000);
    }
  };

  const services = [
    {
      icon: '✦',
      title: 'Полірування',
      desc: 'Відновлення глибини кольору та дзеркального блиску кузова. Усунення подряпин, голограм та окислення лаку.',
      price: 'від 3 500 ₴',
      img: IMAGES.polishing,
    },
    {
      icon: '◈',
      title: 'Керамічне покриття',
      desc: 'Нанокерамічний захист на 2-5 років. Гідрофобний ефект, захист від ультрафіолету та хімічних реагентів.',
      price: 'від 8 000 ₴',
      img: IMAGES.ceramic,
    },
    {
      icon: '◉',
      title: 'Хімчистка салону',
      desc: 'Глибока хімчистка шкіри, тканини, алькантари. Видалення плям, запахів та бактерій. Кондиціонування шкіри.',
      price: 'від 2 500 ₴',
      img: IMAGES.interior,
    },
    {
      icon: '▣',
      title: 'Захисні плівки',
      desc: 'PPF плівка преміум-класу для захисту від сколів, подряпин та гравію. Самовідновлення при нагріванні.',
      price: 'від 12 000 ₴',
      img: IMAGES.film,
    },
  ];

  const advantages = [
    { number: '01', title: 'Преміум матеріали', desc: 'Працюємо виключно з брендами Gyeon, Koch Chemie, XPEL та Suntek' },
    { number: '02', title: 'Досвід 8+ років', desc: 'Команда сертифікованих майстрів з міжнародною підготовкою' },
    { number: '03', title: 'Гарантія якості', desc: 'Надаємо гарантію на всі роботи та матеріали до 5 років' },
    { number: '04', title: 'Індивідуальний підхід', desc: 'Підбираємо оптимальне рішення під кожен автомобіль' },
    { number: '05', title: 'Сучасне обладнання', desc: 'Професійне освітлення, інструменти та стерильний бокс' },
    { number: '06', title: 'Прозорі ціни', desc: 'Фіксована вартість без прихованих доплат та сюрпризів' },
  ];

  const reviews = [
    { name: 'Олександр К.', car: 'BMW X5 2023', text: 'Зробили керамічне покриття — результат неймовірний. Вже 8 місяців тримається ідеально, вода просто стікає з кузова. Рекомендую всім!', rating: 5 },
    { name: 'Марина В.', car: 'Mercedes GLE', text: 'Хімчистка салону — як нове авто. Навіть плями від кави на сидіннях повністю вивели. Дуже акуратна та професійна робота.', rating: 5 },
    { name: 'Дмитро Л.', car: 'Audi A7 2024', text: 'Полірування + PPF на передню частину. Капот виглядає як скло, а плівка взагалі непомітна. Майстри реально знають свою справу.', rating: 5 },
  ];

  const galleryImages = [
    { src: IMAGES.gallery1, label: 'Полірування кузова' },
    { src: IMAGES.gallery2, label: 'Детейлінг-огляд' },
    { src: IMAGES.gallery3, label: 'Нанесення покриття' },
    { src: IMAGES.gallery4, label: 'Догляд за салоном' },
    { src: IMAGES.gallery5, label: 'Керамічний захист' },
    { src: IMAGES.gallery6, label: 'Фінальний результат' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');

        *, *::before, *::after {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
          --primary: #070ee4;
          --primary-light: #3a40ff;
          --primary-glow: rgba(7, 14, 228, 0.3);
          --dark: #0a0a0a;
          --dark-2: #111111;
          --dark-3: #1A1A1A;
          --dark-4: #222222;
          --gray: #888888;
          --gray-light: #aaaaaa;
          --white: #f5f5f5;
          --white-pure: #ffffff;
          --font-heading: 'Playfair Display', Georgia, serif;
          --font-body: 'Inter', -apple-system, sans-serif;
        }

        html {
          scroll-behavior: smooth;
          -webkit-font-smoothing: antialiased;
        }

        body {
          font-family: var(--font-body);
          background: var(--dark);
          color: var(--white);
          line-height: 1.7;
          overflow-x: hidden;
        }

        /* ===== NAVBAR ===== */
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 20px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .navbar.scrolled {
          background: rgba(10, 10, 10, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 14px 40px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .logo {
          font-family: var(--font-heading);
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--white-pure);
          text-decoration: none;
          position: relative;
        }

        .logo span {
          color: var(--primary);
        }

        .nav-links {
          display: flex;
          gap: 36px;
          list-style: none;
          align-items: center;
        }

        .nav-links li a {
          color: var(--gray-light);
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: color 0.3s ease;
          position: relative;
        }

        .nav-links li a::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 1px;
          background: var(--primary);
          transition: width 0.3s ease;
        }

        .nav-links li a:hover {
          color: var(--white-pure);
        }

        .nav-links li a:hover::after {
          width: 100%;
        }

        .nav-cta {
          padding: 10px 24px;
          background: var(--primary);
          color: var(--white-pure) !important;
          border-radius: 0;
          font-size: 12px !important;
          letter-spacing: 2px !important;
          transition: all 0.3s ease !important;
          border: 1px solid var(--primary);
        }

        .nav-cta:hover {
          background: transparent !important;
          color: var(--primary) !important;
        }

        .nav-cta::after {
          display: none !important;
        }

        .burger {
          display: none;
          flex-direction: column;
          gap: 6px;
          cursor: pointer;
          z-index: 1001;
          background: none;
          border: none;
          padding: 4px;
        }

        .burger span {
          display: block;
          width: 28px;
          height: 1.5px;
          background: var(--white);
          transition: all 0.3s ease;
          transform-origin: center;
        }

        .burger.open span:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .burger.open span:nth-child(2) {
          opacity: 0;
        }

        .burger.open span:nth-child(3) {
          transform: rotate(-45deg) translate(5px, -5px);
        }

        .mobile-menu {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(10, 10, 10, 0.98);
          z-index: 999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 32px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.4s ease;
        }

        .mobile-menu.open {
          opacity: 1;
          pointer-events: all;
        }

        .mobile-menu a {
          font-family: var(--font-heading);
          font-size: 32px;
          color: var(--white);
          text-decoration: none;
          font-weight: 400;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .mobile-menu a:hover {
          color: var(--primary);
        }

        /* ===== HERO ===== */
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          background-image: url('${IMAGES.hero}');
          background-size: cover;
          background-position: center;
          transform: scale(1.1);
          transition: transform 8s ease-out, opacity 1.5s ease;
          opacity: 0;
        }

        .hero-bg.loaded {
          opacity: 1;
          transform: scale(1);
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(10, 10, 10, 0.5) 0%,
            rgba(10, 10, 10, 0.3) 40%,
            rgba(10, 10, 10, 0.7) 80%,
            rgba(10, 10, 10, 1) 100%
          );
        }

        .hero-content {
          position: relative;
          z-index: 2;
          text-align: center;
          padding: 0 24px;
          max-width: 900px;
        }

        .hero-badge {
          display: inline-block;
          padding: 8px 24px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          font-size: 11px;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: var(--gray-light);
          margin-bottom: 32px;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeUp 0.8s 0.5s forwards;
        }

        .hero h1 {
          font-family: var(--font-heading);
          font-size: clamp(42px, 7vw, 88px);
          font-weight: 400;
          line-height: 1.05;
          letter-spacing: -1px;
          margin-bottom: 24px;
          opacity: 0;
          transform: translateY(30px);
          animation: fadeUp 1s 0.8s forwards;
        }

        .hero h1 em {
          font-style: italic;
          color: var(--primary-light);
        }

        .hero-sub {
          font-size: clamp(15px, 1.8vw, 18px);
          color: var(--gray-light);
          max-width: 540px;
          margin: 0 auto 48px;
          line-height: 1.8;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeUp 0.8s 1.1s forwards;
        }

        .hero-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeUp 0.8s 1.4s forwards;
        }

        .btn-primary {
          padding: 16px 40px;
          background: var(--primary);
          color: var(--white-pure);
          border: 1px solid var(--primary);
          font-size: 12px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: var(--font-body);
          font-weight: 500;
        }

        .btn-primary:hover {
          background: var(--primary-light);
          border-color: var(--primary-light);
          box-shadow: 0 0 40px var(--primary-glow);
        }

        .btn-outline {
          padding: 16px 40px;
          background: transparent;
          color: var(--white);
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 12px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: var(--font-body);
          font-weight: 500;
        }

        .btn-outline:hover {
          border-color: var(--white);
          background: rgba(255, 255, 255, 0.05);
        }

        .hero-scroll {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          opacity: 0;
          animation: fadeIn 1s 2s forwards;
        }

        .hero-scroll span {
          font-size: 10px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--gray);
        }

        .scroll-line {
          width: 1px;
          height: 40px;
          background: linear-gradient(to bottom, var(--primary), transparent);
          animation: scrollPulse 2s infinite;
        }

        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          to { opacity: 1; }
        }

        @keyframes scrollPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        /* ===== ANIMATED SECTIONS ===== */
        .animated-section {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animated-section.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ===== SECTION COMMON ===== */
        .section {
          padding: 100px 40px;
          max-width: 1320px;
          margin: 0 auto;
        }

        .section-label {
          font-size: 11px;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: var(--primary-light);
          margin-bottom: 16px;
          font-weight: 500;
        }

        .section-title {
          font-family: var(--font-heading);
          font-size: clamp(32px, 4.5vw, 56px);
          font-weight: 400;
          line-height: 1.15;
          margin-bottom: 20px;
          letter-spacing: -0.5px;
        }

        .section-title em {
          font-style: italic;
          color: var(--primary-light);
        }

        .section-desc {
          font-size: 16px;
          color: var(--gray);
          max-width: 520px;
          line-height: 1.8;
          margin-bottom: 60px;
        }

        /* ===== SERVICES ===== */
        .services-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .service-card {
          position: relative;
          background: var(--dark-2);
          border: 1px solid rgba(255, 255, 255, 0.04);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          group: true;
        }

        .service-card:hover {
          border-color: rgba(7, 14, 228, 0.3);
          transform: translateY(-4px);
        }

        .service-img {
          width: 100%;
          height: 240px;
          object-fit: cover;
          transition: transform 0.6s ease;
          filter: brightness(0.7);
        }

        .service-card:hover .service-img {
          transform: scale(1.05);
          filter: brightness(0.85);
        }

        .service-body {
          padding: 32px;
        }

        .service-icon {
          font-size: 20px;
          color: var(--primary-light);
          margin-bottom: 16px;
          display: block;
        }

        .service-title {
          font-family: var(--font-heading);
          font-size: 24px;
          font-weight: 500;
          margin-bottom: 12px;
        }

        .service-desc {
          font-size: 14px;
          color: var(--gray);
          line-height: 1.7;
          margin-bottom: 20px;
        }

        .service-price {
          font-size: 13px;
          letter-spacing: 1px;
          color: var(--primary-light);
          font-weight: 500;
        }

        /* ===== ADVANTAGES ===== */
        .advantages-section {
          background: var(--dark-2);
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .advantages-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
        }

        .advantage-item {
          padding: 48px 36px;
          border-right: 1px solid rgba(255, 255, 255, 0.04);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          transition: all 0.4s ease;
          position: relative;
        }

        .advantage-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--primary);
          transition: width 0.4s ease;
        }

        .advantage-item:hover::before {
          width: 100%;
        }

        .advantage-item:hover {
          background: rgba(7, 14, 228, 0.03);
        }

        .advantage-number {
          font-family: var(--font-heading);
          font-size: 48px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.06);
          margin-bottom: 20px;
          line-height: 1;
        }

        .advantage-title {
          font-family: var(--font-heading);
          font-size: 20px;
          font-weight: 500;
          margin-bottom: 12px;
        }

        .advantage-desc {
          font-size: 14px;
          color: var(--gray);
          line-height: 1.7;
        }

        /* ===== GALLERY ===== */
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .gallery-item {
          position: relative;
          overflow: hidden;
          cursor: pointer;
          aspect-ratio: 4 / 3;
        }

        .gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          filter: brightness(0.6) saturate(0.9);
        }

        .gallery-item:hover img {
          transform: scale(1.08);
          filter: brightness(0.8) saturate(1);
        }

        .gallery-label {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 24px;
          background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.5px;
          transform: translateY(100%);
          transition: transform 0.4s ease;
        }

        .gallery-item:hover .gallery-label {
          transform: translateY(0);
        }

        /* Gallery lightbox */
        .lightbox {
          position: fixed;
          inset: 0;
          z-index: 2000;
          background: rgba(0, 0, 0, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
          cursor: pointer;
        }

        .lightbox.active {
          opacity: 1;
          pointer-events: all;
        }

        .lightbox img {
          max-width: 90%;
          max-height: 85vh;
          object-fit: contain;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .lightbox-close {
          position: absolute;
          top: 32px;
          right: 32px;
          width: 48px;
          height: 48px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: none;
          color: var(--white);
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .lightbox-close:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        /* ===== REVIEWS ===== */
        .reviews-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .review-card {
          background: var(--dark-2);
          border: 1px solid rgba(255, 255, 255, 0.04);
          padding: 40px;
          transition: all 0.4s ease;
          position: relative;
        }

        .review-card:hover {
          border-color: rgba(7, 14, 228, 0.2);
          transform: translateY(-2px);
        }

        .review-stars {
          color: var(--primary-light);
          font-size: 14px;
          letter-spacing: 3px;
          margin-bottom: 20px;
        }

        .review-text {
          font-size: 15px;
          color: var(--gray-light);
          line-height: 1.8;
          margin-bottom: 28px;
          font-style: italic;
        }

        .review-author {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .review-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--dark-4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-heading);
          font-size: 16px;
          color: var(--primary-light);
        }

        .review-name {
          font-weight: 500;
          font-size: 14px;
        }

        .review-car {
          font-size: 12px;
          color: var(--gray);
        }

        .review-quote {
          position: absolute;
          top: 32px;
          right: 32px;
          font-family: var(--font-heading);
          font-size: 72px;
          color: rgba(255, 255, 255, 0.03);
          line-height: 1;
        }

        /* ===== ABOUT / CTA SPLIT ===== */
        .about-section {
          position: relative;
          overflow: hidden;
        }

        .about-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 600px;
        }

        .about-image {
          position: relative;
          overflow: hidden;
        }

        .about-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.6);
        }

        .about-content {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 80px 64px;
          background: var(--dark-2);
        }

        .about-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          margin-top: 48px;
          padding-top: 48px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .stat-number {
          font-family: var(--font-heading);
          font-size: 40px;
          font-weight: 400;
          color: var(--primary-light);
          line-height: 1;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 12px;
          color: var(--gray);
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        /* ===== CONTACT / FORM ===== */
        .contact-section {
          background: var(--dark-2);
          border-top: 1px solid rgba(255, 255, 255, 0.04);
        }

        .contact-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: start;
        }

        .contact-info {
          padding-top: 16px;
        }

        .contact-item {
          margin-bottom: 36px;
        }

        .contact-item-label {
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--gray);
          margin-bottom: 8px;
        }

        .contact-item-value {
          font-family: var(--font-heading);
          font-size: 20px;
          color: var(--white);
        }

        .contact-item-value a {
          color: var(--white);
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .contact-item-value a:hover {
          color: var(--primary-light);
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-label {
          display: block;
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--gray);
          margin-bottom: 8px;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 14px 0;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--white);
          font-size: 16px;
          font-family: var(--font-body);
          transition: border-color 0.3s ease;
          outline: none;
          appearance: none;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          border-bottom-color: var(--primary);
        }

        .form-select {
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 4px center;
        }

        .form-select option {
          background: var(--dark-3);
          color: var(--white);
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .form-error {
          font-size: 12px;
          color: #ff4444;
          margin-top: 6px;
        }

        .form-success {
          padding: 20px;
          background: rgba(7, 14, 228, 0.1);
          border: 1px solid rgba(7, 14, 228, 0.3);
          color: var(--primary-light);
          font-size: 14px;
          text-align: center;
          margin-bottom: 20px;
        }

        .btn-submit {
          width: 100%;
          padding: 18px;
          background: var(--primary);
          color: var(--white-pure);
          border: 1px solid var(--primary);
          font-size: 12px;
          letter-spacing: 3px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: var(--font-body);
          font-weight: 500;
          margin-top: 12px;
        }

        .btn-submit:hover {
          background: var(--primary-light);
          box-shadow: 0 0 40px var(--primary-glow);
        }

        /* ===== FOOTER ===== */
        .footer {
          padding: 40px;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1320px;
          margin: 0 auto;
        }

        .footer-copy {
          font-size: 13px;
          color: var(--gray);
        }

        .footer-links {
          display: flex;
          gap: 24px;
        }

        .footer-links a {
          font-size: 12px;
          color: var(--gray);
          text-decoration: none;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: color 0.3s ease;
        }

        .footer-links a:hover {
          color: var(--white);
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1024px) {
          .services-grid {
            grid-template-columns: 1fr;
          }

          .advantages-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .reviews-grid {
            grid-template-columns: 1fr;
          }

          .about-inner {
            grid-template-columns: 1fr;
          }

          .about-image {
            height: 300px;
          }

          .contact-inner {
            grid-template-columns: 1fr;
            gap: 48px;
          }
        }

        @media (max-width: 768px) {
          .navbar {
            padding: 16px 24px;
          }

          .navbar.scrolled {
            padding: 12px 24px;
          }

          .nav-links {
            display: none;
          }

          .burger {
            display: flex;
          }

          .section {
            padding: 64px 24px;
          }

          .hero h1 {
            font-size: clamp(36px, 10vw, 56px);
          }

          .services-grid {
            grid-template-columns: 1fr;
          }

          .advantages-grid {
            grid-template-columns: 1fr;
          }

          .advantage-item {
            border-right: none;
          }

          .gallery-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .about-content {
            padding: 48px 24px;
          }

          .about-stats {
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }

          .stat-number {
            font-size: 28px;
          }

          .footer {
            flex-direction: column;
            gap: 16px;
            text-align: center;
            padding: 32px 24px;
          }

          .hero-buttons {
            flex-direction: column;
            align-items: center;
          }

          .btn-primary, .btn-outline {
            width: 100%;
            max-width: 280px;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .gallery-grid {
            grid-template-columns: 1fr;
          }

          .about-stats {
            grid-template-columns: 1fr;
            gap: 24px;
            text-align: center;
          }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <a className="logo" href="#" onClick={(e) => { e.preventDefault(); scrollTo('hero'); }}>
          Auto<span>Ban</span>
        </a>
        <ul className="nav-links">
          <li><a onClick={() => scrollTo('services')}>Послуги</a></li>
          <li><a onClick={() => scrollTo('advantages')}>Переваги</a></li>
          <li><a onClick={() => scrollTo('gallery')}>Галерея</a></li>
          <li><a onClick={() => scrollTo('reviews')}>Відгуки</a></li>
          <li><a className="nav-cta" onClick={() => scrollTo('contact')}>Записатись</a></li>
        </ul>
        <button className={`burger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </nav>

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <a onClick={() => scrollTo('services')}>Послуги</a>
        <a onClick={() => scrollTo('advantages')}>Переваги</a>
        <a onClick={() => scrollTo('gallery')}>Галерея</a>
        <a onClick={() => scrollTo('reviews')}>Відгуки</a>
        <a onClick={() => scrollTo('contact')}>Записатись</a>
      </div>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className={`hero-bg ${heroLoaded ? 'loaded' : ''}`} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-badge">Студія автомобільного детейлінгу</div>
          <h1>Детейлінг — <em>мистецтво</em> для клієнтів</h1>
          <p className="hero-sub">
            Ваш автомобіль заслуговує на досконалість. Преміум-догляд, який перетворює кожну деталь на шедевр — від кузова до салону.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => scrollTo('contact')}>Записатись на сервіс</button>
            <button className="btn-outline" onClick={() => scrollTo('services')}>Наші послуги</button>
          </div>
        </div>
        <div className="hero-scroll">
          <span>Scroll</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* SERVICES */}
      <section className="section" id="services">
        <AnimatedSection>
          <div className="section-label">Що ми робимо</div>
          <h2 className="section-title">Послуги <em>студії</em></h2>
          <p className="section-desc">
            Комплексний догляд за вашим автомобілем із використанням найкращих матеріалів та технологій світового рівня.
          </p>
        </AnimatedSection>
        <div className="services-grid">
          {services.map((s, i) => (
            <AnimatedSection key={i} delay={i * 100}>
              <div className="service-card" onClick={() => scrollTo('contact')}>
                <img className="service-img" src={s.img} alt={s.title} loading="lazy" />
                <div className="service-body">
                  <span className="service-icon">{s.icon}</span>
                  <h3 className="service-title">{s.title}</h3>
                  <p className="service-desc">{s.desc}</p>
                  <span className="service-price">{s.price}</span>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ADVANTAGES */}
      <section className="advantages-section" id="advantages">
        <div className="section" style={{ paddingBottom: 0 }}>
          <AnimatedSection>
            <div className="section-label">Чому ми</div>
            <h2 className="section-title">Шість причин <em>обрати</em> нас</h2>
            <p className="section-desc">
              Кожен клієнт для нас — це проєкт, де не буває дрібниць. Від першої консультації до фінального огляду.
            </p>
          </AnimatedSection>
        </div>
        <div className="advantages-grid" style={{ maxWidth: 1320, margin: '0 auto' }}>
          {advantages.map((a, i) => (
            <AnimatedSection key={i} delay={i * 80}>
              <div className="advantage-item">
                <div className="advantage-number">{a.number}</div>
                <h3 className="advantage-title">{a.title}</h3>
                <p className="advantage-desc">{a.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* GALLERY */}
      <section className="section" id="gallery">
        <AnimatedSection>
          <div className="section-label">Портфоліо</div>
          <h2 className="section-title">Галерея <em>робіт</em></h2>
          <p className="section-desc">
            Кожен автомобіль — це унікальний проєкт. Дивіться результати нашої роботи.
          </p>
        </AnimatedSection>
        <AnimatedSection delay={200}>
          <div className="gallery-grid">
            {galleryImages.map((img, i) => (
              <div className="gallery-item" key={i} onClick={() => setActiveGallery(img.src)}>
                <img src={img.src} alt={img.label} loading="lazy" />
                <div className="gallery-label">{img.label}</div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* LIGHTBOX */}
      <div className={`lightbox ${activeGallery ? 'active' : ''}`} onClick={() => setActiveGallery(null)}>
        <button className="lightbox-close" onClick={() => setActiveGallery(null)}>&times;</button>
        {activeGallery && <img src={activeGallery.replace('w=800', 'w=1600')} alt="Gallery" onClick={(e) => e.stopPropagation()} />}
      </div>

      {/* REVIEWS */}
      <section className="section" id="reviews">
        <AnimatedSection>
          <div className="section-label">Відгуки</div>
          <h2 className="section-title">Що кажуть <em>клієнти</em></h2>
          <p className="section-desc">
            Найкраща реклама — це задоволені клієнти, які повертаються знову та рекомендують нас друзям.
          </p>
        </AnimatedSection>
        <div className="reviews-grid">
          {reviews.map((r, i) => (
            <AnimatedSection key={i} delay={i * 120}>
              <div className="review-card">
                <div className="review-quote">"</div>
                <div className="review-stars">{'★'.repeat(r.rating)}</div>
                <p className="review-text">"{r.text}"</p>
                <div className="review-author">
                  <div className="review-avatar">{r.name[0]}</div>
                  <div>
                    <div className="review-name">{r.name}</div>
                    <div className="review-car">{r.car}</div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="about-section">
        <AnimatedSection>
          <div className="about-inner">
            <div className="about-image">
              <img src={IMAGES.about} alt="AutoBan Studio" loading="lazy" />
            </div>
            <div className="about-content">
              <div className="section-label">Про студію</div>
              <h2 className="section-title">Ваш автомобіль заслуговує <em>найкращого</em></h2>
              <p style={{ color: 'var(--gray-light)', fontSize: 15, lineHeight: 1.8 }}>
                AutoBan — це команда ентузіастів, які перетворили любов до автомобілів у професію.
                Кожен наш майстер має міжнародну сертифікацію та постійно вдосконалює свої навички.
                Ми використовуємо тільки перевірені бренди та інноваційні технології,
                щоб результат перевершував очікування.
              </p>
              <div className="about-stats">
                <div>
                  <div className="stat-number">2500+</div>
                  <div className="stat-label">Авто оброблено</div>
                </div>
                <div>
                  <div className="stat-number">8+</div>
                  <div className="stat-label">Років досвіду</div>
                </div>
                <div>
                  <div className="stat-number">98%</div>
                  <div className="stat-label">Задоволених клієнтів</div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* CONTACT */}
      <section className="contact-section" id="contact">
        <div className="section">
          <AnimatedSection>
            <div className="section-label">Контакти</div>
            <h2 className="section-title">Запишіться <em>на сервіс</em></h2>
            <p className="section-desc">
              Залиште заявку і ми зв'яжемося з вами протягом 30 хвилин для підтвердження запису.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <div className="contact-inner">
              <div className="contact-info">
                <div className="contact-item">
                  <div className="contact-item-label">Телефон</div>
                  <div className="contact-item-value">
                    <a href="tel:+380991234567">+38 (099) 123-45-67</a>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-item-label">Графік роботи</div>
                  <div className="contact-item-value">Пн — Сб: 09:00 — 20:00</div>
                </div>
                <div className="contact-item">
                  <div className="contact-item-label">Адреса</div>
                  <div className="contact-item-value">м. Київ, вул. Автозаводська, 12</div>
                </div>
                <div className="contact-item">
                  <div className="contact-item-label">Email</div>
                  <div className="contact-item-value">
                    <a href="mailto:info@autoban.ua">info@autoban.ua</a>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-item-label">Instagram</div>
                  <div className="contact-item-value">
                    <a href="#">@autoban.detailing</a>
                  </div>
                </div>
              </div>
              <form onSubmit={handleSubmit}>
                {formSubmitted && (
                  <div className="form-success">
                    Дякуємо! Вашу заявку прийнято. Ми зв'яжемося з вами найближчим часом.
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Ваше ім'я</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Олександр"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {formErrors.name && <div className="form-error">{formErrors.name}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Телефон</label>
                  <input
                    className="form-input"
                    type="tel"
                    placeholder="+38 (0__) ___-__-__"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  {formErrors.phone && <div className="form-error">{formErrors.phone}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Послуга</label>
                  <select
                    className="form-select"
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  >
                    <option value="">Оберіть послугу</option>
                    <option value="polishing">Полірування</option>
                    <option value="ceramic">Керамічне покриття</option>
                    <option value="interior">Хімчистка салону</option>
                    <option value="film">Захисні плівки (PPF)</option>
                    <option value="complex">Комплексний детейлінг</option>
                  </select>
                  {formErrors.service && <div className="form-error">{formErrors.service}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Повідомлення (необов'язково)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Марка авто, побажання..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn-submit">Надіслати заявку</button>
              </form>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-copy">&copy; 2024 AutoBan Detailing Studio. Всі права захищені.</div>
        <div className="footer-links">
          <a onClick={() => scrollTo('services')} style={{ cursor: 'pointer' }}>Послуги</a>
          <a onClick={() => scrollTo('gallery')} style={{ cursor: 'pointer' }}>Галерея</a>
          <a onClick={() => scrollTo('contact')} style={{ cursor: 'pointer' }}>Контакти</a>
        </div>
      </footer>
    </>
  );
}
