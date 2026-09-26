// Centralized API client for SKVIA client with automatic JWT token management

const TOKEN_KEY = 'skvia_auth_token';

export async function getValidAuthToken(): Promise<string> {
  let token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    return token;
  }

  // Automatic authentication with system credentials for seamless development experience
  try {
    const res = await fetch('/api/seguridad/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@bubbabag.com',
        password: 'Admin123!',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        return data.token;
      }
    }
  } catch (err) {
    console.error('Error auto-logging in:', err);
  }

  return '';
}

async function parseResponseBody<T>(res: Response): Promise<T> {
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as unknown as T;
  }
  const text = await res.text();
  if (!text || text.trim() === '') {
    return undefined as unknown as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

function extractApiErrorMessage(errorData: any, fallbackText: string, status?: number): string {
  if (!errorData) return fallbackText;
  if (typeof errorData === 'string') return errorData;
  if (errorData.detail) return errorData.detail;
  if (errorData.mensaje) return errorData.mensaje;
  if (errorData.message) return errorData.message;
  if (errorData.title) return errorData.title;
  if (errorData.errors && typeof errorData.errors === 'object') {
    const list = Object.values(errorData.errors).flat().filter(Boolean);
    if (list.length > 0) return list.join(', ');
  }
  return fallbackText;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getValidAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If token expired, clear and retry once
    localStorage.removeItem(TOKEN_KEY);
    const newToken = await getValidAuthToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryResponse = await fetch(endpoint, {
        ...options,
        headers,
      });
      if (!retryResponse.ok) {
        const errData = await parseResponseBody<any>(retryResponse);
        throw new Error(extractApiErrorMessage(errData, `API Error: ${retryResponse.statusText}`, retryResponse.status));
      }
      return parseResponseBody<T>(retryResponse);
    }
  }

  if (!response.ok) {
    const errData = await parseResponseBody<any>(response);
    throw new Error(extractApiErrorMessage(errData, `API Error ${response.status}: ${response.statusText}`, response.status));
  }

  return parseResponseBody<T>(response);
}

export async function apiClientDownload(endpoint: string, defaultFilename: string): Promise<void> {
  const token = await getValidAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errData = await parseResponseBody<any>(response);
    throw new Error(extractApiErrorMessage(errData, `Error al descargar archivo: ${response.statusText}`, response.status));
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultFilename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function apiClientUpload<T>(endpoint: string, formData: FormData): Promise<T> {
  const token = await getValidAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await parseResponseBody<any>(response);
    throw new Error(extractApiErrorMessage(errorData, `Error al subir archivo (${response.status}): ${response.statusText}`, response.status));
  }

  return parseResponseBody<T>(response);
}

