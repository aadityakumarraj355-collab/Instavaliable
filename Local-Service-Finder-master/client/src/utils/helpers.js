export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })

// Centralized INR Currency Formatter (₹ - en-IN)
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0)

export const formatPricingType = (type) => {
  const map = {
    fixed: 'Fixed Price',
    starting_at: 'Starting From',
    hourly: 'Hourly Rate',
    per_visit: 'Per Visit',
    custom_quote: 'Custom Quote',
  }
  return map[type] || 'Fixed Price'
}

export const formatPricingDisplay = (price, pricingType = 'fixed') => {
  const formatted = formatCurrency(price)
  switch (pricingType) {
    case 'starting_at':
      return `Starts at ${formatted}`
    case 'hourly':
      return `${formatted} / hr`
    case 'per_visit':
      return `${formatted} / visit`
    case 'custom_quote':
      return `Quote (~${formatted})`
    case 'fixed':
    default:
      return formatted
  }
}

export const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export const getAccountStatusColor = (status) => {
  const colors = {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    suspended: 'bg-red-100 text-red-800 border-red-200',
    blocked: 'bg-gray-900 text-white border-gray-900',
    restricted: 'bg-amber-100 text-amber-800 border-amber-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

export const CATEGORIES = [
  'Cleaning',
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Gardening',
  'Moving',
  'Tutoring',
  'Cooking',
  'Pet Care',
]
