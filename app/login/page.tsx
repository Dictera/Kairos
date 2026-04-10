'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/')
    } else {
      setError('Şifre hatalı. Lütfen tekrar deneyin.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div
        className="w-full max-w-[400px] p-6 rounded-lg"
        style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
      >
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Sigorta Takip</h1>
        <p className="text-sm text-gray-600 mb-6">
          Avukat paneline erişmek için şifrenizi girin.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
            Şifre
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm mb-4 focus:outline-none focus:ring-2"
            style={{ borderColor: '#e2e8f0', outlineColor: '#14b8a6' }}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-md text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#14b8a6' }}
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
          {error && (
            <p className="mt-3 text-sm" style={{ color: '#dc2626' }}>
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
