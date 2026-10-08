import { useEffect, useState } from 'react';
import {
  Button,
  Combobox,
  Option,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  Input,
  Link,
  OverlayDrawer,
  TableCellLayout,
  Text,
  Badge,
  Tooltip,
  createTableColumn,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import type { SelectionItemId, TableColumnDefinition } from '@fluentui/react-components';
import {
  Add16Regular,
  Delete16Regular,
  Dismiss16Regular,
  Edit16Regular,
  BarcodeScanner16Regular,
  BarcodeScanner20Regular,
  Copy16Regular,
  Checkmark16Regular,
  CheckmarkCircle16Filled,
  Search16Regular,
  LockClosed16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../components/common/D365CommandBar';
import { D365FormField } from '../../../components/common/D365FormField';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { TableEmptyState } from '../../../components/common/TableEmptyState';
import { useD365ListStyles } from '../../../styles/d365ListStyles';
import type { ProductoDto } from '../productos/types/producto.types';
import { ProductoService } from '../productos/services/producto.service';
import { SeriesCompraTable, obtenerSeriesCompra } from './SeriesCompraTable';

export type LineaCompraForm = {
  clave: string;
  productoId: string;
  cantidad: string;
  costo: string;
  series: string;
  cantidadRecibida?: string;
  seriesRecibidas?: string;
};

export const importeLinea = (x: LineaCompraForm) =>
  Math.round((Number(x.cantidad) * Number(x.costo) + Number.EPSILON) * 100) / 100;

const useStyles = makeStyles({
  drawer: { width: '520px', maxWidth: '95vw' },
  header: { borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
  body: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: `1px solid ${tokens.colorNeutralStroke2}` },
  control: { width: '100%' },
  opcion: { display: 'flex', flexDirection: 'column' },
  codigo: { color: tokens.colorNeutralForeground3 },
  grid: { overflowX: 'auto' },
  indicator: { display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' },
  total: { display: 'flex', justifyContent: 'flex-end', padding: '16px' },
  // Estilos para la lista de series
  seriesListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '440px',
    overflowY: 'auto',
    padding: '2px',
  },
  seriesItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    transition: 'background-color 0.15s ease',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  seriesLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  seriesIndex: {
    fontSize: '11px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground4,
    minWidth: '24px',
  },
  seriesCode: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '13px',
    letterSpacing: '0.5px',
    color: tokens.colorNeutralForeground1,
  },
  seriesActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
});

export function ProductosCompraGrid({
  lineas,
  productos,
  moneda,
  bloqueado,
  soloLectura,
  soloSeries = false,
  alCambiar,
  alCargarProducto,
}: {
  lineas: LineaCompraForm[];
  productos: ProductoDto[];
  moneda: string;
  bloqueado: boolean;
  soloLectura: boolean;
  soloSeries?: boolean;
  alCambiar: (lineas: LineaCompraForm[]) => void;
  alCargarProducto: (producto: ProductoDto) => void;
}) {
  const styles = useStyles();
  const list = useD365ListStyles();
  const [seleccionados, setSeleccionados] = useState<Set<SelectionItemId>>(new Set());
  const [linea, setLinea] = useState<LineaCompraForm | null>(null);
  const [editando, setEditando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaSerie, setBusquedaSerie] = useState('');
  const [copiadoExito, setCopiadoExito] = useState(false);
  const [error, setError] = useState('');
  const [resultados, setResultados] = useState<ProductoDto[]>([]);
  const [buscando, setBuscando] = useState(false);

  const producto = productos.find(p => p.id === linea?.productoId);
  const seleccionada = lineas.find(x => seleccionados.has(x.clave));
  const seleccionadaSeriada = Boolean(productos.find(p => p.id === seleccionada?.productoId)?.esSerializado);
  const drawerSoloLectura = soloLectura || (soloSeries && !producto?.esSerializado);
  const consulta = busqueda.trim();
  const abierto = Boolean(linea);
  const productoId = linea?.productoId;

  useEffect(() => {
    if (!abierto || soloLectura || soloSeries || productoId) {
      setBuscando(false);
      return;
    }
    const controller = new AbortController();
    setBuscando(true);
    const delay = consulta ? 300 : 0;
    const timer = setTimeout(() => {
      void ProductoService.buscarInventariables(consulta, controller.signal)
        .then(ps => {
          if (!controller.signal.aborted) setResultados(ps);
        })
        .catch(e => {
          if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudieron buscar los productos.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setBuscando(false);
        });
    }, delay);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [abierto, consulta, productoId, soloLectura, soloSeries]);

  const opciones = producto
    ? [producto]
    : resultados.length > 0
    ? resultados
    : productos.filter(p => p.activo && p.tipo === 'Inventario');
  const dinero = (valor: number) => valor.toLocaleString('es-PE', { style: 'currency', currency: moneda });

  const abrir = (x?: LineaCompraForm) => {
    setLinea(x ? { ...x } : { clave: crypto.randomUUID(), productoId: '', cantidad: '', costo: '', series: '' });
    setEditando(Boolean(x));
    setBusqueda('');
    setBusquedaSerie('');
    setCopiadoExito(false);
    setResultados([]);
    setError('');
  };

  const confirmar = () => {
    if (!linea || drawerSoloLectura || bloqueado) return;
    const cantidad = Number(linea.cantidad);
    const costo = Number(linea.costo);
    if (
      !producto?.activo ||
      !linea.cantidad ||
      !Number.isFinite(cantidad) ||
      cantidad <= 0 ||
      !linea.costo ||
      !Number.isFinite(costo) ||
      costo < 0 ||
      Math.round(costo * 100) / 100 !== costo
    ) {
      setError('Seleccione un producto y registre cantidad y costo válidos.');
      return;
    }
    if (lineas.some(x => x.clave !== linea.clave && x.productoId === linea.productoId)) {
      setError('El producto ya está agregado.');
      return;
    }
    if (Number(cantidad.toFixed(producto.decimalesCantidad)) !== cantidad) {
      setError('La cantidad supera los decimales permitidos para el producto.');
      return;
    }
    if (producto.esSerializado && !Number.isInteger(cantidad)) {
      setError('La cantidad de un producto serializado debe ser entera.');
      return;
    }
    const series = linea.series.split(/\r?\n/).map(x => x.trim().toUpperCase()).filter(Boolean);
    const otrasSeries = new Set(
      lineas
        .filter(x => x.clave !== linea.clave)
        .flatMap(x => x.series.split(/\r?\n/).map(s => s.trim().toUpperCase()).filter(Boolean))
    );
    if (
      producto.esSerializado &&
      (series.length > cantidad ||
        new Set(series).size !== series.length ||
        series.some(s => s.length > 100 || otrasSeries.has(s)))
    ) {
      setError('Las series deben ser únicas y corresponder a la cantidad.');
      return;
    }
    const nueva = { ...linea, series: producto.esSerializado ? series.join('\n') : '' };
    alCambiar(editando ? lineas.map(x => (x.clave === nueva.clave ? nueva : x)) : [...lineas, nueva]);
    setLinea(null);
  };

  const columns: TableColumnDefinition<LineaCompraForm>[] = [
    createTableColumn({
      columnId: 'producto',
      renderHeaderCell: () => 'Producto',
      renderCell: x => (
        <TableCellLayout>
          <Link
            as="button"
            onClick={e => {
              e.stopPropagation();
              abrir(x);
            }}
          >
            {productos.find(p => p.id === x.productoId)?.nombre ?? '---'}
          </Link>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'unidad',
      renderHeaderCell: () => 'Unidad',
      renderCell: x => (
        <TableCellLayout>
          {productos.find(p => p.id === x.productoId)?.nombreUnidadMedidaDefecto ?? '---'}
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'cantidad',
      compare: (a, b) => Number(a.cantidad) - Number(b.cantidad),
      renderHeaderCell: () => 'Cantidad',
      renderCell: x => {
        if (x.cantidadRecibida !== undefined) {
          const esperada = Number(x.cantidad);
          const recibida = Number(x.cantidadRecibida);
          const faltante = esperada - recibida;
          return (
            <TableCellLayout>
              <div>
                <span>
                  {recibida.toLocaleString('es-PE')} de {esperada.toLocaleString('es-PE')}
                </span>
                {faltante > 0 && (
                  <span
                    style={{
                      marginLeft: '6px',
                      color: tokens.colorPaletteRedForeground1,
                      fontWeight: 600,
                      fontSize: '11px',
                      backgroundColor: tokens.colorPaletteRedBackground2,
                      border: `1px solid ${tokens.colorPaletteRedBorder2}`,
                      padding: '2px 6px',
                      borderRadius: tokens.borderRadiusSmall,
                    }}
                  >
                    Faltante: -{faltante}
                  </span>
                )}
              </div>
            </TableCellLayout>
          );
        }
        return <TableCellLayout>{Number(x.cantidad).toLocaleString('es-PE')}</TableCellLayout>;
      },
    }),
    createTableColumn({
      columnId: 'costo',
      compare: (a, b) => Number(a.costo) - Number(b.costo),
      renderHeaderCell: () => 'Costo unitario',
      renderCell: x => <TableCellLayout>{dinero(Number(x.costo))}</TableCellLayout>,
    }),
    createTableColumn({
      columnId: 'importe',
      compare: (a, b) => importeLinea(a) - importeLinea(b),
      renderHeaderCell: () => 'Importe',
      renderCell: x => <TableCellLayout>{dinero(importeLinea(x))}</TableCellLayout>,
    }),
    createTableColumn({
      columnId: 'series',
      renderHeaderCell: () => (
        <Tooltip content="Números de serie y trazabilidad" relationship="label">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <BarcodeScanner16Regular />
            <span>Series</span>
          </span>
        </Tooltip>
      ),
      renderCell: x => {
        const prod = productos.find(p => p.id === x.productoId);
        if (!prod?.esSerializado) {
          return (
            <TableCellLayout>
              <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>
                —
              </Text>
            </TableCellLayout>
          );
        }

        const cantidadTotal = obtenerSeriesCompra(x.series).length;

        if (x.seriesRecibidas !== undefined) {
          const recibidas = obtenerSeriesCompra(x.seriesRecibidas).length;
          const conFaltante = recibidas < cantidadTotal;
          return (
            <TableCellLayout>
              <Tooltip
                content={
                  conFaltante
                    ? `Faltan ${cantidadTotal - recibidas} series por recibir. Haga clic para ver lista.`
                    : 'Todas las series recibidas. Haga clic para ver lista.'
                }
                relationship="description"
              >
                <Link
                  as="button"
                  onClick={e => {
                    e.stopPropagation();
                    abrir(x);
                  }}
                  style={{ textDecoration: 'none' }}
                >
                  <Badge
                    appearance="tint"
                    color={conFaltante ? 'danger' : 'success'}
                    icon={<BarcodeScanner16Regular />}
                    style={{ cursor: 'pointer' }}
                  >
                    {recibidas}/{cantidadTotal} {conFaltante ? `(-${cantidadTotal - recibidas})` : 'completas'}
                  </Badge>
                </Link>
              </Tooltip>
            </TableCellLayout>
          );
        }

        const completas = cantidadTotal === Number(x.cantidad);
        return (
          <TableCellLayout>
            <Tooltip
              content={
                completas
                  ? 'Todas las series registradas. Haga clic para ver lista.'
                  : 'Series incompletas. Haga clic para ver lista.'
              }
              relationship="description"
            >
              <Link
                as="button"
                onClick={e => {
                  e.stopPropagation();
                  abrir(x);
                }}
                style={{ textDecoration: 'none' }}
              >
                <Badge
                  appearance="tint"
                  color={completas ? 'success' : 'warning'}
                  icon={<BarcodeScanner16Regular />}
                  style={{ cursor: 'pointer' }}
                >
                  {cantidadTotal}/{x.cantidad} {completas ? 'completas' : 'pendientes'}
                </Badge>
              </Link>
            </Tooltip>
          </TableCellLayout>
        );
      },
    }),
  ];

  return (
    <>
      <D365CommandBar ariaLabel="Comandos de productos de compra">
        <div className={list.toolbarLeft}>
          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            disabled={bloqueado || soloSeries}
            onClick={() => abrir()}
          >
            Agregar producto
          </D365CommandButton>
          <D365CommandButton
            icon={<Edit16Regular />}
            disabled={bloqueado || seleccionados.size !== 1 || (soloSeries && !seleccionadaSeriada)}
            onClick={() => {
              const x = lineas.find(x => seleccionados.has(x.clave));
              if (x) abrir(x);
            }}
          >
            {soloSeries ? 'Registrar series' : 'Editar'}
          </D365CommandButton>
          <D365CommandButton
            icon={<Delete16Regular />}
            disabled={bloqueado || soloSeries || seleccionados.size === 0}
            onClick={() => {
              alCambiar(lineas.filter(x => !seleccionados.has(x.clave)));
              setSeleccionados(new Set());
            }}
          >
            Eliminar
          </D365CommandButton>
        </div>
      </D365CommandBar>

      <div className={styles.grid}>
        <DataGrid
          items={lineas}
          columns={columns}
          getRowId={x => x.clave}
          sortable
          selectionMode="multiselect"
          selectedItems={seleccionados}
          onSelectionChange={(_, d) => setSeleccionados(d.selectedItems)}
          className={list.table}
          focusMode="composite"
        >
          <DataGridHeader>
            <DataGridRow>
              {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
            </DataGridRow>
          </DataGridHeader>
          {lineas.length === 0 ? (
            <TableEmptyState />
          ) : (
            <DataGridBody<LineaCompraForm>>
              {({ item, rowId }) => (
                <DataGridRow<LineaCompraForm> key={rowId} className={list.dataRow}>
                  {({ renderCell }) => <DataGridCell className={list.dataCell}>{renderCell(item)}</DataGridCell>}
                </DataGridRow>
              )}
            </DataGridBody>
          )}
        </DataGrid>
      </div>

      <div className={styles.total}>
        <Text weight="semibold">Total: {dinero(lineas.reduce((s, x) => s + importeLinea(x), 0))}</Text>
      </div>

      {/* Drawer: Si es solo lectura de producto serializado muestra lista dedicada de series */}
      <OverlayDrawer
        open={Boolean(linea)}
        position="end"
        className={styles.drawer}
        onOpenChange={(_, d) => {
          if (!d.open) setLinea(null);
        }}
      >
        <DrawerHeader className={styles.header}>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                icon={<Dismiss16Regular />}
                aria-label="Cerrar"
                onClick={() => setLinea(null)}
              />
            }
          >
            {drawerSoloLectura && producto?.esSerializado ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarcodeScanner20Regular style={{ color: tokens.colorBrandForeground1 }} />
                <span>Series del producto</span>
              </div>
            ) : drawerSoloLectura ? (
              'Detalle de producto'
            ) : soloSeries ? (
              'Registrar series'
            ) : editando ? (
              'Editar producto'
            ) : (
              'Agregar producto'
            )}
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody className={styles.body}>
          {error && <D365MessageBar intent="error" onDismiss={() => setError('')}>{error}</D365MessageBar>}

          {linea && (
            drawerSoloLectura && producto?.esSerializado ? (
              /* VISTA DE SOLO LISTA DE SERIES (REQUERIMIENTO: lista de series con componente de lista) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Cabecera resumen del producto */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: tokens.colorNeutralBackground2,
                    borderRadius: tokens.borderRadiusMedium,
                    border: `1px solid ${tokens.colorNeutralStroke2}`,
                  }}
                >
                  <div>
                    <Text weight="semibold" style={{ display: 'block', fontSize: '14px' }}>
                      {producto.nombre}
                    </Text>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      Código: {producto.codigo} • Cantidad: {linea.cantidad} {producto.nombreUnidadMedidaDefecto || 'UND'}
                    </Text>
                  </div>
                  <Badge
                    appearance="tint"
                    color={obtenerSeriesCompra(linea.series).length === Number(linea.cantidad) ? 'success' : 'warning'}
                    icon={<BarcodeScanner16Regular />}
                  >
                    {obtenerSeriesCompra(linea.series).length}/{linea.cantidad} series
                  </Badge>
                </div>

                {/* Barra de utilidades: Búsqueda y Copiar todas */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <Input
                    size="small"
                    placeholder="Buscar serie..."
                    contentBefore={<Search16Regular />}
                    value={busquedaSerie}
                    onChange={(_, d) => setBusquedaSerie(d.value)}
                    style={{ flexGrow: 1 }}
                  />
                  <Button
                    size="small"
                    appearance="outline"
                    icon={copiadoExito ? <Checkmark16Regular /> : <Copy16Regular />}
                    onClick={() => {
                      const texto = obtenerSeriesCompra(linea.series).join('\n');
                      void navigator.clipboard.writeText(texto);
                      setCopiadoExito(true);
                      setTimeout(() => setCopiadoExito(false), 2000);
                    }}
                  >
                    {copiadoExito ? '¡Copiadas!' : 'Copiar todas'}
                  </Button>
                </div>

                {/* Componente de Lista de Series */}
                <div className={styles.seriesListContainer}>
                  {obtenerSeriesCompra(linea.series).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: tokens.colorNeutralForeground3 }}>
                      <Text size={200}>No hay series registradas para esta línea.</Text>
                    </div>
                  ) : (
                    obtenerSeriesCompra(linea.series)
                      .filter(s => !busquedaSerie.trim() || s.includes(busquedaSerie.trim().toUpperCase()))
                      .map((s, idx) => {
                        const setRec = linea.seriesRecibidas
                          ? new Set(obtenerSeriesCompra(linea.seriesRecibidas))
                          : null;
                        const estaRecibida = setRec ? setRec.has(s) : null;
                        return (
                          <div key={s} className={styles.seriesItem}>
                            <div className={styles.seriesLeft}>
                              <span className={styles.seriesIndex}>#{idx + 1}</span>
                              <Text className={styles.seriesCode}>{s}</Text>
                            </div>
                            <div className={styles.seriesActions}>
                              {estaRecibida !== null && (
                                <Badge
                                  appearance={estaRecibida ? 'filled' : 'tint'}
                                  color={estaRecibida ? 'success' : 'danger'}
                                  icon={estaRecibida ? <CheckmarkCircle16Filled /> : undefined}
                                  size="small"
                                >
                                  {estaRecibida ? 'Recibida' : 'Faltante'}
                                </Badge>
                              )}
                              <Button
                                size="small"
                                appearance="subtle"
                                icon={<Copy16Regular />}
                                title="Copiar serie"
                                aria-label={`Copiar serie ${s}`}
                                onClick={() => void navigator.clipboard.writeText(s)}
                              />
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            ) : (
              /* VISTA DE EDICIÓN O CREACIÓN NORMAL O REGISTRO DE SERIES */
              <>
                {soloSeries ? (
                  /* Modo solo registrar series: eliminar campos innecesarios y mostrar resumen compacto */
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: tokens.colorNeutralBackground2,
                      borderRadius: tokens.borderRadiusMedium,
                      border: `1px solid ${tokens.colorNeutralStroke2}`,
                      marginBottom: '16px',
                    }}
                  >
                    <div>
                      <Text weight="semibold" style={{ display: 'block', fontSize: '14px' }}>
                        {producto?.nombre ?? 'Producto serializado'}
                      </Text>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        Código SKU: {producto?.codigo || '---'} • Cantidad esperada: {linea.cantidad} {producto?.nombreUnidadMedidaDefecto || 'UND'}
                      </Text>
                    </div>
                    <Badge
                      appearance="tint"
                      color={obtenerSeriesCompra(linea.series).length === Number(linea.cantidad) ? 'success' : 'warning'}
                      icon={<BarcodeScanner16Regular />}
                    >
                      {obtenerSeriesCompra(linea.series).length} / {linea.cantidad} series
                    </Badge>
                  </div>
                ) : (
                  <>
                    <D365FormField label="Producto" required htmlFor="compra-producto">
                      <Combobox
                        id="compra-producto"
                        className={styles.control}
                        placeholder="Seleccione o busque un producto..."
                        value={producto ? `${producto.codigo} · ${producto.nombre}` : busqueda}
                        selectedOptions={linea.productoId ? [linea.productoId] : []}
                        disabled={soloLectura}
                        onOpenChange={(_, data) => {
                          if (data.open && resultados.length === 0 && !linea.productoId) {
                            void ProductoService.buscarInventariables(consulta)
                              .then(ps => setResultados(ps))
                              .catch(() => {});
                          }
                        }}
                        onChange={e => {
                          setError('');
                          setBusqueda(e.target.value);
                          setLinea({ ...linea, productoId: '', series: '' });
                        }}
                        onOptionSelect={(_, d) => {
                          const p = (producto && producto.id === d.optionValue)
                            ? producto
                            : [...resultados, ...productos].find(x => x.id === d.optionValue);
                          if (!p) return;
                          alCargarProducto(p);
                          setLinea({
                            ...linea,
                            productoId: p.id,
                            series: '',
                            costo: linea.costo || (p.costoActual ? String(p.costoActual) : p.costoEstandar ? String(p.costoEstandar) : ''),
                          });
                          setBusqueda('');
                        }}
                      >
                        {buscando && <Option value="cargando" disabled>Cargando productos…</Option>}
                        {opciones.map(p => (
                          <Option key={p.id} value={p.id} text={`${p.codigo} · ${p.nombre}`}>
                            <div className={styles.opcion}>
                              <Text weight="medium">{p.nombre}</Text>
                              <Text size={200} className={styles.codigo}>
                                {p.codigo} {p.nombreUnidadMedidaDefecto ? `(${p.nombreUnidadMedidaDefecto})` : ''}
                              </Text>
                            </div>
                          </Option>
                        ))}
                        {!buscando && opciones.length === 0 && (
                          <Option value="sin_resultados" disabled>
                            No se encontraron productos inventariables
                          </Option>
                        )}
                      </Combobox>
                    </D365FormField>
                    <D365FormField label="Unidad" htmlFor="compra-unidad">
                      <Input
                        id="compra-unidad"
                        className={styles.control}
                        value={producto?.nombreUnidadMedidaDefecto ?? '---'}
                        readOnly
                        appearance="filled-darker"
                        contentAfter={<LockClosed16Regular title="Campo de solo lectura" aria-label="Campo de solo lectura" />}
                      />
                    </D365FormField>
                    <D365FormField label="Cantidad" required htmlFor="compra-cantidad">
                      <Input
                        id="compra-cantidad"
                        className={styles.control}
                        type="number"
                        min={0}
                        step={producto?.esSerializado ? 1 : 'any'}
                        value={linea.cantidad}
                        disabled={soloLectura}
                        onChange={(_, d) => setLinea({ ...linea, cantidad: d.value })}
                      />
                    </D365FormField>
                    <D365FormField label="Costo unitario" required htmlFor="compra-costo">
                      <Input
                        id="compra-costo"
                        className={styles.control}
                        type="number"
                        min={0}
                        step="0.01"
                        value={linea.costo}
                        disabled={soloLectura}
                        onChange={(_, d) => setLinea({ ...linea, costo: d.value })}
                      />
                    </D365FormField>
                    <D365FormField label="Importe" htmlFor="compra-importe">
                      <Input
                        id="compra-importe"
                        className={styles.control}
                        value={dinero(importeLinea(linea))}
                        readOnly
                        appearance="filled-darker"
                        contentAfter={<LockClosed16Regular title="Campo de solo lectura" aria-label="Campo de solo lectura" />}
                      />
                    </D365FormField>
                  </>
                )}
                {(soloSeries || soloLectura || Boolean(linea.series)) && producto?.esSerializado && (
                  <SeriesCompraTable
                    key={linea.clave}
                    valor={linea.series}
                    cantidad={Number(linea.cantidad)}
                    soloLectura={drawerSoloLectura || bloqueado}
                    otrasSeries={lineas.filter(x => x.clave !== linea.clave).flatMap(x => obtenerSeriesCompra(x.series))}
                    seriesRecibidas={linea.seriesRecibidas ? obtenerSeriesCompra(linea.seriesRecibidas) : undefined}
                    alCambiar={series => setLinea({ ...linea, series })}
                  />
                )}
              </>
            )
          )}
        </DrawerBody>

        <DrawerFooter className={styles.footer}>
          <Button onClick={() => setLinea(null)}>
            {drawerSoloLectura ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!drawerSoloLectura && (
            <Button appearance="primary" disabled={bloqueado} onClick={confirmar}>
              {editando ? 'Guardar' : 'Agregar'}
            </Button>
          )}
        </DrawerFooter>
      </OverlayDrawer>
    </>
  );
}
