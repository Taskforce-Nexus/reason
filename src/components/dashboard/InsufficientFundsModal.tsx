'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function InsufficientFundsModal() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    function handle() { setOpen(true) }
    window.addEventListener('insufficient-funds', handle)
    return () => window.removeEventListener('insufficient-funds', handle)
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-8 max-w-sm w-full space-y-5">
        <div className="space-y-2">
          <p className="text-[11px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Saldo insuficiente</p>
          <p className="text-white text-[18px] font-bold font-outfit">Tu saldo se agotó</p>
          <p className="text-[13px] text-[#8892A4] leading-relaxed">
            Recarga tu saldo para continuar usando los servicios de Reason.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { setOpen(false); router.push('/settings/facturacion') }}
            className="flex-1 py-2.5 bg-[#B8860B] hover:bg-[#A07710] text-black font-semibold text-[13px] rounded-lg transition-colors"
          >
            Recargar ahora
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2.5 border border-[#1E2A4A] text-[13px] text-[#8892A4] hover:text-white rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
