const prefix = 'skvia_importacion_inventario_';

export async function obtenerIntentoInventario(usuarioId: string, file: File, parametros: object): Promise<string> {
  if (!usuarioId) throw new Error('Inicie sesión antes de importar inventario.');
  if (!navigator.locks?.request) throw new Error('Use un navegador actualizado para importar inventario con protección de reintentos.');
  const digest = async (data: BufferSource) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  const key = prefix + usuarioId + '_' + await digest(await file.arrayBuffer()) + '_' + await digest(new TextEncoder().encode(JSON.stringify(parametros)));
  return navigator.locks.request(key, async () => {
    let id = localStorage.getItem(key);
    if (id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
      throw new Error('El identificador pendiente de importación está dañado. Revise el historial antes de iniciar otra carga.');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
    return id;
  });
}

// Sólo el cierre explícito del resultado confirmado permite iniciar otra carga intencional del mismo archivo.
export function cerrarIntentoInventario(id: string): void {
  for (const key of Object.keys(localStorage))
    if (key.startsWith(prefix) && localStorage.getItem(key) === id) localStorage.removeItem(key);
}
