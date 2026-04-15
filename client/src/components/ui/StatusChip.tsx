type StatusChipProps = {
  children: string
}

function StatusChip({ children }: StatusChipProps) {
  return <span className="status-chip">{children}</span>
}

export default StatusChip
