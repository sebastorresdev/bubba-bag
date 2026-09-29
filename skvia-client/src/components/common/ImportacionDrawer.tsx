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
  Badge,
  Tooltip,
} from '@fluentui/react-components';
import { D365MessageBar } from './D365MessageBar';
import { useD365ImportStyles } from '../../styles/d365ImportStyles';
import { semanticTokens } from '../../styles/semanticTokens';
import {
  DismissRegular,
  DocumentCheckmark24Regular,
  ArrowUpload24Regular,
  CheckmarkCircle16Filled,
  Alert16Filled,
  ArrowLeft16Regular,
  ArrowRight16Regular,
  Delete16Regular,
  TableSimple16Regular,
  Eye16Regular,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import {
  ImportacionService,
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
  dropZone: {
    borderTop: `2px dashed ${tokens.colorBrandStroke1}`,
    borderRight: `2px dashed ${tokens.colorBrandStroke1}`,
    borderBottom: `2px dashed ${tokens.colorBrandStroke1}`,
    borderLeft: `2px dashed ${tokens.colorBrandStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '28px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, border-color 0.2s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      borderTopColor: tokens.colorBrandStroke2,
      borderRightColor: tokens.colorBrandStroke2,
      borderBottomColor: tokens.colorBrandStroke2,
      borderLeftColor: tokens.colorBrandStroke2,
    },
  },
  dropZoneActive: {
    backgroundColor: tokens.colorBrandBackground2,
    borderTopColor: tokens.colorBrandStroke1,
    borderRightColor: tokens.colorBrandStroke1,
    borderBottomColor: tokens.colorBrandStroke1,
    borderLeftColor: tokens.colorBrandStroke1,
  },
  fileCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
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
  stepperHeader: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '8px',
  },
  badgeStep: {
    fontSize: tokens.fontSizeBase100,
    height: '20px',
  },
});

export interface ImportacionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetEntityName?: string; // e.g. "Producto", "Categoria", "Cliente", "UnidadMedida"
  onSuccess?: () => void;
  onDownloadTemplate?: () => Promise<void>;
}

export const ImportacionDrawer: React.FC<ImportacionDrawerProps> = ({
  open,
  onOpenChange,
  targetEntityName,
  onSuccess,
  onDownloadTemplate,
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
  const [isDragging, setIsDragging] = useState<boolean>(false);

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
                Está a punto de importar {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </Text>
            )}
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody className={styles.drawerBody}>
        {/* Barra de progreso de pasos tipo D365 */}
        <div className={styles.stepperHeader}>
          <Badge
            appearance={currentStep === 1 ? 'filled' : 'tint'}
            color={currentStep === 1 ? 'brand' : 'subtle'}
            className={styles.badgeStep}
          >
            1. Archivo
          </Badge>
          <Text size={200} className={importStyles.stepArrow}>→</Text>
          <Badge
            appearance={currentStep === 2 ? 'filled' : 'tint'}
            color={currentStep === 2 ? 'brand' : 'subtle'}
            className={styles.badgeStep}
          >
            2. Mapeador
          </Badge>
          <Text size={200} className={importStyles.stepArrow}>→</Text>
          <Badge
            appearance={currentStep === 3 ? 'filled' : 'tint'}
            color={currentStep === 3 ? 'brand' : 'subtle'}
            className={styles.badgeStep}
          >
            3. Ajustes
          </Badge>
          <Text size={200} className={importStyles.stepArrow}>→</Text>
          <Badge
            appearance={currentStep === 4 ? 'filled' : 'tint'}
            color={currentStep === 4 ? 'brand' : 'subtle'}
            className={styles.badgeStep}
          >
            4. Resumen
          </Badge>
        </div>

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

            {/* Zona de Arrastre de Archivo */}
            {!selectedFile ? (
              <div
                className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt"
                  className={importStyles.hiddenInput}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <ArrowUpload24Regular className={importStyles.brand} />
                <Text weight="semibold">Arrastre o seleccione un archivo Excel o CSV</Text>
                <Text size={200} className={importStyles.muted}>
                  Formatos soportados: .xlsx, .xls, .csv, .txt (hasta 20 MB)
                </Text>
                {onDownloadTemplate && (
                  <Button
                    size="small"
                    appearance="subtle"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadTemplate();
                    }}
                  >
                    Descargar plantilla oficial de {currentEntity?.displayName || 'ejemplo'}
                  </Button>
                )}
              </div>
            ) : (
              <div className={styles.fileCard}>
                <div className={importStyles.fileDetailsRow}>
                  <DocumentCheckmark24Regular className={importStyles.successIcon} />
                  <div>
                    <Text weight="semibold">{selectedFile.name}</Text>
                    <br />
                    <Text size={100} className={importStyles.muted}>
                      {(selectedFile.size / 1024).toFixed(1)} KB • {previewData?.headers.length || 0} columnas detectadas
                    </Text>
                  </div>
                </div>
                <Button
                  appearance="subtle"
                  icon={<Delete16Regular />}
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewData(null);
                    setColumnMapping({});
                  }}
                />
              </div>
            )}

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
            <Text size={200} className={importStyles.muted}>
              Asocie cada columna del archivo de origen a un campo de la entidad {currentEntity.displayName} en el sistema.
            </Text>

            {unmappedRequired.length > 0 && (
              <D365MessageBar intent="warning" title="Campos obligatorios requeridos">
                Debe mapear los siguientes campos: {unmappedRequired.map((f) => f.displayName).join(', ')}.
              </D365MessageBar>
            )}

            {/* Encabezado de la cuadrícula de mapeo */}
            <div
              className={importStyles.mappingHeader}
            >
              <span>Columnas del Archivo de Origen</span>
              <span></span>
              <span>Campos del Sistema ({currentEntity.displayName})</span>
            </div>

            {/* Filas de mapeo */}
            {previewData?.headers.map((header, idx) => {
              const currentMappedField = columnMapping[header] || 'Ignore';
              const isMapped = currentMappedField !== 'Ignore' && currentMappedField !== 'NotMapped';
              const sampleVal = previewData.sampleRows?.[0]?.[idx] || '';

              return (
                <div key={header} className={styles.mappingRow}>
                  {/* Columna Izquierda: Encabezado de tu Excel + Muestra de datos */}
                  <div className={importStyles.overflowHidden}>
                    <Text weight="semibold" size={200} className={importStyles.blockText}>
                      {header}
                    </Text>
                    {sampleVal && (
                      <span className={styles.sampleText} title={`Muestra: ${sampleVal}`}>
                        Ej: {sampleVal}
                      </span>
                    )}
                  </div>

                  {/* Icono de Estado */}
                  <div className={importStyles.centered}>
                    {isMapped ? (
                      <Tooltip content="Mapeado correctamente" relationship="description">
                        <span className={styles.statusIconMapped}>
                          <CheckmarkCircle16Filled />
                        </span>
                      </Tooltip>
                    ) : (
                      <Tooltip content="Columna ignorada (no se importará)" relationship="description">
                        <span className={styles.statusIconUnmapped}>
                          <Alert16Filled />
                        </span>
                      </Tooltip>
                    )}
                  </div>

                  {/* Columna Derecha: Dropdown con campos del sistema */}
                  <Select
                    value={currentMappedField}
                    size="small"
                    onChange={(_, data) => {
                      setColumnMapping((prev) => ({
                        ...prev,
                        [header]: data.value,
                      }));
                    }}
                  >
                    <option value="Ignore">Ignorar (No importar)</option>
                    <option disabled>──────────────</option>

                    {/* Campos Principales / Obligatorios primero */}
                    <optgroup label="Campos Obligatorios Principales *">
                      {currentEntity.fields
                        .filter((f) => f.isRequired)
                        .map((f) => (
                          <option key={f.systemName} value={f.systemName}>
                            {f.displayName}
                          </option>
                        ))}
                    </optgroup>

                    {/* Campos Opcionales */}
                    <optgroup label="Campos Opcionales">
                      {currentEntity.fields
                        .filter((f) => !f.isRequired)
                        .map((f) => (
                          <option key={f.systemName} value={f.systemName}>
                            {f.displayName}
                          </option>
                        ))}
                    </optgroup>
                  </Select>
                </div>
              );
            })}
          </div>
        )}

        {/* PASO 3: TRATAMIENTO DE DUPLICADOS & REVISIÓN FINAL */}
        {currentStep === 3 && (
          <div className={styles.settingsCard}>
            <div className={styles.sectionTitle}>Tratamiento de Registros Duplicados</div>
            <Text size={200} className={importStyles.muted}>
              Determine cómo debe actuar el sistema si encuentra registros que ya existen según el identificador ({currentEntity?.primaryKeyField}).
            </Text>

            <div className={styles.formRow}>
              <Text size={200} weight="semibold">Modo de Tratamiento de Duplicados</Text>
              <Select
                value={duplicateMode}
                onChange={(_, d) => setDuplicateMode(d.value)}
                size="small"
              >
                <option value="Upsert">Actualizar registros existentes (Upsert)</option>
                <option value="Skip">Omitir duplicados (No modificar ni fallar)</option>
                <option value="Error">Rechazar duplicados (Marcar como fila fallida)</option>
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
              icon={<ArrowRight16Regular />}
              iconPosition="after"
              disabled={!selectedFile || !previewData || analyzingFile}
              onClick={() => setCurrentStep(2)}
            >
              Siguiente (Mapeo)
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
              icon={<ArrowRight16Regular />}
              iconPosition="after"
              disabled={unmappedRequired.length > 0}
              onClick={() => setCurrentStep(3)}
            >
              Siguiente (Ajustes)
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
