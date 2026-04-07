// ─── Site Content Types & Defaults ───────────────────────────────────────────
// All editable content sections for the homepage.
// Defaults are used as fallback when DB has no value for a field.

export interface ServiceItem   { title: string; price: string; image: string }
export interface FeatureItem   { title: string; desc: string }
export interface ProcessStep   { title: string; desc: string }
export interface TrustItem     { label: string; active: boolean }
export interface PartnerItem   { img: string; bg: string }

export interface HeroContent     { title: string; subtitle: string; bgImage: string }
export interface ServicesContent { heading: string; description: string; items: ServiceItem[] }
export interface AboutContent    { heading: string; intro: string; subheading: string; description: string; photo: string; checklist: string[]; features: FeatureItem[] }
export interface ProcessContent  { heroImage: string; steps: ProcessStep[] }
export interface GalleryContent  { photos: string[] }
export interface TrustContent    { photo: string; items: TrustItem[]; aboutPhoto: string; aboutText1: string; aboutText2: string }
export interface CtaContent      { bgImage: string; title: string; text: string }
export interface ContactsContent { phone: string; email: string; address: string; military: string }

export interface SiteContent {
  hero:     HeroContent
  services: ServicesContent
  about:    AboutContent
  process:  ProcessContent
  gallery:  GalleryContent
  trust:    TrustContent
  partners: PartnerItem[]
  cta:      CtaContent
  contacts: ContactsContent
}

export const DEFAULT_CONTENT: SiteContent = {
  hero: {
    title:    'Професійні покрівельні роботи',
    subtitle: 'Спеціалізуємося на повному циклі влаштування фальцевої покрівлі, клік-фальці, металочерепиці та профнастилі — від дерев\'яного каркасу до готового даху.',
    bgImage:  'https://images.unsplash.com/photo-1706164971302-e30c0640cc3b?w=1920&q=80&auto=format&fit=crop',
  },
  services: {
    heading:     'Комплексні покрівельні роботи',
    description: 'Вартість покрівельних робіт оцінюється індивідуально залежно від складності архітектури, висоти будівлі, площі покрівлі, обраного матеріалу та необхідності додаткових послуг.',
    items: [
      { title: 'Монтаж фальцевої покрівлі', price: 'від 2000 грн/м²', image: 'https://www.figma.com/api/mcp/asset/92baa573-573b-41a0-9025-a89d6a2ed093' },
      { title: 'Монтаж металочерепиці',     price: 'від 2000 грн/м²', image: 'https://www.figma.com/api/mcp/asset/34a1f4d1-41a3-42e7-8699-89ff6621b8c4' },
      { title: 'Монтаж профнастилу',         price: 'від 2000 грн/м²', image: 'https://www.figma.com/api/mcp/asset/590011ab-7e6a-4987-9988-16045a216a61' },
      { title: 'Демонтаж старого даху',      price: 'від 2000 грн/м²', image: 'https://www.figma.com/api/mcp/asset/203eb353-aa6f-4f31-a744-8c6d20659e9c' },
    ],
  },
  about: {
    heading:     'Основний напрямок',
    intro:       'Ми спеціалізуємось на монтажі дахів під ключ. Працюємо з приватними будинками, котеджами та господарськими спорудами.',
    subheading:  'Комплексні роботи',
    description: 'Маємо власне сучасне обладнання для роботи з фальцевою покрівлею. Завдяки цьому виготовляємо покрівельні картини безпосередньо на об\'єкті та одразу монтуємо їх.',
    photo:       '',
    checklist:   ['Повна герметичність', 'Стійкість до вітру', 'Термін 30+ років', 'Мінімалістичний вигляд'],
    features: [
      { title: 'Герметичність',  desc: 'З\'єднання швами без наскрізних отворів повністю виключає протікання.' },
      { title: 'Довговічність',  desc: 'Служить від 30 до 75 років, витримуючи значні снігові та вітрові навантаження.' },
      { title: 'Естетичність',   desc: 'Мінімалістичний і сучасний вигляд, що підходить для будь-якої архітектури.' },
      { title: 'Універсальність',desc: 'Монтується на дахах будь-якої складності та навіть з мінімальним ухилом.' },
    ],
  },
  process: {
    heroImage: 'https://images.unsplash.com/photo-1634750006909-3258af95e257?w=1920&q=80&auto=format&fit=crop',
    steps: [
      { title: 'Замір та консультація', desc: 'Виїзд на об\'єкт, уточнення запиту та технічні заміри' },
      { title: 'Узгодження деталей',    desc: 'Детальний кошторис та затвердження бюджету' },
      { title: 'Монтаж',                desc: 'Виконання робіт згідно з технологією та графіком' },
      { title: 'Здача та гарантія',     desc: 'Перевірка якості, прийом об\'єкта та передача результату' },
    ],
  },
  gallery: {
    photos: [
      'https://images.unsplash.com/photo-1765808376054-e224c7dbcdee?w=800&q=80',
      'https://images.unsplash.com/photo-1765808376624-aba74b96859f?w=800&q=80',
      'https://images.unsplash.com/photo-1516880967556-b295d8e7b611?w=800&q=80',
      'https://images.unsplash.com/photo-1618833012757-28d87272966f?w=800&q=80',
      'https://images.unsplash.com/photo-1773432114061-2ae201208630?w=800&q=80',
      'https://images.unsplash.com/photo-1722118151004-3ddaba0450e5?w=800&q=80',
    ],
  },
  trust: {
    photo:      'https://www.figma.com/api/mcp/asset/8fa37148-89dd-4996-88f8-dd8b2f2cb2b4',
    items: [
      { label: 'Досвідчена команда майстрів',       active: false },
      { label: 'Чесна ціна та прозорий кошторис',   active: true  },
      { label: 'Офіційна робота за договором',       active: false },
      { label: 'Виконуємо повний цикл робіт',        active: false },
      { label: 'Працюємо за вашим проектом',         active: false },
    ],
    aboutPhoto: 'https://www.figma.com/api/mcp/asset/09d7a461-f25d-4dab-b271-c99a4a56f961',
    aboutText1: 'Ми — команда з 5-річним досвідом, що спеціалізується виключно на дахах. Працюємо з приватними особами та забудовниками в Івано-Франківській та Львівській областях.',
    aboutText2: 'Виконуємо нове будівництво та реконструкцію об\'єктів будь-якої складності: від котеджів до готелів. Пропонуємо як повний комплекс робіт «під ключ», так і окремі етапи монтажу.',
  },
  partners: [
    { img: 'https://www.figma.com/api/mcp/asset/410de29d-eddb-49f2-8e31-0c65cafc66f8', bg: 'bg-white border border-[#f4f5f9]' },
    { img: 'https://www.figma.com/api/mcp/asset/6c108e88-e2db-4b7c-b1c2-3695170be9cb', bg: 'bg-[#090909]' },
    { img: 'https://www.figma.com/api/mcp/asset/da492347-f6fa-4853-b956-028cd0f48c84', bg: 'bg-[#f8f8f8]' },
    { img: 'https://www.figma.com/api/mcp/asset/93321fec-1d14-4352-b6ed-d4d8fee53f99', bg: 'bg-[#f2f2f2]' },
    { img: 'https://www.figma.com/api/mcp/asset/38f8007b-a240-4f92-a2f5-69d8acddfcff', bg: 'bg-[#252625]' },
  ],
  cta: {
    bgImage: 'https://www.figma.com/api/mcp/asset/c74cb262-59d7-4203-a213-fc30291980c7',
    title:   'Потрібен надійний дах?',
    text:    'Залиште заявку — прорахуємо вартість та проконсультуємо щодо оптимального рішення для вашого об\'єкта.',
  },
  contacts: {
    phone:    '+380665864029',
    email:    'example@gmail.com',
    address:  'м. Місто, вул. Адресова 10 А',
    military: 'Військові можуть скористатися індивідуальними знижками на всі види покрівельних послуг. Деталі — під час консультації.',
  },
}

/** Deep-merge DB content with defaults (DB values override defaults) */
export function mergeWithDefaults(db: Record<string, unknown>): SiteContent {
  const result = structuredClone(DEFAULT_CONTENT) as unknown as Record<string, unknown>
  for (const [key, val] of Object.entries(db)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = { ...(result[key] as object ?? {}), ...(val as object) }
    } else if (val !== null && val !== undefined) {
      result[key] = val
    }
  }
  return result as unknown as SiteContent
}
