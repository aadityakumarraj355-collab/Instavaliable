import toast from 'react-hot-toast'

// Inline base64 short beep (Web Audio API generated)
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    // AudioContext not available — silently skip
  }
}

export function notify(message, icon = '🔔') {
  playBeep()
  toast(message, {
    icon,
    duration: 6000,
    style: {
      background: '#1e293b',
      color: '#f8fafc',
      fontWeight: '500',
      borderRadius: '12px',
      padding: '14px 18px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    },
  })
}
