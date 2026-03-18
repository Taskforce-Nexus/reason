/**
 * Dispatch 'insufficient-funds' custom event — picked up by InsufficientFundsModal
 * anywhere in the dashboard layout.
 */
export function triggerInsufficientFunds(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('insufficient-funds'))
  }
}

/**
 * Drop-in replacement for fetch that automatically triggers the InsufficientFundsModal
 * when the server returns HTTP 402.
 */
export async function safeFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init)
  if (response.status === 402) {
    triggerInsufficientFunds()
  }
  return response
}
