const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { webcrypto } = require('node:crypto');

function load(relative, globals = {}, modules = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', relative), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: name => { if (!(name in modules)) throw new Error('Unexpected module ' + name); return modules[name]; }, TextEncoder, Uint8Array, crypto: webcrypto, ...globals });
  return exports;
}
function storage() {
  return Object.create({ getItem(k) { return this[k] ?? null; }, setItem(k, v) { this[k] = String(v); }, removeItem(k) { delete this[k]; } });
}
function locks() {
  const tails = new Map();
  return { request(key, callback) { const next = (tails.get(key) ?? Promise.resolve()).catch(() => {}).then(callback); tails.set(key, next); return next; } };
}
const file = text => ({ arrayBuffer: async () => new TextEncoder().encode(text).buffer });
function intentos(store = storage(), sharedLocks = locks()) {
  return { store, sharedLocks, ...load('src/services/importacionIntento.ts', { localStorage: store, navigator: { locks: sharedLocks } }) };
}
test('un envío perdido conserva el ID después de recargar', async () => {
  const a = intentos(); const id = await a.obtenerIntentoInventario('ana', file('csv'), { entidad: 'InventarioInicial' });
  const b = intentos(a.store, a.sharedLocks);
  assert.equal(await b.obtenerIntentoInventario('ana', file('csv'), { entidad: 'InventarioInicial' }), id);
});
test('dos pestañas preparan simultáneamente el mismo ID', async () => {
  const a = intentos(); const b = intentos(a.store, a.sharedLocks);
  const ids = await Promise.all(Array.from({ length: 20 }, (_, i) => (i % 2 ? a : b).obtenerIntentoInventario('ana', file('csv'), {})));
  assert.equal(new Set(ids).size, 1);
});
test('otra persona, otro archivo u otro mapeo no reutilizan la operación', async () => {
  const a = intentos();
  const ids = await Promise.all([a.obtenerIntentoInventario('ana', file('csv'), {}), a.obtenerIntentoInventario('bea', file('csv'), {}), a.obtenerIntentoInventario('ana', file('csv distinto'), {}), a.obtenerIntentoInventario('ana', file('csv'), { mapping: 'nuevo' })]);
  assert.equal(new Set(ids).size, 4);
});
test('sólo cerrar resultado confirmado permite iniciar otra carga intencional', async () => {
  const a = intentos(); const id = await a.obtenerIntentoInventario('ana', file('csv'), {});
  a.cerrarIntentoInventario(id);
  assert.notEqual(await a.obtenerIntentoInventario('ana', file('csv'), {}), id);
});
test('respaldo dañado no genera un ID nuevo que duplique existencias', async () => {
  const a = intentos(); await a.obtenerIntentoInventario('ana', file('csv'), {});
  a.store.setItem(Object.keys(a.store)[0], 'dañado');
  await assert.rejects(a.obtenerIntentoInventario('ana', file('csv'), {}), /dañado/);
});
test('sin bloqueo de pestañas no inicia importación insegura', async () => {
  const a = load('src/services/importacionIntento.ts', { localStorage: storage(), navigator: {} });
  await assert.rejects(a.obtenerIntentoInventario('ana', file('csv'), {}), /navegador actualizado/);
});
test('guardar y completar usan la versión leída y renuevan la versión tras cada cambio', async () => {
  let version = 7; const headers = [];
  const api = async (_url, options, onResponse) => {
    if (!options) return { id: 'orden', version };
    headers.push(options.headers['If-Match']); version++;
    onResponse({ headers: { get: () => '"' + version + '"' } }); return undefined;
  };
  const { OrdenTrabajoService: service } = load('src/features/servicio-campo/ordenes-trabajo/services/ordenTrabajo.service.ts', {}, { '../../../../services/apiClient': { apiClient: api } });
  await service.obtenerOrdenPorId('orden'); await service.actualizarOrden('orden', { observaciones: 'Nota' }); await service.completarTrabajo('orden', 'trabajo');
  assert.deepEqual(headers, ['7', '8']);
});
test('conflicto de edición se propaga sin simular éxito ni renovar versión', async () => {
  let reads = 0;
  const api = async (_url, options) => { if (!options) { reads++; return { id: 'orden', version: 7 }; } throw new Error('La orden cambió'); };
  const { OrdenTrabajoService: service } = load('src/features/servicio-campo/ordenes-trabajo/services/ordenTrabajo.service.ts', {}, { '../../../../services/apiClient': { apiClient: api } });
  await service.obtenerOrdenPorId('orden'); await assert.rejects(service.actualizarOrden('orden', {}), /cambió/); assert.equal(reads, 1);
});
test('guardar conserva la versión de su propia respuesta aunque otro usuario ya haya editado', async () => {
  let reads = 0; const headers = [];
  const api = async (_url, options, onResponse) => {
    if (!options) { reads++; return { id: 'orden', version: reads === 1 ? 7 : 99 }; }
    headers.push(options.headers['If-Match']); onResponse({ headers: { get: () => '"8"' } });
  };
  const { OrdenTrabajoService: service } = load('src/features/servicio-campo/ordenes-trabajo/services/ordenTrabajo.service.ts', {}, { '../../../../services/apiClient': { apiClient: api } });
  await service.obtenerOrdenPorId('orden'); await service.actualizarOrden('orden', {}); await service.completarTrabajo('orden', 'trabajo');
  assert.deepEqual(headers, ['7', '8']); assert.equal(reads, 1);
});
