import { useState } from 'react'
import logoSvg from '../assets/Toro-Logo2.svg'
import { Icons } from './ui'

interface Props {
  onSuccess: () => void
}

// Demo-only gate. This is a client-side prototype lock, not real security.
const DEMO_USER = 'toroadam'
const DEMO_PASS = 'strata2026'

const LoginScreen: React.FC<Props> = ({ onSuccess }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim().toLowerCase() === DEMO_USER && password === DEMO_PASS) {
      setError(null)
      try { sessionStorage.setItem('strata-auth', '1') } catch { /* ignore */ }
      onSuccess()
    } else {
      setError('Incorrect username or password.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998, background: '#080d12',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <style>{`
        @keyframes loginIn { from { opacity: 0; transform: translateY(14px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes loginShake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-7px)} 40%,80%{transform:translateX(7px)} }
        .strata-login-input {
          width: 100%; height: 46px; padding: 0 14px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.04);
          color: #fff; font-size: 14.5px; outline: none; transition: border-color .16s ease, background .16s ease;
          font-family: inherit;
        }
        .strata-login-input::placeholder { color: rgba(255,255,255,0.32); }
        .strata-login-input:focus { border-color: #E11837; background: rgba(255,255,255,0.06); }
      `}</style>

      <div style={{
        width: '100%', maxWidth: 392, animation: 'loginIn 480ms cubic-bezier(.2,.8,.3,1) both',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 26 }}>
          <img src={logoSvg} alt="Toro" style={{ width: 56, height: 'auto', display: 'block' }} />
          <span style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>Strata</span>
        </div>

        {/* Card */}
        <form
          onSubmit={submit}
          style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 20, padding: '30px 28px 28px', backdropFilter: 'blur(8px)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
            animation: shake ? 'loginShake 480ms' : 'none',
          }}
        >
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff', textAlign: 'center' }}>Welcome back</h1>
          <p style={{ margin: '7px 0 24px', fontSize: 13.5, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
            Sign in to the Course Imagery Publisher
          </p>

          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.66)', marginBottom: 7 }}>Username</label>
          <input
            className="strata-login-input"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(null) }}
            placeholder="toroadam"
            autoFocus
            autoComplete="username"
            style={{ marginBottom: 16 }}
          />

          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.66)', marginBottom: 7 }}>Password</label>
          <div style={{ position: 'relative', marginBottom: error ? 12 : 22 }}>
            <input
              className="strata-login-input"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null) }}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', borderRadius: 8,
              }}
            >
              {showPass ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
            </button>
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18,
              fontSize: 13, color: '#ff8a9b',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: '#E11837', flexShrink: 0 }} />
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%', height: 46, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: '#E11837', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
              boxShadow: '0 8px 22px rgba(225,24,55,0.35)', transition: 'transform .12s ease, filter .12s ease',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.985)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Sign in
          </button>
        </form>

        <p style={{ marginTop: 18, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.34)' }}>
          Demo access · <span style={{ color: 'rgba(255,255,255,0.55)' }}>toroadam</span> / <span style={{ color: 'rgba(255,255,255,0.55)' }}>strata2026</span>
        </p>
      </div>
    </div>
  )
}

export default LoginScreen
