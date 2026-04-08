import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import CTAButton from '@/components/CTAButton'
import { createClient } from '@/lib/supabase'
import { ORG_ID } from '@/lib/org'
import { DEFAULT_CONTENT, mergeWithDefaults } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Roofing Work — Професійні покрівельні роботи',
  description: 'Фальцева покрівля, металочерепиця, профнастил — монтаж під ключ в Івано-Франківській та Львівській областях.',
}

const LOGO_TOP  = 'https://dlsauceqpbkweuzxuvfc.supabase.co/storage/v1/object/public/media/roofing-work/assets/logo-top.svg'
const LOGO_WORK = 'https://dlsauceqpbkweuzxuvfc.supabase.co/storage/v1/object/public/media/roofing-work/assets/logo-work.svg'

// Feature icons (design-only, not editable)
const FEATURE_ICONS = [
  <svg key="0" width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 4C9.37 4 4 9.37 4 16s5.37 12 12 12 12-5.37 12-12S22.63 4 16 4zm-1 17l-5-5 1.41-1.41L15 18.17l7.59-7.59L24 12l-9 9z" fill="#fe4f18"/></svg>,
  <svg key="1" width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 2L2 9l14 7 14-7-14-7zM2 23l14 7 14-7M2 16l14 7 14-7" stroke="#fe4f18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  <svg key="2" width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M28 9H4a2 2 0 00-2 2v10a2 2 0 002 2h24a2 2 0 002-2V11a2 2 0 00-2-2zM8 19a3 3 0 110-6 3 3 0 010 6zm8 0a3 3 0 110-6 3 3 0 010 6zm8 0a3 3 0 110-6 3 3 0 010 6z" fill="#fe4f18"/></svg>,
  <svg key="3" width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 2l14 12v16H2V14L16 2z" stroke="#fe4f18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
]

async function getSiteContent() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_content')
      .select('section, content')
      .eq('org_id', ORG_ID)

    const dbMap: Record<string, unknown> = {}
    for (const row of data ?? []) dbMap[row.section] = row.content
    return mergeWithDefaults(dbMap)
  } catch {
    return mergeWithDefaults({})
  }
}

export default async function HomePage() {
  const c = await getSiteContent()

  return (
    <>
      <Navbar />
      <main>

        {/* ─── HERO ─── */}
        <section className="relative min-h-screen flex flex-col">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.hero.bgImage || DEFAULT_CONTENT.hero.bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative z-10 flex-1 flex flex-col justify-end pb-16 md:pb-20 px-5 max-w-[1160px] mx-auto w-full">
            <p className="text-white/70 font-body text-base md:text-lg mb-10 max-w-[520px] leading-relaxed">
              {c.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <h1 className="font-heading font-medium text-4xl sm:text-5xl lg:text-[62px] text-white uppercase leading-[1.2] flex-1 max-w-[700px]">
                {c.hero.title}
              </h1>
              <div className="sm:self-end">
                <CTAButton>Отримати консультацію</CTAButton>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SERVICES ─── */}
        <section id="services" className="py-20 md:py-24 px-5">
          <div className="max-w-[1160px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-11">
              <div className="flex flex-col gap-4 max-w-[540px]">
                <span className="inline-block bg-[#f4f5f9] text-[#999] text-xs font-body font-semibold uppercase tracking-[0.04em] px-2 py-1.5 rounded-[2px] w-fit">
                  Наші послуги
                </span>
                <h2 className="font-heading font-semibold text-3xl md:text-[36px] text-[#090909] leading-[1.1]">
                  {c.services.heading}
                </h2>
              </div>
              <p className="text-[#9c9c9c] font-body text-base leading-[1.4] max-w-[520px]">
                {c.services.description}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {c.services.items.map((service) => (
                <div key={service.title} className="rounded-[20px] overflow-hidden relative group cursor-pointer">
                  <div className="aspect-[3/4]">
                    {service.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                    <p className="font-body font-medium text-base text-white leading-[1.2]">{service.title}</p>
                    <p className="font-body text-sm text-[#fe4f18] leading-[1.4] mt-1">{service.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── ОСНОВНИЙ НАПРЯМОК ─── */}
        <section id="about" className="py-20 md:py-24 px-5 bg-white">
          <div className="max-w-[1160px] mx-auto">
            {/* Top: big heading left + intro text right */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
              <h2 className="font-heading font-medium text-5xl md:text-[70px] text-[#090909] uppercase leading-[1.15] max-w-[560px]">
                {c.about.heading}
              </h2>
              <p className="text-[#9c9c9c] font-body text-base leading-[1.5] max-w-[440px] md:pt-4">
                {c.about.intro}
              </p>
            </div>

            {/* Middle: subheading + description + buttons LEFT | photo RIGHT */}
            <div className="flex flex-col lg:flex-row gap-10 mb-14 items-start">
              <div className="flex flex-col gap-5 flex-1 max-w-[500px]">
                <span className="inline-block bg-[#f4f5f9] text-[#999] text-xs font-body font-semibold uppercase tracking-[0.04em] px-2 py-1.5 rounded-[2px] w-fit">
                  Наш досвід
                </span>
                <h3 className="font-heading font-semibold text-2xl text-[#090909]">{c.about.subheading}</h3>
                <p className="text-[#9c9c9c] font-body text-base leading-[1.5]">{c.about.description}</p>
                {c.about.checklist.length > 0 && (
                  <ul className="flex flex-col gap-2 mt-2">
                    {c.about.checklist.map((item) => (
                      <li key={item} className="flex items-center gap-2 font-body text-sm text-[#090909]">
                        <span className="text-[#fe4f18] font-bold">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {/* Buttons always visible */}
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <CTAButton>Розрахувати вартість</CTAButton>
                  <CTAButton variant="outline" className="border border-[#e5e5e5]">Результати роботи</CTAButton>
                </div>
              </div>

              {/* Photo right */}
              {c.about.photo && (
                <div className="lg:ml-auto rounded-[20px] overflow-hidden w-full lg:w-[520px] h-[320px] lg:h-[380px] flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.about.photo} alt={c.about.subheading} className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Bottom: 4 feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {c.about.features.map((f, i) => (
                <div key={f.title} className="bg-[#f4f5f9] rounded-[12px] p-6 flex flex-col gap-4">
                  {FEATURE_ICONS[i]}
                  <div>
                    <p className="font-body font-semibold text-base text-[#090909] mb-1">{f.title}</p>
                    <p className="font-body text-sm text-[#9c9c9c] leading-[1.5]">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── WORK WITH US ─── */}
        <section id="works" className="bg-[#0d0d0d] rounded-t-[44px] overflow-hidden">
          <div className="px-5 py-16 md:py-20">
            <div className="max-w-[1160px] mx-auto">
              <h2 className="font-heading font-medium text-4xl md:text-[56px] text-white uppercase leading-[1.2] mb-12">
                Робота з нами
              </h2>

              {/* 4 numbered step cards */}
              <div className="mb-12">
                <span className="inline-block bg-white/10 text-white/60 text-xs font-body font-semibold uppercase tracking-[0.04em] px-2 py-1.5 rounded-[2px] mb-4">
                  Етапи роботи
                </span>
                <h3 className="font-heading font-semibold text-2xl md:text-3xl text-white mb-8">
                  Як проходить співпраця
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {c.process.steps.map((step, i) => (
                    <div key={step.title} className="border border-white/10 rounded-[12px] p-6" style={{background: 'rgba(255,255,255,0.05)'}}>
                      <p className="font-heading font-semibold text-[#fe4f18] text-lg mb-3">
                        {String(i + 1).padStart(2, '0')}
                      </p>
                      <p className="font-body font-medium text-white text-base mb-2">{step.title}</p>
                      <p className="font-body text-white/50 text-sm leading-[1.5]">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hero image — after steps, before gallery (per Figma) */}
              <div className="rounded-[20px] overflow-hidden mb-12 h-[280px] md:h-[420px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.process.heroImage || DEFAULT_CONTENT.process.heroImage} alt="Роботи на об'єктах" className="w-full h-full object-cover" />
              </div>

              {/* Gallery */}
              {c.gallery.photos.length > 0 && (
                <div className="mb-14">
                  <span className="inline-block bg-white/10 text-white/60 text-xs font-body font-semibold uppercase tracking-[0.04em] px-2 py-1.5 rounded-[2px] mb-4">
                    Наші роботи
                  </span>
                  <h3 className="font-heading font-semibold text-2xl md:text-3xl text-white mb-8">
                    Процес монтажу на реальних об&apos;єктах
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {c.gallery.photos.filter(Boolean).map((img, i) => (
                      <div key={i} className="rounded-[16px] overflow-hidden aspect-[4/3]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={`Роботи ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Two-column CTA block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-[20px] p-8">
                  <h3 className="font-heading font-semibold text-xl text-white mb-4">Розрахуємо ваш дах без зайвих складнощів</h3>
                  <p className="font-body text-white/60 text-base leading-[1.5] mb-4">
                    Перед початком робіт проводимо огляд об&apos;єкта, виконуємо точні заміри та готуємо детальний прорахунок.
                  </p>
                  <ul className="flex flex-col gap-2">
                    {['Працюємо акуратно', 'Чистий монтаж без хаосу на ділянці та пошкодження матеріалів'].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-white/70 font-body text-sm">
                        <span className="text-[#fe4f18] mt-0.5">✓</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#fe4f18] rounded-[20px] p-8 flex flex-col justify-between">
                  <div>
                    <h3 className="font-heading font-semibold text-xl text-white mb-3">Бажаєте розрахувати вартість вашого проекту?</h3>
                    <p className="font-body text-white/80 text-base leading-[1.5] mb-6">
                      Зв&apos;яжіться з нами — проконсультуємо, зорієнтуємо по вартості та узгодимо зручний час для огляду об&apos;єкта.
                    </p>
                  </div>
                  <CTAButton className="bg-white text-[#090909] hover:bg-white/90">Обговорити мій проект</CTAButton>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── WHY TRUST ─── */}
        <section className="py-20 md:py-24 px-5 bg-white rounded-t-[64px]">
          <div className="max-w-[1160px] mx-auto flex flex-col gap-16">
            <h2 className="font-heading font-medium text-5xl md:text-[70px] text-[#090909] uppercase leading-[1.2]">
              Чому нам довіряють
            </h2>
            <div className="flex flex-col lg:flex-row items-start gap-10">
              <div className="flex flex-col gap-5 max-w-[500px]">
                <h3 className="font-body font-medium text-xl text-[#090909] leading-[1.4]">
                  Чому нам довіряють монтаж покрівлі?
                </h3>
                <p className="font-body text-[#9c9c9c] text-base leading-[1.5]">
                  Ми завжди дотримуємося порядку на робочій ділянці, щоб уникнути зайвого хаосу.
                  Наша команда працює з максимальною уважністю, забезпечуючи ефективність і безпеку на кожному етапі.
                </p>
              </div>
              {c.trust.photo && (
                <div className="lg:ml-auto rounded-[20px] overflow-hidden w-full lg:w-[520px] h-[260px] lg:h-[294px] flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.trust.photo} alt="Покрівельні роботи" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* 5 trust cards, second is orange per Figma */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {c.trust.items.map((item) => (
                <div key={item.label} className={`rounded-[8px] p-6 h-[120px] flex items-center ${item.active ? 'bg-[#fe4f18]' : 'bg-[#f4f5f9]'}`}>
                  <p className={`font-body font-medium text-base leading-[1.2] ${item.active ? 'text-white' : 'text-[#090909]'}`}>
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            {/* About company */}
            <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
              {c.trust.aboutPhoto && (
                <div className="relative rounded-[20px] overflow-hidden w-full lg:w-[500px] h-[380px] lg:h-[460px] flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.trust.aboutPhoto} alt="Roofing Work" className="w-full h-full object-cover" />
                  <div className="absolute top-6 left-6">
                    <div className="relative w-[100px] h-[37px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={LOGO_TOP} alt="Roofing" className="absolute top-0 left-0 h-[23px] w-auto" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={LOGO_WORK} alt="Work"   className="absolute bottom-0 left-[31px] h-[15px] w-auto" />
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-6 flex-1">
                <div className="flex flex-col gap-4">
                  <span className="inline-block bg-[#f4f5f9] text-[#999] text-xs font-body font-semibold uppercase tracking-[0.04em] px-2 py-1.5 rounded-[2px] w-fit">
                    Коротко про нашу роботу
                  </span>
                  <h3 className="font-heading font-semibold text-3xl md:text-[36px] text-[#090909] leading-[1.1]">Професійна покрівля</h3>
                </div>
                <p className="font-body text-[#9c9c9c] text-base leading-[1.5]">{c.trust.aboutText1}</p>
                <p className="font-body text-[#9c9c9c] text-base leading-[1.5]">{c.trust.aboutText2}</p>
              </div>
            </div>

            {/* Partners */}
            {c.partners.length > 0 && (
              <div className="flex flex-col gap-6">
                <span className="inline-block bg-[#f4f5f9] text-[#999] text-xs font-body font-semibold uppercase tracking-[0.04em] px-2 py-1.5 rounded-[2px] w-fit">
                  Наші партнери та об&apos;єкти
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {c.partners.map((p, i) => (
                    <div key={i} className={`${p.bg} rounded-[12px] h-[120px] md:h-[160px] flex items-center justify-center p-5`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.img} alt={`Партнер ${i + 1}`} className="max-h-[80px] max-w-full object-contain" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ─── CTA BANNER ─── */}
        {/* Figma: heading LEFT + description + button RIGHT */}
        <section className="relative overflow-hidden rounded-t-[44px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.cta.bgImage || DEFAULT_CONTENT.cta.bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/80" />
          <div className="relative z-10 px-5 py-20 md:py-28">
            <div className="max-w-[1160px] mx-auto flex flex-col lg:flex-row lg:items-end gap-10 lg:gap-20">
              <h2 className="font-heading font-medium text-5xl md:text-[70px] text-white uppercase leading-[1.2] flex-1">
                {c.cta.title}
              </h2>
              <div className="flex flex-col gap-6 max-w-[520px]">
                <p className="font-body font-medium text-white/80 text-lg leading-[1.5]">{c.cta.text}</p>
                <CTAButton>Отримати консультацію</CTAButton>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CONTACTS ─── */}
        <section id="contacts" className="bg-[#0d0d0d] px-5 py-16 md:py-20">
          <div className="max-w-[1160px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              <div className="flex flex-col gap-5">
                <span className="inline-block bg-white/10 text-white/60 text-xs font-body font-semibold uppercase tracking-[0.06em] px-2 py-1.5 rounded-[2px] w-fit">
                  Контакти
                </span>
                <div className="flex flex-col gap-2">
                  <a href={`tel:${c.contacts.phone}`} className="font-body text-white text-base hover:text-[#fe4f18] transition-colors">{c.contacts.phone}</a>
                  <a href={`mailto:${c.contacts.email}`} className="font-body text-white/60 text-base hover:text-[#fe4f18] transition-colors">{c.contacts.email}</a>
                </div>
                <div className="flex gap-3">
                  {[
                    { label: 'Telegram', href: '#', path: 'M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.94 8.19l-2.02 9.53c-.15.68-.54.84-1.09.52l-3-2.21-1.45 1.4c-.16.16-.3.3-.6.3l.21-3.05 5.52-4.99c.24-.21-.05-.33-.37-.12L6.27 14.03 3.3 13.1c-.66-.2-.67-.66.14-.98l11.62-4.48c.55-.2 1.03.13.88.55z' },
                    { label: 'Viber',    href: '#', path: 'M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm2.83 16.56c-.4.11-.81.15-1.2.15-1.54 0-3.24-.85-4.6-2.22-1.37-1.36-2.22-3.06-2.22-4.6 0-.4.04-.8.15-1.2.3-1.12 1.28-1.85 2.29-1.63l.56.12c.41.09.77.38.96.79l.87 1.88c.18.39.14.85-.1 1.21l-.46.66c-.13.18-.1.42.05.59l1.26 1.26c.17.15.41.18.59.05l.66-.46c.36-.24.82-.28 1.21-.1l1.88.87c.41.19.7.55.79.96l.12.56c.22 1.01-.51 1.99-1.61 2.31z' },
                    { label: 'WhatsApp',href: '#', path: 'M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm.05 3.6c4.67 0 8.35 3.7 8.35 8.35 0 4.66-3.68 8.35-8.35 8.35-1.47 0-2.85-.38-4.05-1.05L4 20.4l1.16-3.9A8.28 8.28 0 013.7 12c0-4.65 3.7-8.4 8.35-8.4zm-2.4 4.87c-.19-.44-.4-.45-.58-.46-.15-.01-.32-.01-.49-.01-.17 0-.44.06-.67.32-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.12.17 1.72 2.75 4.24 3.74 2.1.82 2.52.66 2.97.62.46-.04 1.47-.6 1.68-1.18.21-.57.21-1.07.15-1.17-.06-.1-.23-.16-.49-.28-.26-.12-1.47-.73-1.7-.81-.23-.08-.4-.12-.57.13-.17.25-.64.8-.78.97-.14.17-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.39.11-.51.11-.11.25-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.35-.77-1.85z' },
                  ].map((s) => (
                    <a key={s.label} href={s.href} aria-label={s.label}
                      className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#fe4f18] transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d={s.path} /></svg>
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <span className="inline-block bg-white/10 text-white/60 text-xs font-body font-semibold uppercase tracking-[0.06em] px-2 py-1.5 rounded-[2px] w-fit">
                  Адреса
                </span>
                <p className="font-body text-white text-base">{c.contacts.address}</p>
                <a href="#" className="font-body text-[#fe4f18] text-base hover:underline inline-flex items-center gap-1">
                  Дивитись на мапі
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              </div>

              <div className="flex flex-col gap-5">
                <span className="inline-block bg-white/10 text-white/60 text-xs font-body font-semibold uppercase tracking-[0.06em] px-2 py-1.5 rounded-[2px] w-fit">
                  Підтримуємо військових
                </span>
                <p className="font-body text-white text-base leading-[1.5]">
                  {c.contacts.military}
                </p>
                <CTAButton className="w-fit bg-white/10 text-white hover:bg-white/20 border-0">
                  Залишити заявку 🇺🇦
                </CTAButton>
              </div>
            </div>
          </div>
        </section>

        {/* ─── COPYRIGHT ─── */}
        <footer className="bg-[#0d0d0d] border-t border-white/10 px-5 py-4">
          <div className="max-w-[1160px] mx-auto flex items-center justify-between">
            <p className="font-body text-white/40 text-sm">© 2026. Всі права захищені</p>
            <p className="font-body text-white/30 text-xs">all rights reserved</p>
          </div>
        </footer>

      </main>
    </>
  )
}
