import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  DrawerFooter,
  Button,
  Select,
  Text,
  Badge,
  Spinner,
  tokens,
  makeStyles,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableCellLayout,
  Tooltip,
} from '@fluentui/react-components';
import {
  DismissRegular,
  ArrowUpload16Regular,
  CheckmarkCircle16Filled,
  Alert16Filled,
  ArrowLeft16Regular,
  BarcodeScanner20Regular,
  Checkmark16Regular,
} from '@fluentui/react-icons';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { useD365ImportStyles } from '../../../styles/d365ImportStyles';
import { semanticTokens } from '../../../styles/semanticTokens';
import { ProductoService } from '../productos/services/producto.service';
import type { ProductoDto } from '../productos/types/producto.types';
import type { LineaCompraForm } from './ProductosCompraGrid';

const useStyles = makeStyles({
  drawer: {
    width: '640px',
    maxWidth: '96vw',
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
    borderBottom: `2px dashed ${tokens.colorBrandStroke1}`,
    borderLeft: `2px dashed ${tokens.colorBrandStroke1}`,
    borderRight: `2px dashed ${tokens.colorBrandStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '32px 16px',
    textAlign: 'center',
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    ':hover': {
      backgroundColor: tokens.colorBrandBackground2,
    },
  },
  mappingRow: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 28px 1.4fr',
    '@media (max-width: 767px)': { gridTemplateColumns: 'minmax(0, 1fr)', '& > :nth-child(2)': { display: 'none' } },
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
  sampleText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '10px',
  },
  metricCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  tableWrapper: {
    maxHeight: '320px',
    overflowY: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  codeFont: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: '12px',
    fontWeight: tokens.fontWeightSemibold,
  },
});

export interface ImportarProductosCompraDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productosExistentes: ProductoDto[];
  onImportarLineas: (lineas: LineaCompraForm[], nuevosProductos?: ProductoDto[]) => void;
}

interface CampoSistema {
  id: string;
  nombreVisible: string;
  requerido: boolean;
  sinonimos: string[];
}

const CAMPOS_DESTINO: CampoSistema[] = [
  {
    id: 'sku',
    nombreVisible: 'Código / SKU de producto',
    requerido: true,
    sinonimos: ['sku', 'codigo', 'código', 'cod', 'item', 'material', 'ref'],
  },
  {
    id: 'cantidad',
    nombreVisible: 'Cantidad / Esperado',
    requerido: true,
    sinonimos: ['esperado', 'cantidad', 'cant', 'qty', 'unidades', 'cant.'],
  },
  {
    id: 'serie',
    nombreVisible: 'Número de Serie',
    requerido: false,
    sinonimos: ['serie', 'series', 'numero de serie', 'número de serie', 'serial', 'sn', 's/n'],
  },
  {
    id: 'producto',
    nombreVisible: 'Descripción / Producto',
    requerido: false,
    sinonimos: ['producto', 'descripcion', 'descripción', 'nombre', 'detalle'],
  },
  {
    id: 'costo',
    nombreVisible: 'Costo unitario',
    requerido: false,
    sinonimos: ['costo', 'costo unitario', 'precio', 'valor', 'unit price'],
  },
  {
    id: 'uom',
    nombreVisible: 'Unidad de medida',
    requerido: false,
    sinonimos: ['uom', 'unidad', 'um', 'und', 'unidad de medida'],
  },
];

interface FilaConsolidada {
  sku: string;
  nombre: string;
  cantidad: number;
  costo: number;
  uom: string;
  series: string[];
  productoId?: string;
  encontradoEnCatalogo: boolean;
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const ImportarProductosCompraDrawer: React.FC<ImportarProductosCompraDrawerProps> = ({
  open,
  onOpenChange,
  productosExistentes,
  onImportarLineas,
}) => {
  const styles = useStyles();
  const importStyles = useD365ImportStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({}); // Header -> campoSistemaId
  const [filasConsolidadas, setFilasConsolidadas] = useState<FilaConsolidada[]>([]);
  const [analizando, setAnalizando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mapeador inteligente en 2 fases (exacto y aproximado)
  const ejecutarMapeoInteligente = (columnas: string[]) => {
    const mapeo: Record<string, string> = {};
    const camposUsados = new Set<string>();

    // Fase 1: Coincidencia exacta o sinónimo exacto
    columnas.forEach((col) => {
      const normCol = normalizar(col);
      for (const campo of CAMPOS_DESTINO) {
        if (camposUsados.has(campo.id)) continue;
        const normId = normalizar(campo.id);
        const normVis = normalizar(campo.nombreVisible);
        const coincideSinonimo = campo.sinonimos.some((s) => normalizar(s) === normCol);

        if (normCol === normId || normCol === normVis || coincideSinonimo) {
          mapeo[col] = campo.id;
          camposUsados.add(campo.id);
          break;
        }
      }
    });

    // Fase 2: Coincidencia aproximada/parcial para columnas no asignadas
    columnas.forEach((col) => {
      if (mapeo[col]) return;
      const normCol = normalizar(col);

      for (const campo of CAMPOS_DESTINO) {
        if (camposUsados.has(campo.id)) continue;
        const coincideParcial = campo.sinonimos.some((s) => {
          const normS = normalizar(s);
          if (normS.length < 3) return false;
          return normCol.includes(normS) || normS.includes(normCol);
        });

        if (coincideParcial) {
          mapeo[col] = campo.id;
          camposUsados.add(campo.id);
          break;
        }
      }
    });

    setColumnMapping(mapeo);
  };

  const procesarArchivo = async (file: File) => {
    try {
      setAnalizando(true);
      setError(null);
      setSelectedFile(file);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('El archivo no contiene hojas de cálculo con datos.');
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (json.length === 0) {
        throw new Error('El archivo seleccionado está vacío.');
      }

      // Encontrar fila de encabezado
      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(json.length, 10); i++) {
        const row = json[i];
        if (Array.isArray(row) && row.some((c) => {
          const s = String(c).toLowerCase();
          return s.includes('sku') || s.includes('codigo') || s.includes('producto') || s.includes('recepcion') || s.includes('serie');
        })) {
          headerRowIndex = i;
          break;
        }
      }

      const headerRow = json[headerRowIndex].map((h, idx) => String(h || `Col_${idx + 1}`).trim());
      const dataRows = json.slice(headerRowIndex + 1);

      const rows: Record<string, any>[] = [];
      dataRows.forEach((row) => {
        if (!Array.isArray(row) || row.every((c) => c === '' || c === null || c === undefined)) return;
        const obj: Record<string, any> = {};
        headerRow.forEach((colName, cIdx) => {
          obj[colName] = row[cIdx];
        });
        rows.push(obj);
      });

      if (rows.length === 0) {
        throw new Error('No se detectaron registros de datos válidos debajo del encabezado.');
      }

      setHeaders(headerRow);
      setRawRows(rows);
      ejecutarMapeoInteligente(headerRow);
      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo seleccionado.');
    } finally {
      setAnalizando(false);
    }
  };

  // Consolidar filas al pasar a Paso 3
  const consolidarFilas = async () => {
    const colSku = Object.entries(columnMapping).find(([, campo]) => campo === 'sku')?.[0];
    const colCant = Object.entries(columnMapping).find(([, campo]) => campo === 'cantidad')?.[0];
    const colSerie = Object.entries(columnMapping).find(([, campo]) => campo === 'serie')?.[0];
    const colProd = Object.entries(columnMapping).find(([, campo]) => campo === 'producto')?.[0];
    const colCosto = Object.entries(columnMapping).find(([, campo]) => campo === 'costo')?.[0];
    const colUom = Object.entries(columnMapping).find(([, campo]) => campo === 'uom')?.[0];

    if (!colSku || !colCant) {
      setError('Debe asignar obligatoriamente las columnas de SKU / Código y Cantidad / Esperado.');
      return false;
    }

    const mapaAgrupado = new Map<string, FilaConsolidada>();

    for (const r of rawRows) {
      const rawSku = String(r[colSku] ?? '').trim();
      if (!rawSku) continue;

      let cant = Number(r[colCant]);
      if (isNaN(cant) || cant <= 0) cant = 1;

      const serieRaw = colSerie ? String(r[colSerie] ?? '').trim() : '';
      const prodNombre = colProd ? String(r[colProd] ?? '').trim() : '';
      const costoVal = colCosto ? Number(r[colCosto]) || 0 : 0;
      const uomVal = colUom ? String(r[colUom] ?? '').trim() : 'UND';

      const key = rawSku.toUpperCase();
      let existente = mapaAgrupado.get(key);

      if (!existente) {
        // Buscar en productos ya cargados en la vista
        const match = productosExistentes.find(
          (p) => p.codigo?.trim().toUpperCase() === key
        );

        existente = {
          sku: rawSku,
          nombre: match?.nombre || prodNombre || rawSku,
          cantidad: 0,
          costo: costoVal,
          uom: uomVal,
          series: [],
          productoId: match?.id,
          encontradoEnCatalogo: Boolean(match),
        };
        mapaAgrupado.set(key, existente);
      }

      if (serieRaw) {
        if (!existente.series.includes(serieRaw)) {
          existente.series.push(serieRaw);
        }
        existente.cantidad = existente.series.length;
      } else {
        existente.cantidad += cant;
      }

      if (!existente.nombre && prodNombre) existente.nombre = prodNombre;
      if (existente.costo === 0 && costoVal > 0) existente.costo = costoVal;
    }

    const listado = Array.from(mapaAgrupado.values());
    if (listado.length === 0) {
      setError('No se pudo consolidar ninguna línea válida a partir del mapeo seleccionado.');
      return false;
    }

    setFilasConsolidadas(listado);
    return true;
  };

  const handleCargarLineas = async () => {
    try {
      setProcesando(true);
      setError(null);

      const nuevosProdsCreados: ProductoDto[] = [];
      const lineasFinales: LineaCompraForm[] = [];

      for (const item of filasConsolidadas) {
        let prodId = item.productoId;

        // Si no existe en el catálogo, buscar o auto-crear para tener un ID válido
        if (!prodId) {
          try {
            const busq = await ProductoService.buscarInventariables(item.sku);
            const coincidencia = busq.find((p) => p.codigo?.trim().toUpperCase() === item.sku.toUpperCase());

            if (coincidencia) {
              prodId = coincidencia.id;
            } else {
              // Auto-crear producto inventariable
              const nuevo = await ProductoService.createProducto({
                codigo: item.sku,
                nombre: item.nombre || item.sku,
                tipo: 'Inventario',
                esSerializado: item.series.length > 0,
                costoActual: item.costo,
                costoEstandar: item.costo,
                precioBase: item.costo > 0 ? item.costo * 1.2 : 0,
              });
              prodId = nuevo.id;
              const prodCompleto = await ProductoService.getProductoById(nuevo.id);
              nuevosProdsCreados.push(prodCompleto);
            }
          } catch {
            // Si falla la auto-creación, omitir o advertir
          }
        }

        if (prodId) {
          lineasFinales.push({
            clave: crypto.randomUUID(),
            productoId: prodId,
            cantidad: String(item.cantidad),
            costo: String(item.costo || 0),
            series: item.series.join('\n'),
            factorConversion: 1,
            unidadMedidaNombre: item.uom,
          });
        }
      }

      if (lineasFinales.length === 0) {
        throw new Error('No se pudo vincular ningún producto de la lista con el catálogo.');
      }

      onImportarLineas(lineasFinales, nuevosProdsCreados);
      handleCerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las líneas a la orden.');
    } finally {
      setProcesando(false);
    }
  };

  const handleCerrar = () => {
    setCurrentStep(1);
    setSelectedFile(null);
    setHeaders([]);
    setRawRows([]);
    setColumnMapping({});
    setFilasConsolidadas([]);
    setError(null);
    onOpenChange(false);
  };

  const camposRequeridosSinAsignar = useMemo(() => {
    const asignados = new Set(Object.values(columnMapping));
    return CAMPOS_DESTINO.filter((c) => c.requerido && !asignados.has(c.id));
  }, [columnMapping]);

  const totalSeries = useMemo(() => {
    return filasConsolidadas.reduce((acc, f) => acc + f.series.length, 0);
  }, [filasConsolidadas]);

  const totalUnidades = useMemo(() => {
    return filasConsolidadas.reduce((acc, f) => acc + f.cantidad, 0);
  }, [filasConsolidadas]);

  return (
    <OverlayDrawer
      open={open}
      position="end"
      className={styles.drawer}
      onOpenChange={(_, state) => {
        if (!state.open) handleCerrar();
      }}
    >
      <DrawerHeader className={styles.drawerHeader}>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Cerrar"
              icon={<DismissRegular />}
              onClick={handleCerrar}
            />
          }
        >
          <div className={importStyles.column}>
            <Text weight="semibold" size={400}>
              Importar Productos a la Orden
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
        {error && (
          <D365MessageBar intent="error" onDismiss={() => setError(null)}>
            {error}
          </D365MessageBar>
        )}

        {/* PASO 1: SELECCIÓN DE ARCHIVO */}
        {currentStep === 1 && (
          <>
            <div
              className={styles.dropZone}
              onClick={() => fileInputRef.current?.click()}
            >
              <ArrowUpload16Regular style={{ fontSize: '32px', color: tokens.colorBrandForeground1 }} />
              <Text weight="semibold" size={300}>
                Haga clic para seleccionar o arrastre el archivo
              </Text>
              <Text size={200} className={importStyles.muted}>
                Formatos compatibles: .xlsx, .xls, .csv, o archivo HTML exportado
              </Text>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.txt,.html,.htm"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void procesarArchivo(f);
                }}
              />
            </div>

            {analizando && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '16px' }}>
                <Spinner size="small" label="Analizando columnas y registros del archivo..." />
              </div>
            )}
          </>
        )}

        {/* PASO 2: MAPEO INTELIGENTE DE COLUMNAS */}
        {currentStep === 2 && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Text weight="semibold" size={300}>
                Asignación de Columnas del Archivo
              </Text>
              <Text size={200} className={importStyles.muted}>
                Verifique que las columnas del archivo correspondan a los campos de la orden.
              </Text>
            </div>

            <div className={importStyles.mappingHeader}>
              <span>Columna en archivo</span>
              <span />
              <span>Campo en la orden</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {CAMPOS_DESTINO.map((campo) => {
                const headerAsignado = Object.entries(columnMapping).find(
                  ([, idDestino]) => idDestino === campo.id
                )?.[0] || '';

                const primerValor = headerAsignado && rawRows[0] ? String(rawRows[0][headerAsignado] ?? '') : '';

                return (
                  <div key={campo.id} className={styles.mappingRow}>
                    <div className={importStyles.overflowHidden}>
                      <Select
                        value={headerAsignado}
                        size="medium"
                        aria-label={`Columna para ${campo.nombreVisible}`}
                        onChange={(_, data) => {
                          setColumnMapping((prev) => {
                            const next = { ...prev };
                            Object.keys(next).forEach((k) => {
                              if (next[k] === campo.id) delete next[k];
                            });
                            if (data.value) next[data.value] = campo.id;
                            return next;
                          });
                        }}
                      >
                        <option value="">(Sin asignar)</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      {headerAsignado ? (
                        <span className={styles.statusIconMapped}>
                          <CheckmarkCircle16Filled />
                        </span>
                      ) : (
                        <span className={styles.statusIconUnmapped}>
                          <Alert16Filled />
                        </span>
                      )}
                    </div>

                    <div className={importStyles.overflowHidden}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Text weight="semibold" size={200}>
                          {campo.nombreVisible}
                        </Text>
                        {campo.requerido && (
                          <Text size={200} style={{ color: tokens.colorPaletteRedForeground1, fontWeight: 'bold' }}>
                            *
                          </Text>
                        )}
                      </div>
                      <span className={styles.sampleText}>
                        {primerValor ? `Ej: ${primerValor}` : campo.requerido ? 'Requerido para la carga' : 'Opcional'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* PASO 3: VISTA PREVIA Y CONSOLIDACIÓN */}
        {currentStep === 3 && (
          <>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <Text size={200} className={importStyles.muted}>Líneas a cargar</Text>
                <Text weight="bold" size={500} style={{ color: tokens.colorBrandForeground1 }}>
                  {filasConsolidadas.length}
                </Text>
              </div>
              <div className={styles.metricCard}>
                <Text size={200} className={importStyles.muted}>Total unidades</Text>
                <Text weight="bold" size={500}>{totalUnidades.toLocaleString('es-PE')}</Text>
              </div>
              <div className={styles.metricCard}>
                <Text size={200} className={importStyles.muted}>Series consolidadas</Text>
                <Text weight="bold" size={500}>{totalSeries.toLocaleString('es-PE')}</Text>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <Table size="small">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell style={{ width: '130px' }}>Código / SKU</TableHeaderCell>
                    <TableHeaderCell>Descripción</TableHeaderCell>
                    <TableHeaderCell style={{ width: '70px', textAlign: 'right' }}>Cant.</TableHeaderCell>
                    <TableHeaderCell style={{ width: '110px' }}>Series</TableHeaderCell>
                    <TableHeaderCell style={{ width: '90px' }}>Catálogo</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filasConsolidadas.map((f, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <TableCellLayout>
                          <span className={styles.codeFont}>{f.sku}</span>
                        </TableCellLayout>
                      </TableCell>
                      <TableCell>
                        <TableCellLayout truncate>
                          <Text size={200}>{f.nombre}</Text>
                        </TableCellLayout>
                      </TableCell>
                      <TableCell style={{ textAlign: 'right' }}>
                        <TableCellLayout style={{ justifyContent: 'flex-end' }}>
                          <Text weight="semibold" size={200}>{f.cantidad}</Text>
                        </TableCellLayout>
                      </TableCell>
                      <TableCell>
                        <TableCellLayout>
                          {f.series.length > 0 ? (
                            <Tooltip content={`Series: ${f.series.slice(0, 5).join(', ')}${f.series.length > 5 ? '...' : ''}`} relationship="description">
                              <Badge appearance="tint" color="brand" icon={<BarcodeScanner20Regular />}>
                                {f.series.length} series
                              </Badge>
                            </Tooltip>
                          ) : (
                            <Text size={200} className={importStyles.muted}>—</Text>
                          )}
                        </TableCellLayout>
                      </TableCell>
                      <TableCell>
                        <TableCellLayout>
                          {f.encontradoEnCatalogo ? (
                            <Badge appearance="tint" color="success">Existe</Badge>
                          ) : (
                            <Badge appearance="tint" color="informative">Auto-crear</Badge>
                          )}
                        </TableCellLayout>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </DrawerBody>

      <DrawerFooter className={styles.drawerFooter}>
        <Button appearance="secondary" onClick={handleCerrar} disabled={procesando}>
          Cancelar
        </Button>

        <div style={{ display: 'flex', gap: '8px' }}>
          {currentStep > 1 && (
            <Button
              appearance="secondary"
              icon={<ArrowLeft16Regular />}
              onClick={() => setCurrentStep((s) => s - 1)}
              disabled={procesando}
            >
              Atrás
            </Button>
          )}

          {currentStep === 2 && (
            <Button
              appearance="primary"
              disabled={camposRequeridosSinAsignar.length > 0}
              onClick={async () => {
                const ok = await consolidarFilas();
                if (ok) setCurrentStep(3);
              }}
            >
              Siguiente
            </Button>
          )}

          {currentStep === 3 && (
            <Button
              appearance="primary"
              icon={<Checkmark16Regular />}
              disabled={procesando || filasConsolidadas.length === 0}
              onClick={() => void handleCargarLineas()}
            >
              {procesando ? (
                <Spinner size="tiny" label="Cargando productos..." />
              ) : (
                `Cargar ${filasConsolidadas.length} productos a la orden`
              )}
            </Button>
          )}
        </div>
      </DrawerFooter>
    </OverlayDrawer>
  );
};
