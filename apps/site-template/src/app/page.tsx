import type { Metadata } from 'next'
import ContactForm from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Головна',
  description: 'Опис сайту',
}

export default function HomePage() {
  return (
    <main>
      {/* Hero section — замінюється версткою з Figma */}
      <section className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">
          Назва компанії
        </h1>
        <p className="text-lg text-gray-500 text-center mb-10 max-w-xl">
          Короткий опис. Цей текст буде замінено на контент з Figma макету.
        </p>
        <ContactForm />
      </section>
    </main>
  )
}
