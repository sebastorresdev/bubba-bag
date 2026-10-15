const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = readFileSync(join(__dirname, '../src/features/configuracion-empresa/services/empresa.service.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function fixture() {
  const calls = [];
  const context = { exports: {}, require: () => ({ apiClient: async (...args) => { calls.push(args); return {}; } }) };
  vm.runInNewContext(compiled, context);
  return { service: context.exports.EmpresaService, calls };
}
const datos = { razonSocial: 'Empresa', nombreComercial: 'Marca', ruc: '20123456789', direccionFiscal: 'Dirección',
  telefono: '123456', email: 'empresa@fixture.invalid', logoBase64: null, piePaginaDocumentos: 'Pie' };

test('consulta de empresa usa sólo lectura para incluir sus datos en documentos', async () => {
  const f = fixture(); await f.service.getDatos();
  assert.equal(f.calls.length, 1); assert.equal(f.calls[0][0], '/api/configuracion/empresa'); assert.equal(f.calls[0][1], undefined);
});
test('guardado fiscal no envía ni sobrescribe logo, contacto o pie de documentos', async () => {
  const f = fixture(); await f.service.guardarDatosFiscales(datos);
  assert.equal(f.calls[0][0], '/api/configuracion/empresa/datos-fiscales'); assert.equal(f.calls[0][1].method, 'PATCH');
  assert.deepEqual(JSON.parse(f.calls[0][1].body), { razonSocial: datos.razonSocial, nombreComercial: datos.nombreComercial, ruc: datos.ruc, direccionFiscal: datos.direccionFiscal });
});
test('guardado de presentación no envía ni sobrescribe los datos fiscales', async () => {
  const f = fixture(); await f.service.guardarPresentacion(datos);
  assert.equal(f.calls[0][0], '/api/configuracion/empresa/presentacion'); assert.equal(f.calls[0][1].method, 'PATCH');
  assert.deepEqual(JSON.parse(f.calls[0][1].body), { telefono: datos.telefono, email: datos.email, logoBase64: datos.logoBase64, piePaginaDocumentos: datos.piePaginaDocumentos });
});
test('usuarios con ambos permisos usan una actualización completa', async () => {
  const f = fixture(); await f.service.guardarDatos(datos);
  assert.equal(f.calls[0][0], '/api/configuracion/empresa'); assert.equal(f.calls[0][1].method, 'PUT');
  assert.deepEqual(JSON.parse(f.calls[0][1].body), datos);
});
