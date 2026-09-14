const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

let accessToken: string | null = null
let onSessionExpired: (() => void) | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

/** AuthProvider registers a callback here so any expired/invalid session
 * (even one discovered deep inside a random component's fetch) bounces the
 * user back to the login screen from a single place. */
export function registerSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json()
    if (typeof body?.detail === 'string') return body.detail
    if (Array.isArray(body?.detail)) {
      return body.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(' ')
    }
  } catch {
    // response body wasn't JSON — fall through to generic message
  }
  return `Erro inesperado (HTTP ${response.status}).`
}

async function refreshAccessToken(): Promise<boolean> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!response.ok) return false
  const data = await response.json()
  setAccessToken(data.access_token)
  return true
}

interface ApiFetchOptions extends RequestInit {
  /** Set true for calls made while a token refresh is already underway, to
   * avoid an infinite retry loop against /auth/refresh itself. */
  skipAuthRetry?: boolean
}

async function fetchWithAuthRetry(path: string, options: ApiFetchOptions): Promise<Response> {
  const { skipAuthRetry, headers, ...rest } = options
  const isFormData = rest.body instanceof FormData

  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      ...rest,
      credentials: 'include',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
    })

  let response = await doFetch()

  if (response.status === 401 && !skipAuthRetry) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      response = await doFetch()
    } else {
      onSessionExpired?.()
      throw new ApiError(401, 'Sessão expirada. Faça login novamente.')
    }
  }

  return response
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const response = await fetchWithAuthRetry(path, options)

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response))
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

/** For authenticated binary downloads (a plain <a href> can't carry the
 * Authorization header) — fetches as a Blob and returns it alongside the
 * server-suggested filename, so the caller can trigger a save. */
export async function apiFetchBlob(
  path: string,
  options: ApiFetchOptions = {}
): Promise<{ blob: Blob; filename: string | null }> {
  const response = await fetchWithAuthRetry(path, options)

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response))
  }

  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
  const filename = match ? decodeURIComponent(match[1]) : null

  return { blob: await response.blob(), filename }
}

export { refreshAccessToken }
