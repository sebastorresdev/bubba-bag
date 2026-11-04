import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuDivider,
  MenuGroup,
  MenuGroupHeader,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Input,
  Textarea,
  Checkbox,
  Text,
  Badge,
  Spinner,
  tokens,
} from '@fluentui/react-components';
import {
  ChevronDown16Regular,
  Checkmark16Regular,
  Save16Regular,
  Add16Regular,
  Delete16Regular,
  Star16Filled,
  Star16Regular,
} from '@fluentui/react-icons';
import { useD365ListStyles } from '../../styles/d365ListStyles';
import {
  VistasUsuarioService,
  type VistaUsuarioDto,
  type ConfiguracionVistaGrid,
} from '../../features/seguridad/services/vistasUsuario.service';
import type { D365EntityTableRef } from './D365EntityTable';

export interface VistaSistemaOpcion {
  key: string;
  label: string;
}

export interface D365ViewSelectorProps {
  entityName: string; // ej: "ordenes", "trabajos", "solicitudes", "clientes"
  vistasSistema: VistaSistemaOpcion[];
  activeViewKey: string;
  onSelectSystemView: (key: string) => void;
  tableRef?: React.RefObject<D365EntityTableRef | null>;
  onApplyPersonalView?: (vista: VistaUsuarioDto, config: ConfiguracionVistaGrid) => void;
  onRefreshData?: () => void;
}

export const D365ViewSelector: React.FC<D365ViewSelectorProps> = ({
  entityName,
  vistasSistema,
  activeViewKey,
  onSelectSystemView,
  onApplyPersonalView,
  onRefreshData,
}) => {
  const styles = useD365ListStyles();
  const [personalViews, setPersonalViews] = useState<VistaUsuarioDto[]>([]);
  const [loadingVistas, setLoadingVistas] = useState(false);
  const [activePersonalViewId, setActivePersonalViewId] = useState<string | null>(null);

  // Modales
  const [modalGuardarOpen, setModalGuardarOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [vistaAEditar, setVistaAEditar] = useState<VistaUsuarioDto | null>(null);

  // Form states
  const [nombreVista, setNombreVista] = useState('');
  const [descripcionVista, setDescripcionVista] = useState('');
  const [marcarPredeterminada, setMarcarPredeterminada] = useState(false);
  const [savingVista, setSavingVista] = useState(false);

  // Cargar vistas personales del usuario
  const cargarVistasPersonales = useCallback(async () => {
    try {
      setLoadingVistas(true);
      const data = await VistasUsuarioService.obtenerVistas(entityName);
      setPersonalViews(data);
    } catch (err) {
      console.error('Error al cargar vistas del usuario:', err);
    } finally {
      setLoadingVistas(false);
    }
  }, [entityName]);

  useEffect(() => {
    void cargarVistasPersonales();
  }, [cargarVistasPersonales]);

  // Nombre de la vista actual activa
  const activeLabel = useMemo(() => {
    if (activePersonalViewId) {
      const p = personalViews.find((v) => v.id === activePersonalViewId);
      if (p) return p.nombre;
    }
    const s = vistasSistema.find((v) => v.key === activeViewKey);
    return s ? s.label : 'Vistas';
  }, [activePersonalViewId, activeViewKey, personalViews, vistasSistema]);

  // Capturar estado actual de la grilla (columnas, anchos, filtros)
  const capturarConfiguracionActual = (): ConfiguracionVistaGrid => {
    const storageId = entityName.toLowerCase().replace(/\s+/g, '_');
    let columnas: any = undefined;
    let anchos: any = undefined;
    let filtros: any = undefined;

    try {
      const savedCols = localStorage.getItem(`d365_grid_cols_${storageId}`);
      if (savedCols) columnas = JSON.parse(savedCols);
    } catch {}

    try {
      const savedWidths = localStorage.getItem(`d365_grid_widths_${storageId}`);
      if (savedWidths) anchos = JSON.parse(savedWidths);
    } catch {}

    try {
      const savedFilters = localStorage.getItem(`d365_grid_filters_${storageId}`);
      if (savedFilters) filtros = JSON.parse(savedFilters);
    } catch {}

    return {
      columnas,
      anchos,
      filtros,
      vistaSistemaBase: activeViewKey,
    };
  };

  // Aplicar una vista personal
  const handleSelectPersonalView = (vista: VistaUsuarioDto) => {
    setActivePersonalViewId(vista.id);
    try {
      const config: ConfiguracionVistaGrid = JSON.parse(vista.configuracionJson || '{}');
      const storageId = entityName.toLowerCase().replace(/\s+/g, '_');

      if (config.columnas) {
        localStorage.setItem(`d365_grid_cols_${storageId}`, JSON.stringify(config.columnas));
      }
      if (config.anchos) {
        localStorage.setItem(`d365_grid_widths_${storageId}`, JSON.stringify(config.anchos));
      }
      if (config.filtros) {
        localStorage.setItem(`d365_grid_filters_${storageId}`, JSON.stringify(config.filtros));
      }

      // Si tiene una vista base de backend asociada, activarla
      if (config.vistaSistemaBase) {
        onSelectSystemView(config.vistaSistemaBase);
      }

      if (onApplyPersonalView) {
        onApplyPersonalView(vista, config);
      } else if (onRefreshData) {
        onRefreshData();
      }
    } catch (e) {
      console.error('Error al aplicar configuración de vista personal:', e);
    }
  };

  // Seleccionar vista del sistema
  const handleSelectSystemView = (key: string) => {
    setActivePersonalViewId(null);
    onSelectSystemView(key);
  };

  // Guardar nueva vista
  const handleGuardarNuevaVista = async () => {
    if (!nombreVista.trim()) return;
    try {
      setSavingVista(true);
      const config = capturarConfiguracionActual();
      const nueva = await VistasUsuarioService.guardarVista({
        entidad: entityName,
        nombre: nombreVista.trim(),
        descripcion: descripcionVista.trim() || null,
        configuracionJson: JSON.stringify(config),
        esPredeterminada: marcarPredeterminada,
      });

      setModalGuardarOpen(false);
      setNombreVista('');
      setDescripcionVista('');
      setMarcarPredeterminada(false);
      await cargarVistasPersonales();
      handleSelectPersonalView(nueva);
    } catch (err: any) {
      console.error('Error al guardar vista:', err);
    } finally {
      setSavingVista(false);
    }
  };

  // Guardar cambios sobre la vista personal actual
  const handleGuardarCambiosEnActual = async () => {
    if (!activePersonalViewId) return;
    const actual = personalViews.find((v) => v.id === activePersonalViewId);
    if (!actual) return;

    try {
      setSavingVista(true);
      const config = capturarConfiguracionActual();
      await VistasUsuarioService.guardarVista({
        entidad: entityName,
        nombre: actual.nombre,
        descripcion: actual.descripcion,
        configuracionJson: JSON.stringify(config),
        esPredeterminada: actual.esPredeterminada,
      });
      await cargarVistasPersonales();
    } catch (err) {
      console.error('Error al actualizar vista:', err);
    } finally {
      setSavingVista(false);
    }
  };

  // Establecer como predeterminada
  const handleTogglePredeterminada = async (vista: VistaUsuarioDto, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await VistasUsuarioService.establecerPredeterminada({
        entidad: entityName,
        vistaId: vista.esPredeterminada ? null : vista.id,
      });
      await cargarVistasPersonales();
    } catch (err) {
      console.error('Error al cambiar predeterminada:', err);
    }
  };

  // Eliminar vista
  const handleConfirmarEliminar = async () => {
    if (!vistaAEditar) return;
    try {
      setSavingVista(true);
      await VistasUsuarioService.eliminarVista(vistaAEditar.id);
      if (activePersonalViewId === vistaAEditar.id) {
        setActivePersonalViewId(null);
        if (vistasSistema.length > 0) {
          onSelectSystemView(vistasSistema[0].key);
        }
      }
      setModalEliminarOpen(false);
      setVistaAEditar(null);
      await cargarVistasPersonales();
    } catch (err) {
      console.error('Error al eliminar vista:', err);
    } finally {
      setSavingVista(false);
    }
  };

  return (
    <>
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <div className={styles.viewSelectorTab} role="button" tabIndex={0} aria-label="Cambiar vista">
            <Text weight="semibold" size={400}>
              {activeLabel}
            </Text>
            {activePersonalViewId && (
              <Badge appearance="tint" color="brand" size="small" style={{ marginLeft: 4 }}>
                Personal
              </Badge>
            )}
            <ChevronDown16Regular className={styles.iconChevronMargin} />
          </div>
        </MenuTrigger>

        <MenuPopover className={styles.viewMenuPopover} style={{ minWidth: 260 }}>
          <MenuList>
            {/* 1. VISTAS DEL SISTEMA */}
            <MenuGroup>
              <MenuGroupHeader>Vistas del Sistema</MenuGroupHeader>
              {vistasSistema.map((v) => {
                const isSelected = !activePersonalViewId && activeViewKey === v.key;
                return (
                  <MenuItem
                    key={v.key}
                    icon={isSelected ? <Checkmark16Regular /> : <span style={{ width: 16 }} />}
                    onClick={() => handleSelectSystemView(v.key)}
                  >
                    {v.label}
                  </MenuItem>
                );
              })}
            </MenuGroup>

            {/* 2. MIS VISTAS (PERSONALIZADAS) */}
            {(personalViews.length > 0 || loadingVistas) && (
              <>
                <MenuDivider />
                <MenuGroup>
                  <MenuGroupHeader>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Mis Vistas</span>
                      {loadingVistas && <Spinner size="extra-tiny" />}
                    </div>
                  </MenuGroupHeader>
                  {personalViews.map((pv) => {
                    const isSelected = activePersonalViewId === pv.id;
                    return (
                      <MenuItem
                        key={pv.id}
                        icon={isSelected ? <Checkmark16Regular /> : <span style={{ width: 16 }} />}
                        onClick={() => handleSelectPersonalView(pv)}
                        secondaryContent={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Button
                              appearance="subtle"
                              size="small"
                              title={pv.esPredeterminada ? 'Vista predeterminada' : 'Establecer como predeterminada'}
                              icon={pv.esPredeterminada ? <Star16Filled style={{ color: '#D83B01' }} /> : <Star16Regular />}
                              onClick={(e) => void handleTogglePredeterminada(pv, e)}
                            />
                            <Button
                              appearance="subtle"
                              size="small"
                              title="Eliminar vista personal"
                              icon={<Delete16Regular />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setVistaAEditar(pv);
                                setModalEliminarOpen(true);
                              }}
                            />
                          </div>
                        }
                      >
                        {pv.nombre}
                      </MenuItem>
                    );
                  })}
                </MenuGroup>
              </>
            )}

            {/* 3. ACCIONES DE VISTAS */}
            <MenuDivider />
            {activePersonalViewId && (
              <MenuItem
                icon={<Save16Regular />}
                onClick={() => void handleGuardarCambiosEnActual()}
              >
                Guardar cambios en esta vista
              </MenuItem>
            )}
            <MenuItem
              icon={<Add16Regular />}
              onClick={() => {
                setNombreVista('');
                setDescripcionVista('');
                setMarcarPredeterminada(false);
                setModalGuardarOpen(true);
              }}
            >
              Guardar como nueva vista...
            </MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>

      {/* DIÁLOGO: GUARDAR COMO NUEVA VISTA */}
      <Dialog open={modalGuardarOpen} onOpenChange={(_, data) => setModalGuardarOpen(data.open)}>
        <DialogSurface style={{ maxWidth: 440 }}>
          <DialogBody>
            <DialogTitle>Guardar como nueva vista personal</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Se guardarán las columnas seleccionadas, el orden, los anchos y los filtros actuales aplicados en la tabla.
              </Text>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text weight="semibold" size={200}>Nombre de la vista *</Text>
                <Input
                  value={nombreVista}
                  onChange={(_, d) => setNombreVista(d.value)}
                  placeholder="Ej: Mis Órdenes en Lima Norte"
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text weight="semibold" size={200}>Descripción (opcional)</Text>
                <Textarea
                  value={descripcionVista}
                  onChange={(_, d) => setDescripcionVista(d.value)}
                  placeholder="Detalles del alcance o criterios de esta vista..."
                  rows={2}
                />
              </div>

              <Checkbox
                checked={marcarPredeterminada}
                onChange={(_, d) => setMarcarPredeterminada(Boolean(d.checked))}
                label="Establecer como mi vista predeterminada al ingresar"
              />
            </DialogContent>
            <DialogActions style={{ marginTop: 16 }}>
              <Button appearance="secondary" onClick={() => setModalGuardarOpen(false)}>
                Cancelar
              </Button>
              <Button
                appearance="primary"
                disabled={!nombreVista.trim() || savingVista}
                icon={<Save16Regular />}
                onClick={() => void handleGuardarNuevaVista()}
              >
                {savingVista ? 'Guardando...' : 'Guardar Vista'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* DIÁLOGO: CONFIRMAR ELIMINACIÓN DE VISTA */}
      <Dialog open={modalEliminarOpen} onOpenChange={(_, data) => setModalEliminarOpen(data.open)}>
        <DialogSurface style={{ maxWidth: 380 }}>
          <DialogBody>
            <DialogTitle>¿Eliminar vista personal?</DialogTitle>
            <DialogContent style={{ marginTop: 8 }}>
              <Text size={300}>
                ¿Estás seguro de que deseas eliminar la vista <strong>"{vistaAEditar?.nombre}"</strong>? Esta acción no se puede deshacer.
              </Text>
            </DialogContent>
            <DialogActions style={{ marginTop: 16 }}>
              <Button appearance="secondary" onClick={() => setModalEliminarOpen(false)}>
                Cancelar
              </Button>
              <Button
                appearance="primary"
                style={{ backgroundColor: tokens.colorPaletteRedBackground3, color: '#fff' }}
                disabled={savingVista}
                onClick={() => void handleConfirmarEliminar()}
              >
                {savingVista ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};
