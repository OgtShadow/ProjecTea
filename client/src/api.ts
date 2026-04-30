export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers as HeadersInit)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(`${path.startsWith('/') ? '' : ''}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })
}

export default apiFetch
