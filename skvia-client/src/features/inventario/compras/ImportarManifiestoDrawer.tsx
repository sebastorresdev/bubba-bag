import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  DrawerFooter,
  Button,
  Input,
  Select,
  Text,
  Badge,
  Spinner,
  Tab,
  TabList,
  Checkbox,
  tokens,
  makeStyles,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableCellLayout,
} from '@fluentui/react-components';
import {
  DismissRegular,
  ArrowUpload16Regular,
  CheckmarkCircle16Filled,
  Warning16Filled,
  BarcodeScanner20Regular,
  DocumentBulletList16Regular,
  Save16Regular,
  Copy16Regular,
} from '@fluentui/react-icons';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { CompraService } from './compra.service';
import type { CrearCompra, LineaCompra } from './compra.service';
import { ProductoService } from '../productos/services/producto.service';
import type { ProductoDto } from '../productos/types/producto.types';
import { AlmacenService } from '../almacenes/services/almacen.service';
import type { AlmacenDto } from '../almacenes/types/almacen.types';

const useStyles = makeStyles({
  drawer: {
    width: '780px',
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
    padding: '24px 16px',
    textAlign: 'center',
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    ':hover': {
      backgroundColor: tokens.colorBrandBackground2,
    },
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '12px',
  },
  summaryCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  tableWrapper: {
    maxHeight: '280px',
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

export interface ImportarManifiestoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (idCompra: string, numero: string) => void;
}

export interface LineaConsolidada {
  sku: string;
  nombreProducto: string;
  uom: string;
  esSerializado: boolean;
  cantidad: number;
  series: string[];
  productoId?: string;
  encontradoEnCatalogo: boolean;
}

export const ImportarManifiestoDrawer: React.FC<ImportarManifiestoDrawerProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<'archivo' | 'pegar'>('archivo');
  const [textoPegado, setTextoPegado] = useState('');
  const [cargandoCatalogos, setCargandoCatalogos] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Catálogos
  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]);
  const [productosCatalogo, setProductosCatalogo] = useState<ProductoDto[]>([]);

  // Datos extraídos del manifiesto
  const [numeroRecepcion, setNumeroRecepcion] = useState('');
  const [fechaAlta, setFechaAlta] = useState(() => new Date().toISOString().slice(0, 10));
  const [origenProveedor, setOrigenProveedor] = useState('DirecTV');
  const [almacenDestinoId, setAlmacenDestinoId] = useState('');
  const [estadoInicial, setEstadoInicial] = useState<'Enviada' | 'Borrador'>('Enviada');
  const [crearProductosFaltantes, setCrearProductosFaltantes] = useState(true);

  // Líneas consolidadas procesadas
  const [lineasConsolidadas, setLineasConsolidadas] = useState<LineaConsolidada[]>([]);
  const [archivoNombre, setArchivoNombre] = useState<string | null>(null);

  // Carga de almacenes y productos del sistema
  useEffect(() => {
    if (!open) return;
    let activo = true;
    setCargandoCatalogos(true);
    setError(null);

    void Promise.all([
      AlmacenService.getAlmacenes(true),
      ProductoService.getProductos(undefined, undefined, true),
    ])
      .then(([alms, prods]) => {
        if (!activo) return;
        setAlmacenes(alms);
        setProductosCatalogo(prods || []);
        if (alms.length > 0 && !almacenDestinoId) {
          setAlmacenDestinoId(alms[0].id);
        }
      })
      .catch((e) => {
        if (activo) setError(e instanceof Error ? e.message : 'Error al cargar almacenes y catálogo.');
      })
      .finally(() => {
        if (activo) setCargandoCatalogos(false);
      });

    return () => {
      activo = false;
    };
  }, [open]);

  // Limpiar formulario al cerrar
  useEffect(() => {
    if (!open) {
      setLineasConsolidadas([]);
      setArchivoNombre(null);
      setTextoPegado('');
      setError(null);
      setNumeroRecepcion('');
    }
  }, [open]);

  // Función núcleo de parseo y consolidación
  const procesarFilasCrudas = (filas: Record<string, unknown>[]) => {
    if (!filas || filas.length === 0) {
      setError('El archivo o texto no contiene filas de datos válidas.');
      return;
    }

    // Identificar dinámicamente las columnas clave
    const keys = Object.keys(filas[0] || {});
    const normalizarKey = (k: string) =>
      k
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    const findKey = (pattern: RegExp) => keys.find((k) => pattern.test(normalizarKey(k)));

    const nRecepcionKey = findKey(/n.*recepcion|documento|guia|remision|pedido/);
    const altaKey = findKey(/alta|fecha|date/);
    const origenKey = findKey(/origen|proveedor|remitente/);
    const destinoKey = findKey(/destino|almacen|bodega/);
    const skuKey = findKey(/sku|codigo|cod_producto|item/);
    const productoKey = findKey(/producto|descripcion|nombre|articulo/);
    const serieKey = findKey(/serie|series|serial|sn/);
    const esperadoKey = findKey(/esperado|cantidad|cant|qty/);
    const uomKey = findKey(/uom|unidad|um/);

    if (!skuKey && !productoKey) {
      setError('No se encontró una columna de SKU o Producto en los datos.');
      return;
    }

    // Extraer cabecera del primer registro con datos
    const primeraFila = filas[0];
    if (nRecepcionKey && primeraFila[nRecepcionKey]) {
      setNumeroRecepcion(String(primeraFila[nRecepcionKey]).trim());
    }

    if (altaKey && primeraFila[altaKey]) {
      const altaVal = String(primeraFila[altaKey]).trim();
      const matchFecha = altaVal.match(/\d{4}-\d{2}-\d{2}/);
      if (matchFecha) {
        setFechaAlta(matchFecha[0]);
      }
    }

    if (origenKey && primeraFila[origenKey]) {
      const origenVal = String(primeraFila[origenKey]).trim();
      if (origenVal && origenVal !== 'DEPOSITO') {
        setOrigenProveedor(origenVal);
      } else {
        setOrigenProveedor('DirecTV - Depósito');
      }
    }

    // Intentar emparejar almacén destino si coincide
    if (destinoKey && primeraFila[destinoKey]) {
      const destVal = String(primeraFila[destinoKey]).trim().toLowerCase();
      const matchAlm = almacenes.find((a) => a.nombre.toLowerCase().includes(destVal));
      if (matchAlm) setAlmacenDestinoId(matchAlm.id);
    }

    // Agrupación y consolidación de líneas por SKU
    const mapaConsolidado = new Map<string, LineaConsolidada>();

    for (const fila of filas) {
      const sku = (skuKey ? String(fila[skuKey] || '') : '').trim();
      const nombreProducto = (productoKey ? String(fila[productoKey] || '') : '').trim() || sku;
      const serie = (serieKey ? String(fila[serieKey] || '') : '').trim().toUpperCase();
      const uom = (uomKey ? String(fila[uomKey] || '') : '').trim() || 'Unidad';
      const cantRaw = esperadoKey ? parseFloat(String(fila[esperadoKey] || '1')) : 1;
      const cantidad = isNaN(cantRaw) || cantRaw <= 0 ? 1 : cantRaw;

      if (!sku && !nombreProducto) continue;

      const clave = sku || nombreProducto;

      if (!mapaConsolidado.has(clave)) {
        mapaConsolidado.set(clave, {
          sku: sku || clave,
          nombreProducto,
          uom,
          esSerializado: Boolean(serie),
          cantidad: serie ? 1 : cantidad,
          series: serie ? [serie] : [],
          encontradoEnCatalogo: false,
        });
      } else {
        const item = mapaConsolidado.get(clave)!;
        if (serie) {
          item.esSerializado = true;
          if (!item.series.includes(serie)) {
            item.series.push(serie);
          }
          item.cantidad = item.series.length;
        } else {
          item.cantidad += cantidad;
        }
      }
    }

    // Vincular con catálogo de productos existente
    const listaFinal = Array.from(mapaConsolidado.values()).map((linea) => {
      const prodEncontrado = productosCatalogo.find(
        (p) =>
          p.codigo.trim().toLowerCase() === linea.sku.toLowerCase() ||
          p.nombre.trim().toLowerCase() === linea.nombreProducto.toLowerCase()
      );

      return {
        ...linea,
        productoId: prodEncontrado?.id,
        encontradoEnCatalogo: Boolean(prodEncontrado),
        esSerializado: prodEncontrado?.esSerializado || linea.esSerializado,
      };
    });

    setLineasConsolidadas(listaFinal);
    setError(null);
  };

  // Manejador de archivo Excel o CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArchivoNombre(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) return;

        // Lee binario, xlsx, xls, csv o html table
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          defval: '',
        });

        procesarFilasCrudas(jsonRows);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al procesar el archivo Excel.');
      }
    };

    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // Manejador de texto pegado directamente desde Excel o tabla web
  const handleProcesarPegado = () => {
    if (!textoPegado.trim()) {
      setError('Pegue el contenido de las celdas o tabla antes de procesar.');
      return;
    }

    try {
      // XLSX puede leer tanto texto TSV (copiado de Excel) como HTML (tablas web)
      const workbook = XLSX.read(textoPegado, { type: 'string' });
      const firstSheet = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheet];
      const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: '',
      });

      procesarFilasCrudas(jsonRows);
      setArchivoNombre('Tabla pegada desde portapapeles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el texto pegado.');
    }
  };

  // Estadísticas consolidadas
  const totalDecosSeriados = useMemo(
    () =>
      lineasConsolidadas
        .filter((l) => l.esSerializado)
        .reduce((sum, l) => sum + (l.series.length || l.cantidad), 0),
    [lineasConsolidadas]
  );

  const totalInsumos = useMemo(
    () =>
      lineasConsolidadas
        .filter((l) => !l.esSerializado)
        .reduce((sum, l) => sum + l.cantidad, 0),
    [lineasConsolidadas]
  );

  const productosFaltantes = useMemo(
    () => lineasConsolidadas.filter((l) => !l.encontradoEnCatalogo),
    [lineasConsolidadas]
  );

  // Ejecución de la importación
  const handleConfirmarImportacion = async () => {
    if (lineasConsolidadas.length === 0) {
      setError('No hay líneas para importar.');
      return;
    }

    if (!almacenDestinoId) {
      setError('Seleccione el almacén de destino de la recepción.');
      return;
    }

    if (!numeroRecepcion.trim()) {
      setError('Indique el número de documento / recepción.');
      return;
    }

    setProcesando(true);
    setError(null);

    try {
      // 1. Si hay productos no encontrados en catálogo y el usuario autorizó crearlos:
      const lineasProcesadas = [...lineasConsolidadas];

      for (let i = 0; i < lineasProcesadas.length; i++) {
        const item = lineasProcesadas[i];
        if (!item.productoId) {
          if (crearProductosFaltantes) {
            // Crear producto automático en catálogo
            const nuevoProd = await ProductoService.createProducto({
              codigo: item.sku,
              nombre: item.nombreProducto,
              tipo: 'Inventario',
              esSerializado: item.esSerializado,
              descripcion: `Registrado automáticamente desde Manifiesto ${numeroRecepcion}`,
            });
            item.productoId = nuevoProd.id;
            item.encontradoEnCatalogo = true;
          } else {
            throw new Error(
              `El producto "${item.sku} - ${item.nombreProducto}" no existe en el catálogo maestro.`
            );
          }
        }
      }

      // 2. Mapear líneas para la orden de compra
      const lineasPayload: LineaCompra[] = lineasProcesadas.map((l) => ({
        productoId: l.productoId!,
        cantidad: l.cantidad,
        costoUnitario: 0,
        series: l.series,
        unidadMedidaId: null,
        factorConversion: 1,
      }));

      const payload: CrearCompra = {
        proveedor: origenProveedor.trim() || 'DirecTV',
        tipoDocumento: 'GuiaRemision',
        numeroDocumento: numeroRecepcion.trim(),
        fechaDocumento: fechaAlta,
        moneda: 'PEN',
        almacenId: almacenDestinoId,
        observacion: `Manifiesto de recepción importado masivamente (${lineasProcesadas.length} líneas, ${totalDecosSeriados} series). Origen: ${origenProveedor}.`,
        lineas: lineasPayload,
      };

      // 3. Crear la compra en el backend
      const res = await CompraService.crear(payload);
      const compraId = res.id;

      // 4. Si el estado inicial seleccionado es "Enviada", transicionar automáticamente
      if (estadoInicial === 'Enviada' && compraId) {
        await CompraService.solicitar(compraId);
        await CompraService.enviar(compraId);
      }

      onSuccess(compraId, numeroRecepcion.trim());
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar el manifiesto de recepción.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <OverlayDrawer
      position="end"
      open={open}
      onOpenChange={(_, { open: isOpen }) => onOpenChange(isOpen)}
      className={styles.drawer}
    >
      <DrawerHeader className={styles.drawerHeader}>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Cerrar"
              icon={<DismissRegular />}
              onClick={() => onOpenChange(false)}
            />
          }
        >
          Importar Manifiesto de Recepción (DirecTV / Proveedor)
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody className={styles.drawerBody}>
        {error && (
          <D365MessageBar intent="error" onDismiss={() => setError(null)}>
            {error}
          </D365MessageBar>
        )}

        {/* Selector de Entrada: Archivo Excel o Pegar Portapapeles */}
        {lineasConsolidadas.length === 0 ? (
          <>
            <TabList
              selectedValue={tab}
              onTabSelect={(_, d) => setTab(d.value as 'archivo' | 'pegar')}
            >
              <Tab value="archivo" icon={<ArrowUpload16Regular />}>
                Subir Archivo Excel / CSV
              </Tab>
              <Tab value="pegar" icon={<Copy16Regular />}>
                Pegar Tabla Copiada
              </Tab>
            </TabList>

            {tab === 'archivo' ? (
              <div
                className={styles.dropZone}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv, .html"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <DocumentBulletList16Regular
                  style={{ fontSize: 36, color: tokens.colorBrandForeground1, marginBottom: 8 }}
                />
                <Text weight="semibold" size={400} block>
                  Haga clic para seleccionar el archivo de Manifiesto
                </Text>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  Formatos compatibles: .xlsx, .xls, .csv, o archivo HTML exportado de DirecTV
                </Text>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  Copie las celdas directamente desde Excel o el portal web y péguelas aquí:
                </Text>
                <textarea
                  value={textoPegado}
                  onChange={(e) => setTextoPegado(e.target.value)}
                  rows={8}
                  placeholder="Pegue aquí el texto con columnas: organizacion, N Recepcion, SKU, producto, serie, esperado..."
                  style={{
                    width: '100%',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: 12,
                    padding: 8,
                    borderRadius: 4,
                    border: `1px solid ${tokens.colorNeutralStroke1}`,
                  }}
                />
                <Button
                  appearance="primary"
                  icon={<CheckmarkCircle16Filled />}
                  onClick={handleProcesarPegado}
                >
                  Procesar tabla pegada
                </Button>
              </div>
            )}
          </>
        ) : (
          /* Vista Previa y Parámetros de la Orden */
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: tokens.colorNeutralBackground3,
                borderRadius: tokens.borderRadiusMedium,
              }}
            >
              <div>
                <Text weight="semibold">{archivoNombre}</Text>
                <Text size={200} block style={{ color: tokens.colorNeutralForeground3 }}>
                  {lineasConsolidadas.length} productos procesados correctamente
                </Text>
              </div>
              <Button
                size="small"
                appearance="subtle"
                onClick={() => {
                  setLineasConsolidadas([]);
                  setArchivoNombre(null);
                }}
              >
                Cambiar archivo
              </Button>
            </div>

            {/* Parámetros de la Orden */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
                padding: 12,
                border: `1px solid ${tokens.colorNeutralStroke2}`,
                borderRadius: tokens.borderRadiusMedium,
              }}
            >
              <div>
                <Text size={200} weight="semibold" block>
                  N° de Recepción / Guía *
                </Text>
                <Input
                  value={numeroRecepcion}
                  onChange={(_, d) => setNumeroRecepcion(d.value)}
                  placeholder="Ej: 823767"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <Text size={200} weight="semibold" block>
                  Fecha del Manifiesto
                </Text>
                <Input
                  type="date"
                  value={fechaAlta}
                  onChange={(_, d) => setFechaAlta(d.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <Text size={200} weight="semibold" block>
                  Proveedor / Origen
                </Text>
                <Input
                  value={origenProveedor}
                  onChange={(_, d) => setOrigenProveedor(d.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <Text size={200} weight="semibold" block>
                  Almacén Destino *
                </Text>
                <Select
                  value={almacenDestinoId}
                  onChange={(_, d) => setAlmacenDestinoId(d.value)}
                  style={{ width: '100%' }}
                >
                  {almacenes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Tarjetas KPI de Resumen */}
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                  DECODIFICADORES SERIADOS
                </Text>
                <Text weight="bold" size={500} style={{ color: tokens.colorBrandForeground1 }}>
                  {totalDecosSeriados} uds.
                </Text>
              </div>
              <div className={styles.summaryCard}>
                <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                  INSUMOS Y MATERIALES
                </Text>
                <Text weight="bold" size={500} style={{ color: tokens.colorPaletteForestForeground2 }}>
                  {totalInsumos.toLocaleString('es-PE')} uds.
                </Text>
              </div>
              <div className={styles.summaryCard}>
                <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                  TOTAL LÍNEAS
                </Text>
                <Text weight="bold" size={500}>
                  {lineasConsolidadas.length} ítems
                </Text>
              </div>
            </div>

            {/* Aviso de productos faltantes en catálogo si los hay */}
            {productosFaltantes.length > 0 && (
              <div
                style={{
                  padding: 12,
                  backgroundColor: tokens.colorPaletteYellowBackground1,
                  border: `1px solid ${tokens.colorPaletteYellowBorder1}`,
                  borderRadius: tokens.borderRadiusMedium,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Warning16Filled style={{ color: tokens.colorPaletteYellowForeground1 }} />
                  <Text weight="semibold">
                    {productosFaltantes.length} producto(s) no existen aún en el catálogo maestro.
                  </Text>
                </div>
                <Checkbox
                  checked={crearProductosFaltantes}
                  onChange={(_, d) => setCrearProductosFaltantes(Boolean(d.checked))}
                  label="Crear automáticamente estos productos en el catálogo como tipo Inventario para completar la importación sin bloqueos."
                />
              </div>
            )}

            {/* Tabla de Vista Previa Consolidada */}
            <div className={styles.tableWrapper}>
              <Table size="small">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell style={{ width: 100 }}>SKU</TableHeaderCell>
                    <TableHeaderCell>Descripción del Producto</TableHeaderCell>
                    <TableHeaderCell style={{ width: 110 }}>Tipo / Series</TableHeaderCell>
                    <TableHeaderCell style={{ width: 80, textAlign: 'right' }}>Cantidad</TableHeaderCell>
                    <TableHeaderCell style={{ width: 90 }}>UOM</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineasConsolidadas.map((linea, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <span className={styles.codeFont}>{linea.sku}</span>
                      </TableCell>
                      <TableCell>
                        <TableCellLayout>
                          <Text weight="medium">{linea.nombreProducto}</Text>
                          {!linea.encontradoEnCatalogo && (
                            <Badge appearance="tint" color="warning" size="small" style={{ marginLeft: 6 }}>
                              Nuevo
                            </Badge>
                          )}
                        </TableCellLayout>
                      </TableCell>
                      <TableCell>
                        {linea.esSerializado ? (
                          <Badge appearance="filled" color="informative" icon={<BarcodeScanner20Regular />}>
                            {linea.series.length} series
                          </Badge>
                        ) : (
                          <Badge appearance="ghost" color="subtle">
                            Insumo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {linea.cantidad.toLocaleString('es-PE')}
                      </TableCell>
                      <TableCell>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                          {linea.uom}
                        </Text>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Selector de Estado Inicial */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: tokens.colorNeutralBackground2,
                borderRadius: tokens.borderRadiusMedium,
                border: `1px solid ${tokens.colorNeutralStroke2}`,
              }}
            >
              <div>
                <Text weight="semibold" block>
                  Estado inicial de la orden
                </Text>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  {estadoInicial === 'Enviada'
                    ? 'La orden quedará lista para que los almaceneros inicien la recepción física.'
                    : 'La orden se guardará como borrador para revisión del supervisor.'}
                </Text>
              </div>
              <Select
                value={estadoInicial}
                onChange={(_, d) => setEstadoInicial(d.value as 'Enviada' | 'Borrador')}
              >
                <option value="Enviada">Enviada (Lista para recepción)</option>
                <option value="Borrador">Borrador (Revisión)</option>
              </Select>
            </div>
          </>
        )}
      </DrawerBody>

      <DrawerFooter className={styles.drawerFooter}>
        <Button appearance="subtle" onClick={() => onOpenChange(false)} disabled={procesando}>
          Cancelar
        </Button>
        <Button
          appearance="primary"
          icon={procesando ? <Spinner size="tiny" /> : <Save16Regular />}
          disabled={procesando || lineasConsolidadas.length === 0 || cargandoCatalogos}
          onClick={() => void handleConfirmarImportacion()}
        >
          {procesando
            ? 'Importando y creando orden...'
            : `Crear Orden de Recepción (${lineasConsolidadas.length} líneas)`}
        </Button>
      </DrawerFooter>
    </OverlayDrawer>
  );
};
