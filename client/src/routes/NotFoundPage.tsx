import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="editorial-card max-w-md text-center">
        <p className="micro-label">404</p>
        <h1 className="mt-2 font-headline text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm text-on-surface-variant">
          The route does not exist in the current Stitch-to-React mapping.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex rounded-radius-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white"
        >
          Return to login
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
