'use client'
import { useState, useEffect } from 'react'

let showToastFn: ((msg: string) => void) | null = null

export function toast(message: string) {
  showToastFn?.(message)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    showToastFn = (msg) => {
      setMessage(msg)
      setVisible(true)
      setTimeout(() => setVisible(false), 3000)
    }
  }, [])

  return (
    <>
      {children}
      {visible && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-[#0D1535] border border-[#B8860B] rounded-lg text-sm text-[#F8F8F8] shadow-lg animate-in fade-in slide-in-from-bottom-4">
          {message}
        </div>
      )}
    </>
  )
}
