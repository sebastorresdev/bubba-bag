import { useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Badge,
  Text,
  Spinner,
  makeStyles,
  tokens,
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  DrawerFooter,
  Popover,
  PopoverTrigger,
  PopoverSurface,
  Tooltip,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  SplitButton,
  Label,
  type MenuButtonProps,
} from '@fluentui/react-components';
import {
  Location16Regular,
  People16Regular,
  Add16Regular,
  Save16Regular,
  Edit16Regular,
  Dismiss16Regular,
  Delete16Regular,
  Info16Regular,
  SaveMultiple16Regular,
} from '@fluentui/react-icons';
import { AlmacenService } from '../services/almacen.service';
import type { UbicacionInventarioDto } from '../types/almacen.types';
import { apiClient } from '../../../../services/apiClient';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { useCurrentUser } from '../../../../hooks/useCurrentUser';

type Permisos = {
  usuarioId: string;
  nombreCompleto?: string;
  email?: string;
  puedeConsultar: boolean;
  puedeDespachar: boolean;
  puedeRecepcionar: boolean;
  esSupervisor: boolean;
  activo: boolean;
};

type Usuario = {
  id: string;
  nombreCompleto: string;
  email: string;
  esActivo: boolean;
  roles?: string[];
};

const inicial: Permisos = {
  usuarioId: '',
  puedeConsultar: true,
  puedeDespachar: false,
  puedeRecepcionar: false,
  esSupervisor: false,
  activo: true,
};

const useStyles = makeStyles({
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '12px',
    marginBottom: '16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  cardTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  cardIcon: {
    fontSize: '20px',
    color: tokens.colorBrandForeground1,
  },
  cardTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  cardSubtitle: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: '2px',
  },
  tableWrapper: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '36px 16px',
    gap: '8px',
    color: tokens.colorNeutralForeground3,
  },
  formSection: {
    marginTop: '16px',
    padding: '16px 20px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formSectionTitle: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  formGrid: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  checkboxGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    alignItems: 'center',
    marginTop: '4px',
  },
  codeCell: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
    letterSpacing: '0.5px',
  },
  userCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  userEmail: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  actionRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    marginTop: '8px',
  },
  drawer: {
    width: '460px',
    maxWidth: '90vw',
    overflowX: 'hidden',
  },
  drawerHeader: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  drawerBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '20px',
    overflowX: 'hidden',
    overflowY: 'auto',
  },
  fieldVertical: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
  },
  fieldLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  drawerFooter: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '16px 20px',
  },
});

export interface AlmacenConfiguracionProps {
  almacenId: string;
  puedeSupervisar: boolean;
  vista?: 'todas' | 'ubicaciones' | 'autorizaciones';
  tipoAlmacen?: number;
}

export function AlmacenConfiguracion({
  almacenId,
  puedeSupervisar,
  vista = 'todas',
  tipoAlmacen,
}: AlmacenConfiguracionProps) {
  const user = useCurrentUser();
  const administra =
    user.isAuthenticated &&
    user.roles.some(r =>
      ['SuperAdmin', 'ServicioCampoAdmin', 'InventarioAdmin'].includes(r)
    );

  const localStyles = useStyles();
  const formStyles = useD365FormStyles();

  const [ubicaciones, setUbicaciones] = useState<UbicacionInventarioDto[]>([]);
  const [permisos, setPermisos] = useState<Permisos[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [edicion, setEdicion] = useState<Permisos>(inicial);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [drawerUbicacionAbierto, setDrawerUbicacionAbierto] = useState(false);
  const [ubicacionAEliminarId, setUbicacionAEliminarId] = useState<string | null>(null);
  const [drawerUsuarioAbierto, setDrawerUsuarioAbierto] = useState(false);
  const [usuarioAEliminarId, setUsuarioAEliminarId] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      try {
        const u = await AlmacenService.getUbicaciones(almacenId);
        if (vigente) setUbicaciones(u);

        if (puedeSupervisar || administra) {
          const a = await AlmacenService.getAutorizaciones(almacenId);
          if (vigente) setPermisos(a);
        }

        if (administra) {
          const cuentas = await apiClient<Usuario[]>(
            '/api/inventario/almacenes/usuarios-autorizables'
          );
          if (vigente) setUsuarios(cuentas);
        }
      } catch (e) {
        if (vigente)
          setError(
            e instanceof Error ? e.message : 'No se pudo cargar la configuración.'
          );
      }
    };
    void cargar();
    return () => {
      vigente = false;
    };
  }, [almacenId, puedeSupervisar, administra]);

  const ejecutar = async (accion: () => Promise<unknown>, mensajeExito?: string) => {
    setOcupado(true);
    setError('');
    setExito('');
    try {
      await accion();
      if (mensajeExito) setExito(mensajeExito);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setOcupado(false);
    }
  };

  const handleGuardarUbicacion = async (crearOtra = false) => {
    if (!codigo.trim() || !nombre.trim()) return;
    await ejecutar(async () => {
      await AlmacenService.crearUbicacion(almacenId, codigo.trim(), nombre.trim());
      setUbicaciones(await AlmacenService.getUbicaciones(almacenId));
      setCodigo('');
      setNombre('');
      if (!crearOtra) {
        setDrawerUbicacionAbierto(false);
      }
    }, crearOtra ? 'Ubicación guardada. Puede registrar otra ubicación.' : 'Ubicación guardada correctamente.');
  };

  const handleEliminarUbicacion = async (ubicacionId: string) => {
    await ejecutar(async () => {
      await AlmacenService.eliminarUbicacion(almacenId, ubicacionId);
      setUbicaciones(await AlmacenService.getUbicaciones(almacenId));
      setUbicacionAEliminarId(null);
    }, 'Ubicación eliminada correctamente.');
  };

  const handleAbrirDrawerUsuario = (perm?: Permisos) => {
    if (perm) {
      setEdicion({ ...perm });
    } else {
      setEdicion({ ...inicial });
    }
    setError('');
    setExito('');
    setDrawerUsuarioAbierto(true);
  };

  const handleGuardarAutorizacion = async () => {
    if (!edicion.usuarioId) return;
    await ejecutar(async () => {
      await AlmacenService.guardarAutorizacion(
        almacenId,
        edicion.usuarioId,
        edicion
      );
      setPermisos(await AlmacenService.getAutorizaciones(almacenId));
      setDrawerUsuarioAbierto(false);
      setEdicion(inicial);
    }, 'Permisos de usuario guardados correctamente.');
  };

  const handleEliminarAutorizacion = async (usuarioId: string) => {
    await ejecutar(async () => {
      await AlmacenService.eliminarAutorizacion(almacenId, usuarioId);
      setPermisos(await AlmacenService.getAutorizaciones(almacenId));
      setUsuarioAEliminarId(null);
    }, 'Autorización de usuario revocada correctamente.');
  };

  const renderUbicacionesCard = () => (
    <div className={formStyles.card}>
      <div className={localStyles.cardHeader}>
        <div>
          <div className={localStyles.cardTitleGroup}>
            <Location16Regular className={localStyles.cardIcon} />
            <Text className={localStyles.cardTitle}>Ubicaciones del almacén</Text>
            <Badge appearance="tint" shape="rounded" color="informative" size="small">
              {ubicaciones.length} {ubicaciones.length === 1 ? 'ubicación' : 'ubicaciones'}
            </Badge>
          </div>
          <Text className={localStyles.cardSubtitle} block>
            Zonas físicas, estanterías y puntos de almacenamiento dentro de este almacén.
          </Text>
        </div>
        {puedeSupervisar && (
          <Button
            appearance="primary"
            icon={<Add16Regular />}
            onClick={() => {
              setCodigo('');
              setNombre('');
              setDrawerUbicacionAbierto(true);
            }}
          >
            Agregar ubicación
          </Button>
        )}
      </div>

      <div className={localStyles.tableWrapper}>
        <Table aria-label="Ubicaciones del almacén">
          <TableHeader>
            <TableRow>
              <TableHeaderCell style={{ width: '160px' }}>Código</TableHeaderCell>
              <TableHeaderCell>Nombre de la ubicación</TableHeaderCell>
              <TableHeaderCell style={{ width: '150px' }}>Principal / Defecto</TableHeaderCell>
              {puedeSupervisar && (
                <TableHeaderCell style={{ width: '90px', textAlign: 'center' }}>Acciones</TableHeaderCell>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ubicaciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={puedeSupervisar ? 4 : 3}>
                  <div className={localStyles.emptyState}>
                    <Location16Regular style={{ fontSize: '24px' }} />
                    <Text size={200}>No hay ubicaciones registradas en este almacén.</Text>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              ubicaciones.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Text className={localStyles.codeCell}>{u.codigo}</Text>
                  </TableCell>
                  <TableCell>
                    <Text weight="semibold">{u.nombre}</Text>
                  </TableCell>
                  <TableCell>
                    {u.esPrincipal ? (
                      <Badge appearance="tint" shape="rounded" color="success">
                        Sí (Principal)
                      </Badge>
                    ) : (
                      <Badge appearance="tint" shape="rounded" color="subtle">
                        Secundaria
                      </Badge>
                    )}
                  </TableCell>
                  {puedeSupervisar && (
                    <TableCell style={{ textAlign: 'center' }}>
                      {u.esPrincipal ? (
                        <Tooltip content="La ubicación principal no se puede eliminar" relationship="label">
                          <Button
                            size="small"
                            appearance="subtle"
                            icon={<Delete16Regular />}
                            disabled
                            aria-label="Ubicación principal no eliminable"
                          />
                        </Tooltip>
                      ) : (
                        <Popover
                          open={ubicacionAEliminarId === u.id}
                          onOpenChange={(_, data) => setUbicacionAEliminarId(data.open ? u.id : null)}
                        >
                          <PopoverTrigger disableButtonEnhancement>
                            <Tooltip content="Eliminar ubicación" relationship="label">
                              <Button
                                size="small"
                                appearance="subtle"
                                icon={<Delete16Regular style={{ color: tokens.colorPaletteRedForeground1 }} />}
                                disabled={ocupado}
                                aria-label={`Eliminar ${u.nombre}`}
                              />
                            </Tooltip>
                          </PopoverTrigger>
                          <PopoverSurface style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '260px' }}>
                            <Text weight="semibold" size={300}>¿Eliminar ubicación?</Text>
                            <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                              Se eliminará la ubicación "{u.nombre}". No debe contener stock ni series activas.
                            </Text>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              <Button
                                size="small"
                                appearance="subtle"
                                onClick={() => setUbicacionAEliminarId(null)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="small"
                                appearance="primary"
                                style={{ backgroundColor: tokens.colorPaletteRedBackground3, color: tokens.colorNeutralForegroundOnBrand }}
                                onClick={() => void handleEliminarUbicacion(u.id)}
                              >
                                Eliminar
                              </Button>
                            </div>
                          </PopoverSurface>
                        </Popover>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <OverlayDrawer
        open={drawerUbicacionAbierto}
        position="end"
        size="medium"
        className={localStyles.drawer}
        onOpenChange={(_, { open }) => setDrawerUbicacionAbierto(open)}
      >
        <DrawerHeader className={localStyles.drawerHeader}>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Cerrar"
                icon={<Dismiss16Regular />}
                onClick={() => setDrawerUbicacionAbierto(false)}
              />
            }
          >
            Agregar ubicación
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody className={localStyles.drawerBody}>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Defina el código y nombre descriptivo para registrar un nuevo espacio físico (estante, pasillo o zona de acopio) dentro de este almacén.
          </Text>
          <div className={localStyles.fieldVertical}>
            <Label required htmlFor="drawer-ubicacion-codigo" className={localStyles.fieldLabel}>
              Código de ubicación
            </Label>
            <Input
              id="drawer-ubicacion-codigo"
              placeholder="Ej. ESTANTE-A1"
              value={codigo}
              maxLength={50}
              disabled={ocupado}
              style={{ width: '100%' }}
              onChange={(_, d) => setCodigo(d.value.toUpperCase())}
            />
          </div>
          <div className={localStyles.fieldVertical}>
            <Label required htmlFor="drawer-ubicacion-nombre" className={localStyles.fieldLabel}>
              Nombre descriptivo
            </Label>
            <Input
              id="drawer-ubicacion-nombre"
              placeholder="Ej. Pasillo Central 01"
              value={nombre}
              maxLength={150}
              disabled={ocupado}
              style={{ width: '100%' }}
              onChange={(_, d) => setNombre(d.value)}
            />
          </div>
        </DrawerBody>
        <DrawerFooter className={localStyles.drawerFooter}>
          <Button
            appearance="subtle"
            disabled={ocupado}
            onClick={() => setDrawerUbicacionAbierto(false)}
          >
            Cancelar
          </Button>
          <Menu positioning="above-end">
            <MenuTrigger disableButtonEnhancement>
              {(propiedades: MenuButtonProps) => (
                <SplitButton
                  appearance="primary"
                  disabled={ocupado || !codigo.trim() || !nombre.trim()}
                  menuButton={propiedades}
                  primaryActionButton={{
                    onClick: () => void handleGuardarUbicacion(false),
                  }}
                  icon={ocupado ? <Spinner size="tiny" /> : <Save16Regular />}
                >
                  {ocupado ? 'Guardando…' : 'Guardar ubicación'}
                </SplitButton>
              )}
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem
                  disabled={ocupado || !codigo.trim() || !nombre.trim()}
                  icon={<SaveMultiple16Regular />}
                  onClick={() => void handleGuardarUbicacion(true)}
                >
                  Guardar y agregar nueva
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </DrawerFooter>
      </OverlayDrawer>
    </div>
  );

  const renderAutorizacionesCard = () => {
    if (tipoAlmacen === 2) {
      return (
        <div className={formStyles.card}>
          <div className={localStyles.emptyState} style={{ padding: '40px 20px', textAlign: 'center' }}>
            <Info16Regular style={{ fontSize: '32px', color: tokens.colorBrandForeground1 }} />
            <Text weight="semibold" size={400}>Almacén de Custodia Personal</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3, maxWidth: '480px', marginTop: '6px' }}>
              Este almacén corresponde a la custodia móvil de un técnico de campo. La custodia y responsabilidad del material pertenece exclusivamente al técnico asignado. Los despachos y devoluciones se gestionan desde y hacia las Bodegas base autorizadas.
            </Text>
          </div>
        </div>
      );
    }

    return (
      <div className={formStyles.card}>
        <div className={localStyles.cardHeader}>
          <div>
            <div className={localStyles.cardTitleGroup}>
              <People16Regular className={localStyles.cardIcon} />
              <Text className={localStyles.cardTitle}>Usuarios autorizados</Text>
              <Badge appearance="tint" shape="rounded" color="informative" size="small">
                {permisos.length} {permisos.length === 1 ? 'usuario' : 'usuarios'}
              </Badge>
            </div>
            <Text className={localStyles.cardSubtitle} block>
              Control de accesos y roles operativos para este almacén (consulta, despacho, recepción y supervisión).
            </Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <Info16Regular style={{ fontSize: '13px', color: tokens.colorNeutralForeground3 }} />
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Solo se pueden autorizar usuarios activos con roles de <strong>Almacenero</strong> o <strong>Administrador</strong> asignados en Seguridad.
              </Text>
            </div>
          </div>
          {administra && (
            <Button
              appearance="primary"
              icon={<Add16Regular />}
              onClick={() => handleAbrirDrawerUsuario()}
            >
              Asignar usuario
            </Button>
          )}
        </div>

        <div className={localStyles.tableWrapper}>
          <Table aria-label="Usuarios autorizados">
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Usuario</TableHeaderCell>
                <TableHeaderCell style={{ width: '110px' }}>Consulta</TableHeaderCell>
                <TableHeaderCell style={{ width: '110px' }}>Despacho</TableHeaderCell>
                <TableHeaderCell style={{ width: '110px' }}>Recepción</TableHeaderCell>
                <TableHeaderCell style={{ width: '120px' }}>Supervisor</TableHeaderCell>
                <TableHeaderCell style={{ width: '100px' }}>Estado</TableHeaderCell>
                {administra && <TableHeaderCell style={{ width: '100px', textAlign: 'center' }}>Acciones</TableHeaderCell>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {permisos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={administra ? 7 : 6}>
                    <div className={localStyles.emptyState}>
                      <People16Regular style={{ fontSize: '24px' }} />
                      <Text size={200}>No hay usuarios autorizados asignados a este almacén.</Text>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                permisos.map(p => {
                  const u = usuarios.find(usr => usr.id.toLowerCase() === p.usuarioId.toLowerCase());
                  const nombreValido = p.nombreCompleto && p.nombreCompleto !== p.usuarioId ? p.nombreCompleto : undefined;
                  const nombreMostrar = nombreValido || u?.nombreCompleto || p.nombreCompleto || p.usuarioId;
                  const emailMostrar = p.email || u?.email;
                  return (
                    <TableRow key={p.usuarioId}>
                      <TableCell>
                        <div className={localStyles.userCell}>
                          <Text weight="semibold">{nombreMostrar}</Text>
                          {emailMostrar && (
                            <span className={localStyles.userEmail}>{emailMostrar}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge appearance="tint" shape="rounded" color={p.puedeConsultar ? 'success' : 'subtle'}>
                          {p.puedeConsultar ? 'Sí' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge appearance="tint" shape="rounded" color={p.puedeDespachar ? 'success' : 'subtle'}>
                          {p.puedeDespachar ? 'Sí' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge appearance="tint" shape="rounded" color={p.puedeRecepcionar ? 'success' : 'subtle'}>
                          {p.puedeRecepcionar ? 'Sí' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          appearance={p.esSupervisor ? 'filled' : 'tint'}
                          shape="rounded"
                          color={p.esSupervisor ? 'brand' : 'subtle'}
                        >
                          {p.esSupervisor ? 'Supervisor' : 'Operador'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge appearance="tint" shape="rounded" color={p.activo ? 'success' : 'danger'}>
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      {administra && (
                        <TableCell style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                            <Tooltip content="Editar permisos" relationship="label">
                              <Button
                                size="small"
                                appearance="subtle"
                                icon={<Edit16Regular />}
                                aria-label={`Editar permisos de ${nombreMostrar}`}
                                onClick={() => handleAbrirDrawerUsuario(p)}
                              />
                            </Tooltip>
                            <Popover
                              open={usuarioAEliminarId === p.usuarioId}
                              onOpenChange={(_, data) =>
                                setUsuarioAEliminarId(data.open ? p.usuarioId : null)
                              }
                            >
                              <PopoverTrigger disableButtonEnhancement>
                                <Tooltip content="Revocar autorización" relationship="label">
                                  <Button
                                    size="small"
                                    appearance="subtle"
                                    icon={<Delete16Regular style={{ color: tokens.colorPaletteRedForeground1 }} />}
                                    disabled={ocupado}
                                    aria-label={`Revocar autorización de ${nombreMostrar}`}
                                  />
                                </Tooltip>
                              </PopoverTrigger>
                              <PopoverSurface
                                style={{
                                  padding: '14px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px',
                                  maxWidth: '280px',
                                }}
                              >
                                <Text weight="semibold" size={300}>¿Revocar autorización?</Text>
                                <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                                  Se revocará el acceso de "{nombreMostrar}" a este almacén.
                                </Text>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                  <Button
                                    size="small"
                                    appearance="subtle"
                                    onClick={() => setUsuarioAEliminarId(null)}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    size="small"
                                    appearance="primary"
                                    style={{ backgroundColor: tokens.colorPaletteRedBackground3, color: tokens.colorNeutralForegroundOnBrand }}
                                    onClick={() => void handleEliminarAutorizacion(p.usuarioId)}
                                  >
                                    Revocar
                                  </Button>
                                </div>
                              </PopoverSurface>
                            </Popover>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <OverlayDrawer
          open={drawerUsuarioAbierto}
          position="end"
          size="medium"
          className={localStyles.drawer}
          onOpenChange={(_, { open }) => setDrawerUsuarioAbierto(open)}
        >
          <DrawerHeader className={localStyles.drawerHeader}>
            <DrawerHeaderTitle
              action={
                <Button
                  appearance="subtle"
                  aria-label="Cerrar"
                  icon={<Dismiss16Regular />}
                  onClick={() => setDrawerUsuarioAbierto(false)}
                />
              }
            >
              {permisos.some(p => p.usuarioId === edicion.usuarioId)
                ? 'Editar permisos de usuario'
                : 'Asignar usuario al almacén'}
            </DrawerHeaderTitle>
          </DrawerHeader>
          <DrawerBody className={localStyles.drawerBody}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Defina el usuario y las facultades operativas autorizadas para consultar stock, despachar, recepcionar o supervisar operaciones en este almacén.
            </Text>

            <div className={localStyles.fieldVertical}>
              <Label required htmlFor="drawer-usuario-select" className={localStyles.fieldLabel}>
                Usuario a autorizar
              </Label>
              {permisos.some(p => p.usuarioId.toLowerCase() === edicion.usuarioId.toLowerCase()) ? (
                <Input
                  id="drawer-usuario-select"
                  value={
                    edicion.nombreCompleto ||
                    permisos.find(p => p.usuarioId.toLowerCase() === edicion.usuarioId.toLowerCase())?.nombreCompleto ||
                    usuarios.find(u => u.id.toLowerCase() === edicion.usuarioId.toLowerCase())?.nombreCompleto ||
                    edicion.usuarioId
                  }
                  disabled
                  style={{ width: '100%' }}
                />
              ) : (
                <Select
                  id="drawer-usuario-select"
                  aria-label="Usuario a autorizar"
                  value={edicion.usuarioId}
                  disabled={ocupado}
                  style={{ width: '100%' }}
                  onChange={(_, d) => {
                    const existente = permisos.find(p => p.usuarioId.toLowerCase() === d.value.toLowerCase());
                    const usr = usuarios.find(u => u.id.toLowerCase() === d.value.toLowerCase());
                    setEdicion(
                      existente ?? {
                        ...inicial,
                        usuarioId: d.value,
                        nombreCompleto: usr?.nombreCompleto,
                        email: usr?.email,
                      }
                    );
                  }}
                >
                  <option value="">Seleccione un usuario...</option>
                  {usuarios.map(u => (
                    <option value={u.id} key={u.id}>
                      {u.nombreCompleto} ({u.email})
                    </option>
                  ))}
                </Select>
              )}
              {usuarios.length === 0 && !ocupado && (
                <div style={{ marginTop: '8px' }}>
                  <D365MessageBar intent="warning">
                    No se encontraron usuarios con rol elegible. Asigne el rol de "Almacenero" o "Administrador de inventario" a los usuarios en Seguridad para que aparezcan en esta lista.
                  </D365MessageBar>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              <Text
                weight="semibold"
                size={200}
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: tokens.colorNeutralForeground2,
                }}
              >
                Permisos y facultades
              </Text>
              <Checkbox
                label="Consultar existencias y ubicaciones"
                checked={edicion.puedeConsultar}
                disabled={ocupado || !edicion.usuarioId}
                onChange={(_, d) =>
                  setEdicion(prev => ({ ...prev, puedeConsultar: Boolean(d.checked) }))
                }
              />
              <Checkbox
                label="Despachar mercadería y transferencias"
                checked={edicion.puedeDespachar}
                disabled={ocupado || !edicion.usuarioId}
                onChange={(_, d) =>
                  setEdicion(prev => ({ ...prev, puedeDespachar: Boolean(d.checked) }))
                }
              />
              <Checkbox
                label="Recepcionar compras y órdenes"
                checked={edicion.puedeRecepcionar}
                disabled={ocupado || !edicion.usuarioId}
                onChange={(_, d) =>
                  setEdicion(prev => ({ ...prev, puedeRecepcionar: Boolean(d.checked) }))
                }
              />
              <Checkbox
                label="Supervisor de almacén (Aprobación y control)"
                checked={edicion.esSupervisor}
                disabled={ocupado || !edicion.usuarioId}
                onChange={(_, d) =>
                  setEdicion(prev => ({ ...prev, esSupervisor: Boolean(d.checked) }))
                }
              />
              <Checkbox
                label="Acceso activo"
                checked={edicion.activo}
                disabled={ocupado || !edicion.usuarioId}
                onChange={(_, d) =>
                  setEdicion(prev => ({ ...prev, activo: Boolean(d.checked) }))
                }
              />
            </div>
          </DrawerBody>
          <DrawerFooter className={localStyles.drawerFooter}>
            <Button
              appearance="subtle"
              disabled={ocupado}
              onClick={() => setDrawerUsuarioAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              appearance="primary"
              icon={ocupado ? <Spinner size="tiny" /> : <Save16Regular />}
              disabled={ocupado || !edicion.usuarioId}
              onClick={() => void handleGuardarAutorizacion()}
            >
              Guardar permisos
            </Button>
          </DrawerFooter>
        </OverlayDrawer>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {error && (
        <D365MessageBar intent="error" onDismiss={() => setError('')}>
          {error}
        </D365MessageBar>
      )}
      {exito && (
        <D365MessageBar intent="success" onDismiss={() => setExito('')}>
          {exito}
        </D365MessageBar>
      )}

      {(vista === 'todas' || vista === 'ubicaciones') && renderUbicacionesCard()}
      {(vista === 'todas' || vista === 'autorizaciones') &&
        (puedeSupervisar || administra) &&
        renderAutorizacionesCard()}
    </div>
  );
}
