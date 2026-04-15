import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { loginUser } from '../lib/api'
import { getSession, setSession } from '../lib/session'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import TextField from '../components/ui/TextField'
import { useNavigate } from 'react-router-dom'

type LoginRole = 'field' | 'admin'

const demoCredentials: Record<LoginRole, { email: string; password: string }> = {
  field: { email: 'field@org.org', password: 'field123' },
  admin: { email: 'admin@org.org', password: 'admin123' },
}

function LoginPage() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<LoginRole>('field')
  const [email, setEmail] = useState(demoCredentials.field.email)
  const [password, setPassword] = useState(demoCredentials.field.password)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      return
    }

    navigate('/dashboard', { replace: true })
  }, [navigate])

  function handleRoleSwitch(role: LoginRole) {
    setSelectedRole(role)
    setEmail(demoCredentials[role].email)
    setPassword(demoCredentials[role].password)
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await loginUser(email, password)
      setSession(response.user)
      navigate('/dashboard', { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to sign in')
    } finally {
      setIsSubmitting(false)
    }
  }

  const tabBaseClass =
    'flex-1 rounded-radius-pill px-4 py-2.5 text-sm font-semibold transition-all duration-200 outline-none'
  const activeTabClass =
    'bg-[var(--color-primary)] text-white shadow-md'
  const inactiveTabClass =
    'bg-transparent text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-low)]'

  return (
    <Card className="w-full max-w-md space-y-6 p-8 shadow-editorial">
      <div>
        <p className="micro-label">Authentication</p>
        <h2 className="mt-2 font-headline text-2xl font-semibold">Sign in</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Access your employee and admin workspace.</p>
      </div>

      {/* Role Toggle */}
      <div
        className="flex gap-1 rounded-radius-pill border border-outline-variant bg-[var(--color-surface-high)] p-1"
        role="tablist"
        aria-label="Login role"
      >
        <button
          type="button"
          role="tab"
          id="tab-field"
          aria-selected={selectedRole === 'field'}
          aria-controls="login-form"
          className={`${tabBaseClass} ${selectedRole === 'field' ? activeTabClass : inactiveTabClass}`}
          onClick={() => handleRoleSwitch('field')}
        >
          Field Agent
        </button>
        <button
          type="button"
          role="tab"
          id="tab-admin"
          aria-selected={selectedRole === 'admin'}
          aria-controls="login-form"
          className={`${tabBaseClass} ${selectedRole === 'admin' ? activeTabClass : inactiveTabClass}`}
          onClick={() => handleRoleSwitch('admin')}
        >
          Admin
        </button>
      </div>

      <form id="login-form" className="space-y-4" onSubmit={handleSubmit} role="tabpanel" aria-labelledby={`tab-${selectedRole}`}>
        <TextField
          type="email"
          label="Email"
          placeholder="name@org.org"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          type="password"
          label="Password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error ? <p className="text-sm font-medium text-[var(--color-error)]">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Continue'}
        </Button>
      </form>

      <p className="text-sm text-on-surface-variant">
        Admin preview: <Link to="/dashboard" className="font-medium text-primary">Go to dashboard</Link>
      </p>
      <p className="text-xs text-on-surface-variant">
        Demo accounts: admin@org.org / admin123 or field@org.org / field123
      </p>
    </Card>
  )
}

export default LoginPage
