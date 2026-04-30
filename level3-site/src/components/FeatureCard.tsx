import { Link } from 'react-router-dom'
import { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  to: string
  color?: string
}

const FeatureCard = ({ icon: Icon, title, description, to, color = 'bg-primary' }: FeatureCardProps) => {
  const colorClass = color || 'bg-primary'

  return (
    <Link
      to={to}
      className="block bg-white rounded-xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-200 group"
    >
      <div className={`w-14 h-14 rounded-xl ${colorClass} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-secondary mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed">
        {description}
      </p>
    </Link>
  )
}

export default FeatureCard
