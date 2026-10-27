// WhatsApp click-to-chat utility for Instavaliable
import { whatsAppService } from '../services/whatsAppService'
import { formatCurrency } from './helpers'

export const DEFAULT_WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '+919876543210'

let cachedContacts = null
let lastFetchedAt = 0

/**
 * Fetch and cache active WhatsApp contacts from database
 */
export async function getLiveWhatsAppNumber(category = 'customer_support') {
  const now = Date.now()
  // Cache for 60 seconds
  if (!cachedContacts || now - lastFetchedAt > 60000) {
    try {
      const res = await whatsAppService.getActiveContacts()
      if (res.data?.success && res.data.data) {
        cachedContacts = res.data.data
        lastFetchedAt = now
      }
    } catch {
      // Fallback
    }
  }

  if (cachedContacts) {
    if (category && cachedContacts.byCategory?.[category]) {
      return cachedContacts.byCategory[category].phoneNumber
    }
    if (cachedContacts.primary) {
      return cachedContacts.primary.phoneNumber
    }
  }

  return DEFAULT_WHATSAPP_NUMBER
}

/**
 * Format phone number to international WhatsApp standard (digits only, no '+' or leading zeros)
 */
export function sanitizePhone(phone) {
  if (!phone) return ''
  return phone.replace(/[^0-9]/g, '')
}

/**
 * Generate a wa.me URL
 */
export function buildWhatsAppLink(phone, message) {
  const cleanPhone = sanitizePhone(phone || DEFAULT_WHATSAPP_NUMBER)
  const encodedText = encodeURIComponent(message || '')
  return `https://wa.me/${cleanPhone}?text=${encodedText}`
}

/**
 * Direct WhatsApp Communication: Customer -> Selected Service Provider
 */
export function getProviderDirectWhatsAppUrl({
  providerPhone,
  providerName,
  serviceTitle,
  price,
  pricingType,
  bookingId,
  clientName,
}) {
  const targetPhone = providerPhone || DEFAULT_WHATSAPP_NUMBER
  const formattedPrice = price !== undefined ? formatCurrency(price) : null

  const text = [
    `*Hello ${providerName || 'Service Professional'}!* 👋`,
    ``,
    `I found your service on *Instavaliable* and would like to connect directly:`,
    serviceTitle ? `*Service:* ${serviceTitle}` : null,
    formattedPrice ? `*Pricing:* ${formattedPrice} ${pricingType ? `(${pricingType})` : ''}` : null,
    bookingId ? `*Booking Reference:* ${bookingId}` : null,
    clientName ? `*My Name:* ${clientName}` : null,
    ``,
    `Could you please let me know your earliest availability? Thank you!`,
    ``,
    `_Instavaliable — Local Services · On Demand_`,
  ]
    .filter(Boolean)
    .join('\n')

  return buildWhatsAppLink(targetPhone, text)
}

/**
 * Generate a pre-filled WhatsApp message for a booking enquiry or confirmed request
 */
export function getBookingWhatsAppUrl({
  phone,
  requestId,
  serviceTitle,
  clientName,
  workerName,
  date,
  scheduledTime,
  address,
  notes,
  price,
}) {
  const targetPhone = phone || DEFAULT_WHATSAPP_NUMBER
  const formattedPrice = price !== undefined ? formatCurrency(price) : null

  const text = [
    `*Hello! Instavaliable Booking Enquiry* 🛠️`,
    ``,
    `*Booking Request ID:* ${requestId || 'Pending'}`,
    `*Service:* ${serviceTitle || 'General Service'}`,
    formattedPrice ? `*Price:* ${formattedPrice}` : null,
    clientName ? `*Client Name:* ${clientName}` : null,
    workerName ? `*Assigned Professional:* ${workerName}` : null,
    date ? `*Date:* ${date}` : null,
    scheduledTime ? `*Time:* ${scheduledTime}` : null,
    address ? `*Location:* ${address}` : null,
    notes ? `*Details/Issue:* ${notes}` : null,
    ``,
    `_Powered by Instavaliable — Local Services · On Demand_`,
  ]
    .filter(Boolean)
    .join('\n')

  return buildWhatsAppLink(targetPhone, text)
}

/**
 * Quick enquiry on a service without booking yet
 */
export function getServiceEnquiryWhatsAppUrl({
  phone,
  serviceTitle,
  category,
  price,
  workerName,
}) {
  const targetPhone = phone || DEFAULT_WHATSAPP_NUMBER
  const formattedPrice = price !== undefined ? formatCurrency(price) : null

  const text = [
    `*Hello! I'm interested in a service on Instavaliable* 👋`,
    ``,
    `*Service:* ${serviceTitle}`,
    category ? `*Category:* ${category}` : null,
    formattedPrice ? `*Price:* ${formattedPrice}` : null,
    workerName ? `*Professional:* ${workerName}` : null,
    ``,
    `Could you please share more information on availability and scheduling? Thank you!`,
  ]
    .filter(Boolean)
    .join('\n')

  return buildWhatsAppLink(targetPhone, text)
}
