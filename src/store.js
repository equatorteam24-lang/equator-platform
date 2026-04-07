// Simple localStorage-based store for applications/requests

const STORAGE_KEY = 'dytsadok_applications'

function getSeedData() {
  return [
    {
      id: 1,
      name: 'Олена Мельник',
      phone: '+38 (067) 123-45-67',
      childName: 'Соня',
      childAge: '4 роки',
      program: 'Ясельна група',
      message: 'Цікавить старший садок',
      date: '2026-03-15T10:23:00',
      status: 'new',
    },
    {
      id: 2,
      name: 'Андрій Коваль',
      phone: '+38 (093) 987-65-43',
      childName: 'Марко',
      childAge: '3 роки',
      program: 'Молодша група',
      message: '',
      date: '2026-03-18T14:05:00',
      status: 'contacted',
    },
    {
      id: 3,
      name: 'Тетяна Шевченко',
      phone: '+38 (050) 555-44-33',
      childName: 'Катя',
      childAge: '5 років',
      program: 'Підготовча група',
      message: 'Хочемо записатися на пробне заняття',
      date: '2026-03-20T09:00:00',
      status: 'new',
    },
    {
      id: 4,
      name: 'Ігор Бондаренко',
      phone: '+38 (066) 222-11-00',
      childName: 'Влад',
      childAge: '2 роки',
      program: 'Ясельна група',
      message: '',
      date: '2026-03-22T16:30:00',
      status: 'enrolled',
    },
    {
      id: 5,
      name: 'Марина Іваненко',
      phone: '+38 (097) 333-22-11',
      childName: 'Аліна',
      childAge: '4 роки',
      program: 'Середня група',
      message: 'Питання щодо харчування',
      date: '2026-04-01T11:15:00',
      status: 'new',
    },
    {
      id: 6,
      name: 'Сергій Петренко',
      phone: '+38 (073) 444-55-66',
      childName: 'Дмитро',
      childAge: '6 років',
      program: 'Підготовча група',
      message: '',
      date: '2026-04-03T13:45:00',
      status: 'contacted',
    },
  ]
}

export function getApplications() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const seed = getSeedData()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
  return JSON.parse(raw)
}

export function addApplication(data) {
  const apps = getApplications()
  const newApp = {
    ...data,
    id: Date.now(),
    date: new Date().toISOString(),
    status: 'new',
  }
  apps.unshift(newApp)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps))
  return newApp
}

export function updateApplicationStatus(id, status) {
  const apps = getApplications()
  const idx = apps.findIndex(a => a.id === id)
  if (idx !== -1) {
    apps[idx].status = status
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps))
  }
}

export function deleteApplication(id) {
  const apps = getApplications().filter(a => a.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps))
}

export function getStats() {
  const apps = getApplications()
  const now = new Date()
  const thisMonth = apps.filter(a => {
    const d = new Date(a.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  return {
    total: apps.length,
    new: apps.filter(a => a.status === 'new').length,
    contacted: apps.filter(a => a.status === 'contacted').length,
    enrolled: apps.filter(a => a.status === 'enrolled').length,
    thisMonth: thisMonth.length,
  }
}
