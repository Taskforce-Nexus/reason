import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-02-25.clover',
    })
  }
  return _stripe
}

/** Lazy proxy — safe to import at module level even when key is missing */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

// Price IDs — Juan los llena después de crear productos en Stripe Dashboard
export const PRICE_IDS = {
  core_monthly:       process.env.STRIPE_PRICE_CORE       || '',
  pro_monthly:        process.env.STRIPE_PRICE_PRO        || '',
  enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE || '',
  token_10:           process.env.STRIPE_PRICE_TOKEN_10   || '',
  token_25:           process.env.STRIPE_PRICE_TOKEN_25   || '',
  token_50:           process.env.STRIPE_PRICE_TOKEN_50   || '',
  token_100:          process.env.STRIPE_PRICE_TOKEN_100  || '',
}

export const PLAN_LIMITS = {
  core:       { projects: 3,   sessions_per_month: 10, advisors: 7  },
  pro:        { projects: 10,  sessions_per_month: 50, advisors: 15 },
  enterprise: { projects: -1,  sessions_per_month: -1, advisors: -1 }, // unlimited
}
