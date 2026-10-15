const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load() {
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, '../src/services/uiFeedback.ts'), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports });
  return exports;
}
test('confirmar o volver resuelve únicamente la operación mostrada', async () => {
  const ui = load();
  const accepted = ui.confirmAction('¿Eliminar borrador?');
  assert.equal(ui.getFeedback().confirmation.action, 'Eliminar');
  assert.equal(ui.getFeedback().confirmation.danger, true);
  ui.resolveConfirmation(true);
  assert.equal(await accepted, true);
  assert.equal(ui.getFeedback().confirmation, null);
  const canceled = ui.confirmAction('¿Eliminar otro borrador?');
  ui.resolveConfirmation(false);
  assert.equal(await canceled, false);
});
test('doble solicitud no sustituye el registro ni produce un segundo envío', async () => {
  const ui = load();
  const first = ui.confirmAction('Eliminar A');
  assert.equal(await ui.confirmAction('Eliminar B'), false);
  assert.equal(ui.getFeedback().confirmation.message, 'Eliminar A');
  ui.resolveConfirmation(true);
  assert.equal(await first, true);
  ui.resolveConfirmation(true);
  assert.equal(ui.getFeedback().confirmation, null);
});
test('cerrar un error mantiene la confirmación pendiente y notifica a suscriptores', async () => {
  const ui = load();
  let changes = 0;
  const unsubscribe = ui.subscribeFeedback(() => changes++);
  const confirmation = ui.confirmAction('Recibir parcialmente', { action: 'Registrar recepción' });
  ui.showError('No se pudo guardar');
  ui.dismissError();
  assert.equal(ui.getFeedback().error, null);
  assert.equal(ui.getFeedback().confirmation.action, 'Registrar recepción');
  ui.resolveConfirmation(false);
  assert.equal(await confirmation, false);
  assert.equal(changes, 4);
  unsubscribe();
  ui.showError('Otra operación');
  assert.equal(changes, 4);
});
