import { useId, useState } from 'react';
import {
  Button,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Spinner,
  Badge,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Add16Regular, Delete16Regular } from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { AlmacenService } from '../almacenes/services/almacen.service';

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: '12px' },
  entry: { display: 'flex', gap: '8px', alignItems: 'center' },
  input: { flexGrow: 1, minWidth: '0' },
  scroll: { maxHeight: '320px', overflowY: 'auto' },
  action: { width: '48px' },
  duplicateBadge: {
    color: tokens.colorPaletteRedForeground1,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: 600,
  },
});

export const obtenerSeriesCompra = (valor: string) =>
  valor
    .split(/\r?\n/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

export function SeriesCompraTable({
  valor,
  cantidad,
  soloLectura,
  otrasSeries,
  seriesRecibidas,
  alCambiar,
  alCambiarCantidad,
}: {
  valor: string;
  cantidad: number;
  soloLectura: boolean;
  otrasSeries: string[];
  seriesRecibidas?: string[];
  alCambiar: (valor: string) => void;
  alCambiarCantidad?: (nuevaCantidad: number) => void;
}) {
  const styles = useStyles();
  const entradaId = useId();
  const [entrada, setEntrada] = useState('');
  const [error, setError] = useState('');
  const [validando, setValidando] = useState(false);
  const series = obtenerSeriesCompra(valor);
  const setRecibidas = seriesRecibidas
    ? new Set(seriesRecibidas.map((s) => s.trim().toUpperCase()))
    : null;

  const limiteAlcanzado = !alCambiarCantidad && cantidad > 0 && series.length >= cantidad;

  const agregar = async () => {
    const raw = entrada.trim();
    if (!raw) return;

    // Soportar ingreso individual o múltiple (pegar varias líneas)
    const nuevas = raw
      .split(/\r?\n/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    if (nuevas.length === 0) return;

    if (nuevas.some((s) => s.length > 100)) {
      setError('Cada serie debe tener un máximo de 100 caracteres.');
      return;
    }

    if (!alCambiarCantidad && cantidad > 0 && series.length + nuevas.length > cantidad) {
      setError(
        `No puede agregar ${nuevas.length} serie(s). La cantidad máxima permitida para este producto es ${cantidad} (actual: ${series.length}).`
      );
      return;
    }

    // Validar duplicados locales en la compra actual
    const yaEnEstaCompra = nuevas.filter(
      (s) => series.includes(s) || otrasSeries.includes(s)
    );
    if (yaEnEstaCompra.length > 0) {
      setError(
        `La serie "${yaEnEstaCompra[0]}" ya fue agregada en esta compra.`
      );
      return;
    }

    // Validar duplicados en la misma entrada
    if (new Set(nuevas).size !== nuevas.length) {
      setError('Hay series repetidas en el texto ingresado.');
      return;
    }

    try {
      setValidando(true);
      setError('');

      // VALIDACIÓN INMEDIATA EN TIEMPO REAL CONTRA BASE DE DATOS
      const res = await AlmacenService.validarSeriesExistentes(nuevas);
      if (res && res.existentes && res.existentes.length > 0) {
        const itemDuplicado = res.existentes[0];
        const ubicacion = itemDuplicado.almacenNombre
          ? `en ${itemDuplicado.almacenNombre}`
          : itemDuplicado.estado;
        setError(
          `La serie "${itemDuplicado.numeroSerie}" ya está registrada en el sistema (${ubicacion}). No se puede volver a ingresar.`
        );
        return;
      }

      const listaFinal = [...series, ...nuevas];
      alCambiar(listaFinal.join('\n'));
      if (alCambiarCantidad) {
        alCambiarCantidad(listaFinal.length);
      }
      setEntrada('');
      setError('');
    } catch (err: any) {
      setError(
        err?.message || 'Error al validar la existencia de las series en el sistema.'
      );
    } finally {
      setValidando(false);
    }
  };

  return (
    <section className={styles.root} aria-label="Números de serie">
      <D365CommandBar ariaLabel="Comandos de series">
        <Text weight="semibold">
          Series ({series.length}{cantidad > 0 ? ` / ${cantidad}` : ''})
          {setRecibidas &&
            ` • ${setRecibidas.size} recibidas, ${
              series.length - setRecibidas.size
            } faltantes`}
        </Text>
      </D365CommandBar>

      {error && (
        <D365MessageBar intent="error" onDismiss={() => setError('')}>
          {error}
        </D365MessageBar>
      )}

      {!soloLectura && (
        <div className={styles.entry}>
          <Label htmlFor={entradaId}>Serie</Label>
          <Input
            aria-label="Nueva serie o escanear"
            className={styles.input}
            placeholder="Escriba o pegue una o más series (Enter para agregar)..."
            value={entrada}
            id={entradaId}
            disabled={validando || limiteAlcanzado}
            maxLength={100}
            onChange={(_, d) => setEntrada(d.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void agregar();
              }
            }}
          />
          <D365CommandButton
            icon={validando ? <Spinner size="tiny" /> : <Add16Regular />}
            tone="create"
            disabled={validando || !entrada.trim() || limiteAlcanzado}
            onClick={() => void agregar()}
          >
            {validando ? 'Validando...' : 'Agregar'}
          </D365CommandButton>
        </div>
      )}

      <div className={styles.scroll}>
        <Table aria-label="Series del producto">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Número de serie</TableHeaderCell>
              {setRecibidas && <TableHeaderCell>Estado de recepción</TableHeaderCell>}
              {!soloLectura && <TableHeaderCell className={styles.action} />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {series.map((serie) => {
              const estaRecibida = setRecibidas ? setRecibidas.has(serie) : null;
              return (
                <TableRow key={serie}>
                  <TableCell style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {serie}
                  </TableCell>
                  {setRecibidas && (
                    <TableCell>
                      <Badge
                        appearance="tint"
                        shape="rounded"
                        color={estaRecibida ? 'success' : 'danger'}
                        size="medium"
                      >
                        {estaRecibida ? '✓ Recibida' : '✗ Faltante'}
                      </Badge>
                    </TableCell>
                  )}
                  {!soloLectura && (
                    <TableCell className={styles.action}>
                      <Button
                        appearance="subtle"
                        icon={<Delete16Regular />}
                        aria-label={`Eliminar serie ${serie}`}
                        onClick={() => {
                          const filtradas = series.filter((s) => s !== serie);
                          alCambiar(filtradas.join('\n'));
                          if (alCambiarCantidad) {
                            alCambiarCantidad(filtradas.length);
                          }
                          setError('');
                        }}
                      />
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
