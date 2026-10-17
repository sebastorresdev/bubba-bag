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
import { UnidadMedidaService } from '../unidades-medida/services/unidadMedida.service';
import type { UnidadMedidaDto } from '../unidades-medida/types/unidadMedida.types';
import type { LineaCompraForm } from './ProductosCompraGrid';

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
    fontSize: tokens.fontSizeBase200,
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
  tableWrapper: {
    maxHeight: '260px',
    overflowY: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  codeFont: {
    fontFamily: tokens.fontFamilyMonospace,
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
    nombreVisible: 'Código / SKU',
    requerido: true,
    sinonimos: ['codigo', 'sku', 'codigo de producto', 'codigo producto', 'cod_producto', 'cod producto', 'item', 'referencia'],
  },
  {
    id: 'cantidad',
    nombreVisible: 'Cantidad',
    requerido: true,
    sinonimos: ['cantidad', 'esperado', 'cant', 'qty', 'cantidad esperada', 'procesado'],
  },
  {
    id: 'serie',
    nombreVisible: 'Número de Serie',
    requerido: false,
    sinonimos: ['serie', 'numero de serie', 'numero serie', 'series', 'serial', 'sn', 'nro serie', 'n serie'],
  },
  {
    id: 'producto',
    nombreVisible: 'Descripción del producto',
    requerido: false,
    sinonimos: ['descripcion', 'nombre', 'descripcion de producto', 'descripcion producto', 'producto', 'articulo', 'detalle'],
  },
  {
    id: 'costo',
    nombreVisible: 'Costo unitario',
    requerido: false,
    sinonimos: ['costo', 'costo unitario', 'precio', 'precio unitario', 'p.u.', 'pu', 'p unitario', 'costo unit'],
  },
  {
    id: 'uom',
    nombreVisible: 'Unidad de medida',
    requerido: false,
    sinonimos: ['unidad de medida', 'unidad', 'uom', 'und', 'medida', 'um'],
  },
];

interface FilaConsolidada {
  sku: string;
  nombre: string;
  cantidad: number;
  costo: number;
  uom: string;
  unidadMedidaId?: string;
  factorConversion?: number;
  series: string[];
  productoId?: string;
  encontradoEnCatalogo: boolean;
  productoOriginal?: ProductoDto;
  esValida: boolean;
  motivoRechazo?: string;
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
  const [resumenCarga, setResumenCarga] = useState<{
    totalValidas: number;
    totalRechazadas: number;
    totalUnidades: number;
    totalSeries: number;
  } | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mapeo automático estrictamente estándar por nombre canónico
  const ejecutarMapeoInteligente = (columnas: string[]) => {
    const mapeo: Record<string, string> = {};
    const camposUsados = new Set<string>();

    columnas.forEach((col) => {
      const normCol = normalizar(col);
      for (const campo of CAMPOS_DESTINO) {
        if (camposUsados.has(campo.id)) continue;
        const normId = normalizar(campo.id);
        const normVis = normalizar(campo.nombreVisible);
        const coincide = campo.sinonimos.some((s) => normalizar(s) === normCol);

        if (normCol === normId || normCol === normVis || coincide) {
          mapeo[col] = campo.id;
          camposUsados.add(campo.id);
          break;
        }
      }
    });

    setColumnMapping(mapeo);
  };

  const handleFileChange = async (file: File) => {
    try {
      setAnalizando(true);
      setError(null);
      setSelectedFile(file);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('El archivo no contiene hojas con datos.');
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (json.length === 0) {
        throw new Error('El archivo seleccionado está vacío.');
      }

      // Detectar fila de cabecera
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

      const headerRow = json[headerRowIndex].map((h, idx) => String(h || `Columna_${idx + 1}`).trim());
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo seleccionado.');
    } finally {
      setAnalizando(false);
    }
  };

  // Consolidar filas para la vista previa del paso 3
  const consolidarFilas = async () => {
    const colSku = Object.entries(columnMapping).find(([, campo]) => campo === 'sku')?.[0];
    const colCant = Object.entries(columnMapping).find(([, campo]) => campo === 'cantidad')?.[0];
    const colSerie = Object.entries(columnMapping).find(([, campo]) => campo === 'serie')?.[0];
    const colProd = Object.entries(columnMapping).find(([, campo]) => campo === 'producto')?.[0];
    const colCosto = Object.entries(columnMapping).find(([, campo]) => campo === 'costo')?.[0];
    const colUom = Object.entries(columnMapping).find(([, campo]) => campo === 'uom')?.[0];

    if (!colSku || !colCant) {
      setError('Debe mapear los campos obligatorios: Código / SKU y Cantidad esperada.');
      return false;
    }

    // Consultar el catálogo maestro para validación estricta de SKUs y unidades de medida
    let catalogo = productosExistentes;
    let unidadesMedida: UnidadMedidaDto[] = [];
    try {
      const [dbProductos, dbUnidades] = await Promise.all([
        ProductoService.getProductos(undefined, undefined, true).catch(() => []),
        UnidadMedidaService.getUnidadesMedida(undefined, true).catch(() => []),
      ]);
      if (dbProductos && dbProductos.length > 0) {
        catalogo = dbProductos;
      }
      if (dbUnidades && dbUnidades.length > 0) {
        unidadesMedida = dbUnidades;
      }
    } catch {
      // continuar con productos cargados en memoria
    }

    const clean = (s?: string | null) => (s || '').toLowerCase().replace(/[\s_\-]/g, '').trim();

    const mapaAgrupado = new Map<string, FilaConsolidada>();

    for (const r of rawRows) {
      const rawSku = String(r[colSku] ?? '').trim();
      if (!rawSku) continue;

      let cant = Number(r[colCant]);
      if (isNaN(cant) || cant <= 0) cant = 1;

      const serieRaw = colSerie ? String(r[colSerie] ?? '').trim() : '';
      const prodNombre = colProd ? String(r[colProd] ?? '').trim() : '';
      const costoVal = colCosto ? Number(r[colCosto]) || 0 : 0;
      const rawUom = colUom ? String(r[colUom] ?? '').trim() : '';

      const match = catalogo.find(
        (p) => clean(p.codigo) === clean(rawSku)
      );

      // 1. Validación de Producto en el Catálogo Maestro
      if (!match) {
        const keyErr = `ERR_${rawSku.toUpperCase()}__${clean(rawUom)}`;
        let filaErr = mapaAgrupado.get(keyErr);
        if (!filaErr) {
          filaErr = {
            sku: rawSku,
            nombre: prodNombre || rawSku,
            cantidad: 0,
            costo: costoVal,
            uom: rawUom || '---',
            series: [],
            encontradoEnCatalogo: false,
            esValida: false,
            motivoRechazo: `El SKU '${rawSku}' no existe en el catálogo maestro.`,
          };
          mapaAgrupado.set(keyErr, filaErr);
        }
        if (serieRaw) filaErr.series.push(serieRaw);
        filaErr.cantidad += cant;
        continue;
      }

      // 2. Validación de Unidad de Medida contra el Grupo de Unidades del Producto
      const unidadesGrupo = unidadesMedida.filter(
        (u) => u.grupoUnidadMedidaId === match.grupoUnidadMedidaId
      );

      let uId: string | undefined = undefined;
      let uNombre = rawUom;
      let factor = 1;
      let uValida = true;
      let motivoUom = '';

      if (rawUom) {
        const uMatch = unidadesGrupo.find(
          (u) => clean(u.nombre) === clean(rawUom)
        );
        const esDefecto = match.nombreUnidadMedidaDefecto && clean(match.nombreUnidadMedidaDefecto) === clean(rawUom);

        if (uMatch) {
          uId = uMatch.id;
          uNombre = uMatch.nombre;
          factor = uMatch.factorConversionTotal || 1;
        } else if (esDefecto) {
          uId = match.unidadMedidaDefectoId || undefined;
          uNombre = match.nombreUnidadMedidaDefecto || rawUom;
          factor = 1;
        } else {
          uValida = false;
          const permitidas = unidadesGrupo.map((u) => u.nombre).join(', ') || match.nombreUnidadMedidaDefecto || 'Ninguna configurada';
          motivoUom = `La unidad '${rawUom}' no es válida para el producto '${match.nombre}'. Unidades autorizadas en catálogo: [${permitidas}].`;
        }
      } else {
        // El archivo no especificó columna de unidad: tomar la unidad oficial por defecto del producto
        if (match.nombreUnidadMedidaDefecto) {
          uId = match.unidadMedidaDefectoId || undefined;
          uNombre = match.nombreUnidadMedidaDefecto;
          factor = 1;
        } else {
          uValida = false;
          motivoUom = `El producto '${match.nombre}' no tiene unidad de medida configurada en el catálogo y el archivo no la incluye.`;
        }
      }

      const key = `${match.codigo.toUpperCase()}__${clean(uNombre)}`;
      let existente = mapaAgrupado.get(key);

      if (!existente) {
        existente = {
          sku: match.codigo,
          nombre: match.nombre || prodNombre || rawSku,
          cantidad: 0,
          costo: costoVal,
          uom: uNombre,
          unidadMedidaId: uId,
          factorConversion: factor,
          series: [],
          productoId: match.id,
          encontradoEnCatalogo: true,
          productoOriginal: match,
          esValida: uValida,
          motivoRechazo: uValida ? undefined : motivoUom,
        };
        mapaAgrupado.set(key, existente);
      }

      if (serieRaw) {
        if (!existente.series.includes(serieRaw)) {
          existente.series.push(serieRaw);
        } else {
          existente.esValida = false;
          existente.motivoRechazo = `La serie '${serieRaw}' se encuentra duplicada en el archivo para este producto.`;
        }
        existente.cantidad = existente.series.length;
      } else {
        existente.cantidad += cant;
      }

      if (existente.costo === 0 && costoVal > 0) existente.costo = costoVal;
    }

    const listado = Array.from(mapaAgrupado.values());
    if (listado.length === 0) {
      setError('No se pudo consolidar ninguna línea válida a partir del mapeo seleccionado.');
      return false;
    }

    // Regla de validación de serialización e integridad
    listado.forEach((fila) => {
      if (!fila.esValida) return; // Ya fue rechazada por producto o unidad

      if (fila.productoOriginal?.esSerializado) {
        if (fila.series.length === 0) {
          fila.esValida = false;
          fila.motivoRechazo = 'El producto es serializado en el catálogo maestro pero el archivo no contiene números de serie.';
        } else if (fila.cantidad !== fila.series.length) {
          fila.esValida = false;
          fila.motivoRechazo = `La cantidad esperada (${fila.cantidad}) no coincide con el número de series registradas (${fila.series.length}).`;
        }
      } else if (fila.productoOriginal && !fila.productoOriginal.esSerializado && fila.series.length > 0) {
        fila.esValida = false;
        fila.motivoRechazo = 'El producto está registrado como NO serializado en el catálogo, pero el archivo contiene números de serie.';
      }
    });

    setFilasConsolidadas(listado);
    return true;
  };

  const handleCargarLineas = () => {
    try {
      setProcesando(true);
      setError(null);

      const filasValidas = filasConsolidadas.filter((f) => f.esValida && f.productoId);

      if (filasValidas.length === 0) {
        throw new Error('Ningún producto del archivo cumple con las validaciones del catálogo maestro. Las filas han sido rechazadas.');
      }

      const prodsUtilizados = filasValidas
        .map((f) => f.productoOriginal)
        .filter((p): p is ProductoDto => Boolean(p));

      const lineasFinales: LineaCompraForm[] = filasValidas.map((item) => ({
        clave: crypto.randomUUID(),
        productoId: item.productoId!,
        productoNombre: item.nombre,
        productoCodigo: item.sku,
        cantidad: String(item.cantidad),
        costo: String(item.costo || 0),
        series: item.series.join('\n'),
        factorConversion: item.factorConversion || 1,
        unidadMedidaId: item.unidadMedidaId,
        unidadMedidaNombre: item.uom,
      }));

      onImportarLineas(lineasFinales, prodsUtilizados);

      setResumenCarga({
        totalValidas: filasValidas.length,
        totalRechazadas: filasRechazadas.length,
        totalUnidades: totalUnidadesValidas,
        totalSeries: totalSeriesValidas,
      });

      setCurrentStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las líneas a la orden.');
    } finally {
      setProcesando(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setSelectedFile(null);
    setHeaders([]);
    setRawRows([]);
    setColumnMapping({});
    setFilasConsolidadas([]);
    setResumenCarga(null);
    setError(null);
    onOpenChange(false);
  };

  const camposRequeridosSinAsignar = useMemo(() => {
    const asignados = new Set(Object.values(columnMapping));
    return CAMPOS_DESTINO.filter((c) => c.requerido && !asignados.has(c.id));
  }, [columnMapping]);

  const filasValidas = useMemo(() => {
    return filasConsolidadas.filter((f) => f.esValida);
  }, [filasConsolidadas]);

  const filasRechazadas = useMemo(() => {
    return filasConsolidadas.filter((f) => !f.esValida);
  }, [filasConsolidadas]);

  const totalSeriesValidas = useMemo(() => {
    return filasValidas.reduce((acc, f) => acc + f.series.length, 0);
  }, [filasValidas]);

  const totalUnidadesValidas = useMemo(() => {
    return filasValidas.reduce((acc, f) => acc + f.cantidad, 0);
  }, [filasValidas]);

  const renderFieldMapping = (campo: CampoSistema) => {
    const sourceHeader = Object.entries(columnMapping).find(
      ([, idDestino]) => idDestino === campo.id
    )?.[0] || '';

    const primerValor = sourceHeader && rawRows[0] ? String(rawRows[0][sourceHeader] ?? '') : '';

    return (
      <div key={campo.id} className={styles.mappingRow}>
        <div className={importStyles.overflowHidden}>
          <Select
            value={sourceHeader}
            size="medium"
            aria-label={`Columna de origen para ${campo.nombreVisible}`}
            onChange={(_, data) => {
              setColumnMapping((prev) => {
                const next = { ...prev };
                Object.keys(next).forEach((h) => {
                  if (next[h] === campo.id) delete next[h];
                });
                if (data.value) next[data.value] = campo.id;
                return next;
              });
            }}
          >
            <option value="">Sin asignar</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </Select>
        </div>

        <div className={importStyles.centered}>
          {sourceHeader ? (
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
          <Text weight="semibold" size={200} className={importStyles.blockText}>
            {campo.nombreVisible}
          </Text>
          <span className={styles.sampleText}>
            {primerValor ? `Ejemplo: ${primerValor}` : campo.requerido ? 'Campo obligatorio' : 'Campo opcional'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <OverlayDrawer
      open={open}
      position="end"
      className={styles.drawer}
      onOpenChange={(_, state) => {
        if (!state.open) handleClose();
      }}
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
        {error && (
          <D365MessageBar intent="error" onDismiss={() => setError(null)}>
            {error}
          </D365MessageBar>
        )}

        {/* PASO 1: SELECCIÓN DE ARCHIVO */}
        {currentStep === 1 && (
          <>
            <div className={styles.formRow}>
              <label htmlFor="archivo-importacion-orden">Archivo</label>
              <input
                id="archivo-importacion-orden"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.txt,.html,.htm"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFileChange(file);
                }}
              />
              {selectedFile && (
                <small>
                  {selectedFile.name} · {(selectedFile.size / 1024).toFixed(1)} KB · {headers.length} columnas
                </small>
              )}
            </div>

            {analizando && (
              <div className={importStyles.analysisRow}>
                <Spinner size="tiny" />
                <Text size={200}>Analizando estructura del archivo...</Text>
              </div>
            )}
          </>
        )}

        {/* PASO 2: MAPEO INTELIGENTE DE CAMPOS */}
        {currentStep === 2 && (
          <div className={styles.mappingContainer}>
            {camposRequeridosSinAsignar.length > 0 && (
              <D365MessageBar intent="warning" title="Campos obligatorios requeridos">
                Debe mapear los siguientes campos: {camposRequeridosSinAsignar.map((f) => f.nombreVisible).join(', ')}.
              </D365MessageBar>
            )}

            <div className={styles.mappingSection}>
              <div className={styles.mappingSectionTitle}>
                <Text weight="semibold" size={300}>
                  Mapeo obligatorio
                </Text>
              </div>
              <div className={importStyles.mappingHeader}>
                <span>Columna del archivo</span>
                <span />
                <span>Campo del sistema</span>
              </div>
              {CAMPOS_DESTINO.filter((campo) => campo.requerido).map(renderFieldMapping)}
            </div>

            <div className={styles.mappingSectionOptional}>
              <div className={styles.mappingSectionTitle}>
                <Text weight="semibold" size={300}>
                  Mapeo opcional
                </Text>
              </div>
              <div className={importStyles.mappingHeader}>
                <span>Columna del archivo</span>
                <span />
                <span>Campo del sistema</span>
              </div>
              {CAMPOS_DESTINO.filter((campo) => !campo.requerido).map(renderFieldMapping)}
            </div>
          </div>
        )}

        {/* PASO 3: REVISIÓN Y VISTA PREVIA FINAL */}
        {currentStep === 3 && (
          <div className={styles.settingsCard}>
            <div className={styles.sectionTitle}>
              Resumen de Productos Consolidados
            </div>

            <div className={importStyles.metricsGrid}>
              <div className={importStyles.metricCard}>
                <Text size={600} weight="bold" style={{ color: tokens.colorPaletteGreenForeground1 }}>
                  {filasValidas.length}
                </Text>
                <br />
                <Text size={100} className={importStyles.muted}>Válidas</Text>
              </div>

              <div className={importStyles.metricCard}>
                <Text
                  size={600}
                  weight="bold"
                  style={{ color: filasRechazadas.length > 0 ? tokens.colorPaletteRedForeground1 : tokens.colorNeutralForeground3 }}
                >
                  {filasRechazadas.length}
                </Text>
                <br />
                <Text size={100} className={importStyles.muted}>Rechazadas</Text>
              </div>

              <div className={importStyles.metricCard}>
                <Text size={600} weight="bold">
                  {totalUnidadesValidas.toLocaleString('es-PE')}
                </Text>
                <br />
                <Text size={100} className={importStyles.muted}>Unidades válidas</Text>
              </div>

              <div className={importStyles.metricCard}>
                <Text size={600} weight="bold">
                  {totalSeriesValidas.toLocaleString('es-PE')}
                </Text>
                <br />
                <Text size={100} className={importStyles.muted}>Series válidas</Text>
              </div>
            </div>

            {filasRechazadas.length > 0 && (
              <D365MessageBar intent={filasValidas.length === 0 ? 'error' : 'warning'}>
                {filasValidas.length === 0
                  ? 'Ningún producto del archivo existe en el catálogo maestro. Todas las filas han sido rechazadas. Registre primero los productos en el Catálogo de Productos antes de importarlos.'
                  : `Se detectaron ${filasRechazadas.length} producto(s) no registrados en el catálogo maestro. Estas filas fueron rechazadas y no se cargarán a la orden.`}
              </D365MessageBar>
            )}

            <div className={styles.tableWrapper}>
              <Table size="small" style={{ minWidth: '550px' }}>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell style={{ width: '90px', minWidth: '90px' }}>Código / SKU</TableHeaderCell>
                    <TableHeaderCell style={{ minWidth: '130px' }}>Descripción</TableHeaderCell>
                    <TableHeaderCell style={{ width: '55px', minWidth: '55px', textAlign: 'right' }}>Cant.</TableHeaderCell>
                    <TableHeaderCell style={{ width: '85px', minWidth: '85px' }}>Unidad</TableHeaderCell>
                    <TableHeaderCell style={{ width: '90px', minWidth: '90px' }}>Series</TableHeaderCell>
                    <TableHeaderCell style={{ width: '95px', minWidth: '95px' }}>Catálogo</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filasConsolidadas.map((f, i) => {
                    const rechazada = !f.esValida;
                    return (
                      <TableRow
                        key={i}
                        style={rechazada ? { opacity: 0.8, backgroundColor: tokens.colorNeutralBackground3 } : undefined}
                      >
                        <TableCell>
                          <TableCellLayout>
                            <span
                              className={styles.codeFont}
                              style={rechazada ? { textDecoration: 'line-through' } : undefined}
                            >
                              {f.sku}
                            </span>
                          </TableCellLayout>
                        </TableCell>
                        <TableCell>
                          <TableCellLayout truncate>
                            <div>
                              <Text size={200} weight={rechazada ? 'medium' : 'regular'}>{f.nombre}</Text>
                              {rechazada && f.motivoRechazo && (
                                <Text size={100} style={{ color: tokens.colorPaletteRedForeground1, display: 'block', marginTop: '2px', whiteSpace: 'normal' }}>
                                  ⚠️ {f.motivoRechazo}
                                </Text>
                              )}
                            </div>
                          </TableCellLayout>
                        </TableCell>
                        <TableCell style={{ textAlign: 'right' }}>
                          <TableCellLayout style={{ justifyContent: 'flex-end' }}>
                            <Text weight="semibold" size={200}>{f.cantidad}</Text>
                          </TableCellLayout>
                        </TableCell>
                        <TableCell>
                          <TableCellLayout>
                            <Badge appearance={rechazada ? 'outline' : 'tint'} size="small" color={rechazada ? 'danger' : 'subtle'}>
                              {f.uom || '—'}
                              {Boolean(f.factorConversion && f.factorConversion > 1) ? ` (x${f.factorConversion})` : ''}
                            </Badge>
                          </TableCellLayout>
                        </TableCell>
                        <TableCell>
                          <TableCellLayout>
                            {f.series.length > 0 ? (
                              <Tooltip content={`Series: ${f.series.slice(0, 5).join(', ')}${f.series.length > 5 ? '...' : ''}`} relationship="description">
                                <Badge appearance="tint" color={rechazada ? 'subtle' : 'brand'} icon={<BarcodeScanner20Regular />}>
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
                            {rechazada ? (
                              <Tooltip content={f.motivoRechazo || 'Fila rechazada'} relationship="description">
                                <Badge appearance="tint" color="danger">Rechazado</Badge>
                              </Tooltip>
                            ) : (
                              <Badge appearance="tint" color="success">Existe</Badge>
                            )}
                          </TableCellLayout>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* PASO 4: RESULTADO DE LA CARGA */}
        {currentStep === 4 && resumenCarga && (
          <div className={importStyles.resultColumn}>
            <D365MessageBar
              intent={resumenCarga.totalRechazadas === 0 ? 'success' : 'warning'}
              title={
                resumenCarga.totalRechazadas === 0
                  ? 'Productos cargados exitosamente a la orden'
                  : 'Productos cargados con líneas rechazadas'
              }
            >
              Se cargaron {resumenCarga.totalValidas} producto(s) a la orden de compra
              ({resumenCarga.totalUnidades.toLocaleString('es-PE')} unidades
              {resumenCarga.totalSeries > 0 ? ` y ${resumenCarga.totalSeries.toLocaleString('es-PE')} series registradas` : ''}).
              {resumenCarga.totalRechazadas > 0 &&
                ` ${resumenCarga.totalRechazadas} producto(s) fueron rechazados por no encontrarse en el catálogo maestro.`}
            </D365MessageBar>

            <div className={importStyles.resultMetricsGrid}>
              <div className={importStyles.metricCard}>
                <Text size={600} weight="bold" className={importStyles.success}>
                  {resumenCarga.totalValidas}
                </Text>
                <br />
                <Text size={100} className={importStyles.muted}>
                  Cargados
                </Text>
              </div>

              <div className={importStyles.metricCard}>
                <Text
                  size={600}
                  weight="bold"
                  className={resumenCarga.totalRechazadas > 0 ? importStyles.danger : undefined}
                >
                  {resumenCarga.totalRechazadas}
                </Text>
                <br />
                <Text size={100} className={importStyles.muted}>
                  Rechazados
                </Text>
              </div>

              <div className={importStyles.metricCard}>
                <Text size={600} weight="bold">
                  {resumenCarga.totalUnidades.toLocaleString('es-PE')}
                </Text>
                <br />
                <Text size={100} className={importStyles.muted}>
                  Unidades
                </Text>
              </div>

              <div className={importStyles.metricCard}>
                <Text size={600} weight="bold">
                  {resumenCarga.totalSeries.toLocaleString('es-PE')}
                </Text>
                <br />
                <Text size={100} className={importStyles.muted}>
                  Series
                </Text>
              </div>
            </div>

            <div className={styles.settingsCard}>
              <div className={styles.sectionTitle}>
                Estado en la Orden
              </div>
              <Text size={200} className={importStyles.muted}>
                Los productos ya fueron volcados a la tabla de productos de la orden de compra. Puede visualizarlos, verificar sus series haciendo clic en el badge de series de cada producto, y ajustar cantidades o costos si lo requiere antes de guardar.
              </Text>
            </div>
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
              disabled={!selectedFile || headers.length === 0 || analizando}
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
              disabled={camposRequeridosSinAsignar.length > 0}
              onClick={async () => {
                const ok = await consolidarFilas();
                if (ok) setCurrentStep(3);
              }}
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
              disabled={procesando}
              onClick={() => setCurrentStep(2)}
            >
              Atrás
            </Button>
            <Button
              appearance="primary"
              icon={<Checkmark16Regular />}
              disabled={procesando || filasValidas.length === 0}
              onClick={() => void handleCargarLineas()}
            >
              {procesando ? (
                <Spinner size="tiny" label="Cargando productos..." />
              ) : filasValidas.length > 0 ? (
                `Cargar ${filasValidas.length} producto(s) válidos`
              ) : (
                'Sin productos válidos'
              )}
            </Button>
          </>
        )}

        {currentStep === 4 && (
          <Button appearance="primary" onClick={handleClose} className={importStyles.rightAligned}>
            Aceptar y ver en la orden
          </Button>
        )}
      </DrawerFooter>
    </OverlayDrawer>
  );
};
