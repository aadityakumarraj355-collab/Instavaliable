import { MapPin, CheckCircle, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../utils/helpers'
import { WhatsAppIcon } from './WhatsAppButton'
import { getServiceEnquiryWhatsAppUrl } from '../utils/whatsapp'

export default function ServiceCard({ service }) {
  const whatsappUrl = getServiceEnquiryWhatsAppUrl({
    phone: service.workerId?.phone,
    serviceTitle: service.title,
    category: service.category,
    price: service.price,
    workerName: service.workerId?.name,
  })

  return (
    <div className="card hover:shadow-lg transition-all duration-200 flex flex-col group border-gray-100 hover:border-emerald-200">
      <Link to={`/services/${service._id}`} className="block">
        <div className="h-40 bg-gradient-to-br from-emerald-100/60 via-teal-50 to-blue-100/60 flex items-center justify-center relative overflow-hidden">
          <Wrench size={42} className="text-emerald-500/70 group-hover:scale-110 transition-transform duration-300" />
          <span className="absolute top-3 left-3 text-xs font-semibold text-emerald-800 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full shadow-2xs">
            {service.category}
          </span>
        </div>
      </Link>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/services/${service._id}`}>
            <h3 className="font-bold text-gray-900 mt-1 mb-1.5 line-clamp-1 group-hover:text-emerald-600 transition-colors">
              {service.title}
            </h3>
          </Link>
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {service.description}
          </p>
        </div>

        <div className="pt-2 border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <MapPin size={13} className="text-emerald-500" />
              <span className="truncate max-w-[110px]">{service.location || 'Local Area'}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-bold text-emerald-600">{formatPricingDisplay(service.price, service.pricingType)}</span>
              {service.pricingType && service.pricingType !== 'fixed' && (
                <span className="text-[10px] text-gray-400 capitalize">{service.pricingType.replace('_', ' ')}</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            {service.workerId && (
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700 shrink-0">
                  {service.workerId.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-xs text-gray-600 truncate">{service.workerId.name}</span>
                {service.workerId.isVerified && (
                  <CheckCircle size={11} className="text-emerald-600 shrink-0" />
                )}
              </div>
            )}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[#25D366] hover:text-[#1da851] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition-colors shrink-0"
              title="Chat about this service on WhatsApp"
            >
              <WhatsAppIcon size={12} />
              <span>Chat</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

