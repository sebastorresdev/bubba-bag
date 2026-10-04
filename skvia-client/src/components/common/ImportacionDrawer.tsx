import React, { useState, useEffect, useRef } from 'react';
import {
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  DrawerFooter,
  Button,
  Spinner,
  Text,
  tokens,
  makeStyles,
  Select,
  Switch,
} from '@fluentui/react-components';
import { D365MessageBar } from './D365MessageBar';
import { useD365ImportStyles } from '../../styles/d365ImportStyles';
import { semanticTokens } from '../../styles/semanticTokens';
import {
  DismissRegular,
  CheckmarkCircle16Filled,
  Alert16Filled,
  ArrowLeft16Regular,
  TableSimple16Regular,
  Eye16Regular,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import {
  ImportacionService,
  type CampoImportacionDto,
  type EntidadImportableDto,
  type VistaPreviaImportacionDto,
  type TrabajoImportacionDto,
} from '../../services/importacion.service';

const useStyles = makeStyles({
  drawer: {
    width: '560px',
    maxWidth: '95vw',
  },
  drawerHeader: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingBottom: '12px',
  },
  drawerBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px 20px',
  },
  drawerFooter: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '12px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  settingsCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  mappingContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  mappingRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 28px 1.4fr',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  mappingSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  mappingSectionOptional: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '10px',
    paddingTop: '16px',
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  mappingSectionTitle: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginBottom: '2px',
  },
  sampleText: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block',
  },
  statusIconMapped: {
    color: semanticTokens.status.success,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconUnmapped: {
    color: semanticTokens.status.warning,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export interface ImportacionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetEntityName?: string; // e.g. "Producto", "Categoria", "Cliente", "UnidadMedida"
  onSuccess?: () => void;
}

export const ImportacionDrawer: React.FC<ImportacionDrawerProps> = ({
  open,
  onOpenChange,
  targetEntityName,
  onSuccess,
}) => {
  const styles = useStyles();
  const importStyles = useD365ImportStyles();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de configuración de entidad
  const [entities, setEntities] = useState<EntidadImportableDto[]>([]);
  const [selectedEntityName, setSelectedEntityName] = useState<string>(targetEntityName || 'Producto');
  const [loadingEntities, setLoadingEntities] = useState<boolean>(false);

  // Estados del asistente (Steps: 1 = Archivo & Delimitadores, 2 = Mapeador Inteligente, 3 = Ajustes & Resumen, 4 = Resultado)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Configuración de Delimitadores CSV
  const [delimiter, setDelimiter] = useState<string>(',');
  const [quoteChar, setQuoteChar] = useState<string>('"');
  const [hasHeader, setHasHeader] = useState<boolean>(true);

  // Ajustes de duplicados
  const [duplicateMode, setDuplicateMode] = useState<string>('Upsert'); // "Upsert", "Skip", "Error"

  // Previsualización y Mapeo
  const [previewData, setPreviewData] = useState<VistaPreviaImportacionDto | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({}); // ExcelHeader -> SystemFieldName
  const [analyzingFile, setAnalyzingFile] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<TrabajoImportacionDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar catálogo de entidades importables
  useEffect(() => {
    if (open) {
      loadEntities();
    }
  }, [open]);

  useEffect(() => {
    if (targetEntityName) {
      setSelectedEntityName(targetEntityName);
    }
  }, [targetEntityName]);

  const loadEntities = async () => {
    try {
      setLoadingEntities(true);
      const data = await ImportacionService.getImportableEntities();
      setEntities(data);
      if (!targetEntityName && data.length > 0) {
        setSelectedEntityName(data[0].entityName);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingEntities(false);
    }
  };

  const currentEntity = entities.find(
    (e) => e.entityName.toLowerCase() === selectedEntityName.toLowerCase()
  );

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setColumnMapping({});
    setCurrentStep(1);
    setImportResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  // Normalizador para Fuzzy Matching inteligente
  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
      .replace(/[*_()\-.\/]/g, ' ') // Quitar signos comunes
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Algoritmo de Mapeo Inteligente (Smart Auto-Mapper en 2 fases con exclusividad)
  const performSmartMapping = (headers: string[], entity: EntidadImportableDto) => {
    const newMapping: Record<string, string> = {};
    const usedSystemFields = new Set<string>();

    // FASE 1: Coincidencias EXACTAS prioritarias (nombre de sistema, nombre visible o sinónimo exacto)
    headers.forEach((header) => {
      const normHeader = normalize(header);

      for (const field of entity.fields) {
        if (usedSystemFields.has(field.systemName)) continue;

        const normSys = normalize(field.systemName);
        const normDisp = normalize(field.displayName);
        const isExactSynonym = field.synonyms.some((syn) => normalize(syn) === normHeader);

        if (normHeader === normSys || normHeader === normDisp || isExactSynonym) {
          newMapping[header] = field.systemName;
          usedSystemFields.add(field.systemName);
          break;
        }
      }
    });

    // FASE 2: Coincidencias APROXIMADAS (solo para columnas pendientes y campos del sistema sin asignar)
    headers.forEach((header) => {
      if (newMapping[header]) return;

      const normHeader = normalize(header);
      let matchedField = 'Ignore';

      for (const field of entity.fields) {
        if (usedSystemFields.has(field.systemName)) continue;

        const hasSynonym = field.synonyms.some((syn) => {
          const normSyn = normalize(syn);
          // Exigir al menos 4 caracteres para evitar coincidencias erróneas por prefijos genéricos
          if (normSyn.length < 4) return false;
          return normHeader.includes(normSyn) || normSyn.includes(normHeader);
        });

        if (hasSynonym) {
          matchedField = field.systemName;
          usedSystemFields.add(field.systemName);
          break;
        }
      }

      newMapping[header] = matchedField;
    });

    setColumnMapping(newMapping);
  };

  // Manejador de selección de archivo
  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    setPreviewData(null);

    const isCsv = file.name.endsWith('.csv') || file.name.endsWith('.txt');

    try {
      setAnalyzingFile(true);
      const preview = await ImportacionService.previewImportFile(file, {
        delimiter: isCsv ? undefined : undefined,
        hasHeader: true,
      });

      setPreviewData(preview);
      if (isCsv && preview.detectedDelimiter) {
        setDelimiter(preview.detectedDelimiter === '\\t' ? '\t' : preview.detectedDelimiter);
      }

      if (currentEntity) {
        performSmartMapping(preview.headers, currentEntity);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al analizar el archivo seleccionado.');
    } finally {
      setAnalyzingFile(false);
    }
  };

  const handleReanalyzeWithDelimiter = async (newDelim: string) => {
    setDelimiter(newDelim);
    if (!selectedFile) return;

    try {
      setAnalyzingFile(true);
      const preview = await ImportacionService.previewImportFile(selectedFile, {
        delimiter: newDelim,
        quoteChar,
        hasHeader,
      });
      setPreviewData(preview);
      if (currentEntity) {
        performSmartMapping(preview.headers, currentEntity);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al reanalizar archivo con nuevo delimitador.');
    } finally {
      setAnalyzingFile(false);
    }
  };

  // Ejecutar importación
  const handleExecuteImport = async () => {
    if (!selectedFile || !currentEntity) return;

    try {
      setImporting(true);
      setErrorMessage(null);

      const job = await ImportacionService.executeImport(selectedFile, {
        entityName: currentEntity.entityName,
        duplicateMode,
        delimiter,
        quoteChar,
        columnMapping,
      });

      setImportResult(job);
      setCurrentStep(4);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ocurrió un error al procesar la importación.');
    } finally {
      setImporting(false);
    }
  };

  // Validación de campos obligatorios en el mapeo
  const getUnmappedRequiredFields = () => {
    if (!currentEntity) return [];
    const mappedSystemFields = new Set(Object.values(columnMapping));
    return currentEntity.fields.filter(
      (f) => f.isRequired && !mappedSystemFields.has(f.systemName)
    );
  };

  const unmappedRequired = getUnmappedRequiredFields();

  const renderFieldMapping = (field: CampoImportacionDto) => {
    const sourceHeader = Object.entries(columnMapping)
      .find(([, systemField]) => systemField === field.systemName)?.[0] || '';

    return (
      <div key={field.systemName} className={styles.mappingRow}>
        <div className={importStyles.overflowHidden}>
          <Select
            value={sourceHeader}
            size="medium"
            aria-label={`Columna de origen para ${field.displayName}`}
            onChange={(_, data) => {
              setColumnMapping((previous) => {
                const next = { ...previous };
                Object.keys(next).forEach((header) => {
                  if (next[header] === field.systemName) next[header] = 'Ignore';
                });
                if (data.value) next[data.value] = field.systemName;
                return next;
              });
            }}
          >
            <option value="">Sin asignar</option>
            {previewData?.headers.map((header) => (
              <option key={header} value={header}>{header}</option>
            ))}
          </Select>
        </div>
        <div className={importStyles.centered}>
          {sourceHeader ? (
            <span className={styles.statusIconMapped}><CheckmarkCircle16Filled /></span>
          ) : (
            <span className={styles.statusIconUnmapped}><Alert16Filled /></span>
          )}
        </div>
        <div className={importStyles.overflowHidden}>
          <Text weight="semibold" size={200} className={importStyles.blockText}>{field.displayName}</Text>
          <span className={styles.sampleText}>{field.type === 'lookup' ? 'Catálogo relacionado' : 'Campo del sistema'}</span>
        </div>
      </div>
    );
  };

  return (
    <OverlayDrawer
      open={open}
      position="end"
      className={styles.drawer}
      onOpenChange={(_, state) => onOpenChange(state.open)}
    >
      <DrawerHeader className={styles.drawerHeader}>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Cerrar"
              icon={<DismissRegular />}
              onClick={handleClose}
            />
          }
        >
          <div className={importStyles.column}>
            <Text weight="semibold" size={400}>
              Importar desde Excel o CSV
            </Text>
            {selectedFile && (
              <Text size={200} className={importStyles.muted}>
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </Text>
            )}
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody className={styles.drawerBody}>
        {errorMessage && (
          <D365MessageBar intent="error" title="Error">
            {errorMessage}
          </D365MessageBar>
        )}

        {/* PASO 1: SELECCIÓN DE ENTIDAD, ARCHIVO Y DELIMITADORES */}
        {currentStep === 1 && (
          <>
            {/* Si es importación genérica, permite elegir la entidad destino */}
            {!targetEntityName && (
              <div className={styles.formRow}>
                <Text weight="semibold" size={200}>
                  Entidad Destino
                </Text>
                <Select
                  value={selectedEntityName}
                  onChange={(_, data) => {
                    setSelectedEntityName(data.value);
                    const ent = entities.find((e) => e.entityName === data.value);
                    if (ent && previewData) {
                      performSmartMapping(previewData.headers, ent);
                    }
                  }}
                  disabled={loadingEntities || analyzingFile}
                >
                  {entities.map((e) => (
                    <option key={e.entityName} value={e.entityName}>
                      {e.displayName}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div className={styles.formRow}>
              <label htmlFor="archivo-importacion">Archivo</label>
              <input
                id="archivo-importacion"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFileChange(file);
                }}
              />
              {selectedFile && (
                <small>
                  {selectedFile.name} · {(selectedFile.size / 1024).toFixed(1)} KB · {previewData?.headers.length || 0} columnas
                </small>
              )}
            </div>

            {analyzingFile && (
              <div className={importStyles.analysisRow}>
                <Spinner size="tiny" />
                <Text size={200}>Analizando estructura del archivo...</Text>
              </div>
            )}

            {/* Ajustes de Delimitador para CSV / TXT */}
            {selectedFile && (selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.txt')) && (
              <div className={styles.settingsCard}>
                <div className={styles.sectionTitle}>
                  <TableSimple16Regular /> Configuración de Delimitadores (CSV / TXT)
                </div>

                <div className={styles.formRow}>
                  <Text size={200} weight="semibold">Calificador de Texto (Comillas)</Text>
                  <Select
                    value={quoteChar}
                    onChange={(_, d) => setQuoteChar(d.value)}
                    size="small"
                  >
                    <option value='"'>Comillas dobles ( " )</option>
                    <option value="'">Comillas simples ( ' )</option>
                    <option value="">Ninguno</option>
                  </Select>
                </div>

                <div className={styles.formRow}>
                  <Text size={200} weight="semibold">Delimitador de Campos</Text>
                  <Select
                    value={delimiter}
                    onChange={(_, d) => handleReanalyzeWithDelimiter(d.value)}
                    size="small"
                  >
                    <option value=",">Coma ( , )</option>
                    <option value=";">Punto y coma ( ; )</option>
                    <option value="\t">Tabulación (\t)</option>
                    <option value="|">Barra vertical ( | )</option>
                  </Select>
                </div>

                <Switch
                  checked={hasHeader}
                  onChange={(_, d) => setHasHeader(d.checked)}
                  label="La primera fila contiene los encabezados de columna"
                />
              </div>
            )}
          </>
        )}

        {/* PASO 2: MAPEO INTELIGENTE DE CAMPOS */}
        {currentStep === 2 && currentEntity && (
          <div className={styles.mappingContainer}>

            {unmappedRequired.length > 0 && (
              <D365MessageBar intent="warning" title="Campos obligatorios requeridos">
                Debe mapear los siguientes campos: {unmappedRequired.map((f) => f.displayName).join(', ')}.
              </D365MessageBar>
            )}

            <div className={styles.mappingSection}>
              <div className={styles.mappingSectionTitle}>
                <Text weight="semibold" size={300}>Mapeo obligatorio</Text>
              </div>
              <div className={importStyles.mappingHeader}>
                <span>Columna del archivo</span><span></span><span>Campo del sistema</span>
              </div>
              {currentEntity.fields.filter((field) => field.isRequired).map(renderFieldMapping)}
            </div>

            <div className={styles.mappingSectionOptional}>
              <div className={styles.mappingSectionTitle}>
                <Text weight="semibold" size={300}>Mapeo opcional</Text>
              </div>
              <div className={importStyles.mappingHeader}>
                <span>Columna del archivo</span><span></span><span>Campo del sistema</span>
              </div>
              {currentEntity.fields.filter((field) => !field.isRequired).map(renderFieldMapping)}
            </div>
          </div>
        )}

        {/* PASO 3: TRATAMIENTO DE DUPLICADOS & REVISIÓN FINAL */}
        {currentStep === 3 && (
          <div className={styles.settingsCard}>
            <div className={styles.sectionTitle}>Tratamiento de Registros Duplicados</div>

            <div className={styles.formRow}>
              <Text size={200} weight="semibold">Modo de Tratamiento de Duplicados</Text>
              <Select
                value={duplicateMode}
                onChange={(_, d) => setDuplicateMode(d.value)}
                size="small"
              >
                <option value="Upsert">Actualizar registros existentes</option>
                <option value="Skip">Omitir duplicados</option>
                <option value="Error">Rechazar duplicados</option>
              </Select>
            </div>

            <div className={importStyles.summarySection}>
              <div className={styles.sectionTitle}>Resumen de Importación</div>
              <ul className={importStyles.summaryList}>
                <li><strong>Entidad destino:</strong> {currentEntity?.displayName}</li>
                <li><strong>Archivo:</strong> {selectedFile?.name}</li>
                <li><strong>Total columnas a importar:</strong> {Object.values(columnMapping).filter((v) => v !== 'Ignore').length}</li>
                <li><strong>Columnas ignoradas:</strong> {Object.values(columnMapping).filter((v) => v === 'Ignore').length}</li>
              </ul>
            </div>
          </div>
        )}

        {/* PASO 4: RESULTADOS DE IMPORTACIÓN */}
        {currentStep === 4 && importResult && (
          <div className={importStyles.resultColumn}>
            <D365MessageBar
              intent={
                importResult.totalFallidos === 0
                  ? 'success'
                  : importResult.totalExitosos > 0
                  ? 'warning'
                  : 'error'
              }
              title={
                importResult.totalFallidos === 0
                  ? 'Importación completada con éxito'
                  : importResult.totalExitosos > 0
                  ? 'Importación completada con advertencias/errores'
                  : 'Falló la importación'
              }
            >
              Se procesaron {importResult.totalProcesados} filas: {importResult.totalExitosos} creadas/actualizadas y {importResult.totalFallidos} fallidas.
            </D365MessageBar>

            {/* Tarjeta de Métricas estilo D365 */}
            <div
              className={importStyles.resultMetricsGrid}
            >
              <div className={importStyles.metricCard}>
                <Text size={600} weight="bold" className={importStyles.success}>
                  {importResult.totalExitosos}
                </Text>
                <br />
                <Text size={100} className={importStyles.muted}>Correctos</Text>
              </div>

              <div className={importStyles.metricCard}>
                <Text size={600} weight="bold" className={importStyles.danger}>
                  {importResult.totalFallidos}
                </Text>
                <br />
                <Text size={100} className={importStyles.muted}>Errores</Text>
              </div>

              <div className={importStyles.metricCard}>
                <Text size={600} weight="bold">
                  {importResult.totalProcesados}
                </Text>
                <br />
                <Text size={100} className={importStyles.muted}>Total Filas</Text>
              </div>
            </div>

            {/* Botón para ver página dedicada de auditoría */}
            <Button
              appearance="secondary"
              icon={<Eye16Regular />}
              onClick={() => {
                handleClose();
                navigate(`/gestion-datos/importaciones/${importResult.id}`);
              }}
            >
              Ver reporte de auditoría y detalle de la importación
            </Button>
          </div>
        )}
      </DrawerBody>

      <DrawerFooter className={styles.drawerFooter}>
        {currentStep === 1 && (
          <>
            <Button appearance="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              appearance="primary"
              disabled={!selectedFile || !previewData || analyzingFile}
              onClick={() => setCurrentStep(2)}
            >
              Siguiente
            </Button>
          </>
        )}

        {currentStep === 2 && (
          <>
            <Button
              appearance="secondary"
              icon={<ArrowLeft16Regular />}
              onClick={() => setCurrentStep(1)}
            >
              Atrás
            </Button>
            <Button
              appearance="primary"
              disabled={unmappedRequired.length > 0}
              onClick={() => setCurrentStep(3)}
            >
              Siguiente
            </Button>
          </>
        )}

        {currentStep === 3 && (
          <>
            <Button
              appearance="secondary"
              icon={<ArrowLeft16Regular />}
              disabled={importing}
              onClick={() => setCurrentStep(2)}
            >
              Atrás
            </Button>
            <Button
              appearance="primary"
              disabled={importing}
              icon={importing ? <Spinner size="tiny" /> : undefined}
              onClick={handleExecuteImport}
            >
              {importing ? 'Importando datos...' : 'Finalizar e Importar'}
            </Button>
          </>
        )}

        {currentStep === 4 && (
          <Button appearance="primary" onClick={handleClose} className={importStyles.rightAligned}>
            Listo
          </Button>
        )}
      </DrawerFooter>
    </OverlayDrawer>
  );
};
