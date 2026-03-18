'use client'

import Link from 'next/link'

interface Props {
  balance: number
}

export default function LowBalanceBanner({ balance }: Props) {
  if (balance >= 5) return null
  return (
    <div className="w-full bg-[#B8860B]/10 border-b border-[#B8860B]/20 px-6 py-2.5 flex items-center justify-between gap-4">
      <p className="text-[13px] text-[#F0D060]">
        Tu saldo es bajo (${Number(balance).toFixed(2)} USD). Recarga para seguir usando Reason.
      </p>
      <Link
        href="/settings/facturacion"
        className="shrink-0 text-[12px] font-semibold text-[#B8860B] hover:text-[#D4A017] transition-colors"
      >
        Recargar →
      </Link>
    </div>
  )
}
