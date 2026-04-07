const CONTENT_KEY = 'dytsadok_content'

const DEFAULT_CONTENT = {
  header: {
    phone: '+38 (067) 444-22-33',
    telegramUrl: 'https://t.me/',
    callbackBtnText: 'Передзвоніть мені',
  },
  hero: {
    title: 'ДОЧКИ ТА\nСИНОЧКИ',
    subtitle: 'Приватний дитячий садочок та центр естетично-спортивного розвитку для дітей від 2 до 6 років на Осокорках.',
    ctaText: 'Ознайомче заняття',
    image1: 'https://www.figma.com/api/mcp/asset/8c99f5ed-3ebc-45a7-9ebc-e70ea52d4b20',
    image2: 'https://www.figma.com/api/mcp/asset/87ee1501-5f0d-4a6f-9423-57375042f801',
    image3: 'https://www.figma.com/api/mcp/asset/b0b1eb67-ce02-4cb9-81a9-3c169222eb74',
    badge1: 'Творчість',
    badge2: 'Англійська',
    badge3: 'Спорт',
    badge4: '15 років досвіду',
    badge5: 'Музика',
  },
  video: {
    backgroundUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=1600&q=80',
    caption: 'Подивіться, як живе наш садочок',
  },
  about: {
    tag: 'Про садочок',
    title: 'Ми створили простір,\nде дітям добре',
    text1: '«Дочки та Синочки» — це приватний дитячий садочок та центр розвитку, де кожна дитина почувається особливою. Ми поєднуємо сучасні методики раннього розвитку з любов\'ю та турботою.',
    text2: 'Наші вихователі мають багаторічний досвід роботи з дітьми від 2 до 6 років. Ми розвиваємо творчість, спорт, музику, мови — все це в одному місці.',
    image1: 'https://www.figma.com/api/mcp/asset/b0b1eb67-ce02-4cb9-81a9-3c169222eb74',
    image2: 'https://www.figma.com/api/mcp/asset/87ee1501-5f0d-4a6f-9423-57375042f801',
    ctaText: 'Записатися',
    stats: [
      { num: '15+', label: 'років досвіду' },
      { num: '200+', label: 'щасливих родин' },
      { num: '30+', label: 'педагогів' },
      { num: '2–6', label: 'вік дітей' },
    ],
  },
  whyUs: {
    title: 'Чому нас обирають',
    subtitle: 'Більше 15 років ми допомагаємо дітям розвиватися в атмосфері тепла та підтримки',
    items: [
      { icon: '🎨', title: 'Творчий розвиток', text: 'Малювання, ліплення, музика та театр розвивають уяву та таланти.' },
      { icon: '⚽', title: 'Фізична активність', text: 'Щоденна гімнастика, танці та спорт для здорового розвитку.' },
      { icon: '🌍', title: 'Іноземні мови', text: 'Англійська з носієм мови у форматі гри та занурення.' },
      { icon: '🍎', title: 'Здорове харчування', text: 'Збалансоване меню від дієтолога, без консервантів та добавок.' },
      { icon: '👩‍🏫', title: 'Досвідчені педагоги', text: 'Команда з 15+ роками досвіду та безперервним навчанням.' },
      { icon: '📱', title: 'Прозорість', text: 'Щоденні фото та відео в батьківський чат. Ви завжди в курсі.' },
    ],
  },
  programs: {
    title: 'НАШІ ПРОГРАМИ',
    subtitle: 'Підберіть оптимальну програму для вашої дитини',
    ctaText: 'Записатись на пробне заняття',
    items: [
      { emoji: '🐣', title: 'Ясельна група', age: '2–3 роки', color: '#FF696F', desc: 'Адаптація, сенсорний розвиток, перші навички самостійності у грі.' },
      { emoji: '🌱', title: 'Молодша група', age: '3–4 роки', color: '#FFD600', desc: 'Розвиток мовлення, творчість, спілкування та базові знання про світ.' },
      { emoji: '🎨', title: 'Середня група', age: '4–5 років', color: '#A9D13D', desc: 'Поглиблений розвиток: математика, читання, музика, іноземна мова.' },
      { emoji: '📚', title: 'Підготовча група', age: '5–6 років', color: '#9FA7FF', desc: 'Підготовка до школи: письмо, читання, логіка та соціалізація.' },
      { emoji: '🌅', title: 'Ранковий клуб', age: '2–6 роки', color: '#FF8C42', desc: 'Гуртки та майстер-класи: танці, карате, ліплення, малювання.' },
      { emoji: '🇬🇧', title: 'Англійська', age: '3–6 роки', color: '#6BB8FF', desc: 'Занурення в мову через ігри, пісні та казки з носієм мови.' },
    ],
  },
  reviews: {
    title: 'Що говорять батьки',
    items: [
      { name: 'Олена М.', child: '4 роки', stars: 5, text: 'Наша Соня ходить сюди вже рік і обожнює! Педагоги дуже уважні, дитина розквітла.' },
      { name: 'Андрій К.', child: '3 роки', stars: 5, text: 'Чудовий садочок! Марко після першого місяця вже читає склади. Рекомендуємо!' },
      { name: 'Тетяна Ш.', child: '5 років', stars: 5, text: 'Дуже задоволені вибором. Катя плаче, коли нема садочку у вихідні 😄 Дякуємо команді!' },
      { name: 'Ігор Б.', child: '2 роки', stars: 5, text: 'Влад спочатку не хотів іти, а тепер прокидається сам і питає "коли садочок?"' },
    ],
  },
  contact: {
    tag: 'Зв\'яжіться з нами',
    title: 'Запишіть дитину\nдо садочку',
    subtitle: 'Заповніть форму і ми зв\'яжемося з вами протягом 30 хвилин у робочий час',
    address: 'вул. Осокорська, 15, Київ',
    phone: '+38 (067) 444-22-33',
    email: 'info@dytsadok.com.ua',
    hours: 'Пн–Пт: 07:00 – 19:00',
  },
  footer: {
    name: '«Дочки та Синочки»',
    description: 'Приватний дитячий садочок та центр естетично-спортивного розвитку',
    facebookUrl: '#',
    instagramUrl: '#',
    telegramUrl: '#',
  },
}

export function getContent() {
  try {
    const raw = localStorage.getItem(CONTENT_KEY)
    if (!raw) return DEFAULT_CONTENT
    // Deep merge: default fills in any missing keys
    return deepMerge(DEFAULT_CONTENT, JSON.parse(raw))
  } catch {
    return DEFAULT_CONTENT
  }
}

export function saveContent(content) {
  localStorage.setItem(CONTENT_KEY, JSON.stringify(content))
  // Dispatch event so open tabs can react
  window.dispatchEvent(new CustomEvent('contentUpdated', { detail: content }))
}

export function resetContent() {
  localStorage.removeItem(CONTENT_KEY)
  window.dispatchEvent(new CustomEvent('contentUpdated', { detail: DEFAULT_CONTENT }))
  return DEFAULT_CONTENT
}

function deepMerge(defaults, saved) {
  const result = { ...defaults }
  for (const key of Object.keys(saved)) {
    if (key in defaults && typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
      result[key] = deepMerge(defaults[key], saved[key])
    } else {
      result[key] = saved[key]
    }
  }
  return result
}
