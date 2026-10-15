const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, modules = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, {exports,Set,Map,JSON,require: name => modules[name]});
  return exports;
}
test('la selección de series se compara por contenido, incluso con distinto orden', () => {
  const state = load('src/services/draftState.ts');
  assert.equal(state.serializeDraft({series:new Set(['B','A'])}), state.serializeDraft({series:new Set(['A','B'])}));
  assert.notEqual(state.serializeDraft({series:new Set(['A'])}), state.serializeDraft({series:new Set(['A','B'])}));
});
test('guardar o desmontar una ficha no elimina los cambios de otra', () => {
  const state = load('src/services/draftState.ts');
  state.updateDraft('orden',true);state.updateDraft('detalle',true);
  state.updateDraft('orden',false);assert.equal(state.hasUnsavedDrafts(),true);
  state.removeDraft('orden');assert.equal(state.hasUnsavedDrafts(),true);
  state.removeDraft('detalle');assert.equal(state.hasUnsavedDrafts(),false);
});
function priceDraft() {
  return load('src/features/inventario/listas-precios/services/listaPreciosDraft.ts', {'./listaPrecios.service':{ListaPreciosService:{}}});
}
test('un fallo parcial conserva la lista creada y reintenta sólo los precios pendientes', async () => {
  const service=priceDraft();let created=0, fail=true;const writes=[];
  const api={createListaPrecios:async()=>({id:'lista-'+ ++created}),updateListaPrecios:async()=>{},eliminarElemento:async()=>{},guardarElemento:async(_,item)=>{writes.push(item.productoId);if(item.productoId==='B'&&fail)throw Error('Error temporal');return {id:'precio-'+item.productoId};}};
  const context={elementos:new Map()},items=[{id:'temp-a',productoId:'A',monto:10,metodoFijacion:1},{id:'temp-b',productoId:'B',monto:20,metodoFijacion:1}];
  await assert.rejects(service.guardarListaNuevaPendiente(context,{nombre:'Lista'},items,api),/temporal/);
  assert.equal(context.id,'lista-1');assert.equal(context.elementos.size,1);
  fail=false;await service.guardarListaNuevaPendiente(context,{nombre:'Lista'},items,api);
  assert.equal(created,1);assert.deepEqual(writes,['A','B','B']);
});
test('editar un precio ya confirmado tras el fallo actualiza el mismo registro', async () => {
  const service=priceDraft(), context={id:'lista',elementos:new Map([['temp-a',{id:'precio-a',snapshot:JSON.stringify({productoId:'A',monto:10,unidadMedidaId:null,metodoFijacion:1})}]])};let payload;
  const api={updateListaPrecios:async()=>{},guardarElemento:async(_,item)=>{payload=item;return {id:'precio-a'};},eliminarElemento:async()=>{},createListaPrecios:async()=>{throw Error('No debe crear otra lista');}};
  await service.guardarListaNuevaPendiente(context,{nombre:'Lista'},[{id:'temp-a',productoId:'A',monto:25,metodoFijacion:1}],api);
  assert.equal(payload.elementoId,'precio-a');assert.equal(payload.monto,25);
});
test('quitar un precio confirmado de un borrador parcial elimina su registro remoto', async () => {
  const service=priceDraft(),context={id:'lista',elementos:new Map([['temp-a',{id:'precio-a',snapshot:'x'}]])};const deleted=[];
  await service.guardarListaNuevaPendiente(context,{nombre:'Lista'},[],{updateListaPrecios:async()=>{},eliminarElemento:async id=>deleted.push(id)});
  assert.deepEqual(deleted,['precio-a']);assert.equal(context.elementos.size,0);
});
