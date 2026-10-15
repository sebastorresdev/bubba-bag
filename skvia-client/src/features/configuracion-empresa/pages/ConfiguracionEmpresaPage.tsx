import { D365FormContent } from '../../../components/common/D365FormContent';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import React, { useEffect, useState, useRef } from 'react';
import {
  Button,
  Input,
  Textarea,
  Text,
  Spinner,
  makeStyles,
  tokens,
  typographyStyles,
} from '@fluentui/react-components';
import {
  Save16Regular,
  ArrowSync16Regular,
  Image16Regular,
  Delete16Regular,
  Building16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../components/common/D365FormField';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { useD365FormStyles } from '../../../styles/d365FormStyles';
import { EmpresaService, type ActualizarEmpresaDto } from '../services/empresa.service';
import { useAuthSession } from '../../../services/authSession';

const useStyles = makeStyles({
  logoSection: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
    padding: '16px',
    border: `1px dashed ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    marginTop: '8px',
  },
  logoPreviewBox: {
    width: '160px',
    height: '90px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  logoImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  logoPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    color: tokens.colorNeutralForeground4,
    fontWeight: 700,
    fontSize: '14px',
    letterSpacing: '1px',
  },
  logoActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  hintText: {
    ...typographyStyles.caption1,
    color: tokens.colorNeutralForeground3,
  },
});

export const ConfiguracionEmpresaPage: React.FC = () => {
  const formStyles = useD365FormStyles();
  const classes = useStyles();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { permisos } = useAuthSession();
  const puedeEditarFiscal = permisos.includes('configuracion.empresa.datos_fiscales.gestionar');
  const puedeEditarPresentacion = permisos.includes('configuracion.empresa.presentacion.gestionar');
  const puedeGuardar = puedeEditarFiscal || puedeEditarPresentacion;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const [formData, setFormData] = useState<ActualizarEmpresaDto>({
    razonSocial: '',
    nombreComercial: '',
    ruc: '',
    direccionFiscal: '',
    telefono: '',
    email: '',
    logoBase64: null,
    piePaginaDocumentos: '',
  });
  const draft = useUnsavedChanges({ formData }, !loading);


  const cargarDatos = async () => {
    try {
      setLoading(true);
      const datos = await EmpresaService.getDatos();
      setFormData({
        razonSocial: datos.razonSocial || '',
        nombreComercial: datos.nombreComercial || '',
        ruc: datos.ruc || '',
        direccionFiscal: datos.direccionFiscal || '',
        telefono: datos.telefono || '',
        email: datos.email || '',
        logoBase64: datos.logoBase64 || null,
        piePaginaDocumentos: datos.piePaginaDocumentos || '',
      });
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al cargar datos de la empresa.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
  }, []);

  const handleGuardar = async () => {
    const savedDraft = draft.capture();
    if (!puedeGuardar || saving) return;
    if (puedeEditarFiscal && !formData.razonSocial.trim()) {
      setMensaje({ tipo: 'error', texto: 'La Razón Social es un campo requerido.' });
      return;
    }

    try {
      setSaving(true);
      setMensaje(null);
      const guardados = puedeEditarFiscal && puedeEditarPresentacion
        ? await EmpresaService.guardarDatos(formData)
        : puedeEditarFiscal ? await EmpresaService.guardarDatosFiscales(formData)
        : await EmpresaService.guardarPresentacion(formData);
      setFormData(guardados);
      draft.markSaved(savedDraft);
      setMensaje({ tipo: 'success', texto: 'Los datos autorizados de la empresa se guardaron correctamente.' });
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al guardar configuración.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSeleccionarLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!puedeEditarPresentacion || saving) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMensaje({ tipo: 'error', texto: 'El archivo seleccionado debe ser una imagen válida (PNG, JPG, SVG, WebP).' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMensaje({ tipo: 'error', texto: 'El tamaño de la imagen no puede exceder 2 MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({ ...prev, logoBase64: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleEliminarLogo = () => {
    if (!puedeEditarPresentacion || saving) return;
    setFormData(prev => ({ ...prev, logoBase64: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Spinner size="large" label="Cargando configuración de la empresa..." />
      </div>
    );
  }

  return (
    <div className={formStyles.root}>
      <D365CommandBar ariaLabel="Comandos de configuración de empresa">
        <div className={formStyles.toolbarLeft}>
          <D365CommandButton
            icon={<Save16Regular />}
            tone="save"
            onClick={() => void handleGuardar()}
            disabled={saving || !puedeGuardar}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </D365CommandButton>
          <D365CommandButton
            icon={<ArrowSync16Regular />}
            onClick={() => void cargarDatos()}
            disabled={saving}
          >
            Actualizar
          </D365CommandButton>
        </div>
      </D365CommandBar>

      <D365EntityHeader
        title={formData.razonSocial || 'Datos de la Empresa'}
        subtitle="Centro de Administración • Configuración Institucional"
        avatarIcon={<Building16Regular />}
      />

      <D365FormContent busy={saving} className={formStyles.contentBody}>
        {(!puedeEditarFiscal || !puedeEditarPresentacion) && (
          <D365MessageBar intent="info">
            Puede consultar la información de la empresa para sus documentos.
            Los campos sin autorización de edición se muestran como sólo lectura.
          </D365MessageBar>
        )}
        {mensaje && (
          <div style={{ marginBottom: '16px' }}>
            <D365MessageBar intent={mensaje.tipo}>
              {mensaje.texto}
            </D365MessageBar>
          </div>
        )}

        <div className={formStyles.card}>
          <div className={formStyles.cardSectionTitle}>Identificación y Razón Social</div>

          <D365FormField label="Razón Social" required info="Nombre legal registrado de la empresa">
            <Input
              value={formData.razonSocial}
              disabled={!puedeEditarFiscal || saving}
              onChange={(_, d) => setFormData(p => ({ ...p, razonSocial: d.value }))}
              placeholder=""
            />
          </D365FormField>

          <D365FormField label="Nombre Comercial" info="Marca o nombre visible">
            <Input
              value={formData.nombreComercial || ''}
              disabled={!puedeEditarFiscal || saving}
              onChange={(_, d) => setFormData(p => ({ ...p, nombreComercial: d.value }))}
              placeholder=""
            />
          </D365FormField>

          <D365FormField label="R.U.C. / Identificación Fiscal" info="Número de registro tributario">
            <Input
              value={formData.ruc || ''}
              disabled={!puedeEditarFiscal || saving}
              onChange={(_, d) => setFormData(p => ({ ...p, ruc: d.value }))}
              placeholder=""
            />
          </D365FormField>
        </div>

        <div className={formStyles.card}>
          <div className={formStyles.cardSectionTitle}>Contacto y Domicilio Fiscal</div>

          <D365FormField label="Dirección Fiscal" info="Dirección oficial de la sede principal">
            <Input
              value={formData.direccionFiscal || ''}
              disabled={!puedeEditarFiscal || saving}
              onChange={(_, d) => setFormData(p => ({ ...p, direccionFiscal: d.value }))}
              placeholder=""
            />
          </D365FormField>

          <D365FormField label="Teléfono de Contacto">
            <Input
              value={formData.telefono || ''}
              disabled={!puedeEditarPresentacion || saving}
              onChange={(_, d) => setFormData(p => ({ ...p, telefono: d.value }))}
              placeholder=""
            />
          </D365FormField>

          <D365FormField label="Correo Electrónico Oficial">
            <Input
              value={formData.email || ''}
              disabled={!puedeEditarPresentacion || saving}
              onChange={(_, d) => setFormData(p => ({ ...p, email: d.value }))}
              placeholder=""
            />
          </D365FormField>
        </div>

        <div className={formStyles.card}>
          <div className={formStyles.cardSectionTitle}>Logotipo Oficial para Documentos y Cargos PDF</div>
          <Text className={classes.hintText}>
            Este logotipo se imprimirá automáticamente en el encabezado de los Cargos de Despacho, Actas de Devolución y Guías de Traslado.
          </Text>

          <div className={classes.logoSection}>
            <div className={classes.logoPreviewBox}>
              {formData.logoBase64 ? (
                <img
                  src={formData.logoBase64}
                  alt="Logo Empresa"
                  className={classes.logoImage}
                />
              ) : (
                <div className={classes.logoPlaceholder}>
                  <Building16Regular style={{ fontSize: '24px' }} />
                  <span>[LOGO]</span>
                </div>
              )}
            </div>

            <div className={classes.logoActions}>
              <input
                ref={fileInputRef}
                type="file"
                disabled={!puedeEditarPresentacion || saving}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleSeleccionarLogo}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  icon={<Image16Regular />}
                  disabled={!puedeEditarPresentacion || saving}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.logoBase64 ? 'Cambiar Logo' : 'Subir Logotipo'}
                </Button>
                {formData.logoBase64 && (
                  <Button
                    icon={<Delete16Regular />}
                    disabled={!puedeEditarPresentacion || saving}
                    appearance="subtle"
                    onClick={handleEliminarLogo}
                  >
                    Quitar Logo
                  </Button>
                )}
              </div>
              <Text className={classes.hintText}>
                {formData.logoBase64
                  ? 'Logotipo cargado y listo para incluirse en las emisiones.'
                  : 'Si no se sube un logo, el sistema mostrará el recuadro formal [LOGO] en las impresiones.'}
              </Text>
            </div>
          </div>
        </div>

        <div className={formStyles.card}>
          <div className={formStyles.cardSectionTitle}>Cláusula y Pie de Página de Documentos</div>
          <D365FormField label="Pie de Página en Cargos / Actas" info="Texto legal o informativo al pie de cada página del PDF">
            <Textarea
              value={formData.piePaginaDocumentos || ''}
              disabled={!puedeEditarPresentacion || saving}
              onChange={(_, d) => setFormData(p => ({ ...p, piePaginaDocumentos: d.value }))}
              placeholder=""
              rows={2}
            />
          </D365FormField>
        </div>
      </D365FormContent>
    </div>
  );
};
