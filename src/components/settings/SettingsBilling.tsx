'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from '@/components/ui/Toast'

interface Subscription {
  plan_id: string | null
  status: string | null
  current_period_end: string | null
}

interface UsageRow {
  id: string
  project_id: string | null
  activity: string | null
  tokens_used: number
  cost_usd: number
  created_at: string
  project?: { name: string } | null
}

interface Invoice {
  id: string
  concept: string | null
  amount_usd: number
  status: string | null
  pdf_url?: string | null
  created_at: string
}

interface PaymentMethod {
  id: string
  brand: string | null
  last4: string | null
  exp_month: number | null
  exp_year: number | null
}

interface PriceIds {
  token10?: string
  token25?: string
  token50?: string
  token100?: string
}

interface Props {
  balance: number
  subscription: Subscription | null
  usage: UsageRow[]
  invoices: Invoice[]
  paymentMethod: PaymentMethod | null
  priceIds?: PriceIds
}

const PLAN_NAMES: Record<string, string> = {
  core: 'Plan Core',
  pro: 'Plan Pro',
  enterprise: 'Enterprise',
}

const PLAN_PRICE: Record<string, string> = {
  core: '$29/mes',
  pro: '$79/mes',
  enterprise: 'Personalizado',
}

const ACTIVITY_LABELS: Record<string, string> = {
  compose: 'Composición',
  compose_edit: 'Edición entregable',
  session_question: 'Pregunta sesión',
  session_resolve: 'Resolución sesión',
  generate_specialist: 'Especialista',
  generate_persona: 'Buyer persona',
  seed_chat: 'Semilla chat',
  brief_generation: 'Resumen fundador',
}

export default function SettingsBilling({
  balance,
  subscription,
  usage,
  invoices,
  paymentMethod,
  priceIds,
}: Props) {
  const [showFunds, setShowFunds] = useState(false)
  const [amount, setAmount] = useState('')
  const [loadingFunds, setLoadingFunds] = useState(false)
  const [loadingPortal, setLoadingPortal] = useState(false)

  const planId = subscription?.plan_id ?? null
  const planName = planId ? (PLAN_NAMES[planId] ?? planId) : 'Plan Free'
  const planPrice = planId ? (PLAN_PRICE[planId] ?? '') : 'Sin suscripción'
  const isActive = subscription?.status === 'activo' || subscription?.status === 'active'
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('es', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const QUICK_AMOUNTS = [
    { label: '$10', value: 10, priceId: priceIds?.token10 },
    { label: '$25', value: 25, priceId: priceIds?.token25 },
    { label: '$50', value: 50, priceId: priceIds?.token50 },
    { label: '$100', value: 100, priceId: priceIds?.token100 },
  ]

  async function handleQuickRecharge(amountVal: number, priceId?: string) {
    setLoadingFunds(true)
    try {
      const body = priceId
        ? { price_id: priceId, mode: 'payment' }
        : { amount: amountVal, mode: 'payment' }
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const { url, error } = await res.json()
      if (error) { toast(error || 'Error al procesar'); return }
      if (url) window.location.href = url
    } catch {
      toast('Error iniciando checkout. Intenta de nuevo.')
    } finally {
      setLoadingFunds(false)
    }
  }

  async function handleCustomRecharge() {
    const num = parseFloat(amount)
    if (!num || num < 5) { toast('Monto mínimo: $5 USD'); return }
    if (num > 1000) { toast('Monto máximo: $1,000 USD'); return }
    await handleQuickRecharge(num)
  }

  async function handlePortal() {
    setLoadingPortal(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url, error } = await res.json()
      if (error) { toast(error || 'Error abriendo portal'); return }
      if (url) window.location.href = url
    } catch {
      toast('Error abriendo portal. Intenta de nuevo.')
    } finally {
      setLoadingPortal(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* TU SALDO */}
      <section className="space-y-3">
        <p className="text-[11px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Tu saldo</p>
        <div className="bg-[#0D1535] border border-[#B8860B] rounded-lg p-6 flex items-start justify-between gap-6">
          <div>
            <p className="text-[36px] text-white font-bold font-outfit">
              ${Number(balance).toFixed(2)}
            </p>
            <p className="text-[12px] text-[#4A5568] mt-1">disponible en USD</p>
          </div>
          {showFunds ? (
            <div className="flex flex-col gap-3 min-w-[220px]">
              <div className="flex gap-2 flex-wrap">
                {QUICK_AMOUNTS.map(({ label, value, priceId }) => (
                  <button
                    key={value}
                    type="button"
                    disabled={loadingFunds}
                    onClick={() => handleQuickRecharge(value, priceId)}
                    className="px-3 py-1.5 rounded-lg text-[12px] transition-colors border border-[#1E2A4A] text-[#8892A4] hover:bg-[#B8860B] hover:text-black hover:border-[#B8860B] disabled:opacity-50"
                  >
                    {loadingFunds ? '...' : label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#8892A4] text-[13px]">$</span>
                <input
                  type="number"
                  min="5"
                  max="1000"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Otro monto"
                  className="flex-1 px-3 py-1.5 bg-[#0A1128] border border-[#1E2A4A] rounded-lg text-[#F8F8F8] text-[13px] focus:outline-none focus:border-[#B8860B]/50"
                />
                <span className="text-[11px] text-[#4A5568]">USD</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCustomRecharge}
                  disabled={loadingFunds || !amount}
                  className="flex-1 py-2 bg-[#B8860B] hover:bg-[#A07710] disabled:opacity-50 text-black font-semibold text-[13px] rounded-lg transition-colors"
                >
                  {loadingFunds ? 'Redirigiendo...' : `Recargar $${amount || '0'} USD`}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowFunds(false); setAmount('') }}
                  className="px-3 py-2 border border-[#1E2A4A] text-[13px] text-[#4A5568] hover:text-white rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowFunds(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#B8860B] hover:bg-[#A07710] text-black font-semibold text-[13px] rounded-lg transition-colors"
            >
              Recargar saldo →
            </button>
          )}
        </div>
      </section>

      {/* TU PLAN */}
      <section className="space-y-3">
        <p className="text-[11px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Tu plan</p>
        <div className="bg-[#0D1535] border border-[#1E2A40] rounded-lg p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <p className="text-[18px] text-white font-bold font-outfit">{planName}</p>
                {isActive && (
                  <span className="text-[10px] text-green-400 font-semibold px-2 py-0.5 bg-green-400/10 rounded uppercase tracking-wider">
                    Activo
                  </span>
                )}
                {!subscription && (
                  <span className="text-[10px] text-[#4A5568] font-semibold px-2 py-0.5 bg-[#1E2A4A] rounded uppercase tracking-wider">
                    Sin plan
                  </span>
                )}
              </div>
              <p className="text-[22px] text-[#B8860B] font-semibold">{planPrice}</p>
              {periodEnd && (
                <p className="text-[12px] text-[#4A5568]">Próxima renovación: {periodEnd}</p>
              )}
              {!subscription && (
                <p className="text-[12px] text-[#4A5568]">Sin suscripción activa</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {subscription ? (
              <button
                type="button"
                onClick={handlePortal}
                disabled={loadingPortal}
                className="px-4 py-2 bg-[#B8860B] hover:bg-[#A07710] disabled:opacity-50 text-black font-semibold text-[13px] rounded-lg transition-colors"
              >
                {loadingPortal ? 'Abriendo...' : 'Gestionar suscripción'}
              </button>
            ) : (
              <Link
                href="/settings/planes"
                className="px-4 py-2 bg-[#B8860B] hover:bg-[#A07710] text-black font-semibold text-[13px] rounded-lg transition-colors"
              >
                Ver planes →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* HISTORIAL DE CONSUMO */}
      <section className="space-y-3">
        <p className="text-[11px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Historial de consumo</p>
        <div className="bg-[#0D1535] border border-[#1E2A40] rounded-lg overflow-hidden">
          <div className="grid grid-cols-[80px_1fr_120px_64px] gap-0 px-5 py-3 border-b border-[#1E2A4A]">
            <span className="text-[10px] text-[#4A5568] uppercase tracking-wider">Fecha</span>
            <span className="text-[10px] text-[#4A5568] uppercase tracking-wider">Actividad</span>
            <span className="text-[10px] text-[#4A5568] uppercase tracking-wider">Proyecto</span>
            <span className="text-[10px] text-[#4A5568] uppercase tracking-wider text-right">Costo</span>
          </div>
          {usage.length > 0 ? (
            usage.map(row => (
              <div
                key={row.id}
                className="grid grid-cols-[80px_1fr_120px_64px] gap-0 px-5 py-3 border-b border-[#1E2A4A]/50 last:border-b-0 hover:bg-[#0D1535]/80"
              >
                <span className="text-[12px] text-[#4A5568]">
                  {new Date(row.created_at).toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-[12px] text-[#8892A4]">
                  {ACTIVITY_LABELS[row.activity ?? ''] ?? row.activity ?? 'Actividad'}
                </span>
                <span className="text-[12px] text-[#4A5568] truncate">
                  {row.project?.name ?? '—'}
                </span>
                <span className="text-[12px] text-[#8892A4] text-right">
                  ${Number(row.cost_usd).toFixed(2)}
                </span>
              </div>
            ))
          ) : (
            <div className="px-5 py-6 text-center text-[13px] text-[#4A5568]">Sin consumo registrado</div>
          )}
        </div>
        {usage.length > 0 && (
          <p className="text-[12px] text-[#4A5568]">
            Mostrando {usage.length} registro{usage.length !== 1 ? 's' : ''}
          </p>
        )}
      </section>

      {/* MÉTODO DE PAGO */}
      <section className="space-y-3">
        <p className="text-[11px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Método de pago</p>
        <div className="bg-[#0D1535] border border-[#1E2A40] rounded-lg p-6 flex items-center justify-between">
          {paymentMethod ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 bg-[#1E2A4A] rounded flex items-center justify-center">
                <span className="text-[10px] text-[#8892A4] font-mono">{paymentMethod.brand ?? 'VISA'}</span>
              </div>
              <span className="text-[14px] text-white">
                •••• •••• •••• {paymentMethod.last4}
              </span>
              <span className="text-[12px] text-[#4A5568]">
                Exp. {paymentMethod.exp_month}/{paymentMethod.exp_year}
              </span>
            </div>
          ) : (
            <span className="text-[14px] text-[#4A5568]">
              {subscription ? 'Sin método de pago registrado' : 'Agrega un método de pago al suscribirte a un plan'}
            </span>
          )}
          {subscription && (
            <button
              type="button"
              onClick={handlePortal}
              disabled={loadingPortal}
              className="text-[13px] text-[#8892A4] hover:text-white border border-[#1E2A4A] hover:border-[#4A5568] rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              {loadingPortal ? 'Abriendo...' : 'Gestionar método de pago'}
            </button>
          )}
        </div>
      </section>

      {/* FACTURAS */}
      <section className="space-y-3">
        <p className="text-[11px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Facturas</p>
        <div className="bg-[#0D1535] border border-[#1E2A40] rounded-lg overflow-hidden">
          {invoices.length > 0 ? (
            <>
              <div className="grid grid-cols-[80px_1fr_72px_80px_40px] gap-0 px-5 py-3 border-b border-[#1E2A4A]">
                <span className="text-[10px] text-[#4A5568] uppercase tracking-wider">Fecha</span>
                <span className="text-[10px] text-[#4A5568] uppercase tracking-wider">Concepto</span>
                <span className="text-[10px] text-[#4A5568] uppercase tracking-wider text-right">Monto</span>
                <span className="text-[10px] text-[#4A5568] uppercase tracking-wider text-right">Estado</span>
                <span className="w-10" />
              </div>
              {invoices.map(inv => (
                <div
                  key={inv.id}
                  className="grid grid-cols-[80px_1fr_72px_80px_40px] gap-0 px-5 py-3 border-b border-[#1E2A4A]/50 last:border-b-0 hover:bg-[#0D1535]/80"
                >
                  <span className="text-[12px] text-[#4A5568]">
                    {new Date(inv.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </span>
                  <span className="text-[12px] text-[#8892A4]">{inv.concept ?? 'Suscripción'}</span>
                  <span className="text-[12px] text-white text-right">${Number(inv.amount_usd).toFixed(2)}</span>
                  <span className={`text-[11px] font-medium text-right ${
                    inv.status === 'pagada' || inv.status === 'paid'
                      ? 'text-green-400'
                      : inv.status === 'pendiente' || inv.status === 'pending'
                        ? 'text-[#B8860B]'
                        : 'text-[#4A5568]'
                  }`}>
                    {inv.status === 'pagada' || inv.status === 'paid' ? 'Pagada' :
                     inv.status === 'pendiente' || inv.status === 'pending' ? 'Pendiente' :
                     inv.status ?? '—'}
                  </span>
                  <div className="flex items-center justify-end">
                    {inv.pdf_url && (
                      <a
                        href={inv.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[#B8860B] hover:text-[#D4A017] transition-colors"
                        title="Descargar PDF"
                      >
                        PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="px-5 py-6 text-center text-[13px] text-[#4A5568]">Sin facturas</div>
          )}
        </div>
      </section>
    </div>
  )
}
