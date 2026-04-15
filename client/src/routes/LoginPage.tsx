import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { loginUser } from '../lib/api'
import { getSession, setSession } from '../lib/session'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import TextField from '../components/ui/TextField'
import { useNavigate } from 'react-router-dom'

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('field@org.org')
  const [password, setPassword] = useState('field123')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      return
    }

    navigate('/dashboard', { replace: true })
  }, [navigate])

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

  return (
    <Card className="w-full max-w-md space-y-6 p-8 shadow-editorial">
      <div>
        <p className="micro-label">Authentication</p>
        <h2 className="mt-2 font-headline text-2xl font-semibold">Sign in</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Access your employee and admin workspace.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
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
