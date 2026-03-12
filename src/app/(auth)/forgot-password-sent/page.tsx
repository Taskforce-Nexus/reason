import Link from 'next/link'

export default function ForgotPasswordSentPage() {
  return (
    <div className="min-h-screen bg-[#0F0F11] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-widest text-[#C9A84C] mb-2">Reason</h1>
        </div>
        <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Revisa tu correo</h2>
          <p className="text-sm text-[#6b6d75] mb-6">
            Te enviamos instrucciones para restablecer tu contraseña. Si no ves el correo, revisa tu carpeta de spam.
          </p>
          <Link href="/login" className="text-sm text-[#C9A84C] hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
