import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  Textarea,
  Spinner,
  Text,
  Toast,
  Toaster,
  ToastTitle,
  useToastController,
  useId,
  tokens,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  Delete16Regular,
  ClipboardTask20Regular,
  Person16Regular,
  Money16Regular,
} from '@fluentui/react-icons';
import { TipoOrdenService } from '../services/tipoOrden.service';
import type { GuardarTipoOrdenTrabajoDto } from '../types/tipoOrden.types';
import { ListaPreciosService } from '../../../inventario/listas-precios/services/listaPrecios.service';
import type { ListaPreciosDto } from '../../../inventario/listas-precios/types/listaPrecios.types';
import { useAuthSession } from '../../../../services/authSession';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { SelectorEntidadRelacionada } from '../../../../components/common/SelectorEntidadRelacionada';
import { SeguridadService, type UsuarioDto } from '../../../seguridad';


export function TipoOrdenFormPage() {
  const styles = useD365FormStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const toasterId = useId('tipo-orden-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const notifySuccess = useCallback((title: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
      </Toast>,
      { intent: 'success', position: 'top-end' }
    );
  }, [dispatchToast]);

  const isEditMode = Boolean(id && id !== 'nuevo');

  const [formData, setFormData] = useState<GuardarTipoOrdenTrabajoDto>({
    nombre: '',
    requiereVisitaCampo: true,
    exigeFirmaCliente: true,
    exigeEvidenciasFotograficas: true,
    descripcion: '',
    colorHex: '#0f6cbd',
  });

  const [savedTitle, setSavedTitle] = useState(isEditMode ? '' : 'Nuevo');
  const savedSubtitle = 'Configuración Operativa • Naturaleza de Servicio';

  const auth = useAuthSession();
  const creadorNombre = auth.usuario?.nombreCompleto || 'Usuario del Sistema';

  const [usuarios, setUsuarios] = useState<UsuarioDto[]>([]);
  const [propietarioId, setPropietarioId] = useState<string>(auth.usuario?.id || 'creador');
  const [propietarioNombre, setPropietarioNombre] = useState<string>(creadorNombre);
  const [busquedaPropietario, setBusquedaPropietario] = useState<string>('');

  const [listasPrecios, setListasPrecios] = useState<ListaPreciosDto[]>([]);
  const [listaPrecioId, setListaPrecioId] = useState<string>('');
  const [busquedaLista, setBusquedaLista] = useState<string>('');

  const [activo, setActivo] = useState(true);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    void ListaPreciosService.getListasPrecios(undefined, true)
      .then((res) => setListasPrecios(res))
      .catch(() => {});
    void SeguridadService.usuarios()
      .then((res) => setUsuarios(res))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (auth.usuario?.id && (!propietarioId || propietarioId === 'creador')) {
      setPropietarioId(auth.usuario.id);
      setPropietarioNombre(auth.usuario.nombreCompleto || 'Usuario del Sistema');
    }
  }, [auth.usuario, propietarioId]);

  const opcionesUsuarios = useMemo(() => {
    const list = usuarios.map((u) => ({
      id: u.id,
      nombre: u.nombreCompleto,
      detalle: u.email,
    }));
    if (propietarioId && !list.some((u) => u.id === propietarioId)) {
      list.unshift({
        id: propietarioId,
        nombre: propietarioNombre || creadorNombre,
        detalle: undefined,
      });
    }
    return list;
  }, [usuarios, propietarioId, propietarioNombre, creadorNombre]);

  const propietarioSeleccionado = useMemo(() => {
    if (!propietarioId) return null;
    return (
      opcionesUsuarios.find((u) => u.id === propietarioId) || {
        id: propietarioId,
        nombre: propietarioNombre || creadorNombre,
      }
    );
  }, [propietarioId, propietarioNombre, creadorNombre, opcionesUsuarios]);

  const cargarDatos = useCallback(async (tipoId: string) => {
    try {
      setLoading(true);
      const data = await TipoOrdenService.getTipoOrdenById(tipoId);
      setFormData({
        nombre: data.nombre,
        requiereVisitaCampo: data.requiereVisitaCampo,
        exigeFirmaCliente: data.exigeFirmaCliente,
        exigeEvidenciasFotograficas: data.exigeEvidenciasFotograficas,
        descripcion: data.descripcion || '',
        colorHex: data.colorHex || '#0f6cbd',
      });
      setSavedTitle(data.nombre);
      setActivo(data.activo);
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Error al cargar tipo de orden.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isEditMode && id) {
      void cargarDatos(id);
    }
  }, [isEditMode, id, cargarDatos]);

  const validar = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.nombre.trim()) {
      errs.nombre = 'El nombre del tipo de orden es obligatorio.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const guardar = async (cerrarAlFinal = false): Promise<string | null> => {
    if (!validar()) {
      setStatusMessage({ type: 'error', text: 'Por favor complete todos los campos obligatorios.' });
      return null;
    }

    try {
      setSaving(true);
      setStatusMessage(null);

      let savedId = id;
      if (isEditMode && id) {
        await TipoOrdenService.actualizarTipoOrden(id, formData);
        setSavedTitle(formData.nombre.trim());
        notifySuccess('Tipo de orden actualizado correctamente.');
      } else {
        const res = await TipoOrdenService.crearTipoOrden(formData);
        savedId = res.id;
        setSavedTitle(formData.nombre.trim());
        notifySuccess('Tipo de orden registrado exitosamente.');
      }

      if (cerrarAlFinal) {
        navigate('/servicio-campo/tipos-orden');
      } else if (!isEditMode && savedId) {
        navigate(`/servicio-campo/tipos-orden/${savedId}`, { replace: true });
      }

      return savedId ?? null;
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Error al guardar tipo de orden.',
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const cambiarEstado = async () => {
    if (!id || !isEditMode) return;
    try {
      setSaving(true);
      await TipoOrdenService.cambiarEstado(id, !activo);
      setActivo(!activo);
      notifySuccess(`Tipo de orden ${!activo ? 'activado' : 'desactivado'} correctamente.`);
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Error al cambiar estado.',
      });
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async () => {
    if (!id || !isEditMode) return;
    if (!window.confirm('¿Está seguro de eliminar este tipo de orden de trabajo?')) return;
    try {
      setSaving(true);
      await TipoOrdenService.eliminarTipoOrden(id);
      navigate('/servicio-campo/tipos-orden');
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Error al eliminar tipo de orden.',
      });
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner label="Cargando tipo de orden..." size="large" />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Toaster toasterId={toasterId} />

      {/* Barra de Comandos */}
      <D365CommandBar ariaLabel="Barra de comandos de tipo de orden">
        <D365CommandButton
          icon={<ArrowLeft16Regular />}
          tone="brand"
          aria-label="Atrás"
          title="Atrás"
          onClick={() => navigate('/servicio-campo/tipos-orden')}
        />
        <D365CommandDivider />
        <D365CommandButton
          icon={<Save16Regular />}
          tone="save"
          disabled={saving}
          onClick={() => void guardar(false)}
        >
          Guardar
        </D365CommandButton>
        <D365CommandButton
          icon={<SaveMultiple16Regular />}
          tone="save"
          disabled={saving}
          onClick={() => void guardar(true)}
        >
          Guardar y cerrar
        </D365CommandButton>
        <D365CommandDivider />
        <D365CommandButton
          icon={<Add16Regular />}
          tone="create"
          onClick={() => navigate('/servicio-campo/tipos-orden/nuevo')}
        >
          Nuevo
        </D365CommandButton>
        {isEditMode && (
          <>
            <D365CommandButton
              disabled={saving}
              onClick={() => void cambiarEstado()}
            >
              {activo ? 'Desactivar' : 'Activar'}
            </D365CommandButton>
            <D365CommandButton
              icon={<Delete16Regular />}
              tone="danger"
              disabled={saving}
              onClick={() => void eliminar()}
            >
              Eliminar
            </D365CommandButton>
          </>
        )}
      </D365CommandBar>

      {/* Alerta de Estado */}
      {statusMessage && (
        <div style={{ padding: '8px 16px' }}>
          <D365MessageBar intent={statusMessage.type} onDismiss={() => setStatusMessage(null)}>
            {statusMessage.text}
          </D365MessageBar>
        </div>
      )}

      {/* Encabezado D365 */}
      <D365EntityHeader
        title={savedTitle || (isEditMode ? 'Tipo de Orden' : 'Nuevo')}
        subtitle={savedSubtitle}
        avatarIcon={<ClipboardTask20Regular />}
        avatarSize={48}
        metadata={[
          {
            label: 'Propietario',
            value: propietarioNombre || creadorNombre,
          },
          {
            label: 'Lista de Precios',
            value: listasPrecios.find((l) => l.id === listaPrecioId)?.nombre || 'Predeterminada',
          },
          {
            label: 'Estado',
            value: activo ? 'Activo' : 'Inactivo',
          },
        ]}
      />

      {/* Formulario */}
      <div className={styles.contentBody}>
        <div className={styles.halfCardWrapper} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Tarjeta 1: General */}
          <div className={styles.card}>
            <Text size={400} weight="semibold" style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, paddingBottom: 8, display: 'block' }}>
              General
            </Text>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
              <D365FormField
                label="Nombre"
                required
                error={errors.nombre}
                info="Identificador público del tipo de orden (ej: 'Instalación Residencial', 'Mantenimiento Correctivo')."
              >
                <Input
                  value={formData.nombre}
                  onChange={(_, d) => setFormData((prev) => ({ ...prev, nombre: d.value }))}
                />
              </D365FormField>

              <D365FormField
                label="Propietario"
                info="Usuario responsable de la creación o gestión de este registro."
              >
                <SelectorEntidadRelacionada
                  etiquetaGrupo="Usuarios"
                  icono={<Person16Regular />}
                  opciones={opcionesUsuarios}
                  seleccionada={propietarioSeleccionado}
                  textoBusqueda={busquedaPropietario}
                  alCambiarBusqueda={setBusquedaPropietario}
                  alSeleccionar={(newId) => {
                    setPropietarioId(newId || '');
                    const u = opcionesUsuarios.find((x) => x.id === newId);
                    setPropietarioNombre(u ? u.nombre : '');
                  }}
                  alNavegar={(uId) => {
                    if (uId && uId !== 'creador') {
                      navigate(`/configuracion/usuarios/${uId}`);
                    }
                  }}
                  textoVacio="No se encontraron usuarios"
                />
              </D365FormField>
            </div>
          </div>

          {/* Tarjeta 2: Detalles */}
          <div className={styles.card}>
            <Text size={400} weight="semibold" style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, paddingBottom: 8, display: 'block' }}>
              Detalles
            </Text>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
              <D365FormField
                label="Lista de Precios"
                info="Lista de precios por defecto que heredarán las órdenes de este tipo si el cliente no tiene una pactada."
              >
                <SelectorEntidadRelacionada
                  etiquetaGrupo="Listas de Precios"
                  icono={<Money16Regular />}
                  opciones={listasPrecios.map((l) => ({
                    id: l.id,
                    nombre: l.nombre,
                    detalle: l.moneda ? `Moneda: ${l.moneda}` : undefined,
                  }))}
                  seleccionada={
                    listasPrecios.find((l) => l.id === listaPrecioId)
                      ? {
                          id: listaPrecioId,
                          nombre: listasPrecios.find((l) => l.id === listaPrecioId)!.nombre,
                          detalle: listasPrecios.find((l) => l.id === listaPrecioId)!.moneda ? `Moneda: ${listasPrecios.find((l) => l.id === listaPrecioId)!.moneda}` : undefined,
                        }
                      : null
                  }
                  textoBusqueda={busquedaLista}
                  alCambiarBusqueda={setBusquedaLista}
                  alSeleccionar={(id) => setListaPrecioId(id || '')}
                  textoVacio="No se encontraron listas de precios"
                />
              </D365FormField>

              <D365FormField
                label="Descripción"
                info="Instrucciones, alcance técnico o notas operativas para este tipo de orden."
              >
                <Textarea
                  value={formData.descripcion}
                  onChange={(_, d) => setFormData((prev) => ({ ...prev, descripcion: d.value }))}
                  rows={3}
                />
              </D365FormField>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
