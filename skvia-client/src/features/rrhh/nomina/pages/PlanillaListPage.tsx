import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Button,
  Card,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Text,
  Badge,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  tokens,
  createTableColumn,
  type TableColumnDefinition,
} from '@fluentui/react-components';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import {
  ArrowClockwise16Regular,
  ArrowDownload16Regular,
  EyeOff16Regular,
  DocumentPdf16Regular,
  DocumentBulletList16Regular,
  Calculator16Regular,
  ChevronDown16Regular,
  Checkmark16Regular,
  ChevronLeft16Regular,
  ChevronRight16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import {
  D365EntityTable,
  D365TableToolbarTools,
  type D365EntityTableRef,
  type D365FilterField,
} from '../../../../components/common/D365EntityTable';
import { D365StatusBadge } from '../../../../components/common/D365StatusBadge';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { RecursosHumanosService } from '../../services/recursosHumanos.service';
import type { EmpleadoDto } from '../../types/recursosHumanos.types';
import { exportToExcel, type ExportColumn } from '../../../../utils/exportUtils';
import { useAuthSession } from '../../../../services/authSession';

const ASIGNACION_FAMILIAR_MONTO = 102.50; // 10% RMV en Perú

export interface ItemPlanillaCalculada {
  id: string;
  empleadoId: string;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  departamentoNombre: string;
  cargoNombre: string;
  fechaIngreso: string;
  estado: string;
  moneda: string;
  salarioBase: number;
  tieneAsignacionFamiliar: boolean;
  montoAsignacionFamiliar: number;
  totalBruto: number;
  regimenPensionario: string;
  porcentajePension: number;
  descuentoPension: number;
  netoPagar: number;
  essaludEmpleador: number;
  entidadFinanciera: string;
  cuentaBancaria: string;
  cuentaInterbancaria: string;
}

export interface ItemLiquidacionCalculada {
  id: string;
  empleadoId: string;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  departamentoNombre: string;
  cargoNombre: string;
  fechaIngreso: string;
  fechaCese: string;
  motivoCese: string;
  observacionesCese: string;
  tiempoServicioTexto: string;
  mesesCompletos: number;
  diasRemanentes: number;
  salarioBase: number;
  ctsTrunca: number;
  gratificacionTrunca: number;
  bonoExtraordinario: number;
  vacacionesTruncas: number;
  totalLiquidacion: number;
}

const filterFieldsPlanilla: D365FilterField[] = [
  { id: 'nombres', label: 'Nombres', type: 'string' },
  { id: 'apellidos', label: 'Apellidos', type: 'string' },
  { id: 'numeroDocumento', label: 'N° Documento', type: 'string' },
  { id: 'departamentoNombre', label: 'Departamento', type: 'string' },
  { id: 'cargoNombre', label: 'Cargo', type: 'string' },
  { id: 'regimenPensionario', label: 'Régimen Pensión', type: 'string' },
  { id: 'entidadFinanciera', label: 'Banco', type: 'string' },
];

export const PlanillaListPage: React.FC = () => {
  const styles = useD365ListStyles();
  const tableRef = useRef<D365EntityTableRef>(null);
  const { permisos } = useAuthSession();
  const canViewSalarios = permisos?.includes('rrhh.salarios.confidencial') ?? true;

  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeView, setActiveView] = useState<'activos' | 'cesados' | 'previsional'>('activos');
  const [fechaPeriodo, setFechaPeriodo] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const mesSeleccionado = useMemo(() => {
    return `${fechaPeriodo.getFullYear()}-${String(fechaPeriodo.getMonth() + 1).padStart(2, '0')}`;
  }, [fechaPeriodo]);

  const handleCambiarMes = (delta: number) => {
    setFechaPeriodo((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const [empleados, setEmpleados] = useState<EmpleadoDto[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modales de detalle
  const [boletaSeleccionada, setBoletaSeleccionada] = useState<ItemPlanillaCalculada | null>(null);
  const [liquidacionSeleccionada, setLiquidacionSeleccionada] = useState<ItemLiquidacionCalculada | null>(null);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await RecursosHumanosService.obtenerEmpleados();
      setEmpleados(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cargar colaboradores para el cálculo de planilla');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Cálculo de planilla para colaboradores activos
  const planillaCalculada: ItemPlanillaCalculada[] = useMemo(() => {
    const activos = empleados.filter((e) => e.estado === 'Activo' || e.estado === 'Vacaciones' || e.estado === 'Licencia');
    return activos.map((e) => {
      const base = Number(e.salarioBase || 0);
      const asig = e.tieneAsignacionFamiliar ? ASIGNACION_FAMILIAR_MONTO : 0;
      const totalBruto = base + asig;

      const regimen = (e.regimenPensionario || 'AFP Integra').trim();
      let pctPension = 0.1184; // 11.84% promedio AFP
      if (regimen.toUpperCase().includes('ONP')) {
        pctPension = 0.13; // 13% ONP
      }

      const descPension = Math.round(totalBruto * pctPension * 100) / 100;
      const neto = Math.round((totalBruto - descPension) * 100) / 100;
      const essalud = Math.round(totalBruto * 0.09 * 100) / 100;

      return {
        id: e.id,
        empleadoId: e.id,
        nombres: e.nombres,
        apellidos: e.apellidos,
        tipoDocumento: e.tipoDocumento,
        numeroDocumento: e.numeroDocumento,
        departamentoNombre: e.departamentoNombre || '---',
        cargoNombre: e.cargoNombre || '---',
        fechaIngreso: e.fechaIngreso ? e.fechaIngreso.split('T')[0] : '---',
        estado: e.estado,
        moneda: e.monedaSalario || 'PEN',
        salarioBase: base,
        tieneAsignacionFamiliar: !!e.tieneAsignacionFamiliar,
        montoAsignacionFamiliar: asig,
        totalBruto,
        regimenPensionario: regimen,
        porcentajePension: pctPension,
        descuentoPension: descPension,
        netoPagar: neto,
        essaludEmpleador: essalud,
        entidadFinanciera: e.entidadFinanciera || 'BCP',
        cuentaBancaria: e.cuentaBancaria || '---',
        cuentaInterbancaria: e.cuentaInterbancaria || '---',
      };
    });
  }, [empleados]);

  // Cálculo de liquidaciones para colaboradores cesados
  const liquidacionesCalculadas: ItemLiquidacionCalculada[] = useMemo(() => {
    const cesados = empleados.filter((e) => e.estado === 'Cesado');
    return cesados.map((e) => {
      const base = Number(e.salarioBase || 0);
      const fIngreso = e.fechaIngreso ? new Date(e.fechaIngreso) : new Date();
      const fCese = e.fechaCese ? new Date(e.fechaCese) : new Date();

      const diffMs = Math.max(0, fCese.getTime() - fIngreso.getTime());
      const diffDiasTotales = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const anios = Math.floor(diffDiasTotales / 365);
      const meses = Math.floor((diffDiasTotales % 365) / 30);
      const dias = (diffDiasTotales % 365) % 30;

      const tiempoTexto = `${anios > 0 ? `${anios}a ` : ''}${meses}m ${dias}d`;

      // Cálculos referenciales de ley peruana (D.L. 650, D.L. 728, Ley 27735)
      const mesesFraccion = Math.max(1, meses);
      const cts = Math.round((((base + base / 6) / 12) * Math.min(mesesFraccion, 6)) * 100) / 100;
      const grati = Math.round(((base / 6) * Math.min(mesesFraccion, 6)) * 100) / 100;
      const bono9 = Math.round(grati * 0.09 * 100) / 100;
      const vacTruncas = Math.round(((base / 12) * Math.min(mesesFraccion, 12)) * 100) / 100;

      const totalLiq = Math.round((cts + grati + bono9 + vacTruncas) * 100) / 100;

      return {
        id: e.id,
        empleadoId: e.id,
        nombres: e.nombres,
        apellidos: e.apellidos,
        tipoDocumento: e.tipoDocumento,
        numeroDocumento: e.numeroDocumento,
        departamentoNombre: e.departamentoNombre || '---',
        cargoNombre: e.cargoNombre || '---',
        fechaIngreso: e.fechaIngreso ? e.fechaIngreso.split('T')[0] : '---',
        fechaCese: e.fechaCese ? e.fechaCese.split('T')[0] : '---',
        motivoCese: e.motivoCese || 'Renuncia Voluntaria',
        observacionesCese: e.observacionesCese || 'Sin observaciones',
        tiempoServicioTexto: tiempoTexto,
        mesesCompletos: meses,
        diasRemanentes: dias,
        salarioBase: base,
        ctsTrunca: cts,
        gratificacionTrunca: grati,
        bonoExtraordinario: bono9,
        vacacionesTruncas: vacTruncas,
        totalLiquidacion: totalLiq,
      };
    });
  }, [empleados]);

  // Totales de la planilla activa
  const totalesKpi = useMemo(() => {
    const totalBruto = planillaCalculada.reduce((acc, p) => acc + p.totalBruto, 0);
    const totalPension = planillaCalculada.reduce((acc, p) => acc + p.descuentoPension, 0);
    const totalNeto = planillaCalculada.reduce((acc, p) => acc + p.netoPagar, 0);
    const totalEssalud = planillaCalculada.reduce((acc, p) => acc + p.essaludEmpleador, 0);
    const totalColaboradores = planillaCalculada.length;

    return {
      totalBruto,
      totalPension,
      totalNeto,
      totalEssalud,
      totalColaboradores,
    };
  }, [planillaCalculada]);

  // Filtrado de la planilla activa según buscador
  const planillaFiltrada = useMemo(() => {
    if (!searchTerm.trim()) return planillaCalculada;
    const q = searchTerm.toLowerCase();
    return planillaCalculada.filter(
      (p) =>
        p.nombres.toLowerCase().includes(q) ||
        p.apellidos.toLowerCase().includes(q) ||
        p.numeroDocumento.toLowerCase().includes(q) ||
        p.departamentoNombre.toLowerCase().includes(q) ||
        p.cargoNombre.toLowerCase().includes(q) ||
        p.entidadFinanciera.toLowerCase().includes(q) ||
        p.regimenPensionario.toLowerCase().includes(q)
    );
  }, [planillaCalculada, searchTerm]);

  // Filtrado de liquidaciones según buscador
  const liquidacionesFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return liquidacionesCalculadas;
    const q = searchTerm.toLowerCase();
    return liquidacionesCalculadas.filter(
      (l) =>
        l.nombres.toLowerCase().includes(q) ||
        l.apellidos.toLowerCase().includes(q) ||
        l.numeroDocumento.toLowerCase().includes(q) ||
        l.departamentoNombre.toLowerCase().includes(q) ||
        l.cargoNombre.toLowerCase().includes(q) ||
        l.motivoCese.toLowerCase().includes(q)
    );
  }, [liquidacionesCalculadas, searchTerm]);

  // Exportar a Excel
  const handleExportarExcel = () => {
    if (activeView === 'cesados') {
      const cols: ExportColumn<ItemLiquidacionCalculada>[] = [
        { header: 'Colaborador', accessor: (l) => `${l.nombres} ${l.apellidos}` },
        { header: 'Documento', accessor: (l) => `${l.tipoDocumento} ${l.numeroDocumento}` },
        { header: 'Departamento', accessor: (l) => l.departamentoNombre },
        { header: 'Cargo', accessor: (l) => l.cargoNombre },
        { header: 'Fecha Ingreso', accessor: (l) => l.fechaIngreso },
        { header: 'Fecha Cese', accessor: (l) => l.fechaCese },
        { header: 'Motivo Cese', accessor: (l) => l.motivoCese },
        { header: 'Tiempo Laborado', accessor: (l) => l.tiempoServicioTexto },
        { header: 'Último Salario Base (PEN)', accessor: (l) => l.salarioBase },
        { header: 'CTS Trunca (PEN)', accessor: (l) => l.ctsTrunca },
        { header: 'Gratificación Trunca (PEN)', accessor: (l) => l.gratificacionTrunca },
        { header: 'Bono 9% (PEN)', accessor: (l) => l.bonoExtraordinario },
        { header: 'Vacaciones Truncas (PEN)', accessor: (l) => l.vacacionesTruncas },
        { header: 'Total Liquidación (PEN)', accessor: (l) => l.totalLiquidacion },
      ];
      exportToExcel(liquidacionesFiltradas, cols, `Liquidaciones_Ceses_${mesSeleccionado}`);
    } else {
      const cols: ExportColumn<ItemPlanillaCalculada>[] = [
        { header: 'Colaborador', accessor: (p) => `${p.nombres} ${p.apellidos}` },
        { header: 'Documento', accessor: (p) => `${p.tipoDocumento} ${p.numeroDocumento}` },
        { header: 'Departamento', accessor: (p) => p.departamentoNombre },
        { header: 'Cargo', accessor: (p) => p.cargoNombre },
        { header: 'Fecha Ingreso', accessor: (p) => p.fechaIngreso },
        { header: 'Salario Base (PEN)', accessor: (p) => p.salarioBase },
        { header: 'Asig. Familiar (PEN)', accessor: (p) => p.montoAsignacionFamiliar },
        { header: 'Remuneración Bruta (PEN)', accessor: (p) => p.totalBruto },
        { header: 'Régimen Pensión', accessor: (p) => p.regimenPensionario },
        { header: 'Retención Pensión (PEN)', accessor: (p) => p.descuentoPension },
        { header: 'Neto a Pagar (PEN)', accessor: (p) => p.netoPagar },
        { header: 'EsSalud 9% Patronal (PEN)', accessor: (p) => p.essaludEmpleador },
        { header: 'Entidad Bancaria', accessor: (p) => p.entidadFinanciera },
        { header: 'Cuenta Bancaria', accessor: (p) => p.cuentaBancaria },
        { header: 'Cuenta Interbancaria (CCI)', accessor: (p) => p.cuentaInterbancaria },
      ];
      exportToExcel(planillaFiltrada, cols, `Planilla_Mensual_${mesSeleccionado}`);
    }
  };

  // Definición de columnas para Planilla Activa
  const columnsPlanilla: TableColumnDefinition<ItemPlanillaCalculada>[] = [
    createTableColumn<ItemPlanillaCalculada>({
      columnId: 'colaborador',
      compare: (a, b) => a.apellidos.localeCompare(b.apellidos),
      renderHeaderCell: () => 'Colaborador',
      renderCell: (item) => (
        <div>
          <Text weight="semibold" style={{ display: 'block' }}>
            {item.nombres} {item.apellidos}
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {item.tipoDocumento}: {item.numeroDocumento}
          </Text>
        </div>
      ),
    }),
    createTableColumn<ItemPlanillaCalculada>({
      columnId: 'cargo',
      compare: (a, b) => a.cargoNombre.localeCompare(b.cargoNombre),
      renderHeaderCell: () => 'Área / Cargo',
      renderCell: (item) => (
        <div>
          <Text size={300} weight="medium" style={{ display: 'block' }}>
            {item.cargoNombre}
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>
            {item.departamentoNombre}
          </Text>
        </div>
      ),
    }),
    createTableColumn<ItemPlanillaCalculada>({
      columnId: 'salarioBase',
      compare: (a, b) => a.salarioBase - b.salarioBase,
      renderHeaderCell: () => 'Sueldo Base',
      renderCell: (item) => (
        <Text size={200} style={{ fontFamily: 'monospace' }}>
          S/ {item.salarioBase.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
        </Text>
      ),
    }),
    createTableColumn<ItemPlanillaCalculada>({
      columnId: 'asigFamiliar',
      compare: (a, b) => a.montoAsignacionFamiliar - b.montoAsignacionFamiliar,
      renderHeaderCell: () => 'Asig. Familiar',
      renderCell: (item) => (
        <Text size={200} style={{ color: item.tieneAsignacionFamiliar ? tokens.colorPaletteBlueForeground2 : tokens.colorNeutralForeground4 }}>
          {item.tieneAsignacionFamiliar ? `S/ ${item.montoAsignacionFamiliar.toFixed(2)}` : 'S/ 0.00'}
        </Text>
      ),
    }),
    createTableColumn<ItemPlanillaCalculada>({
      columnId: 'totalBruto',
      compare: (a, b) => a.totalBruto - b.totalBruto,
      renderHeaderCell: () => 'Total Bruto',
      renderCell: (item) => (
        <Text size={300} weight="semibold" style={{ fontFamily: 'monospace' }}>
          S/ {item.totalBruto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
        </Text>
      ),
    }),
    createTableColumn<ItemPlanillaCalculada>({
      columnId: 'regimenPensionario',
      compare: (a, b) => a.regimenPensionario.localeCompare(b.regimenPensionario),
      renderHeaderCell: () => 'Régimen Pensión',
      renderCell: (item) => (
        <Badge appearance="tint" color={item.regimenPensionario.includes('ONP') ? 'warning' : 'informative'}>
          {item.regimenPensionario}
        </Badge>
      ),
    }),
    createTableColumn<ItemPlanillaCalculada>({
      columnId: 'descuentoPension',
      compare: (a, b) => a.descuentoPension - b.descuentoPension,
      renderHeaderCell: () => 'Retención',
      renderCell: (item) => (
        <Text size={200} style={{ color: tokens.colorPaletteRedForeground1, fontFamily: 'monospace' }}>
          -S/ {item.descuentoPension.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
        </Text>
      ),
    }),
    createTableColumn<ItemPlanillaCalculada>({
      columnId: 'netoPagar',
      compare: (a, b) => a.netoPagar - b.netoPagar,
      renderHeaderCell: () => 'Neto a Pagar',
      renderCell: (item) => (
        <Text size={300} weight="bold" style={{ color: tokens.colorPaletteGreenForeground1, fontFamily: 'monospace' }}>
          S/ {item.netoPagar.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
        </Text>
      ),
    }),
    createTableColumn<ItemPlanillaCalculada>({
      columnId: 'banco',
      compare: (a, b) => a.entidadFinanciera.localeCompare(b.entidadFinanciera),
      renderHeaderCell: () => 'Abono Bancario',
      renderCell: (item) => (
        <div>
          <Text size={200} weight="semibold" style={{ display: 'block' }}>
            {item.entidadFinanciera}
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground4, fontFamily: 'monospace' }}>
            {item.cuentaBancaria !== '---' ? item.cuentaBancaria : item.cuentaInterbancaria}
          </Text>
        </div>
      ),
    }),
    createTableColumn<ItemPlanillaCalculada>({
      columnId: 'acciones',
      renderHeaderCell: () => 'Boleta',
      renderCell: (item) => (
        <Button
          size="small"
          appearance="subtle"
          icon={<DocumentBulletList16Regular />}
          onClick={() => setBoletaSeleccionada(item)}
          title="Ver Boleta de Pago"
        >
          Boleta
        </Button>
      ),
    }),
  ];

  // Definición de columnas para Liquidaciones de Cesados
  const columnsLiquidaciones: TableColumnDefinition<ItemLiquidacionCalculada>[] = [
    createTableColumn<ItemLiquidacionCalculada>({
      columnId: 'colaborador',
      compare: (a, b) => a.apellidos.localeCompare(b.apellidos),
      renderHeaderCell: () => 'Colaborador Cesado',
      renderCell: (item) => (
        <div>
          <Text weight="semibold" style={{ display: 'block' }}>
            {item.nombres} {item.apellidos}
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {item.tipoDocumento}: {item.numeroDocumento}
          </Text>
        </div>
      ),
    }),
    createTableColumn<ItemLiquidacionCalculada>({
      columnId: 'fechas',
      renderHeaderCell: () => 'Período Laboral',
      renderCell: (item) => (
        <div>
          <Text size={200} style={{ display: 'block' }}>
            Ingreso: {item.fechaIngreso}
          </Text>
          <Text size={200} weight="semibold" style={{ color: tokens.colorPaletteRedForeground1 }}>
            Cese: {item.fechaCese}
          </Text>
        </div>
      ),
    }),
    createTableColumn<ItemLiquidacionCalculada>({
      columnId: 'tiempoServicio',
      renderHeaderCell: () => 'Tiempo Laborado',
      renderCell: (item) => (
        <Badge appearance="tint" color="informative">
          {item.tiempoServicioTexto}
        </Badge>
      ),
    }),
    createTableColumn<ItemLiquidacionCalculada>({
      columnId: 'motivoCese',
      renderHeaderCell: () => 'Motivo de Cese',
      renderCell: (item) => (
        <div>
          <D365StatusBadge status="Cesado" size="small" />
          <Text size={200} style={{ display: 'block', marginTop: 2, color: tokens.colorNeutralForeground3 }}>
            {item.motivoCese}
          </Text>
        </div>
      ),
    }),
    createTableColumn<ItemLiquidacionCalculada>({
      columnId: 'salarioBase',
      renderHeaderCell: () => 'Último Salario',
      renderCell: (item) => (
        <Text size={200} style={{ fontFamily: 'monospace' }}>
          S/ {item.salarioBase.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
        </Text>
      ),
    }),
    createTableColumn<ItemLiquidacionCalculada>({
      columnId: 'ctsTrunca',
      renderHeaderCell: () => 'CTS Trunca',
      renderCell: (item) => (
        <Text size={200} style={{ fontFamily: 'monospace' }}>
          S/ {item.ctsTrunca.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
        </Text>
      ),
    }),
    createTableColumn<ItemLiquidacionCalculada>({
      columnId: 'gratiTrunca',
      renderHeaderCell: () => 'Grati + Bono',
      renderCell: (item) => (
        <Text size={200} style={{ fontFamily: 'monospace' }}>
          S/ {(item.gratificacionTrunca + item.bonoExtraordinario).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
        </Text>
      ),
    }),
    createTableColumn<ItemLiquidacionCalculada>({
      columnId: 'vacacionesTruncas',
      renderHeaderCell: () => 'Vac. Truncas',
      renderCell: (item) => (
        <Text size={200} style={{ fontFamily: 'monospace' }}>
          S/ {item.vacacionesTruncas.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
        </Text>
      ),
    }),
    createTableColumn<ItemLiquidacionCalculada>({
      columnId: 'totalLiquidacion',
      compare: (a, b) => a.totalLiquidacion - b.totalLiquidacion,
      renderHeaderCell: () => 'Total Liquidación',
      renderCell: (item) => (
        <Text size={300} weight="bold" style={{ color: tokens.colorPaletteGreenForeground1, fontFamily: 'monospace' }}>
          S/ {item.totalLiquidacion.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
        </Text>
      ),
    }),
    createTableColumn<ItemLiquidacionCalculada>({
      columnId: 'acciones',
      renderHeaderCell: () => 'Detalle',
      renderCell: (item) => (
        <Button
          size="small"
          appearance="subtle"
          icon={<DocumentBulletList16Regular />}
          onClick={() => setLiquidacionSeleccionada(item)}
          title="Ver Hoja de Liquidación"
        >
          Liquidación
        </Button>
      ),
    }),
  ];

  return (
    <div className={styles.root}>
      {/* 1. Command Bar */}
      <D365CommandBar ariaLabel="Comandos de Planilla y Liquidaciones">
        <D365CommandButton
          icon={<Calculator16Regular />}
          tone="create"
          onClick={() => {
            setSuccessMessage(`Planilla recalculada exitosamente para el período ${mesSeleccionado}.`);
            void cargarDatos();
          }}
          disabled={loading || !canViewSalarios}
        >
          Calcular Planilla
        </D365CommandButton>
        <D365CommandButton
          icon={<ArrowClockwise16Regular />}
          onClick={cargarDatos}
          disabled={loading}
        >
          Actualizar
        </D365CommandButton>
        <D365CommandDivider />
        <D365CommandButton
          icon={<ArrowDownload16Regular />}
          onClick={handleExportarExcel}
          disabled={loading || !canViewSalarios}
        >
          Exportar a Excel
        </D365CommandButton>
      </D365CommandBar>

      {/* 2. Header & Search Row (Selector de Vista D365) */}
      <div className={styles.viewHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <div className={styles.viewSelectorTab} title="Seleccionar vista">
                <Text weight="semibold" size={400}>
                  {activeView === 'activos'
                    ? 'Planilla Mensual (Colaboradores Activos)'
                    : activeView === 'cesados'
                    ? 'Liquidaciones de Beneficios (Colaboradores Cesados)'
                    : 'Aportes Patronales & Previsión (AFP / EsSalud)'}
                </Text>
                <ChevronDown16Regular />
              </div>
            </MenuTrigger>
            <MenuPopover>
              <MenuList className={styles.viewMenuPopover}>
                <MenuItem
                  icon={activeView === 'activos' ? <Checkmark16Regular /> : undefined}
                  onClick={() => setActiveView('activos')}
                >
                  Planilla Mensual (Colaboradores Activos)
                </MenuItem>
                <MenuItem
                  icon={activeView === 'cesados' ? <Checkmark16Regular /> : undefined}
                  onClick={() => setActiveView('cesados')}
                >
                  Liquidaciones de Beneficios (Colaboradores Cesados)
                </MenuItem>
                <MenuItem
                  icon={activeView === 'previsional' ? <Checkmark16Regular /> : undefined}
                  onClick={() => setActiveView('previsional')}
                >
                  Aportes Patronales & Previsión (AFP / EsSalud)
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontWeight: 'medium' }}>
              Período:
            </Text>
            <Button
              size="small"
              appearance="subtle"
              icon={<ChevronLeft16Regular />}
              onClick={() => handleCambiarMes(-1)}
              title="Mes anterior"
              aria-label="Mes anterior"
            />
            <DatePicker
              size="small"
              value={fechaPeriodo}
              onSelectDate={(d) => {
                if (d) {
                  setFechaPeriodo(new Date(d.getFullYear(), d.getMonth(), 1));
                }
              }}
              formatDate={(d) => {
                if (!d) return '';
                const m = d.toLocaleDateString('es-PE', { month: 'long' });
                return `${m.charAt(0).toUpperCase() + m.slice(1)} de ${d.getFullYear()}`;
              }}
              style={{ minWidth: 175 }}
            />
            <Button
              size="small"
              appearance="subtle"
              icon={<ChevronRight16Regular />}
              onClick={() => handleCambiarMes(1)}
              title="Mes siguiente"
              aria-label="Mes siguiente"
            />
          </div>
        </div>

        <D365TableToolbarTools
          tableRef={tableRef}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar"
        />
      </div>

      {/* Mensajes */}
      {errorMessage && (
        <div style={{ padding: '8px 24px' }}>
          <D365MessageBar intent="error" onDismiss={() => setErrorMessage(null)}>
            {errorMessage}
          </D365MessageBar>
        </div>
      )}
      {successMessage && (
        <div style={{ padding: '8px 24px' }}>
          <D365MessageBar intent="success" onDismiss={() => setSuccessMessage(null)}>
            {successMessage}
          </D365MessageBar>
        </div>
      )}

      {/* 3. Panel de Métricas / KPI D365 */}
      {canViewSalarios && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 12,
            padding: '12px 24px 0',
          }}
        >
          <Card style={{ padding: '12px 16px', border: `1px solid ${tokens.colorNeutralStroke2}` }}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Colaboradores en Planilla
            </Text>
            <Text size={500} weight="bold" style={{ display: 'block', marginTop: 4 }}>
              {totalesKpi.totalColaboradores} activos
            </Text>
          </Card>

          <Card style={{ padding: '12px 16px', border: `1px solid ${tokens.colorNeutralStroke2}` }}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Total Remuneración Bruta
            </Text>
            <Text size={500} weight="bold" style={{ display: 'block', marginTop: 4 }}>
              S/ {totalesKpi.totalBruto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </Text>
          </Card>

          <Card style={{ padding: '12px 16px', border: `1px solid ${tokens.colorNeutralStroke2}` }}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Retenciones Previsionales (AFP/ONP)
            </Text>
            <Text size={500} weight="bold" style={{ display: 'block', marginTop: 4, color: tokens.colorPaletteRedForeground1 }}>
              S/ {totalesKpi.totalPension.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </Text>
          </Card>

          <Card style={{ padding: '12px 16px', border: `1px solid ${tokens.colorNeutralStroke2}`, backgroundColor: tokens.colorNeutralBackground2 }}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Neto a Transferir
            </Text>
            <Text size={500} weight="bold" style={{ display: 'block', marginTop: 4, color: tokens.colorPaletteGreenForeground1 }}>
              S/ {totalesKpi.totalNeto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </Text>
          </Card>

          <Card style={{ padding: '12px 16px', border: `1px solid ${tokens.colorNeutralStroke2}` }}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Aporte Empleador EsSalud (9%)
            </Text>
            <Text size={500} weight="bold" style={{ display: 'block', marginTop: 4, color: tokens.colorPaletteBlueForeground2 }}>
              S/ {totalesKpi.totalEssalud.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </Text>
          </Card>
        </div>
      )}

      {/* 4. Tabla D365 */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '12px 0 0' }}>
        {!canViewSalarios ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: tokens.colorNeutralForeground4 }}>
            <EyeOff16Regular style={{ fontSize: 44, marginBottom: 12, display: 'inline-block' }} />
            <Text size={400} weight="semibold" style={{ display: 'block' }}>
              Información de Planilla Confidencial
            </Text>
            <Text size={300} style={{ maxWidth: 460, margin: '8px auto 0', display: 'block' }}>
              No cuentas con los permisos requeridos (<code>rrhh.salarios.confidencial</code>) para consultar las planillas, remuneraciones y liquidaciones del personal.
            </Text>
          </div>
        ) : activeView === 'cesados' ? (
          <D365EntityTable<ItemLiquidacionCalculada>
            ref={tableRef}
            columns={columnsLiquidaciones}
            items={liquidacionesFiltradas}
            loading={loading}
          />
        ) : (
          <D365EntityTable<ItemPlanillaCalculada>
            ref={tableRef}
            columns={columnsPlanilla}
            items={planillaFiltrada}
            filterFields={filterFieldsPlanilla}
            loading={loading}
          />
        )}
      </div>

      {/* DIÁLOGO: DETALLE BOLETA DE PAGO */}
      <Dialog open={!!boletaSeleccionada} onOpenChange={(_, d) => !d.open && setBoletaSeleccionada(null)}>
        <DialogSurface style={{ maxWidth: 600 }}>
          <DialogBody>
            <DialogTitle>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Boleta de Pago Referencial</span>
                <Badge color="brand" appearance="tint">
                  Período: {mesSeleccionado}
                </Badge>
              </div>
            </DialogTitle>
            {boletaSeleccionada && (
              <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                <Card style={{ padding: 14, backgroundColor: tokens.colorNeutralBackground2 }}>
                  <Text size={400} weight="bold">
                    {boletaSeleccionada.nombres} {boletaSeleccionada.apellidos}
                  </Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    {boletaSeleccionada.tipoDocumento}: {boletaSeleccionada.numeroDocumento} • {boletaSeleccionada.cargoNombre} ({boletaSeleccionada.departamentoNombre})
                  </Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Fecha de Ingreso: {boletaSeleccionada.fechaIngreso} • Banco: {boletaSeleccionada.entidadFinanciera} ({boletaSeleccionada.cuentaBancaria})
                  </Text>
                </Card>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <Text size={300} weight="semibold" style={{ display: 'block', marginBottom: 8, color: tokens.colorPaletteBlueForeground2 }}>
                      INGRESOS (HABERES)
                    </Text>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span>Sueldo Básico:</span>
                      <strong>S/ {boletaSeleccionada.salarioBase.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span>Asignación Familiar:</span>
                      <strong>S/ {boletaSeleccionada.montoAsignacionFamiliar.toFixed(2)}</strong>
                    </div>
                    <Divider style={{ margin: '6px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 'bold' }}>
                      <span>Total Ingresos:</span>
                      <span>S/ {boletaSeleccionada.totalBruto.toFixed(2)}</span>
                    </div>
                  </div>

                  <div>
                    <Text size={300} weight="semibold" style={{ display: 'block', marginBottom: 8, color: tokens.colorPaletteRedForeground1 }}>
                      DESCUENTOS AL TRABAJADOR
                    </Text>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span>{boletaSeleccionada.regimenPensionario}:</span>
                      <strong>-S/ {boletaSeleccionada.descuentoPension.toFixed(2)}</strong>
                    </div>
                    <Divider style={{ margin: '6px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 'bold', color: tokens.colorPaletteRedForeground1 }}>
                      <span>Total Retenciones:</span>
                      <span>-S/ {boletaSeleccionada.descuentoPension.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Divider />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: tokens.colorNeutralBackground3, borderRadius: 6 }}>
                  <Text size={400} weight="bold">
                    NETO A PAGAR:
                  </Text>
                  <Text size={500} weight="bold" style={{ color: tokens.colorPaletteGreenForeground1 }}>
                    S/ {boletaSeleccionada.netoPagar.toFixed(2)}
                  </Text>
                </div>

                <div style={{ fontSize: 12, color: tokens.colorNeutralForeground4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Aporte Empleador EsSalud (9%): S/ {boletaSeleccionada.essaludEmpleador.toFixed(2)}</span>
                  <span>Régimen: D.Leg 728 / Micro-Pequeña Empresa</span>
                </div>
              </DialogContent>
            )}
            <DialogActions>
              <Button appearance="secondary" onClick={() => setBoletaSeleccionada(null)}>
                Cerrar
              </Button>
              <Button
                appearance="primary"
                icon={<DocumentPdf16Regular />}
                onClick={() => {
                  window.print();
                }}
              >
                Imprimir Boleta
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* DIÁLOGO: DETALLE HOJA DE LIQUIDACIÓN */}
      <Dialog open={!!liquidacionSeleccionada} onOpenChange={(_, d) => !d.open && setLiquidacionSeleccionada(null)}>
        <DialogSurface style={{ maxWidth: 620 }}>
          <DialogBody>
            <DialogTitle>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Liquidación de Beneficios Sociales (LBS)</span>
                <Badge color="danger" appearance="filled">
                  Cesado
                </Badge>
              </div>
            </DialogTitle>
            {liquidacionSeleccionada && (
              <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                <Card style={{ padding: 14, backgroundColor: tokens.colorNeutralBackground2 }}>
                  <Text size={400} weight="bold">
                    {liquidacionSeleccionada.nombres} {liquidacionSeleccionada.apellidos}
                  </Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    {liquidacionSeleccionada.tipoDocumento}: {liquidacionSeleccionada.numeroDocumento} • {liquidacionSeleccionada.cargoNombre}
                  </Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Ingreso: {liquidacionSeleccionada.fechaIngreso} • Cese: {liquidacionSeleccionada.fechaCese} ({liquidacionSeleccionada.tiempoServicioTexto})
                  </Text>
                  <Text size={200} style={{ color: tokens.colorPaletteRedForeground1, fontWeight: 'medium' }}>
                    Motivo de Cese: {liquidacionSeleccionada.motivoCese}
                  </Text>
                </Card>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>1. Compensación por Tiempo de Servicios (CTS Trunca):</span>
                    <strong>S/ {liquidacionSeleccionada.ctsTrunca.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>2. Gratificación Trunca (Ley 27735):</span>
                    <strong>S/ {liquidacionSeleccionada.gratificacionTrunca.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>3. Bonificación Extraordinaria Ley 29351 (9% s/ Grati):</span>
                    <strong>S/ {liquidacionSeleccionada.bonoExtraordinario.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>4. Vacaciones Truncas (D.Leg 713):</span>
                    <strong>S/ {liquidacionSeleccionada.vacacionesTruncas.toFixed(2)}</strong>
                  </div>

                  <Divider style={{ margin: '8px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: tokens.colorNeutralBackground3, borderRadius: 6 }}>
                    <Text size={400} weight="bold">
                      TOTAL LIQUIDACIÓN A PAGAR:
                    </Text>
                    <Text size={600} weight="bold" style={{ color: tokens.colorPaletteGreenForeground1 }}>
                      S/ {liquidacionSeleccionada.totalLiquidacion.toFixed(2)}
                    </Text>
                  </div>
                </div>

                {liquidacionSeleccionada.observacionesCese && (
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>
                    Observaciones: {liquidacionSeleccionada.observacionesCese}
                  </Text>
                )}
              </DialogContent>
            )}
            <DialogActions>
              <Button appearance="secondary" onClick={() => setLiquidacionSeleccionada(null)}>
                Cerrar
              </Button>
              <Button
                appearance="primary"
                icon={<DocumentPdf16Regular />}
                onClick={() => {
                  window.print();
                }}
              >
                Imprimir Liquidación
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default PlanillaListPage;