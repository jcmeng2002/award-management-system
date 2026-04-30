import { ApplicationStatus } from '../types'

interface StatusBadgeProps {
  status: ApplicationStatus
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusConfig: Record<ApplicationStatus, { label: string; className: string }> = {
    draft: {
      label: '草稿',
      className: 'bg-gray-100 text-gray-700 border-gray-200'
    },
    pending_confirm: {
      label: '待确认',
      className: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    approved: {
      label: '已通过',
      className: 'bg-green-100 text-green-700 border-green-200'
    },
    rejected: {
      label: '已驳回',
      className: 'bg-red-100 text-red-700 border-red-200'
    },
  }

  const config = statusConfig[status]

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  )
}

export default StatusBadge
