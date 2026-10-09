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
  createTableColumn,
  makeStyles,
  tokens,
  Textarea,
} from '@fluentui/react-components';
import type { SelectionItemId, TableColumnDefinition } from '@fluentui/react-components';
import {
  Add16Regular,
  Delete16Regular,
  Dismiss16Regular,
  Edit16Regular,
  BarcodeScanner16Regular,
  LockClosed16Regular,
  ArrowDownLeft16Regular,
  ArrowUpRight16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../../components/common/D365CommandBar';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { TableEmptyState } from '../../../../components/common/TableEmptyState';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { ProductoService } from '../../productos/services/producto.service';
import type { ProductoDto } from '../../productos/types/producto.types';
import type { TipoAjuste } from '../types/ajuste.types';

const formatoMoneda = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  toolbar: {
    padding: '4px 0',
  },
  drawer: {
    width: '580px',
    maxWidth: '95vw',
  },
  header: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingBottom: '14px',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '20px 24px',
    overflowX: 'hidden',
    '& [class*="d365LabelCol"]': {
      width: '150px',
      minWidth: '150px',
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    padding: '16px 24px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  control: {
    width: '100%',
    minWidth: 0,
  },
  opcion: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: '12px',
    minWidth: 0,
  },
  codigo: {
    color: tokens.colorNeutralForeground4,
    fontSize: '11px',
    fontFamily: 'Consolas, monospace',
    flexShrink: 0,
  },
  totalBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '24px',
    padding: '12px 16px',
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
});

export interface LineaAjusteForm {
  clave: string;
  id?: string;
  productoId: string;
  codigoProducto?: string;
  nombreProducto?: string;
  unidad?: string;
  tipo: 'Entrada' | 'Salida';
  cantidad: string;
  costo: string;
  series: string;
  motivoLinea: string;
}

interface LineasAjusteGridProps {
  lineas: LineaAjusteForm[];
  tipoAjusteGeneral: TipoAjuste;
  bloqueado: boolean;
  soloLectura: boolean;
  alCambiar: (lineas: LineaAjusteForm[]) => void;
  productosRegistrados: ProductoDto[];
  alCargarProducto: (producto: ProductoDto) => void;
}

export function LineasAjusteGrid({
  lineas,
  tipoAjusteGeneral,
  bloqueado,
  soloLectura,
  alCambiar,
  productosRegistrados,
  alCargarProducto,
}: LineasAjusteGridProps) {
  const styles = useStyles();
  const list = useD365ListStyles();

  const [seleccionados, setSeleccionados] = useState<Set<SelectionItemId>>(new Set());
  const [linea, setLinea] = useState<LineaAjusteForm | null>(null);
  const [editando, setEditando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const [resultados, setResultados] = useState<ProductoDto[]>([]);
  const [buscando, setBuscando] = useState(false);

  const productoSeleccionado = [...resultados, ...productosRegistrados].find(
    p => p.id === linea?.productoId
  );
  const consulta = busqueda.trim();
  const abierto = Boolean(linea);

  // Precarga inicial de productos inventariables
  useEffect(() => {
    let activo = true;
    void ProductoService.getProductos(undefined, undefined, true)
      .then(prods => {
        if (activo && Array.isArray(prods)) {
          setResultados(prods.filter(p => p.tipo === 'Inventario'));
        }
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  // Carga inmediata de productos inventariables al buscar en el Drawer
  useEffect(() => {
    if (!abierto || soloLectura || (linea?.productoId && !consulta)) {
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
          if (!controller.signal.aborted)
            setError(e instanceof Error ? e.message : 'No se pudieron buscar productos.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setBuscando(false);
        });
    }, delay);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [abierto, consulta, linea?.productoId, soloLectura]);

  const opciones = productoSeleccionado
    ? [productoSeleccionado]
    : resultados.length > 0
    ? resultados
    : productosRegistrados.filter(p => p.activo && p.tipo === 'Inventario');

  const abrir = (x?: LineaAjusteForm) => {
    const tipoDefecto = tipoAjusteGeneral === 'Salida' ? 'Salida' : 'Entrada';
    setLinea(
      x
        ? { ...x }
        : {
            clave: crypto.randomUUID(),
            productoId: '',
            tipo: tipoDefecto,
            cantidad: '1',
            costo: '0',
            series: '',
            motivoLinea: '',
          }
    );
    setEditando(Boolean(x));
    const prod = x ? [...productosRegistrados, ...resultados].find(p => p.id === x.productoId) : null;
    setBusqueda(
      prod ? `${prod.codigo} · ${prod.nombre}` : x?.codigoProducto ? `${x.codigoProducto} · ${x.nombreProducto}` : ''
    );
    setError('');
  };

  const confirmar = () => {
    if (!linea || soloLectura || bloqueado) return;
    const prod = productoSeleccionado;
    const cant = Number(linea.cantidad);
    const costo = Number(linea.costo);

    if (!linea.productoId || !prod) {
      setError('Seleccione un producto inventariable válido.');
      return;
    }
    if (!Number.isFinite(cant) || cant <= 0) {
      setError('Ingrese una cantidad mayor a cero.');
      return;
    }
    if (!Number.isFinite(costo) || costo < 0) {
      setError('El costo unitario no puede ser negativo.');
      return;
    }
    if (prod.esSerializado && !Number.isInteger(cant)) {
      setError('Los productos serializados deben tener cantidad entera.');
      return;
    }

    const seriesArr = linea.series
      .split(/\r?\n/)
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);

    if (prod.esSerializado && seriesArr.length !== cant) {
      setError(`Debe ingresar exactamente ${cant} series (ingresadas: ${seriesArr.length}).`);
      return;
    }
    if (prod.esSerializado && new Set(seriesArr).size !== seriesArr.length) {
      setError('Hay números de serie duplicados en la lista.');
      return;
    }

    const nueva: LineaAjusteForm = {
      ...linea,
      codigoProducto: prod.codigo,
      nombreProducto: prod.nombre,
      unidad: prod.nombreUnidadMedidaDefecto || 'UND',
      series: prod.esSerializado ? seriesArr.join('\n') : '',
    };

    if (editando) {
      alCambiar(lineas.map(l => (l.clave === nueva.clave ? nueva : l)));
    } else {
      alCambiar([...lineas, nueva]);
    }
    setLinea(null);
  };

  const eliminarSeleccionados = () => {
    if (seleccionados.size === 0 || soloLectura || bloqueado) return;
    alCambiar(lineas.filter(l => !seleccionados.has(l.clave)));
    setSeleccionados(new Set());
  };

  const columns: TableColumnDefinition<LineaAjusteForm>[] = [
    createTableColumn({
      columnId: 'producto',
      renderHeaderCell: () => 'Producto',
      renderCell: item => {
        const prod = [...productosRegistrados, ...resultados].find(p => p.id === item.productoId);
        const texto = prod
          ? `${prod.codigo} · ${prod.nombre}`
          : item.codigoProducto
          ? `${item.codigoProducto} · ${item.nombreProducto}`
          : item.nombreProducto || '---';

        return (
          <TableCellLayout truncate>
            <Link
              as="button"
              onClick={e => {
                e.stopPropagation();
                abrir(item);
              }}
            >
              {texto}
            </Link>
          </TableCellLayout>
        );
      },
    }),
    createTableColumn({
      columnId: 'unidad',
      renderHeaderCell: () => 'Unidad',
      renderCell: item => {
        const prod = [...productosRegistrados, ...resultados].find(p => p.id === item.productoId);
        return <TableCellLayout>{prod?.nombreUnidadMedidaDefecto || item.unidad || 'UND'}</TableCellLayout>;
      },
    }),
    createTableColumn({
      columnId: 'tipo',
      renderHeaderCell: () => 'Movimiento',
      renderCell: item => (
        <TableCellLayout>
          {item.tipo === 'Entrada' ? (
            <Badge appearance="tint" shape="rounded" color="success" icon={<ArrowDownLeft16Regular />}>
              Ingreso (+)
            </Badge>
          ) : (
            <Badge appearance="tint" shape="rounded" color="danger" icon={<ArrowUpRight16Regular />}>
              Salida (-)
            </Badge>
          )}
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'cantidad',
      renderHeaderCell: () => 'Cantidad',
      renderCell: item => (
        <TableCellLayout>
          <span style={{ fontWeight: 500 }}>{Number(item.cantidad).toLocaleString('es-PE')}</span>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'costo',
      renderHeaderCell: () => 'Costo Unit.',
      renderCell: item => (
        <TableCellLayout>{formatoMoneda.format(Number(item.costo) || 0)}</TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'total',
      renderHeaderCell: () => 'Importe Total',
      renderCell: item => {
        const total = (Number(item.cantidad) || 0) * (Number(item.costo) || 0);
        return (
          <TableCellLayout>
            <span style={{ fontWeight: tokens.fontWeightSemibold }}>
              {formatoMoneda.format(total)}
            </span>
          </TableCellLayout>
        );
      },
    }),
    createTableColumn({
      columnId: 'series',
      renderHeaderCell: () => 'Series',
      renderCell: item => {
        const prod = [...productosRegistrados, ...resultados].find(p => p.id === item.productoId);
        if (!prod?.esSerializado) {
          return (
            <TableCellLayout>
              <span style={{ color: tokens.colorNeutralForeground4 }}>—</span>
            </TableCellLayout>
          );
        }
        const seriesArr = item.series.split(/\r?\n/).filter(Boolean);
        return (
          <TableCellLayout>
            <Badge
              appearance="tint"
              color={seriesArr.length === Number(item.cantidad) ? 'success' : 'warning'}
              icon={<BarcodeScanner16Regular />}
            >
              {seriesArr.length}/{item.cantidad} series
            </Badge>
          </TableCellLayout>
        );
      },
    }),
  ];

  const totalCantidad = lineas.reduce((s, x) => s + (Number(x.cantidad) || 0), 0);
  const totalImporte = lineas.reduce(
    (s, x) => s + (Number(x.cantidad) || 0) * (Number(x.costo) || 0),
    0
  );

  return (
    <div className={styles.container}>
      {/* Sub-barra de comandos D365 */}
      {!soloLectura && !bloqueado && (
        <div className={styles.toolbar}>
          <D365CommandBar ariaLabel="Comandos de líneas de ajuste">
            <div style={{ display: 'flex', gap: '8px' }}>
              <D365CommandButton icon={<Add16Regular />} tone="create" onClick={() => abrir()}>
                Agregar producto
              </D365CommandButton>
              <D365CommandButton
                icon={<Edit16Regular />}
                disabled={seleccionados.size !== 1}
                onClick={() => {
                  const sel = lineas.find(l => seleccionados.has(l.clave));
                  if (sel) abrir(sel);
                }}
              >
                Editar
              </D365CommandButton>
              <D365CommandButton
                icon={<Delete16Regular />}
                tone="danger"
                disabled={seleccionados.size === 0}
                onClick={eliminarSeleccionados}
              >
                Eliminar
              </D365CommandButton>
            </div>
          </D365CommandBar>
        </div>
      )}

      {/* Tabla de líneas */}
      <div style={{ border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusMedium, overflow: 'hidden' }}>
        <DataGrid
          items={lineas}
          columns={columns}
          getRowId={item => item.clave}
          selectionMode={soloLectura || bloqueado ? undefined : 'multiselect'}
          selectedItems={seleccionados}
          onSelectionChange={(_, data) => setSeleccionados(data.selectedItems)}
        >
          <DataGridHeader>
            <DataGridRow>
              {({ renderHeaderCell }) => (
                <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
              )}
            </DataGridRow>
          </DataGridHeader>
          {lineas.length === 0 ? (
            <TableEmptyState />
          ) : (
            <DataGridBody<LineaAjusteForm>>
              {({ item, rowId }) => (
                <DataGridRow<LineaAjusteForm> key={rowId} className={list.dataRow}>
                  {({ renderCell }) => <DataGridCell className={list.dataCell}>{renderCell(item)}</DataGridCell>}
                </DataGridRow>
              )}
            </DataGridBody>
          )}
        </DataGrid>
      </div>

      {/* Resumen de totales */}
      <div className={styles.totalBar}>
        <Text>
          Total Ítems: <strong>{lineas.length}</strong>
        </Text>
        <Text>
          Total Cantidad: <strong>{totalCantidad.toLocaleString('es-PE')}</strong>
        </Text>
        <Text size={400} weight="semibold">
          Valorización Total: {formatoMoneda.format(totalImporte)}
        </Text>
      </div>

      {/* Drawer lateral para agregar/editar línea de ajuste */}
      <OverlayDrawer
        open={abierto}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <Text weight="semibold" size={400}>
                {editando ? 'Editar línea de ajuste' : 'Agregar producto al ajuste'}
              </Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontWeight: 'normal' }}>
                Seleccione el producto, cantidad, costo unitario y motivo.
              </Text>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody className={styles.body} style={{ overflowX: 'hidden' }}>
          {error && <D365MessageBar intent="error" onDismiss={() => setError('')}>{error}</D365MessageBar>}

          {linea && (
            <>
              <D365FormField label="Producto" required htmlFor="ajuste-producto">
                <Combobox
                  id="ajuste-producto"
                  className={styles.control}
                  value={
                    productoSeleccionado
                      ? `${productoSeleccionado.codigo} · ${productoSeleccionado.nombre}`
                      : busqueda
                  }
                  selectedOptions={linea.productoId ? [linea.productoId] : []}
                  disabled={soloLectura || bloqueado}
                  onChange={e => {
                    setError('');
                    setBusqueda(e.target.value);
                    setLinea({ ...linea, productoId: '', series: '' });
                  }}
                  onOptionSelect={(_, d) => {
                    const p = [...resultados, ...productosRegistrados].find(x => x.id === d.optionValue);
                    if (!p) return;
                    alCargarProducto(p);
                    setLinea({
                        ...linea,
                        productoId: p.id,
                        costo: String(p.costoActual ?? p.costoEstandar ?? '0'),
                        series: '',
                    });
                    setBusqueda('');
                  }}
                >
                  {buscando && <Option value="cargando" disabled>Cargando productos…</Option>}
                  {opciones.map(p => (
                    <Option key={p.id} value={p.id} text={`${p.codigo} · ${p.nombre}`}>
                      <div className={styles.opcion}>
                        <Text truncate style={{ fontSize: '13px', fontWeight: tokens.fontWeightRegular }}>
                          {p.nombre}
                        </Text>
                        <Text className={styles.codigo}>
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

              <D365FormField label="Unidad" htmlFor="ajuste-unidad">
                <Input
                  id="ajuste-unidad"
                  className={styles.control}
                  value={productoSeleccionado?.nombreUnidadMedidaDefecto || '---'}
                  readOnly
                  appearance="filled-darker"
                  contentAfter={<LockClosed16Regular title="Campo de solo lectura" aria-label="Solo lectura" />}
                />
              </D365FormField>

              <D365FormField label="Cantidad" required htmlFor="ajuste-cantidad">
                <Input
                  id="ajuste-cantidad"
                  className={styles.control}
                  type="number"
                  min={1}
                  step={productoSeleccionado?.esSerializado ? 1 : 'any'}
                  value={linea.cantidad}
                  onChange={(_, d) => setLinea({ ...linea, cantidad: d.value })}
                />
              </D365FormField>

              <D365FormField label="Costo unitario" required htmlFor="ajuste-costo">
                <Input
                  id="ajuste-costo"
                  className={styles.control}
                  type="number"
                  min={0}
                  step="0.01"
                  value={linea.costo}
                  onChange={(_, d) => setLinea({ ...linea, costo: d.value })}
                />
              </D365FormField>

              <D365FormField label="Importe" htmlFor="ajuste-importe">
                <Input
                  id="ajuste-importe"
                  className={styles.control}
                  value={formatoMoneda.format((Number(linea.cantidad) || 0) * (Number(linea.costo) || 0))}
                  readOnly
                  appearance="filled-darker"
                  contentAfter={<LockClosed16Regular title="Campo de solo lectura" aria-label="Solo lectura" />}
                />
              </D365FormField>

              <D365FormField label="Justificación de línea" htmlFor="ajuste-justif">
                <Input
                  id="ajuste-justif"
                  className={styles.control}
                  value={linea.motivoLinea}
                  onChange={(_, d) => setLinea({ ...linea, motivoLinea: d.value })}
                />
              </D365FormField>

              {productoSeleccionado?.esSerializado && (
                <D365FormField label={`Series (${linea.series.split(/\r?\n/).filter(Boolean).length}/${linea.cantidad})`} required htmlFor="ajuste-series">
                  <Textarea
                    id="ajuste-series"
                    className={styles.control}
                    rows={4}
                    value={linea.series}
                    onChange={(_, d) => setLinea({ ...linea, series: d.value })}
                  />
                </D365FormField>
              )}
            </>
          )}
        </DrawerBody>

        <DrawerFooter className={styles.footer}>
          <Button appearance="secondary" onClick={() => setLinea(null)}>
            Cancelar
          </Button>
          <Button appearance="primary" onClick={confirmar}>
            {editando ? 'Guardar cambios' : 'Guardar línea'}
          </Button>
        </DrawerFooter>
      </OverlayDrawer>
    </div>
  );
}
