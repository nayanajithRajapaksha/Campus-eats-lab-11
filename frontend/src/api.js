const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export async function apiRequest(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error('We could not reach CampusEats. Check your connection and try again.')
  }

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : null

  if (!response.ok) {
    const validationMessage = payload?.errors
      ? Object.values(payload.errors).flat().join(' ')
      : null
    const error = new Error(
      validationMessage || payload?.detail || payload?.title || 'Something went wrong. Please try again.',
    )
    error.status = response.status
    throw error
  }

  return payload
}
