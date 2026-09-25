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
        throw new Error(`API Error: ${retryResponse.statusText}`);
      }
      return retryResponse.json();
    }
  }

  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
