# Uniframe Design System — дефолтні правила для всіх сайтів

Ці правила ОБОВ'ЯЗКОВІ для кожного сайту за замовчуванням.
Клієнт може змінити їх через правки агента, але початковий сайт має відповідати цим стандартам.

---

## Глобальна структура

- Весь контент обернути в `<div className="site-wrapper">` з `overflow-x: hidden; width: 100%; position: relative;`
- `html, body` — обов'язково `overflow-x: hidden`
- Використовувати `box-sizing: border-box` глобально

## Відступи між секціями (блоками)

Кожна секція має `padding` зверху і знизу. Оскільки сусідні секції сумують свої padding, використовуй ПОЛОВИНУ бажаного відступу:
- Desktop: `padding: 50px 0` (між блоками вийде 100px)
- Tablet (≤768px): `padding: 40px 0` (між блоками 80px)
- Mobile (≤480px): `padding: 30px 0` (між блоками 60px)

## Відступи всередині секцій

- Від section-label (мітка секції) до заголовка: `margin-bottom: 16px`
- Від заголовка секції до контенту/підзаголовку: `margin-bottom: 50px`
- Від підзаголовку до контенту: `margin-bottom: 50px`

## Контейнер (.container)

- `max-width: 1280px; margin: 0 auto;`
- Desktop: `padding: 0 40px`
- Tablet (≤768px): `padding: 0 24px`
- Mobile (≤480px): `padding: 0 16px`

## Навбар

- `position: fixed; top: 0; left: 0; right: 0; z-index: 1000;`
- Фон: суцільний `#fff` (або колір теми), НЕ прозорий
- При скролі: `box-shadow: 0 1px 0 rgba(0,0,0,0.06)`, зменшити padding
- Transition: `padding 0.4s ease, box-shadow 0.4s ease` — НЕ `transition: all`

## Бургер-меню (мобільне)

- Показувати з `@media (max-width: 768px)`
- Кнопка: 3 лінії (span), z-index вищий за меню
- Відкрите меню:
  - `position: fixed; inset: 0;`
  - `background: #fff` (суцільний, БЕЗ прозорості/blur)
  - `z-index: 1000`
  - Посилання вертикально по центру, `gap: 28px`
  - Анімація ліній → хрестик (rotate 45deg)
- Обов'язково `position: relative` на кнопці бургера для коректної роботи z-index

## Hero секція

- `padding-top` повинен враховувати висоту навбару (мінімум 100px desktop, 80px mobile)
- Контент: `max-width: 70%` desktop, `100%` mobile
- Текст: `overflow-wrap: break-word; word-break: break-word;` для заголовків
- ⚠️ КРИТИЧНО — ВИРІВНЮВАННЯ ПО ЛІВОМУ КРАЮ: Контент hero (заголовок, підзаголовок, кнопки) повинен бути вирівняний по лівому краю контейнера, а НЕ по центру екрану. Якщо обмежуєш ширину контенту через `max-width`, ОБОВ'ЯЗКОВО додай `margin-right: auto` (а НЕ `margin: 0 auto`), щоб блок притиснувся вліво. `text-align: left` за замовчуванням. Це стосується будь-якої секції з фоновим зображенням на весь екран — контент завжди починається від лівого краю контейнера.

## Загальне правило вирівнювання контенту

- ⚠️ У ВСІХ секціях де є фонове зображення/колір на весь екран і контент обмежений `max-width` — контент вирівнюється по ЛІВОМУ краю контейнера: `margin-right: auto` (НЕ `margin: 0 auto`). Центрування допустиме ТІЛЬКИ якщо це явно вказано в брифі або якщо це секція з одним коротким CTA-текстом.

## Типографіка

- ⚠️ BLACKLISTED шрифти (НІКОЛИ не використовувати як primary): Inter, Poppins, Montserrat, Raleway, Space Grotesk, Outfit
- Дозволені альтернативи: Inter Tight, Syne, Instrument Sans, IBM Plex Sans, Manrope, Archivo, Work Sans, Cabinet Grotesk, Satoshi, DM Serif Display, Fraunces, Instrument Serif, Cormorant Garamond, Playfair Display
- Для mono-акцентів: JetBrains Mono, IBM Plex Mono, Space Mono
- Заголовки секцій: `font-size: clamp(1.8rem, 3.5vw, 2.6rem)`, `font-weight: 600`, `line-height: 1.2`
- Підзаголовки: `font-size: 1.05rem`, `line-height: 1.7`
- Body text: `font-size: 0.95rem`, `line-height: 1.7`
- Використовуй `clamp()` для fluid type scaling замість breakpoint jumps

## Кнопки

- Primary: `padding: 16px 40px`, `border-radius: 12px`, `font-size: 0.95rem`
- Mobile (≤480px): зменшити padding до `14px 32px`
- Hover: `transform: translateY(-3px); box-shadow: ...`
- НЕ використовувати `width: 100%` для CTA кнопок (окрім форм)

## Анімації

- Використовувати `IntersectionObserver` для scroll-triggered ефектів
- ⚠️ ЗАБОРОНЕНО: однакові fade-in-from-below на всіх елементах (AOS-style). Це AI-кліше.
- Рекомендовані техніки: clip-path reveals, scale-on-scroll, text split animations, staggered delays, horizontal scroll sections
- **ОБОВ'ЯЗКОВО**: будь-яка секція з translateX анімаціями повинна мати `overflow: hidden`
- Тривалість: `0.8s`, easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- Stagger everything — ніщо не повинно рухатись одночасно. Різні `animation-delay` для сусідніх елементів.
- Різні анімації для різних секцій — не одна і та сама анімація скрізь

## Responsive

- Брейкпоінти: `1024px` (tablet landscape), `768px` (tablet), `480px` (mobile)
- Гріди: `repeat(3, 1fr)` → `repeat(2, 1fr)` → `1fr`
- `background-attachment: fixed` — НЕ використовувати (ламається на iOS)
- Зображення: `max-width: 100%; display: block;`

## Модальні вікна / форми

- Overlay: `position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);`
- Контент: `max-width: 500px; padding: 48px` desktop, `padding: 32px 24px` mobile
- Поля форми: `border-radius: 12px; padding: 14px 16px; border: 1px solid #e0e0e0`

## Footer

- `background: var(--bg-dark)` або темний колір
- Grid layout: `2fr 1fr 1fr` desktop → `1fr` mobile
- Текст: приглушені кольори `rgba(255,255,255,0.4–0.6)`

---

## Стилі дизайну (designStyle)

Якщо в брифі вказано `designStyle`, ОБОВ'ЯЗКОВО дотримуйся відповідних правил нижче. Це ключова різниця між сайтами.

### minimalist — Мінімалістичний

- **Простір**: багато білого простору, збільшені відступи між елементами
- **Кольори**: максимум 2-3 кольори (основний + акцент + нейтральний), без градієнтів
- **Тіні**: тонкі і легкі або взагалі без тіней
- **Шрифти**: один refined sans-serif (IBM Plex Sans, Instrument Sans, Work Sans, Inter Tight), мінімальна кількість font-weight варіацій
- **Декор**: мінімум декоративних елементів — без складних карток, іконок-заливок, overlay-ефектів
- **Фото**: великі, на всю ширину, без рамок і без border-radius
- **Анімації**: стримані clip-path reveals, subtle scale transitions
- **Кнопки**: outline або з мінімальним фоном, без агресивних hover-ефектів
- **Лейаут**: простий, але не симетричний — одна асиметрична деталь для характеру
- **Загальне відчуття**: як сайт Apple або Muji — чисто, спокійно, нічого зайвого

### premium — Преміум (Awwwards-рівень)

- **Простір**: драматичні переходи між секціями, чергування темних і світлих блоків
- **Кольори**: стримані, з одним сміливим акцентом. НЕ purple-to-blue градієнти. НЕ neon на dark.
- **Тіні**: глибокі тіні на картках і кнопках для об'єму
- **Шрифти**: display-шрифти для заголовків (Syne, Instrument Serif, DM Serif Display, Fraunces, Cabinet Grotesk), контрастні розміри між заголовком і body. Mono для metadata (JetBrains Mono).
- **Декор**: мікро-деталі — noise texture overlay, custom cursor, scroll progress bar, grain. НЕ blob shapes, НЕ floating geometric shapes.
- **Фото/відео**: hero на весь екран, зображення з mix-blend-mode overlay
- **Анімації**: clip-path reveals, horizontal scroll sections, scale-on-scroll, split-text, parallax layers, stagger delays. НЕ однаковий fade-in-from-below на всіх елементах.
- **Кнопки**: magnetic hover effects, subtle transform, refined shadows
- **Лейаут**: нестандартний — кожен сайт має унікальну структурну ДНК (не hero→cards→about→testimonials→CTA). Асиметричні сітки, ledger rows, sticky elements, overlapping layouts.
- **Загальне відчуття**: як Linear, Vercel, Stripe, Cursor — кожен піксель осмислений

## ⚠️ ЗАБОРОНЕНІ ПАТЕРНИ (AI-кліше)

Наступні речі роблять сайт впізнаваним як "зроблений AI" і ЗАБОРОНЕНІ:
- Purple-to-blue градієнти
- Neon accent colors на dark backgrounds (the "developer portfolio" look)
- Hero → 3-column feature grid → testimonials → CTA → footer layout
- Однаковий fade-in-from-below на ВСІХ елементах
- Icon + heading + paragraph cards в ряд по 3-4
- Blob shapes або floating geometric shapes як декор
- Однакові transitions на всьому (same duration, same easing, same direction)
- Все по центру, все в max-width container
- Rounded rectangles з box-shadows як основний UI елемент
