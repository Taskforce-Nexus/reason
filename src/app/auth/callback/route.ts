import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('🔑 AUTH CALLBACK — code:', code ? 'present' : 'MISSING')
  console.log('🔑 AUTH CALLBACK — error:', error)
  console.log('🔑 AUTH CALLBACK — error_description:', error_description)
  console.log('🔑 AUTH CALLBACK — origin:', origin)

  if (code) {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    console.log('🔑 AUTH CALLBACK — exchange result:', data?.user?.email || 'NO USER')
    console.log('🔑 AUTH CALLBACK — exchange error:', exchangeError?.message || 'none')

    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(exchangeError.message)}`)
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
