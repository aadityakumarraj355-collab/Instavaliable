import { MessageSquare } from 'lucide-react'

// Official WhatsApp SVG Icon
export function WhatsAppIcon({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.52 3.449A11.91 11.91 0 0012.07 0C5.46 0 .09 5.37.09 11.98c0 2.11.55 4.17 1.6 5.99L0 24l6.21-1.63a11.97 11.97 0 005.86 1.51h.01c6.61 0 11.98-5.37 11.98-11.98 0-3.2-1.25-6.21-3.54-8.451zM12.08 21.87h-.01a9.92 9.92 0 01-5.06-1.39l-.36-.22-3.76.99 1-3.66-.24-.38a9.88 9.88 0 01-1.52-5.23c0-5.48 4.46-9.94 9.95-9.94 2.65 0 5.15 1.03 7.02 2.91a9.9 9.9 0 012.91 7.03c0 5.48-4.46 9.94-9.95 9.94zm5.46-7.46c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01s-.52.07-.8.37c-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.09 3.2 5.07 4.48.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function WhatsAppButton({
  href,
  onClick,
  children = 'Chat on WhatsApp',
  variant = 'primary', // 'primary', 'secondary', 'subtle', 'floating'
  size = 'md',
  className = '',
}) {
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold',
  }[size] || 'text-sm px-4 py-2.5 gap-2'

  const variantClasses = {
    primary:
      'bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-sm hover:shadow-md transition-all duration-200 active:scale-95',
    secondary:
      'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 transition-all duration-200',
    subtle:
      'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 transition-colors',
    floating:
      'fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20bd5a] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center gap-2 group',
  }[variant] || 'bg-[#25D366] text-white'

  const content = (
    <>
      <WhatsAppIcon size={size === 'lg' ? 22 : size === 'sm' ? 15 : 18} />
      <span>{children}</span>
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center font-medium rounded-xl transition-all ${sizeClasses} ${variantClasses} ${className}`}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium rounded-xl transition-all ${sizeClasses} ${variantClasses} ${className}`}
    >
      {content}
    </button>
  )
}
