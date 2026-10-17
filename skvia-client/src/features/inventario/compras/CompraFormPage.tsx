import { D365FormContent } from '../../../components/common/D365FormContent';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Dialog, DialogSurface, DialogTitle, DialogBody, DialogContent, DialogActions, Input, Select, Skeleton, SkeletonItem, Tab, TabList, Text, Textarea, tokens } from '@fluentui/react-components';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import { Add16Regular, ArrowLeft16Regular, ArrowUndo16Regular, Box16Regular, Checkmark16Regular, CheckmarkCircle16Regular, Delete16Regular, LockClosed16Regular, Save16Regular, SaveMultiple16Regular, VehicleTruckProfile16Regular } from '@fluentui/react-icons';
import { confirmAction } from '../../../services/uiFeedback';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../components/common/D365FormField';
import { D365StatusField } from '../../../components/common/D365StatusField';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { LookupDropdownWithQuickCreate } from '../../../components/common/LookupDropdownWithQuickCreate';
import { useD365FormStyles } from '../../../styles/d365FormStyles';
import { useAuthSession } from '../../../services/authSession';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { AlmacenService } from '../almacenes/services/almacen.service';
import type { AlmacenDto } from '../almacenes/types/almacen.types';
import { ProductoService } from '../productos/services/producto.service';
import type { ProductoDto } from '../productos/types/producto.types';
import { CompraService } from './compra.service';
import type { CompraDto, CrearCompra, RecepcionCompraDatos } from './compra.service';
import { ProductosCompraGrid, importeLinea } from './ProductosCompraGrid';
import type { LineaCompraForm } from './ProductosCompraGrid';
import { CreacionRapidaEntidadDrawer } from './CreacionRapidaEntidadDrawer';
import { CompraEtapas } from './CompraEtapas';

const fechaISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function CompraFormPage() {
  const form = useD365FormStyles(); const navigate = useNavigate(); const { id } = useParams();
  const { permisos } = useAuthSession();
  const currentUser = useCurrentUser();
  const puedeGestionarCompras =
    currentUser.roles.includes('SuperAdmin') ||
    currentUser.roles.includes('InventarioAdmin') ||
    currentUser.roles.includes('Gerencia') ||
    permisos.includes('inventario.compras.gestionar') ||
    permisos.includes('inventario.catalogos.gestionar') ||
    permisos.includes('inventario.ajustes.aprobar');
  const esAlmaceneroOperativo = !puedeGestionarCompras;

  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]); const [productos, setProductos] = useState<ProductoDto[]>([]);
  const [proveedor, setProveedor] = useState(''); const [tipo, setTipo] = useState('Factura'); const [documento, setDocumento] = useState('');
  const [fecha, setFecha] = useState(() => fechaISO(new Date())); const [moneda, setMoneda] = useState('PEN');
  const [almacenId, setAlmacenId] = useState(''); const [observacion, setObservacion] = useState('');
  const [lineas, setLineas] = useState<LineaCompraForm[]>([]); const [compra, setCompra] = useState<CompraDto | null>(null);
  const [tab, setTab] = useState('general'); const [saving, setSaving] = useState(false); const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); const [mensaje, setMensaje] = useState<string | null>(null);
  const [busquedaAlmacen, setBusquedaAlmacen] = useState('');
  const [dialogEliminarBorrador, setDialogEliminarBorrador] = useState(false);
  const [eliminandoBorrador, setEliminandoBorrador] = useState(false);
  const draft = useUnsavedChanges(
    {
      proveedor: proveedor.trim(),
      tipo,
      documento: documento.trim(),
      fecha,
      moneda,
      almacenId: almacenId || '',
      observacion: observacion.trim(),
      lineas: lineas.map(x => ({
        productoId: x.productoId,
        cantidad: x.cantidad,
        costo: x.costo,
        series: x.series,
        unidadMedidaId: x.unidadMedidaId || '',
      })),
    },
    !loading
  );

  const guardando = useRef(false);
  useEffect(() => {
    let activo = true; setLoading(true); setError(null);
    void Promise.all([AlmacenService.getAlmacenes(), id ? CompraService.obtenerPorId(id) : Promise.resolve(null)])
      .then(async ([a, c]) => {
        const p = c ? await Promise.all(c.lineas.map(x => ProductoService.getProductoById(x.productoId))) : [];
        if (!activo) return;
        setAlmacenes(a); setProductos(p);
        if (c) cargarCompra(c);
      }).catch(e => { if (activo) setError(e instanceof Error ? e.message : 'No se pudieron cargar los datos.'); })
      .finally(() => { if (activo) setLoading(false); });
    return () => { activo = false; };
  }, [id]);
  const cargarCompra = (c: CompraDto) => {
    const fechaDoc = c.fechaDocumento ? c.fechaDocumento.split('T')[0] : fechaISO(new Date());
    setCompra(c); setProveedor(c.proveedor); setTipo(c.tipoDocumento); setDocumento(c.numeroDocumento); setFecha(fechaDoc);
    setMoneda(c.moneda); setAlmacenId(c.almacenId ?? ''); setObservacion(c.observacion ?? '');
    const mappedLineas: LineaCompraForm[] = c.lineas.map(x => ({
      clave: crypto.randomUUID(),
      productoId: x.productoId,
      cantidad: String(x.cantidad),
      costo: String(x.costoUnitario),
      series: x.series.join('\n'),
      cantidadRecibida: x.cantidadRecibida != null ? String(x.cantidadRecibida) : undefined,
      seriesRecibidas: x.seriesRecibidas ? x.seriesRecibidas.join('\n') : undefined,
      unidadMedidaId: x.unidadMedidaId ?? undefined,
      unidadMedidaNombre: x.unidad ?? undefined,
      factorConversion: x.factorConversion ?? 1,
    }));
    setLineas(mappedLineas);
    draft.markSaved(JSON.stringify({
      proveedor: c.proveedor.trim(),
      tipo: c.tipoDocumento,
      documento: c.numeroDocumento.trim(),
      fecha: fechaDoc,
      moneda: c.moneda,
      almacenId: c.almacenId ?? '',
      observacion: (c.observacion ?? '').trim(),
      lineas: mappedLineas.map(x => ({
        productoId: x.productoId,
        cantidad: x.cantidad,
        costo: x.costo,
        series: x.series,
        unidadMedidaId: x.unidadMedidaId || '',
      })),
    }));
  };
  const cargandoDatos = loading || Boolean(id && compra?.id !== id && !error);
  const estado = compra?.estado ?? 'Borrador';
  const bloqueado = esAlmaceneroOperativo || cargandoDatos || saving || Boolean(id && compra?.id !== id) || estado.startsWith('Recibida') || estado === 'Enviada';
  const bloqueadoPedido = bloqueado || estado === 'Enviada';
  const total = lineas.reduce((s, x) => s + importeLinea(x), 0);
  const dinero = (valor: number) => valor.toLocaleString('es-PE', { style: 'currency', currency: moneda });
  const almacen = almacenes.find(x => x.id === almacenId);
  const datos = (): CrearCompra => ({
    proveedor: proveedor.trim(),
    tipoDocumento: tipo,
    numeroDocumento: documento.trim(),
    fechaDocumento: fecha,
    moneda,
    almacenId: almacenId || null,
    observacion: observacion.trim() || null,
    lineas: lineas.map(x => ({
      productoId: x.productoId,
      cantidad: Number(x.cantidad),
      costoUnitario: Number(x.costo),
      series: x.series.split(/\r?\n/).map(s => s.trim()).filter(Boolean),
      unidadMedidaId: x.unidadMedidaId || null,
      factorConversion: x.factorConversion || 1,
    })),
  });
  const guardar = async (cerrar: boolean) => {
    if (guardando.current || bloqueado) return;
    guardando.current = true; setSaving(true); setError(null); setMensaje(null);
    try {
      const resultado = id ? await CompraService.actualizar(id, datos()) : await CompraService.crear(datos());
      draft.markSaved();
      if (cerrar) {
        navigate('/servicio-campo/recepciones-compra', { state: { successMessage: 'Compra guardada.' } });
      } else if (!id) {
        navigate(`/servicio-campo/recepciones-compra/${resultado.id}`, { replace: true, state: { successMessage: 'Compra guardada.' } });
      } else {
        const cActualizada = await CompraService.obtenerPorId(resultado.id);
        cargarCompra(cActualizada);
        setMensaje('Compra guardada.');
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar la compra.'); }
    finally { guardando.current = false; setSaving(false); }
  };
  const procesar = async (accion: 'solicitar' | 'enviar' | 'recepcionar', recepcion?: RecepcionCompraDatos) => {
    const savedDraft = draft.capture();
    if (guardando.current || loading) return;
    guardando.current = true; setSaving(true); setError(null); setMensaje(null);
    try {
      let compraId = id;
      if (accion === 'solicitar') {
        const resultado = compraId ? await CompraService.actualizar(compraId, datos()) : await CompraService.crear(datos());
        compraId = resultado.id;
      }
      if (!compraId) return;
      if (accion === 'enviar') await CompraService.actualizar(compraId, datos());
      if (accion === 'recepcionar') {
        if (!recepcion) return;
        await CompraService.recepcionar(compraId, recepcion);
      } else await CompraService[accion](compraId);
      cargarCompra(await CompraService.obtenerPorId(compraId));
      draft.markSaved(savedDraft);
      if (!id) navigate(`/servicio-campo/recepciones-compra/${compraId}`, { replace: true });
      setMensaje(accion === 'solicitar' ? 'Compra solicitada.' : accion === 'enviar' ? 'Envío registrado.' : 'Compra recibida.');
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo procesar la compra.'); }
    finally { guardando.current = false; setSaving(false); }
  };
  const handleRevertirBorrador = async () => {
    if (!id || saving || guardando.current) return;
    const conf = await confirmAction(
      '¿Desea revertir esta orden de compra a estado Borrador? Podrá modificar libremente los datos del pedido.',
      { title: 'Revertir orden a borrador', action: 'Revertir a borrador', danger: false }
    );
    if (!conf) return;
    setSaving(true);
    setError(null);
    try {
      await CompraService.revertirBorrador(id);
      const c = await CompraService.obtenerPorId(id);
      cargarCompra(c);
      setMensaje('Orden de compra revertida a Borrador.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo revertir la compra a borrador.');
    } finally {
      setSaving(false);
    }
  };
  const handleCerrarFaltantes = async () => {
    if (!id || saving || guardando.current) return;
    const conf = await confirmAction(
      '¿Está seguro de cerrar este pedido con las unidades efectivamente recibidas? Los productos faltantes quedarán cancelados definitivamente.',
      { title: 'Cerrar pedido con lo recibido', action: 'Cerrar pedido', danger: false }
    );
    if (!conf) return;
    setSaving(true);
    setError(null);
    try {
      await CompraService.cerrarFaltantes(id);
      const c = await CompraService.obtenerPorId(id);
      cargarCompra(c);
      setMensaje('Pedido cerrado con las cantidades recibidas. El saldo faltante ha sido cancelado.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cerrar el pedido.');
    } finally {
      setSaving(false);
    }
  };
  return <div className={form.root}>
    {error && <D365MessageBar intent="error" onDismiss={() => setError(null)}>{error}</D365MessageBar>}
    {mensaje && <D365MessageBar intent="success" onDismiss={() => setMensaje(null)}>{mensaje}</D365MessageBar>}
    {!id && esAlmaceneroOperativo && (
      <D365MessageBar intent="warning">
        Tu cuenta tiene perfil operativo de Almacenero. La emisión y creación de nuevas órdenes de compra está reservada para el Supervisor de Almacén o Administrador de Inventario. Los almaceneros están facultados para realizar la recepción física cuando la orden esté en estado Enviada.
      </D365MessageBar>
    )}
    {id && esAlmaceneroOperativo && estado !== 'Enviada' && estado !== 'Recibida con faltantes' && estado !== 'Recibida' && (
      <D365MessageBar intent="info">
        Ficha de orden de compra en modo solo lectura para control operativo. La recepción física se habilitará cuando la orden se encuentre en estado "Enviada".
      </D365MessageBar>
    )}
    <D365CommandBar ariaLabel="Comandos de compra" busy={saving || cargandoDatos} busyLabel={cargandoDatos ? 'Cargando...' : 'Guardando...'}><div className={form.toolbarLeft}>
      <D365CommandButton
        icon={<ArrowLeft16Regular />}
        tone="brand"
        aria-label="Volver"
        title="Volver al listado"
        disabled={saving}
        onClick={() => navigate('/servicio-campo/recepciones-compra')}
      />
      <D365CommandDivider />
      {puedeGestionarCompras && (
        <>
          <D365CommandButton icon={<Save16Regular />} tone="save" disabled={bloqueado} onClick={() => void guardar(false)}>Guardar</D365CommandButton>
          <D365CommandButton icon={<SaveMultiple16Regular />} tone="save" disabled={bloqueado} onClick={() => void guardar(true)}>Guardar y cerrar</D365CommandButton>
          {!cargandoDatos && estado === 'Borrador' && <D365CommandButton icon={<Checkmark16Regular />} disabled={loading || saving || !id} onClick={() => void procesar('solicitar')}>Solicitar compra</D365CommandButton>}
          {!cargandoDatos && (estado === 'Solicitada' || estado === 'Enviada') && (
            <D365CommandButton
              icon={<ArrowUndo16Regular />}
              disabled={loading || saving}
              onClick={() => void handleRevertirBorrador()}
            >
              Revertir a borrador
            </D365CommandButton>
          )}
          {!cargandoDatos && !estado.startsWith('Recibida') && Boolean(id) && (
            <D365CommandButton
              icon={<Delete16Regular />}
              tone="danger"
              disabled={loading || saving}
              onClick={() => setDialogEliminarBorrador(true)}
            >
              Eliminar orden
            </D365CommandButton>
          )}
          {!cargandoDatos && estado === 'Solicitada' && (
            <D365CommandButton
              icon={<VehicleTruckProfile16Regular />}
              tone="create"
              disabled={loading || saving || lineas.some(x => productos.find(p => p.id === x.productoId)?.esSerializado && x.series.split(/\r?\n/).filter(s => s.trim()).length !== Number(x.cantidad))}
              onClick={() => void procesar('enviar')}
            >
              Registrar envío
            </D365CommandButton>
          )}
        </>
      )}
      {!cargandoDatos && estado === 'Enviada' && (
        <D365CommandButton
          icon={<Box16Regular />}
          tone="create"
          disabled={loading || saving}
          onClick={() => navigate(`/servicio-campo/recepciones-compra/${id}/recepcion`)}
        >
          Recepcionar mercadería
        </D365CommandButton>
      )}
      {!cargandoDatos && estado === 'Recibida con faltantes' && (
        <>
          <D365CommandButton
            icon={<Box16Regular />}
            tone="create"
            disabled={loading || saving}
            onClick={() => navigate(`/servicio-campo/recepciones-compra/${id}/recepcion`)}
          >
            Recepcionar faltantes
          </D365CommandButton>
          {puedeGestionarCompras && (
            <D365CommandButton
              icon={<CheckmarkCircle16Regular />}
              disabled={loading || saving}
              onClick={() => void handleCerrarFaltantes()}
            >
              Cerrar pedido
            </D365CommandButton>
          )}
        </>
      )}
      {!cargandoDatos && estado === 'Recibida' && (
        <D365CommandButton
          icon={<Box16Regular />}
          disabled={loading || saving}
          onClick={() => navigate(`/servicio-campo/recepciones-compra/${id}/recepcion`)}
        >
          Ver recepción
        </D365CommandButton>
      )}
      <D365CommandDivider />
      <D365CommandButton icon={<Add16Regular />} tone="create" disabled={saving || cargandoDatos} onClick={() => navigate('/servicio-campo/recepciones-compra/nuevo')}>Nuevo</D365CommandButton>
    </div></D365CommandBar>
    <D365EntityHeader
      loading={cargandoDatos}
      title={compra?.numero ?? 'Nueva compra'}
      subtitle="Compra"
      avatarName={proveedor || 'Compra'}
      metadata={[
        { label: 'Estado', value: estado },
        { label: 'Total', value: dinero(total) },
        ...(compra?.creadoPor ? [{ label: 'Creado por', value: compra.creadoPor }] : []),
        ...(compra?.fechaRegistro ? [{ label: 'Fecha creación', value: new Date(compra.fechaRegistro).toLocaleString('es-PE') }] : []),
        ...(compra?.recibidoPor ? [{ label: 'Recibido por', value: compra.recibidoPor }] : []),
        ...(compra?.fechaRecepcion ? [{ label: 'Fecha de recepción', value: new Date(compra.fechaRecepcion).toLocaleString('es-PE') }] : []),
      ]}
      processFlow={!cargandoDatos ? <CompraEtapas estado={estado} embedded /> : undefined}
      tabs={
        <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(String(d.value))}>
          <Tab value="general" disabled={cargandoDatos}>General</Tab>
          <Tab value="productos" disabled={cargandoDatos}>Productos</Tab>
        </TabList>
      }
    />
    <D365FormContent busy={saving} className={form.contentBody} aria-busy={cargandoDatos}>{cargandoDatos ? <div className={form.card} role="status" aria-label="Cargando compra">
      <Skeleton animation="pulse">
        <SkeletonItem size={16} className={form.skeletonHeader} />
        <div className={form.grid2Cols}>
          {Array.from({ length: 8 }, (_, index) => <SkeletonItem key={index} size={32} className={form.skeletonFull} />)}
        </div>
        <SkeletonItem size={72} className={form.skeletonTextarea72} />
      </Skeleton>
    </div> : id && compra?.id !== id ? null : tab === 'general' ? (
      <div className={form.grid2Cols}>
        {/* Tarjeta 1: Información de la Compra */}
        <Card className={form.card}>
          <Text className={form.cardSectionTitle}>Información de la Compra</Text>

          <D365FormField label="Código de compra" htmlFor="compra-codigo">
            <Input
              id="compra-codigo"
              className={form.d365ControlFull}
              value={compra?.numero ?? ''}
              appearance="filled-darker"
              readOnly
              contentAfter={<LockClosed16Regular title="Campo de solo lectura" aria-label="Campo de solo lectura" />}
            />
          </D365FormField>

          <D365FormField label="Estado" htmlFor="compra-estado">
            <D365StatusField
              id="compra-estado"
              value={estado}
            />
          </D365FormField>

          {compra?.creadoPor && (
            <D365FormField label="Creado por" htmlFor="compra-creado-por">
              <Input
                id="compra-creado-por"
                className={form.d365ControlFull}
                value={compra.creadoPor}
                appearance="filled-darker"
                readOnly
                contentAfter={<LockClosed16Regular title="Campo de solo lectura" aria-label="Campo de solo lectura" />}
              />
            </D365FormField>
          )}

          {compra?.fechaRegistro && (
            <D365FormField label="Fecha de creación" htmlFor="compra-fecha-creacion">
              <Input
                id="compra-fecha-creacion"
                className={form.d365ControlFull}
                value={new Date(compra.fechaRegistro).toLocaleString('es-PE')}
                appearance="filled-darker"
                readOnly
                contentAfter={<LockClosed16Regular title="Campo de solo lectura" aria-label="Campo de solo lectura" />}
              />
            </D365FormField>
          )}

          {estado.startsWith('Recibida') && (
            <>
              <D365FormField label="Recibido por" htmlFor="compra-recibido-por">
                <Input
                  id="compra-recibido-por"
                  className={form.d365ControlFull}
                  value={compra?.recibidoPor || '—'}
                  appearance="filled-darker"
                  readOnly
                  contentAfter={<LockClosed16Regular title="Campo de solo lectura" aria-label="Campo de solo lectura" />}
                />
              </D365FormField>
              <D365FormField label="Fecha de recepción" htmlFor="compra-fecha-recepcion">
                <Input
                  id="compra-fecha-recepcion"
                  className={form.d365ControlFull}
                  value={compra?.fechaRecepcion ? new Date(compra.fechaRecepcion).toLocaleString('es-PE') : '—'}
                  appearance="filled-darker"
                  readOnly
                  contentAfter={<LockClosed16Regular title="Campo de solo lectura" aria-label="Campo de solo lectura" />}
                />
              </D365FormField>
            </>
          )}

          <D365FormField label="Proveedor">
            <Input
              aria-label="Proveedor"
              className={form.d365ControlFull}
              value={proveedor}
              maxLength={150}
              disabled={bloqueadoPedido}
              onChange={(_, d) => setProveedor(d.value)}
            />
          </D365FormField>

          <D365FormField label="Almacén de recepción" htmlFor="compra-almacen">
            <LookupDropdownWithQuickCreate
              idEntrada="compra-almacen"
              etiquetaGrupo="Almacenes"
              icono={<Box16Regular className={form.categoryIcon} />}
              alNavegar={id => window.open(`/servicio-campo/almacenes/${id}`, '_blank')}
              tituloEnlace="Ver detalles del almacén"
              opciones={almacenes
                .filter(x => (x.activo || x.id === almacenId) && (x.tipo === 1 || (!x.tipo && !x.recursoId)))
                .map(x => ({ id: x.id, nombre: x.nombre }))}
              seleccionada={almacen ? { id: almacen.id, nombre: almacen.nombre } : null}
              textoBusqueda={busquedaAlmacen}
              alCambiarBusqueda={setBusquedaAlmacen}
              alSeleccionar={id => setAlmacenId(id ?? '')}
              deshabilitado={bloqueadoPedido}
              renderizarCreacionRapida={({ abierto, nombreInicial, cerrar }) => <CreacionRapidaEntidadDrawer
                entidad={abierto ? 'almacen' : null}
                nombreInicial={nombreInicial}
                alCerrar={cerrar}
                alGuardar={id => {
                  void AlmacenService.getAlmacenById(id).then(a => {
                    setAlmacenes(xs => [...xs.filter(x => x.id !== a.id), a]);
                    setAlmacenId(a.id);
                    cerrar();
                  }).catch(e => setError(e instanceof Error ? e.message : 'No se pudo cargar el almacén.'));
                }}
              />}
            />
          </D365FormField>
        </Card>

        {/* Tarjeta 2: Comprobante y Condiciones */}
        <Card className={form.card}>
          <Text className={form.cardSectionTitle}>Comprobante y Condiciones</Text>

          <D365FormField label="Tipo de comprobante">
            <Select
              aria-label="Tipo de comprobante"
              className={form.d365ControlFull}
              value={tipo}
              disabled={bloqueado}
              onChange={(_, d) => setTipo(d.value)}
            >
              {['Factura', 'Boleta', 'Guía de remisión'].map(x => <option key={x}>{x}</option>)}
            </Select>
          </D365FormField>

          <D365FormField label="Número de comprobante">
            <Input
              aria-label="Número de comprobante"
              className={form.d365ControlFull}
              value={documento}
              maxLength={100}
              disabled={bloqueado}
              onChange={(_, d) => setDocumento(d.value)}
            />
          </D365FormField>

          <D365FormField label="Fecha del comprobante" htmlFor="compra-fecha">
            <DatePicker
              id="compra-fecha"
              className={form.d365ControlFull}
              value={fecha ? new Date(fecha + 'T00:00:00') : undefined}
              disabled={bloqueado}
              formatDate={d => d?.toLocaleDateString('es-PE') ?? ''}
              onSelectDate={d => setFecha(d ? fechaISO(d) : '')}
            />
          </D365FormField>

          <D365FormField label="Moneda">
            <Select
              aria-label="Moneda"
              className={form.d365ControlFull}
              value={moneda}
              disabled={bloqueadoPedido}
              onChange={(_, d) => setMoneda(d.value)}
            >
              <option value="PEN">Soles (PEN)</option>
              <option value="USD">Dólares (USD)</option>
            </Select>
          </D365FormField>

          <D365FormField label="Observación" align="top">
            <Textarea
              aria-label="Observación"
              className={form.d365ControlFull}
              value={observacion}
              maxLength={500}
              rows={3}
              disabled={bloqueado}
              onChange={(_, d) => setObservacion(d.value)}
            />
          </D365FormField>
        </Card>
      </div>
    ) : (
      <Card className={form.card}>
        <ProductosCompraGrid
          lineas={lineas}
          productos={productos}
          moneda={moneda}
          bloqueado={bloqueado}
          soloLectura={estado.startsWith('Recibida') || estado === 'Enviada'}
          soloSeries={false}
          alCambiar={setLineas}
          alCargarProducto={p => setProductos(ps => [...ps.filter(x => x.id !== p.id), p])}
        />
      </Card>
    )}</D365FormContent>

    <Dialog
      open={dialogEliminarBorrador}
      onOpenChange={(_, data) => {
        if (!data.open && !eliminandoBorrador) setDialogEliminarBorrador(false);
      }}
    >
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Eliminar orden de compra</DialogTitle>
          <DialogContent>
            ¿Está seguro de que desea eliminar la orden de compra{' '}
            <strong>{compra?.numero}</strong>? Esta acción no se puede deshacer.
          </DialogContent>
          <DialogActions>
            <Button
              appearance="secondary"
              disabled={eliminandoBorrador}
              onClick={() => setDialogEliminarBorrador(false)}
            >
              Cancelar
            </Button>
            <Button
              appearance="primary"
              style={{ backgroundColor: tokens.colorPaletteRedBackground3, color: tokens.colorNeutralForegroundOnBrand }}
              disabled={eliminandoBorrador}
              onClick={async () => {
                if (!id) return;
                try {
                  setEliminandoBorrador(true);
                  await CompraService.eliminar(id);
                  navigate('/servicio-campo/recepciones-compra', {
                    state: { successMessage: `Orden de compra ${compra?.numero ?? ''} eliminada exitosamente.` },
                  });
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Error al eliminar la orden de compra.');
                } finally {
                  setEliminandoBorrador(false);
                }
              }}
            >
              {eliminandoBorrador ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  </div>;
}
