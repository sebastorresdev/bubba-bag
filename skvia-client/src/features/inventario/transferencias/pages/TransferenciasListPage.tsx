import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Link,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  TableCellLayout,
  Text,
  Tooltip,
  createTableColumn,
  tokens,
  Toast,
  Toaster,
  ToastTitle,
  useId,
  useToastController,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
} from '@fluentui/react-components';
import type { SelectionItemId, TableColumnDefinition } from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  Checkmark16Regular,
  ChevronDown16Regular,
  Eye16Regular,
  ArrowDownload16Regular,
  Print16Regular,
  Delete16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365EntityTable, D365TableToolbarTools, type D365EntityTableRef } from '../../../../components/common/D365EntityTable';
import { WhatsAppIcon } from '../../../../components/common/WhatsAppIcon';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { DetalleMaterialesTransferenciaDrawer } from '../components/DetalleMaterialesTransferenciaDrawer';
import { TransferenciaService } from '../services/transferencia.service';
import type { TransferenciaInventarioDto } from '../types/transferencia.types';

type Vista = 'recientes' | 'todas' | 'en_transito';

interface TransferenciasListPageProps {
  tipoFiltro?: 'Despacho' | 'Devolucion' | 'Traslado';
}

export function TransferenciasListPage({ tipoFiltro }: TransferenciasListPageProps) {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const [datos, setDatos] = useState<TransferenciaInventarioDto[]>([]);
  const [buscar, setBuscar] = useState('');
  const [vista, setVista] = useState<Vista>('recientes');
  const [seleccionados, setSeleccionados] = useState<Set<SelectionItemId>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerTransferencia, setDrawerTransferencia] = useState<TransferenciaInventarioDto | null>(null);
  const [transferenciasAEliminar, setTransferenciasAEliminar] = useState<TransferenciaInventarioDto[] | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const tableRef = useRef<D365EntityTableRef>(null);
  const toasterId = useId('transferencias-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const notifySuccess = useCallback((title: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
      </Toast>,
      { intent: 'success', position: 'top-end' }
    );
  }, [dispatchToast]);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setDatos(await TransferenciaService.obtener());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las transferencias.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    const texto = (location.state as { successMessage?: string } | null)?.successMessage;
    if (!texto) return;
    notifySuccess(texto);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, notifySuccess]);

  const filtrados = useMemo(() => {
    const limite = new Date();
    limite.setDate(limite.getDate() - 30);
    const q = buscar.trim().toLowerCase();

    return datos.filter((item) => {
      // Si tipoFiltro está definido, filtrar por tipo de operación
      if (tipoFiltro) {
        const itemTipo = item.tipoOperacion || (
          (item.tipoAlmacenOrigen === 1 && item.tipoAlmacenDestino === 2)
            ? 'Despacho'
            : (item.tipoAlmacenOrigen === 2 && item.tipoAlmacenDestino === 1)
              ? 'Devolucion'
              : 'Traslado'
        );
        if (itemTipo !== tipoFiltro) return false;
      }

      if (vista === 'recientes' && new Date(item.fecha) < limite) return false;
      if (vista === 'en_transito' && item.estado !== 'EnTransito' && item.estado !== 'ParcialmenteRecibida') {
        return false;
      }
      return (
        !q ||
        [
          item.numero,
          item.producto,
          item.resumenProductos ?? '',
          item.almacenOrigen,
          item.almacenDestino,
          item.modalidad ?? '',
          item.estado ?? '',
        ].some((valor) => valor.toLowerCase().includes(q))
      );
    });
  }, [buscar, datos, tipoFiltro, vista]);

  const getRutaDetalle = useCallback(
    (item: TransferenciaInventarioDto) => {
      // 1. Si la lista actual tiene un contexto/filtro explícito, ese contexto manda
      if (tipoFiltro === 'Despacho') return `/servicio-campo/despacho-tecnicos/${item.id}`;
      if (tipoFiltro === 'Devolucion') return `/servicio-campo/devolucion-tecnicos/${item.id}`;
      if (tipoFiltro === 'Traslado') return `/servicio-campo/transferencias/${item.id}`;

      // 2. Si es una vista global sin filtro explícito, deducir por tipo de operación y almacenes
      const esDespacho =
        item.tipoOperacion === 'Despacho' ||
        (item.tipoAlmacenOrigen === 1 && item.tipoAlmacenDestino === 2);
      if (esDespacho) return `/servicio-campo/despacho-tecnicos/${item.id}`;

      const esDevolucion =
        item.tipoOperacion === 'Devolucion' ||
        (item.tipoAlmacenOrigen === 2 && item.tipoAlmacenDestino === 1);
      if (esDevolucion) return `/servicio-campo/devolucion-tecnicos/${item.id}`;

      return `/servicio-campo/transferencias/${item.id}`;
    },
    [tipoFiltro]
  );

  const columns: TableColumnDefinition<TransferenciaInventarioDto>[] = useMemo(
    () => [
      createTableColumn({
        columnId: 'numero',
        compare: (a: TransferenciaInventarioDto, b: TransferenciaInventarioDto) =>
          a.numero.localeCompare(b.numero),
        renderHeaderCell: () => 'Número',
        renderCell: (x: TransferenciaInventarioDto) => (
          <TableCellLayout truncate>
            <Link
              as="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(getRutaDetalle(x));
              }}
            >
              {x.numero}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'guiaRemision',
        compare: (a: TransferenciaInventarioDto, b: TransferenciaInventarioDto) =>
          (a.numeroGuiaRemision ?? '').localeCompare(b.numeroGuiaRemision ?? ''),
        renderHeaderCell: () => 'Guía de Remisión',
        renderCell: (x: TransferenciaInventarioDto) => (
          <TableCellLayout truncate>
            {x.numeroGuiaRemision ? (
              <span>{x.numeroGuiaRemision}</span>
            ) : (
              <Text style={{ color: tokens.colorNeutralForeground4 }}>—</Text>
            )}
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'fecha',
        compare: (a: TransferenciaInventarioDto, b: TransferenciaInventarioDto) =>
          new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
        renderHeaderCell: () => 'Fecha',
        renderCell: (x: TransferenciaInventarioDto) => (
          <TableCellLayout>{new Date(x.fecha).toLocaleString('es-PE')}</TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'origen',
        compare: (a: TransferenciaInventarioDto, b: TransferenciaInventarioDto) =>
          a.almacenOrigen.localeCompare(b.almacenOrigen),
        renderHeaderCell: () => 'Origen',
        renderCell: (x: TransferenciaInventarioDto) => (
          <TableCellLayout>{x.almacenOrigen}</TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'destino',
        compare: (a: TransferenciaInventarioDto, b: TransferenciaInventarioDto) =>
          a.almacenDestino.localeCompare(b.almacenDestino),
        renderHeaderCell: () => 'Destino',
        renderCell: (x: TransferenciaInventarioDto) => (
          <TableCellLayout>{x.almacenDestino}</TableCellLayout>
        ),
      }),

      createTableColumn({
        columnId: 'estado',
        compare: (a: TransferenciaInventarioDto, b: TransferenciaInventarioDto) =>
          (a.estado ?? '').localeCompare(b.estado ?? ''),
        renderHeaderCell: () => 'Estado',
        renderCell: (x: TransferenciaInventarioDto) => {
          const est = x.estado ?? 'Cerrada';
          let label = est;

          if (est === 'EnTransito') {
            label = 'En Tránsito';
          } else if (est === 'ParcialmenteRecibida') {
            label = 'Parcialmente Recibida';
          } else if (est === 'Cerrada') {
            label = 'Cerrada';
          } else if (est === 'Cancelada') {
            label = 'Cancelada';
          }

          return (
            <TableCellLayout truncate>
              <Text>{label}</Text>
            </TableCellLayout>
          );
        },
      }),
      createTableColumn({
        columnId: 'items',
        renderHeaderCell: () => 'Materiales transferidos',
        renderCell: (x: TransferenciaInventarioDto) => {
          const cantidadTotal = x.totalCantidad ?? x.cantidad ?? 0;
          const tieneItems =
            (x.totalLineas !== undefined && x.totalLineas > 0) ||
            (x.resumenProductos && x.resumenProductos !== 'Sin items' && x.resumenProductos !== '—') ||
            cantidadTotal > 0;

          if (!tieneItems) {
            return (
              <TableCellLayout truncate>
                <Text style={{ color: tokens.colorNeutralForeground4 }}>Sin ítems</Text>
              </TableCellLayout>
            );
          }

          const etiquetaTexto = x.totalLineas
            ? `${x.totalLineas} ${x.totalLineas === 1 ? 'material' : 'materiales'}`
            : (x.resumenProductos && x.resumenProductos !== 'Sin items' ? x.resumenProductos : 'Ver materiales');

          return (
            <TableCellLayout truncate>
              <Link
                as="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDrawerTransferencia(x);
                }}
                title="Ver materiales y números de serie en el panel lateral"
              >
                {etiquetaTexto}
              </Link>
            </TableCellLayout>
          );
        },
      }),
      createTableColumn({
        columnId: 'cantidad',
        compare: (a: TransferenciaInventarioDto, b: TransferenciaInventarioDto) =>
          (a.totalCantidad ?? a.cantidad ?? 0) - (b.totalCantidad ?? b.cantidad ?? 0),
        renderHeaderCell: () => 'Total Unidades',
        renderCell: (x: TransferenciaInventarioDto) => (
          <TableCellLayout truncate>
            <Text>{(x.totalCantidad ?? x.cantidad ?? 0).toLocaleString('es-PE')}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'acciones',
        renderHeaderCell: () => 'Cargo Oficial',
        renderCell: (x: TransferenciaInventarioDto) => (
          <TableCellLayout>
            <div style={{ display: 'flex', gap: '4px' }}>
              <Tooltip content="Descargar Cargo PDF" relationship="label">
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<ArrowDownload16Regular />}
                  onClick={(e) => {
                    e.stopPropagation();
                    void TransferenciaService.descargarCargoPdf(x.id, x.numero);
                  }}
                />
              </Tooltip>
              <Tooltip content="Abrir / Imprimir Cargo" relationship="label">
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<Print16Regular />}
                  onClick={(e) => {
                    e.stopPropagation();
                    void TransferenciaService.abrirCargoPdf(x.id);
                  }}
                />
              </Tooltip>
              <Tooltip content="Compartir por WhatsApp" relationship="label">
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<WhatsAppIcon size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    void TransferenciaService.compartirCargoWhatsapp(x.id, x.numero, {
                      tipoOperacion: x.tipoOperacion || 'Cargo Oficial',
                      destinatario: x.almacenDestino,
                    });
                  }}
                />
              </Tooltip>
            </div>
          </TableCellLayout>
        ),
      }),
    ],
    [navigate, getRutaDetalle]
  );

  const tituloVista = useMemo(() => {
    const prefijo = tipoFiltro === 'Despacho' ? 'Despachos' : tipoFiltro === 'Devolucion' ? 'Devoluciones' : 'Transferencias';
    switch (vista) {
      case 'recientes':
        return `${prefijo} recientes`;
      case 'en_transito':
        return 'Pendientes en tránsito';
      case 'todas':
        return `${prefijo} (Todas)`;
    }
  }, [tipoFiltro, vista]);

  const itemsSeleccionados = useMemo(() => {
    return datos.filter((d) => seleccionados.has(d.id));
  }, [datos, seleccionados]);

  const borradoresSeleccionados = useMemo(() => {
    return itemsSeleccionados.filter((d) => d.estado === 'Borrador');
  }, [itemsSeleccionados]);

  return (
    <div className={styles.root}>
      <Toaster toasterId={toasterId} position="top-end" />

      <D365CommandBar ariaLabel="Comandos de transferencias">
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            onClick={() => {
              if (tipoFiltro === 'Despacho') {
                navigate('/servicio-campo/despacho-tecnicos/nuevo');
              } else if (tipoFiltro === 'Devolucion') {
                navigate('/servicio-campo/devolucion-tecnicos/nuevo');
              } else {
                navigate('/servicio-campo/transferencias/nuevo');
              }
            }}
          >
            Nuevo
          </D365CommandButton>
          <D365CommandDivider />
          {seleccionados.size === 1 && (() => {
            const itemSel = itemsSeleccionados[0] ?? datos.find((d) => seleccionados.has(d.id));
            const esBorrador = itemSel?.estado === 'Borrador';
            const idSel = itemSel?.id;
            return (
              <>
                <D365CommandButton
                  icon={<Eye16Regular />}
                  onClick={() => {
                    if (itemSel) {
                      navigate(getRutaDetalle(itemSel));
                    } else if (idSel) {
                      const fallbackRuta =
                        tipoFiltro === 'Despacho'
                          ? `/servicio-campo/despacho-tecnicos/${idSel}`
                          : tipoFiltro === 'Devolucion'
                          ? `/servicio-campo/devolucion-tecnicos/${idSel}`
                          : `/servicio-campo/transferencias/${idSel}`;
                      navigate(fallbackRuta);
                    }
                  }}
                >
                  Ver detalle
                </D365CommandButton>
                {esBorrador && (
                  <D365CommandButton
                    icon={<Delete16Regular />}
                    tone="danger"
                    onClick={() => itemSel && setTransferenciasAEliminar([itemSel])}
                  >
                    Eliminar
                  </D365CommandButton>
                )}
                <D365CommandButton
                  icon={<ArrowDownload16Regular />}
                  onClick={() => {
                    if (idSel) void TransferenciaService.descargarCargoPdf(idSel, itemSel?.numero);
                  }}
                >
                  Cargo PDF
                </D365CommandButton>
                <D365CommandButton
                  icon={<Print16Regular />}
                  onClick={() => {
                    if (idSel) void TransferenciaService.abrirCargoPdf(idSel);
                  }}
                >
                  Imprimir
                </D365CommandButton>
                <D365CommandButton
                  icon={<WhatsAppIcon size={16} />}
                  onClick={() => {
                    if (idSel) {
                      void TransferenciaService.compartirCargoWhatsapp(idSel, itemSel?.numero, {
                        tipoOperacion: itemSel?.tipoOperacion || 'Cargo Oficial',
                        destinatario: itemSel?.almacenDestino,
                      });
                    }
                  }}
                >
                  WhatsApp
                </D365CommandButton>
                <D365CommandDivider />
              </>
            );
          })()}
          {seleccionados.size > 1 && (
            <>
              {borradoresSeleccionados.length > 0 && (
                <D365CommandButton
                  icon={<Delete16Regular />}
                  tone="danger"
                  onClick={() => setTransferenciasAEliminar(borradoresSeleccionados)}
                >
                  Eliminar ({borradoresSeleccionados.length})
                </D365CommandButton>
              )}
              <D365CommandDivider />
            </>
          )}
          <D365CommandButton icon={<ArrowClockwise16Regular />} onClick={() => void cargar()}>
            Actualizar
          </D365CommandButton>
        </div>
      </D365CommandBar>

      <div className={styles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={styles.viewSelectorTab} title="Seleccionar vista">
              <Text weight="semibold" size={400}>
                {tituloVista}
              </Text>
              <ChevronDown16Regular />
            </div>
          </MenuTrigger>
          <MenuPopover>
            <MenuList className={styles.viewMenuPopover}>
              <MenuItem
                icon={vista === 'recientes' ? <Checkmark16Regular /> : undefined}
                onClick={() => setVista('recientes')}
              >
                Transferencias recientes
              </MenuItem>
              <MenuItem
                icon={vista === 'en_transito' ? <Checkmark16Regular /> : undefined}
                onClick={() => setVista('en_transito')}
              >
                Pendientes en tránsito
              </MenuItem>
              <MenuItem
                icon={vista === 'todas' ? <Checkmark16Regular /> : undefined}
                onClick={() => setVista('todas')}
              >
                Todas las transferencias
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>

        <div className={styles.viewToolsRight}>
          <D365TableToolbarTools
            tableRef={tableRef}
            searchValue={buscar}
            onSearchChange={setBuscar}
            searchPlaceholder="Buscar por número, almacén, producto"
          />
        </div>
      </div>

      <D365EntityTable
        ref={tableRef}
        entityName={tipoFiltro ? `${tipoFiltro}s` : 'Transferencias'}
        tableId="transferencias"
        items={filtrados}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={() => void cargar()}
        selectionMode="multiselect"
        selectedItems={seleccionados}
        onSelectionChange={(_, data) => setSeleccionados(data.selectedItems)}
        onRowDoubleClick={(item) => navigate(getRutaDetalle(item))}
      />

      <footer className={styles.footer}>
        <div>
          1-{filtrados.length} de {filtrados.length} ({seleccionados.size} seleccionados)
        </div>
        <div>Página 1</div>
      </footer>

      <DetalleMaterialesTransferenciaDrawer
        open={Boolean(drawerTransferencia)}
        transferencia={drawerTransferencia}
        onClose={() => setDrawerTransferencia(null)}
        onVerFichaCompleta={(id) => {
          if (drawerTransferencia) {
            navigate(getRutaDetalle(drawerTransferencia));
          } else {
            navigate(`/servicio-campo/transferencias/${id}`);
          }
          setDrawerTransferencia(null);
        }}
      />

      <Dialog
        open={Boolean(transferenciasAEliminar && transferenciasAEliminar.length > 0)}
        onOpenChange={(_, data) => {
          if (!data.open && !eliminando) setTransferenciasAEliminar(null);
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              {transferenciasAEliminar?.length === 1
                ? 'Eliminar borrador'
                : `Eliminar ${transferenciasAEliminar?.length} borradores`}
            </DialogTitle>
            <DialogContent>
              {transferenciasAEliminar?.length === 1 ? (
                <>
                  ¿Está seguro de que desea eliminar el borrador{' '}
                  <strong>{transferenciasAEliminar[0]?.numero}</strong>? Esta acción no se puede deshacer.
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    ¿Está seguro de que desea eliminar los{' '}
                    <strong>{transferenciasAEliminar?.length}</strong> borradores seleccionados? Esta acción no se puede deshacer.
                  </div>
                  <div
                    style={{
                      maxHeight: '120px',
                      overflowY: 'auto',
                      backgroundColor: tokens.colorNeutralBackground2,
                      padding: '8px 12px',
                      borderRadius: tokens.borderRadiusMedium,
                      fontSize: '12px',
                    }}
                  >
                    {transferenciasAEliminar?.map((t) => t.numero).join(', ')}
                  </div>
                  {itemsSeleccionados.length > (transferenciasAEliminar?.length ?? 0) && (
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      ℹ️ Nota: {itemsSeleccionados.length - (transferenciasAEliminar?.length ?? 0)} registro(s) seleccionados
                      no se encuentran en estado Borrador y se mantendrán intactos.
                    </Text>
                  )}
                </div>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                disabled={eliminando}
                onClick={() => setTransferenciasAEliminar(null)}
              >
                Cancelar
              </Button>
              <Button
                appearance="primary"
                style={{ backgroundColor: tokens.colorPaletteRedBackground3, color: '#fff' }}
                disabled={eliminando}
                onClick={async () => {
                  if (!transferenciasAEliminar || transferenciasAEliminar.length === 0) return;
                  try {
                    setEliminando(true);
                    let exitosos = 0;
                    const errores: string[] = [];
                    for (const t of transferenciasAEliminar) {
                      try {
                        await TransferenciaService.eliminar(t.id);
                        exitosos++;
                      } catch (err) {
                        errores.push(`${t.numero}: ${err instanceof Error ? err.message : 'Error al eliminar'}`);
                      }
                    }

                    if (exitosos > 0) {
                      notifySuccess(
                        exitosos === 1
                          ? `Borrador ${transferenciasAEliminar[0].numero} eliminado exitosamente.`
                          : `Se eliminaron ${exitosos} borradores exitosamente.`
                      );
                    }

                    if (errores.length > 0) {
                      dispatchToast(
                        <Toast>
                          <ToastTitle>{`No se pudieron eliminar ${errores.length} registros: ${errores.join('; ')}`}</ToastTitle>
                        </Toast>,
                        { intent: 'error', position: 'top-end' }
                      );
                    }

                    setTransferenciasAEliminar(null);
                    setSeleccionados(new Set());
                    await cargar();
                  } catch (e) {
                    dispatchToast(
                      <Toast>
                        <ToastTitle>{e instanceof Error ? e.message : 'Error al eliminar'}</ToastTitle>
                      </Toast>,
                      { intent: 'error', position: 'top-end' }
                    );
                  } finally {
                    setEliminando(false);
                  }
                }}
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
