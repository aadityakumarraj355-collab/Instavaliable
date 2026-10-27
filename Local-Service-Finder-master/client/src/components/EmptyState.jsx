import { PackageOpen } from 'lucide-react'

export default function EmptyState({ title = 'No results found', description = '', icon: Icon = PackageOpen }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon size={48} className="text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-gray-500 text-sm max-w-sm">{description}</p>}
    </div>
  )
}
