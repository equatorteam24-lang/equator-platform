// Fetches USD/UAH rate from National Bank of Ukraine (free, no API key)
// NBU updates rate daily; we cache for 1 hour

let cached: { rate: number; fetchedAt: number } | null = null
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function getUsdRate(): Promise<number> {
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.rate
  }

  try {
    const res = await fetch(
      'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json',
      { next: { revalidate: 3600 } }
    )
    const data = await res.json() as { rate: number }[]
    const rate = data[0]?.rate
    if (rate && rate > 0) {
      cached = { rate, fetchedAt: Date.now() }
      return rate
    }
  } catch { /* fallback below */ }

  // Fallback if NBU API is unavailable
  return cached?.rate ?? 43
}

export function usdToUah(usd: number, rate: number): number {
  return Math.ceil(usd * rate / 10) * 10 // Round up to nearest 10 грн
}
