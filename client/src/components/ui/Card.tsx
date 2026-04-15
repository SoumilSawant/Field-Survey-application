import type { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  className?: string
}

function Card({ children, className = '' }: CardProps) {
  return <div className={['rounded-radius-card border border-outline-variant bg-surface-container-lowest', className].join(' ')}>{children}</div>
}

export default Card
