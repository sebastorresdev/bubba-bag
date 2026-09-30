import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button, Card, DataGrid, DataGridBody, DataGridCell, DataGridHeader,
  DataGridHeaderCell, DataGridRow, Input, makeStyles, Skeleton, SkeletonItem,
  Tab, TabList, Text, Textarea, Toast, Toaster, ToastTitle, tokens,
  createTableColumn, useId, useToastController,
} from '@fluentui/react-components';
import type { TableColumnDefinition, TableRowId } from '@fluentui/react-components';
import {
  Add16Regular, ArrowClockwise16Regular, ArrowLeft16Regular, Box16Regular,
  Checkmark16Regular, DismissCircle16Regular, Ruler16Regular,
  LockClosed16Regular, Save16Regular, Search16Regular,
} from '@fluentui/react-icons';
import { GrupoUnidadMedidaService, UnidadMedidaService } from '../services/unidadMedida.service';
import type { CreateGrupoUnidadMedidaDto, GrupoUnidadMedidaDto, UnidadMedidaDto } from '../types/unidadMedida.types';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { CrearUnidadDrawer } from '../components/CrearUnidadDrawer';

const usePageStyles = makeStyles({
  tableWrap: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  associatedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalS,
  },
  associatedCommands: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS },
  associatedTitle: { marginBottom: tokens.spacingVerticalS },
  searchBox: { width: '260px' },
  emptyUnits: {
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
});

const emptyGroup: CreateGrupoUnidadMedidaDto = { nombre: '', nombreUnidadBase: '' };

export interface UnidadMedidaFormPageProps {
  id?: string | null;
  onBack?: () => void;
  onSaved?: (savedId: string) => void;
  onCreated?: (createdId: string) => void;
}

export const UnidadMedidaFormPage: React.FC<UnidadMedidaFormPageProps> = ({
  id: propId, onBack, onSaved, onCreated,
}) => {
  const styles = useD365FormStyles();
  const pageStyles = usePageStyles();
  const toasterId = useId('grupos-unidades-notificaciones');
  const { dispatchToast } = useToastController(toasterId);
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id: string }>();
  const initialId = propId !== undefined ? propId : routeId && routeId !== 'nuevo' ? routeId : null;
  const [currentId, setCurrentId] = useState<string | null>(initialId);
  const [selectedTab, setSelectedTab] = useState<'general' | 'unidades'>('general');
  const [group, setGroup] = useState<CreateGrupoUnidadMedidaDto & { observacion?: string | null }>(emptyGroup);
  const [detail, setDetail] = useState<GrupoUnidadMedidaDto | null>(null);
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<TableRowId>>(new Set());
  const [unitSearch, setUnitSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(Boolean(initialId));
  const [saving, setSaving] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async (id: string) => {
    try {
      setLoading(true);
      const data = await GrupoUnidadMedidaService.getGrupoById(id);
      const base = data.unidades.find((unit) => unit.esUnidadBase);
      if (!base) throw new Error('El grupo no tiene una unidad base válida.');
      setDetail(data);
      setGroup({ nombre: data.nombre, nombreUnidadBase: base.nombre, observacion: data.observacion });
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'No se pudo cargar el grupo.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      setCurrentId(initialId);
      void load(initialId);
    } else {
      setCurrentId(null);
      setDetail(null);
      setGroup(emptyGroup);
      setSaveAttempted(false);
      setLoading(false);
    }
  }, [initialId]);

  const validationErrors = useMemo(() => ({
    nombre: group.nombre.trim() ? '' : 'El nombre del grupo es obligatorio.',
    unidad: group.nombreUnidadBase.trim() ? '' : 'La unidad base es obligatoria.',
  }), [group]);
  const errors = saveAttempted ? validationErrors : { nombre: '', unidad: '' };
  const invalid = Boolean(validationErrors.nombre || validationErrors.unidad);
  const baseUnit = detail?.unidades.find((unit) => unit.esUnidadBase);

  const save = async (close = false) => {
    setSaveAttempted(true);
    if (invalid) {
      setMessage({ type: 'error', text: 'Complete los datos obligatorios del grupo y su unidad base.' });
      return;
    }
    try {
      setSaving(true);
      setMessage(null);
      let id = currentId;
      if (id) {
        await GrupoUnidadMedidaService.updateGrupo(id, { nombre: group.nombre, observacion: group.observacion });
      } else {
        const result = await GrupoUnidadMedidaService.createGrupo(group);
        id = result.id;
        setCurrentId(id);
        onCreated?.(id);
        navigate(`/grupos-unidades/${id}`, { replace: true });
      }
      onSaved?.(id);
      setSaveAttempted(false);
      setMessage({ type: 'success', text: 'Grupo de unidades guardado correctamente.' });
      await load(id);
      if (close) navigate('/servicio-campo/unidades-medida');
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  };


  const toggleUnit = async (id: string, active: boolean) => {
    try {
      await UnidadMedidaService.cambiarEstado(id, active);
      if (currentId) await load(currentId);
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'No se pudo cambiar el estado.' });
    }
  };

  const toggleGroup = async () => {
    if (!currentId || !detail) return;
    try {
      setSaving(true);
      await GrupoUnidadMedidaService.cambiarEstadoGrupo(currentId, !detail.estaActivo);
      await load(currentId);
      setMessage({ type: 'success', text: `Grupo ${detail.estaActivo ? 'desactivado' : 'activado'} correctamente.` });
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'No se pudo cambiar el estado del grupo.' });
    } finally {
      setSaving(false);
    }
  };

  const unitColumns: TableColumnDefinition<UnidadMedidaDto>[] = [
    createTableColumn({
      columnId: 'nombre',
      renderHeaderCell: () => 'Nombre',
      renderCell: (unit) => <Text weight="semibold">{unit.nombre}</Text>,
    }),
    createTableColumn({
      columnId: 'base',
      renderHeaderCell: () => 'Unidad de referencia',
      renderCell: (unit) => unit.esUnidadBase
        ? '—'
        : detail?.unidades.find((candidate) => candidate.id === unit.unidadMedidaBaseId)?.nombre || '—',
    }),
    createTableColumn({
      columnId: 'cantidad',
      renderHeaderCell: () => 'Cantidad',
      renderCell: (unit) => unit.cantidad.toFixed(4),
    }),
    createTableColumn({
      columnId: 'total',
      renderHeaderCell: () => 'Equivalencia total',
      renderCell: (unit) => unit.factorConversionTotal.toFixed(4),
    }),
    createTableColumn({
      columnId: 'estado',
      renderHeaderCell: () => 'Estado',
      renderCell: (unit) => <Text>{unit.estaActivo ? 'Activa' : 'Inactiva'}</Text>,
    }),
  ];
  const filteredUnits = (detail?.unidades || []).filter((unit) =>
    unit.nombre.toLocaleLowerCase().includes(unitSearch.trim().toLocaleLowerCase()));
  const selectedUnit = detail?.unidades.find((unit) => selectedUnitIds.has(unit.id));

  return (
    <div className={styles.root}>
      <Toaster toasterId={toasterId} position="top-end" />
      {message && (
        <D365MessageBar intent={message.type} onDismiss={() => setMessage(null)}>{message.text}</D365MessageBar>
      )}

      <D365CommandBar ariaLabel="Comandos del grupo" busy={saving || loading}>
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            onClick={() => onBack ? onBack() : navigate('/servicio-campo/unidades-medida')}
            title="Volver al listado"
            aria-label="Volver"
          />
          <D365CommandDivider />
          <D365CommandButton icon={<Save16Regular />} tone="save" disabled={saving || loading} onClick={() => save(false)}>
            Guardar
          </D365CommandButton>
          <D365CommandButton icon={<Save16Regular />} tone="save" disabled={saving || loading} onClick={() => save(true)}>
            Guardar y cerrar
          </D365CommandButton>
          {currentId && detail && (
            <>
              <D365CommandDivider />
              <D365CommandButton
                icon={detail.estaActivo ? <DismissCircle16Regular /> : <Checkmark16Regular />}
                disabled={saving || loading}
                onClick={() => void toggleGroup()}
              >
                {detail.estaActivo ? 'Desactivar' : 'Activar'}
              </D365CommandButton>
              <D365CommandButton
                icon={<ArrowClockwise16Regular />}
                disabled={saving || loading}
                onClick={() => void load(currentId)}
              >
                Actualizar
              </D365CommandButton>
            </>
          )}
        </div>
      </D365CommandBar>

      <D365EntityHeader
        title={currentId ? detail?.nombre || 'Grupo de unidades' : 'Nuevo'}
        subtitle="Grupo de unidades de medida"
        avatarName={group.nombre || 'Grupo de unidades'}
        avatarInitials="UM"
        subtleAvatar
        loading={loading}
        metadata={[
          {
            label: 'Estado',
            value: detail?.estaActivo === false ? 'Inactivo' : 'Activo',
          },
          { label: 'Unidad base', value: baseUnit?.nombre || 'Sin definir' },
          { label: 'Unidades', value: detail?.unidades.length ?? '—' },
        ]}
        tabs={(
          <TabList selectedValue={selectedTab} onTabSelect={(_, data) => setSelectedTab(data.value as 'general' | 'unidades')}>
            <Tab value="general" icon={<Box16Regular />}>General</Tab>
            <Tab value="unidades" icon={<Ruler16Regular />}>Unidades</Tab>
          </TabList>
        )}
      />

      {loading ? (
        <div className={styles.contentBody}>
          <Card className={styles.card}>
            <Skeleton animation="pulse">
              <SkeletonItem size={16} className={styles.skeletonHeader} />
              <div className={styles.fieldColumnFlex}>
                <SkeletonItem size={32} className={styles.skeletonFull} />
                <SkeletonItem size={32} className={styles.skeletonFull} />
              </div>
            </Skeleton>
          </Card>
        </div>
      ) : selectedTab === 'general' ? (
        <div className={styles.contentBody}>
          <Card className={styles.card}>
              <Text className={styles.cardSectionTitle}>Información general</Text>
              <D365FormField label="Nombre del grupo" required htmlFor="grupo-nombre" error={errors.nombre}>
                <Input
                  id="grupo-nombre"
                  className={styles.d365ControlFull}
                  value={group.nombre}
                  placeholder="---"
                  onChange={(_, data) => setGroup({ ...group, nombre: data.value })}
                />
              </D365FormField>
              <D365FormField
                label="Unidad base"
                required
                htmlFor="unidad-base"
                error={errors.unidad}
              >
                <Input
                  id="unidad-base"
                  className={styles.d365ControlFull}
                  value={group.nombreUnidadBase}
                  placeholder="---"
                  appearance={currentId ? 'filled-darker' : 'outline'}
                  readOnly={Boolean(currentId)}
                  contentAfter={currentId ? (
                    <LockClosed16Regular
                      title="Campo de solo lectura"
                      aria-label="Campo de solo lectura"
                    />
                  ) : undefined}
                  onChange={(_, data) => setGroup({ ...group, nombreUnidadBase: data.value })}
                />
              </D365FormField>
              <D365FormField label="Observación" htmlFor="grupo-observacion" align="top">
                <Textarea
                  id="grupo-observacion"
                  className={styles.d365ControlFull}
                  rows={4}
                  value={group.observacion || ''}
                  onChange={(_, data) => setGroup({ ...group, observacion: data.value })}
                />
              </D365FormField>
          </Card>
        </div>
      ) : (
        <div className={styles.contentBody}>
          {!currentId ? (
            <Card className={styles.card}>
              <div className={pageStyles.emptyUnits}>
                <Text weight="semibold" block>Primero guarde el grupo y su unidad base.</Text>
                <Text block>Después podrá agregar las demás unidades y definir su cantidad respecto a la unidad base.</Text>
              </div>
            </Card>
          ) : (
            <Card className={styles.card}>
                <div className={pageStyles.associatedHeader}>
                  <div className={pageStyles.associatedCommands}>
                    <Button
                      size="medium"
                      appearance="subtle"
                      icon={<Add16Regular />}
                      onClick={() => setDrawerOpen(true)}
                    >
                      Nueva unidad
                    </Button>
                    <Button size="medium" appearance="subtle" icon={<ArrowClockwise16Regular />} onClick={() => void load(currentId)}>
                      Actualizar
                    </Button>
                    {selectedUnit && !selectedUnit.esUnidadBase && (
                      <Button
                        size="medium"
                        appearance="subtle"
                        onClick={() => void toggleUnit(selectedUnit.id, !selectedUnit.estaActivo)}
                      >
                        {selectedUnit.estaActivo ? 'Desactivar' : 'Activar'}
                      </Button>
                    )}
                  </div>
                  <Input
                    size="medium"
                    className={pageStyles.searchBox}
                    contentBefore={<Search16Regular />}
                    placeholder="---"
                    value={unitSearch}
                    onChange={(_, data) => setUnitSearch(data.value)}
                  />
                </div>
                <Text size={400} weight="semibold" className={pageStyles.associatedTitle}>
                  Unidades asociadas del grupo
                </Text>
                <div className={pageStyles.tableWrap}>
                  <DataGrid
                    items={filteredUnits}
                    columns={unitColumns}
                    selectionMode="multiselect"
                    selectedItems={selectedUnitIds}
                    onSelectionChange={(_, data) => setSelectedUnitIds(data.selectedItems)}
                    getRowId={(unit) => unit.id}
                    focusMode="composite"
                    size="medium"
                  >
                    <DataGridHeader>
                      <DataGridRow>{({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}</DataGridRow>
                    </DataGridHeader>
                    <DataGridBody<UnidadMedidaDto>>
                      {({ item, rowId }) => (
                        <DataGridRow<UnidadMedidaDto> key={rowId}>
                          {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                        </DataGridRow>
                      )}
                    </DataGridBody>
                  </DataGrid>
                </div>
              </Card>
          )}
        </div>
      )}

      {currentId && baseUnit && (
        <CrearUnidadDrawer
          abierto={drawerOpen}
          grupoId={currentId}
          nombreGrupo={detail?.nombre || ''}
          nombreUnidadRaiz={baseUnit.nombre}
          alCerrar={() => setDrawerOpen(false)}
          alGuardar={async () => {
            await load(currentId);
            dispatchToast(
              <Toast><ToastTitle>Unidad agregada</ToastTitle></Toast>,
              { intent: 'success' },
            );
          }}
        />
      )}
    </div>
  );
};

export default UnidadMedidaFormPage;
