import { Link } from 'react-router-dom'
import logoImg from '../assets/logo.jpeg'

export default function Logo({ size = 'default', showTagline = false, className = '' }) {
  const isSm = size === 'sm'
  const isLg = size === 'lg'
  const isXl = size === 'xl'

  const imgSizeClass = isSm
    ? 'h-8 w-8'
    : isLg
    ? 'h-12 w-12'
    : isXl
    ? 'h-16 w-16'
    : 'h-9 w-9'

  const titleSizeClass = isSm
    ? 'text-lg'
    : isLg
    ? 'text-2xl'
    : isXl
    ? 'text-3xl'
    : 'text-xl'

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 group transition-transform active:scale-95 ${className}`}>
      <div className={`relative overflow-hidden rounded-xl shadow-sm border border-emerald-100/50 bg-white p-0.5 flex items-center justify-center ${imgSizeClass}`}>
        <img
          src={logoImg}
          alt="Instavaliable Logo"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="flex flex-col leading-none">
        <div className={`font-extrabold tracking-tight ${titleSizeClass}`}>
          <span className="text-[#0B1E3F]">Insta</span>
          <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 bg-clip-text text-transparent">
            valiable
          </span>
        </div>
        {showTagline && (
          <span className="text-[10px] font-medium tracking-wide text-gray-500 mt-0.5 uppercase">
            Local Services · On Demand
          </span>
        )}
      </div>
    </Link>
  )
}
