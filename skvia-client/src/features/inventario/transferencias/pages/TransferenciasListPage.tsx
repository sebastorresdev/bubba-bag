import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  Input,
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
} from '@fluentui/react-components';
import type { SelectionItemId, TableColumnDefinition } from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  Checkmark16Regular,
  ChevronDown16Regular,
  DataFunnel20Regular,
  Eye16Regular,
  Search16Regular,
  TableEdit16Regular,
  ArrowDownload16Regular,
  Print16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365ListState } from '../../../../components/common/D365ListState';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { TableEmptyState } from '../../../../components/common/TableEmptyState';
import { WhatsAppIcon } from '../../../../components/common/WhatsAppIcon';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
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
  const [mensaje, setMensaje] = useState<string | null>(null);

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
    setMensaje(texto);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

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
          let color: 'informative' | 'warning' | 'important' | 'success' | 'danger' = 'informative';
          let label = est;

          if (est === 'EnTransito') {
            color = 'warning';
            label = 'En Tránsito';
          } else if (est === 'ParcialmenteRecibida') {
            color = 'important';
            label = 'Parcialmente Recibida';
          } else if (est === 'Cerrada') {
            color = 'success';
            label = 'Cerrada';
          } else if (est === 'Cancelada') {
            color = 'danger';
            label = 'Cancelada';
          }

          return (
            <TableCellLayout>
              <Badge appearance="tint" shape="rounded" color={color} size="small">
                {label}
              </Badge>
            </TableCellLayout>
          );
        },
      }),
      createTableColumn({
        columnId: 'items',
        renderHeaderCell: () => 'Materiales transferidos',
        renderCell: (x: TransferenciaInventarioDto) => (
          <TableCellLayout truncate>
            <span>{x.resumenProductos || x.producto || '—'}</span>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'cantidad',
        compare: (a: TransferenciaInventarioDto, b: TransferenciaInventarioDto) =>
          (a.totalCantidad ?? a.cantidad ?? 0) - (b.totalCantidad ?? b.cantidad ?? 0),
        renderHeaderCell: () => 'Total Unidades',
        renderCell: (x: TransferenciaInventarioDto) => (
          <TableCellLayout>
            <Text weight="bold">{(x.totalCantidad ?? x.cantidad ?? 0).toLocaleString('es-PE')}</Text>
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

  return (
    <div className={styles.root}>
      {mensaje && (
        <D365MessageBar intent="success" onDismiss={() => setMensaje(null)}>
          {mensaje}
        </D365MessageBar>
      )}

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
          {seleccionados.size === 1 && (
            <>
              <D365CommandButton
                icon={<Eye16Regular />}
                onClick={() => {
                  const idSel = Array.from(seleccionados)[0] as string;
                  const itemSel = datos.find((d) => d.id === idSel);
                  if (itemSel) {
                    navigate(getRutaDetalle(itemSel));
                  } else {
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
              <D365CommandButton
                icon={<ArrowDownload16Regular />}
                onClick={() => {
                  const idSel = Array.from(seleccionados)[0] as string;
                  const itemSel = datos.find((d) => d.id === idSel);
                  void TransferenciaService.descargarCargoPdf(idSel, itemSel?.numero);
                }}
              >
                Cargo PDF
              </D365CommandButton>
              <D365CommandButton
                icon={<Print16Regular />}
                onClick={() => {
                  const idSel = Array.from(seleccionados)[0] as string;
                  void TransferenciaService.abrirCargoPdf(idSel);
                }}
              >
                Imprimir
              </D365CommandButton>
              <D365CommandButton
                icon={<WhatsAppIcon size={16} />}
                onClick={() => {
                  const idSel = Array.from(seleccionados)[0] as string;
                  const itemSel = datos.find((d) => d.id === idSel);
                  void TransferenciaService.compartirCargoWhatsapp(idSel, itemSel?.numero, {
                    tipoOperacion: itemSel?.tipoOperacion || 'Cargo Oficial',
                    destinatario: itemSel?.almacenDestino,
                  });
                }}
              >
                WhatsApp
              </D365CommandButton>
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
          <Tooltip content="Modificar orden y visibilidad de columnas" relationship="label">
            <Button
              appearance="subtle"
              size="medium"
              icon={<TableEdit16Regular className={styles.iconBrand} />}
            >
              Editar columnas
            </Button>
          </Tooltip>
          <Tooltip content="Editar filtros de la consulta" relationship="label">
            <Button
              appearance="subtle"
              size="medium"
              icon={<DataFunnel20Regular className={styles.iconBrand} />}
            >
              Editar filtros
            </Button>
          </Tooltip>
          <Input
            className={styles.searchBox}
            size="medium"
            contentBefore={<Search16Regular />}
            placeholder="Buscar" aria-label="Buscar por número, almacén, producto"
            value={buscar}
            onChange={(_, d) => setBuscar(d.value)}
          />
        </div>
      </div>

      <div className={styles.gridContainer}>
        <D365ListState
          loading={loading}
          error={error}
          onRetry={() => void cargar()}
          loadingLabel="Cargando transferencias..."
        >
          <DataGrid
            items={filtrados}
            columns={columns}
            sortable
            selectionMode="multiselect"
            selectedItems={seleccionados}
            onSelectionChange={(_, data) => setSeleccionados(data.selectedItems)}
            getRowId={(item) => item.id}
            focusMode="composite"
            size="medium"
            className={styles.table}
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
              </DataGridRow>
            </DataGridHeader>
            {filtrados.length === 0 ? (
              <TableEmptyState />
            ) : (
              <DataGridBody<TransferenciaInventarioDto>>
                {({ item, rowId }) => (
                  <DataGridRow<TransferenciaInventarioDto> key={rowId} className={styles.dataRow}>
                    {({ renderCell }) => (
                      <DataGridCell className={styles.dataCell}>{renderCell(item)}</DataGridCell>
                    )}
                  </DataGridRow>
                )}
              </DataGridBody>
            )}
          </DataGrid>
        </D365ListState>
      </div>

      <footer className={styles.footer}>
        <div>
          1-{filtrados.length} de {filtrados.length} ({seleccionados.size} seleccionados)
        </div>
        <div>Página 1</div>
      </footer>
    </div>
  );
}
