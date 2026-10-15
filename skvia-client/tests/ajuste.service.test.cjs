const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { randomUUID } = require('node:crypto');
const vm = require('node:vm');
const ts = require('typescript');

// Ejecutar el servicio real compilado, aislando sólo HTTP y almacenamiento del navegador.
const source = readFileSync(join(__dirname, '../src/features/inventario/ajustes/services/ajuste.service.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const KEY = 'skvia_ajustes_inventario_v1';
const SERVER_ID = '11111111-1111-4111-8111-111111111111';
function local(id = 'ajuste-1', extra = {}) {
  return { id, numero: 'AJU-000001', tipo: 'Entrada', almacenId: SERVER_ID, fecha: '2026-10-14',
    motivo: 'Regularización', estado: 'Aplicado', usuarioAprobacion: 'SuperAdmin',
    lineas: [{ productoId: SERVER_ID, tipo: 'Entrada', cantidad: 2, costoUnitario: 5, series: [] }], ...extra };
}
function locks() {
  let queue = Promise.resolve();
  return { request: (_name, action) => { const next = queue.then(action); queue = next.catch(() => {}); return next; } };
}
function fixture(items = [], options = {}) {
  const storage = options.storage || new Map([[KEY, JSON.stringify(items)]]);
  const calls = [];
  const state = { failWrite: false, api: async () => { throw new Error('Configure la respuesta de prueba'); } };
  const context = { exports: {}, Error, crypto: { randomUUID }, navigator: { locks: options.noLocks ? undefined : options.locks || locks() },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => { if (state.failWrite) throw new Error('Almacenamiento lleno'); storage.set(key, value); } },
    require: name => {
      assert.equal(name, '../../../../services/apiClient');
      return { apiClient: async (...args) => { calls.push(args); return state.api(...args); } };
    } };
  vm.runInNewContext(compiled, context);
  return { service: context.exports.AjusteService, calls, state, storage, stored: () => JSON.parse(storage.get(KEY)) };
}

test('consultar lista sólo lee el servidor y conserva los registros locales', async () => {
  const f = fixture([local()]); const before = f.storage.get(KEY);
  f.state.api = async () => [{ id: SERVER_ID, numero: 'AJU-000001' }];
  await f.service.obtenerAjustes();
  assert.equal(f.calls.length, 1); assert.equal(f.calls[0][0], '/api/inventario/ajustes');
  assert.equal(f.storage.get(KEY), before); assert.equal(f.service.obtenerPendientesLocales(), 1);
});

test('fallos de lectura no sustituyen datos oficiales por ajustes locales', async () => {
  const f = fixture([local()]); const before = f.storage.get(KEY); const failure = new Error('Sesión vencida');
  f.state.api = async () => { throw failure; };
  await assert.rejects(f.service.obtenerAjustes(), error => error === failure);
  await assert.rejects(f.service.obtenerAjustePorId(SERVER_ID), error => error === failure);
  assert.equal(f.storage.get(KEY), before);
});

for (const operation of [
  service => service.guardarAjuste(null, {}), service => service.guardarAjuste(SERVER_ID, {}),
  service => service.solicitarAprobacion(SERVER_ID), service => service.aplicarAjuste(SERVER_ID),
  service => service.rechazarAjuste(SERVER_ID, 'Revisar'), service => service.anularAjuste(SERVER_ID),
  service => service.eliminarAjuste(SERVER_ID),
]) {
  test(`error HTTP se propaga sin simular éxito: ${operation.toString()}`, async () => {
    const f = fixture([local()]); const before = f.storage.get(KEY); const failure = new Error('Sin permisos / validación / servidor');
    f.state.api = async () => { throw failure; };
    await assert.rejects(operation(f.service), error => error === failure);
    assert.equal(f.storage.get(KEY), before);
  });
}

test('ID local no permite aprobar, aplicar, editar o borrar sin recuperación', () => {
  const f = fixture([local()]); const before = f.storage.get(KEY);
  for (const action of [() => f.service.solicitarAprobacion('ajuste-1'), () => f.service.aplicarAjuste('ajuste-1'),
    () => f.service.guardarAjuste('ajuste-1', {}), () => f.service.eliminarAjuste('ajuste-1')]) {
    assert.throws(action, /Recupérelo como borrador/);
  }
  assert.equal(f.calls.length, 0); assert.equal(f.storage.get(KEY), before);
});

test('aplicar no envía un aprobador aunque alguien agregue un argumento falso', async () => {
  const f = fixture(); f.state.api = async () => undefined;
  await f.service.aplicarAjuste(SERVER_ID, 'SuperAdmin');
  assert.equal(f.calls[0][0], `/api/inventario/ajustes/${SERVER_ID}/aplicar`);
  assert.deepEqual(JSON.parse(JSON.stringify(f.calls[0][1])), { method: 'POST' });
});

test('recuperación parcial elimina sólo confirmados y conserva fallidos e inválidos', async () => {
  const f = fixture([local('a'), local('b'), local('c', { almacenId: 'invalido' })]);
  f.state.api = async (url, options) => {
    assert.equal(url, '/api/inventario/ajustes/recuperar-local');
    const body = JSON.parse(options.body);
    assert.equal(body.datos.usuarioAprobador, undefined); assert.match(body.datos.observaciones, /Estado local anterior: Aplicado/);
    if (body.datos.observaciones.includes('registro local FALLA')) throw new Error('403: Sin permisos');
    return { id: body.recuperacionId, numero: 'AJU-SERVIDOR' };
  };
  const items = f.stored(); items[1].numero = 'FALLA'; f.storage.set(KEY, JSON.stringify(items));
  const result = await f.service.recuperarAjustesLocales();
  assert.equal(result.recuperados, 1); assert.equal(result.pendientes, 2); assert.equal(result.errores.length, 2);
  assert.deepEqual(f.stored().map(item => item.id), ['b', 'c']);
  assert.equal(f.stored()[0].estado, 'Aplicado'); assert.ok(f.stored()[0].recuperacionId);
  assert.equal(f.calls.length, 2); // Ninguna llamada de aprobación o aplicación automática.
});

test('respuesta perdida conserva el ID y el reintento recupera un único documento', async () => {
  const f = fixture([local()]); const documents = new Map(); let loseResponse = true;
  f.state.api = async (_url, options) => {
    const body = JSON.parse(options.body);
    documents.set(body.recuperacionId, { id: body.recuperacionId, numero: 'AJU-OFICIAL' });
    if (loseResponse) { loseResponse = false; throw new Error('Respuesta perdida'); }
    return documents.get(body.recuperacionId);
  };
  const first = await f.service.recuperarAjustesLocales();
  assert.equal(first.pendientes, 1); assert.equal(first.recuperados, 0);
  const savedId = f.stored()[0].recuperacionId;
  const second = await f.service.recuperarAjustesLocales();
  assert.equal(second.recuperados, 1); assert.equal(second.pendientes, 0);
  assert.equal(documents.size, 1); assert.ok(documents.has(savedId));
});

test('almacenamiento lleno evita enviar una creación sin ID persistido', async () => {
  const f = fixture([local()]); f.state.failWrite = true;
  const result = await f.service.recuperarAjustesLocales();
  assert.equal(result.pendientes, 1); assert.equal(result.recuperados, 0);
  assert.equal(f.calls.length, 0); assert.equal(f.stored()[0].id, 'ajuste-1');
});

test('una respuesta sin confirmación no elimina el respaldo', async () => {
  const f = fixture([local()]); f.state.api = async () => ({ id: SERVER_ID, numero: 'AJU-OTRO' });
  const result = await f.service.recuperarAjustesLocales();
  assert.equal(result.pendientes, 1); assert.equal(result.recuperados, 0); assert.equal(f.stored()[0].id, 'ajuste-1');
});

test('registros agregados durante el envío sobreviven a la confirmación', async () => {
  const f = fixture([local()]);
  f.state.api = async (_url, options) => {
    const body = JSON.parse(options.body);
    f.storage.set(KEY, JSON.stringify([...f.stored(), local('ajuste-nuevo')]));
    return { id: body.recuperacionId, numero: 'AJU-OFICIAL' };
  };
  const result = await f.service.recuperarAjustesLocales();
  assert.equal(result.pendientes, 1); assert.deepEqual(f.stored().map(item => item.id), ['ajuste-nuevo']);
});

test('dos pestañas serializan la recuperación y crean un único documento', async () => {
  const sharedLocks = locks(); const first = fixture([local()], { locks: sharedLocks });
  const second = fixture([], { storage: first.storage, locks: sharedLocks });
  const api = async (_url, options) => ({ id: JSON.parse(options.body).recuperacionId, numero: 'AJU-OFICIAL' });
  first.state.api = api; second.state.api = api;
  await Promise.all([first.service.recuperarAjustesLocales(), second.service.recuperarAjustesLocales()]);
  assert.equal(first.calls.length + second.calls.length, 1); assert.equal(first.stored().length, 0);
});

test('respaldo ilegible permanece intacto y muestra un error', () => {
  const f = fixture(); f.storage.set(KEY, 'contenido-invalido');
  assert.throws(() => f.service.obtenerPendientesLocales(), /Se conserva el respaldo/);
  assert.equal(f.storage.get(KEY), 'contenido-invalido');
});

test('sin bloqueo entre pestañas se informa la limitación sin modificar datos', async () => {
  const f = fixture([local()], { noLocks: true }); const before = f.storage.get(KEY);
  await assert.rejects(f.service.recuperarAjustesLocales(), /navegador actualizado/);
  assert.equal(f.storage.get(KEY), before); assert.equal(f.calls.length, 0);
});
