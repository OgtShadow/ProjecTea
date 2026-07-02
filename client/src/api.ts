
const JAVA_API_URL = import.meta.env.VITE_JAVA_API_URL || '';
const GO_API_URL = import.meta.env.VITE_GO_API_URL || '';

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers as HeadersInit)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }


  let baseUrl = JAVA_API_URL; 
  if (
    path.startsWith('/api/files') || 
    path.startsWith('/api/kanban') || 
    path.startsWith('/api/notify') || 
    path.startsWith('/api/notifications')
  ) {
    baseUrl = GO_API_URL;
  }

  // Składamy pełny URL
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${baseUrl}${cleanPath}`;

  return fetch(fullUrl, {
    ...init,
    headers,
    credentials: 'include',
  })
}

export default apiFetch