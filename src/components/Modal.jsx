import { useState } from 'react'
import { addApplication } from '../store.js'

export default function Modal({ onClose }) {
  const [form, setForm] = useState({ name: '', phone: '', childName: '', childAge: '', program: 'Ясельна група', message: '' })
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = "Вкажіть ваше ім'я"
    if (!form.phone.trim()) e.phone = 'Вкажіть номер телефону'
    if (!form.childName.trim()) e.childName = "Вкажіть ім'я дитини"
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    addApplication(form)
    setSent(true)
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        <button onClick={onClose} style={styles.close}>✕</button>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h3 style={{ fontFamily: 'Onest', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Заявку відправлено!</h3>
            <p style={{ color: '#3A3A3A', marginBottom: 24 }}>Ми зв'яжемося з вами найближчим часом</p>
            <button className="btn-yellow" onClick={onClose}>Закрити</button>
          </div>
        ) : (
          <>
            <h3 style={styles.title}>Залишити заявку</h3>
            <p style={styles.subtitle}>Ми передзвонимо вам та відповімо на всі питання</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Ваше ім'я *" error={errors.name}>
                <input style={inputStyle(errors.name)} placeholder="Олена Мельник" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Телефон *" error={errors.phone}>
                <input style={inputStyle(errors.phone)} placeholder="+38 (067) 000-00-00" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Ім'я дитини *" error={errors.childName}>
                  <input style={inputStyle(errors.childName)} placeholder="Соня" value={form.childName} onChange={e => setForm({ ...form, childName: e.target.value })} />
                </Field>
                <Field label="Вік дитини">
                  <input style={inputStyle()} placeholder="4 роки" value={form.childAge} onChange={e => setForm({ ...form, childAge: e.target.value })} />
                </Field>
              </div>
              <Field label="Програма">
                <select style={inputStyle()} value={form.program} onChange={e => setForm({ ...form, program: e.target.value })}>
                  <option>Ясельна група (2-3 роки)</option>
                  <option>Молодша група (3-4 роки)</option>
                  <option>Середня група (4-5 років)</option>
                  <option>Підготовча група (5-6 років)</option>
                </select>
              </Field>
              <Field label="Коментар">
                <textarea style={{ ...inputStyle(), height: 80, resize: 'vertical' }} placeholder="Ваше питання або побажання..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              </Field>
              <button type="submit" className="btn-yellow" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
                Відправити заявку →
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label style={{ fontWeight: 600, fontSize: 13, color: '#3A3A3A', display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
      {error && <p style={{ color: '#FF696F', fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  )
}

function inputStyle(error) {
  return {
    width: '100%',
    padding: '12px 16px',
    border: `1.5px solid ${error ? '#FF696F' : '#E5E7EB'}`,
    borderRadius: 12,
    fontFamily: 'Manrope, sans-serif',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
    background: 'white',
  }
}

const styles = {
  close: {
    position: 'absolute',
    top: 16,
    right: 20,
    background: 'none',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    color: '#9CA3AF',
    lineHeight: 1,
  },
  title: {
    fontFamily: 'Onest, sans-serif',
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 8,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 24,
  },
}
