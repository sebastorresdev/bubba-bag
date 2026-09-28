// Servicio para obtener la información del usuario en sesión actual (estilo Dynamics 365)

export interface UserSession {
  id: string;
  nombre: string;
  username: string;
  email: string;
  iniciales: string;
  rol: string;
}

export function getCurrentUserSession(): UserSession {
  const token = localStorage.getItem('skvia_auth_token');
  let nombre = 'Sebastian Torres';
  let username = 'admin@skvia.com';
  let email = 'admin@skvia.com';

  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        const resolvedName = payload.nombre_completo || payload.name || payload.unique_name || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
        if (resolvedName && resolvedName !== 'SuperAdmin') {
          nombre = resolvedName;
        }

        if (payload.email) email = payload.email;
        else if (payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']) {
          email = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
        }

        if (payload.sub) username = payload.sub;
        else if (payload.unique_name) username = payload.unique_name;
      }
    } catch {
      // Ignorar error de parsing y usar valores por defecto
    }
  }

  // Generar iniciales (ej: "Sebastián Torres" -> "ST")
  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'ST';

  return {
    id: 'user-00000000-0000-0000-0000-000000000001',
    nombre,
    username,
    email,
    iniciales,
    rol: 'Administrador del Sistema',
  };
}
