using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ProgrammingCar.Modules.ServicioCampo.Domain.Clientes;
using ProgrammingCar.Modules.ServicioCampo.Domain.Enums;
using ProgrammingCar.Modules.ServicioCampo.Domain.Mantenimientos;
using ProgrammingCar.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using ProgrammingCar.Modules.ServicioCampo.Domain.Organizacion;
using ProgrammingCar.Modules.ServicioCampo.Domain.Plantillas;
using ProgrammingCar.Modules.ServicioCampo.Domain.Productos;
using ProgrammingCar.Modules.ServicioCampo.Domain.Recursos;

namespace ProgrammingCar.Modules.ServicioCampo.Application.OrdenesTrabajo;

public record ResultadoImportacionSiebel(
    int TotalFilas,
    int TotalOrdenesDetectadas,
    int OrdenesCreadas,
    int OrdenesOmitidas,
    int ClientesCreados,
    int ServiciosCreados,
    int ZonasCreadas,
    int TecnicosCreados,
    List<string> Errores
);

public class SiebelImportadorService
{
    private readonly IServicioCampoDbContext _db;
    private readonly ILogger<SiebelImportadorService> _logger;

    public SiebelImportadorService(IServicioCampoDbContext db, ILogger<SiebelImportadorService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<ResultadoImportacionSiebel> ImportarDesdeStreamAsync(
        Stream stream,
        Guid usuarioEjecutorId,
        CancellationToken ct = default)
    {
        var errores = new List<string>();

        // 1. Leer buffer para detectar codificación
        using var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream, ct);
        var bytes = memoryStream.ToArray();

        if (bytes.Length == 0)
        {
            errores.Add("El archivo proporcionado está vacío.");
            return new ResultadoImportacionSiebel(0, 0, 0, 0, 0, 0, 0, 0, errores);
        }

        var encoding = DetectarEncoding(bytes);
        using var reader = new StreamReader(new MemoryStream(bytes), encoding);

        // 2. Leer encabezado y determinar delimitador
        var headerLine = await reader.ReadLineAsync(ct);
        if (string.IsNullOrWhiteSpace(headerLine))
        {
            errores.Add("El archivo no contiene encabezado con columnas válidas.");
            return new ResultadoImportacionSiebel(0, 0, 0, 0, 0, 0, 0, 0, errores);
        }

        var delimiter = headerLine.Contains('\t') ? '\t' : (headerLine.Contains(';') ? ';' : ',');
        var headerCols = ParseCsvLine(headerLine, delimiter);
        var colMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        for (int i = 0; i < headerCols.Count; i++)
        {
            var norm = NormalizarNombreColumna(headerCols[i]);
            if (!colMap.ContainsKey(norm))
            {
                colMap[norm] = i;
            }
        }

        // 3. Leer todas las filas de datos
        var lineas = new List<List<string>>();
        string? line;
        while ((line = await reader.ReadLineAsync(ct)) != null)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;
            var parts = ParseCsvLine(line, delimiter);
            lineas.Add(parts);
        }

        if (lineas.Count == 0)
        {
            errores.Add("El archivo no contiene filas de datos.");
            return new ResultadoImportacionSiebel(0, 0, 0, 0, 0, 0, 0, 0, errores);
        }

        // Helpers para extraer valores de fila
        string GetVal(List<string> row, params string[] normColNames)
        {
            foreach (var name in normColNames)
            {
                if (colMap.TryGetValue(name, out var idx) && idx < row.Count)
                {
                    var val = row[idx]?.Trim();
                    if (!string.IsNullOrEmpty(val)) return val;
                }
            }
            return string.Empty;
        }

        // 4. Agrupar filas por Número de Orden de Trabajo
        var ordenesAgrupadas = new Dictionary<string, List<List<string>>>(StringComparer.OrdinalIgnoreCase);
        foreach (var row in lineas)
        {
            var nroWo = GetVal(row, "numerodeordendetrabajo", "ordendetrabajo", "nowodeibs");
            if (string.IsNullOrWhiteSpace(nroWo)) continue;
            if (!ordenesAgrupadas.TryGetValue(nroWo, out var list))
            {
                list = new List<List<string>>();
                ordenesAgrupadas[nroWo] = list;
            }
            list.Add(row);
        }

        if (ordenesAgrupadas.Count == 0)
        {
            errores.Add("No se encontraron números de orden de trabajo válidos en el archivo.");
            return new ResultadoImportacionSiebel(lineas.Count, 0, 0, 0, 0, 0, 0, 0, errores);
        }

        // 5. Cargar catálogos y preparar entidades base
        var sedePrincipal = await _db.UnidadesOrganizativas.FirstOrDefaultAsync(u => u.Activo, ct);
        if (sedePrincipal == null)
        {
            sedePrincipal = UnidadOrganizativa.Crear("SEDE-TRU", "Sede Principal Trujillo", "Trujillo", esSedePrincipal: true);
            _db.UnidadesOrganizativas.Add(sedePrincipal);
            await _db.SaveChangesAsync(ct);
        }

        var tipoOrden = await _db.TiposOrdenTrabajo.FirstOrDefaultAsync(t => t.Activo, ct);
        if (tipoOrden == null)
        {
            tipoOrden = TipoOrdenTrabajo.Crear("Servicio Siebel DirecTV", true, true, true, "Órdenes de servicio importadas de Siebel", "#0078D4");
            _db.TiposOrdenTrabajo.Add(tipoOrden);
            await _db.SaveChangesAsync(ct);
        }

        var listaPrecios = await _db.ListasPrecios.FirstOrDefaultAsync(l => l.Activo, ct);
        if (listaPrecios == null)
        {
            listaPrecios = ListaPrecios.Crear("Tarifario DirecTV General", "PEN");
            _db.ListasPrecios.Add(listaPrecios);
            await _db.SaveChangesAsync(ct);
        }

        // Ubigeos válidos en base de datos
        var ubigeosValidos = await _db.Ubigeos.AsNoTracking().Select(u => u.Codigo).ToHashSetAsync(ct);

        // Clientes existentes
        var clientesPorCodigoExterno = await _db.Clientes
            .Where(c => c.CodigoExterno != null)
            .ToDictionaryAsync(c => c.CodigoExterno!, c => c, StringComparer.OrdinalIgnoreCase, ct);

        var clientesPorDoc = await _db.Clientes
            .ToDictionaryAsync(c => c.DocumentoIdentidad, c => c, StringComparer.OrdinalIgnoreCase, ct);

        // Zonas existentes
        var zonasPorCodigo = await _db.ZonasOperativas
            .ToDictionaryAsync(z => z.Codigo, z => z, StringComparer.OrdinalIgnoreCase, ct);

        // Recursos existentes
        var recursosPorNombre = await _db.Recursos
            .ToDictionaryAsync(r => r.NombreCompleto.ToUpperInvariant(), r => r, StringComparer.OrdinalIgnoreCase, ct);

        // Servicios / Productos existentes
        var productosPorCodigo = await _db.Productos
            .Where(p => p.Tipo == TipoProducto.Servicio)
            .ToDictionaryAsync(p => p.Codigo, p => p, StringComparer.OrdinalIgnoreCase, ct);

        // Plantillas / Configuraciones existentes
        var configsPorProductoId = await _db.ConfiguracionesServicio
            .Where(c => c.Activo)
            .ToDictionaryAsync(c => c.ProductoId, c => c, ct);

        // Elementos de lista de precios existentes
        var preciosPorProductoId = await _db.ElementosListaPrecios
            .Where(e => e.ListaPreciosId == listaPrecios.Id)
            .ToDictionaryAsync(e => e.ProductoId, e => e, ct);

        // Órdenes existentes
        var ordenesExistentes = await _db.OrdenesTrabajo
            .Where(o => o.NumeroOrden != null || o.ReferenciaExterna != null)
            .Select(o => o.NumeroOrden ?? o.ReferenciaExterna!)
            .ToHashSetAsync(StringComparer.OrdinalIgnoreCase, ct);

        // Conteo actual para secuencias
        var totalClientesCount = await _db.Clientes.CountAsync(ct);
        var totalOrdenesCount = await _db.OrdenesTrabajo.CountAsync(ct);

        int clientesCreados = 0;
        int serviciosCreados = 0;
        int zonasCreadas = 0;
        int tecnicosCreados = 0;
        int ordenesCreadas = 0;
        int ordenesOmitidas = 0;

        // 6. Procesar cada grupo de Orden de Trabajo
        foreach (var kvp in ordenesAgrupadas)
        {
            var nroWo = kvp.Key;
            var filasWo = kvp.Value;
            var primeraFila = filasWo[0];

            if (ordenesExistentes.Contains(nroWo))
            {
                ordenesOmitidas++;
                continue;
            }

            try
            {
                // A) Resolver o crear Cliente
                var nroCliente = GetVal(primeraFila, "nodecliente", "cliente", "numerodecliente");
                if (string.IsNullOrWhiteSpace(nroCliente))
                    nroCliente = $"EXT-{nroWo}";

                Cliente? cliente = null;
                if (!clientesPorCodigoExterno.TryGetValue(nroCliente, out cliente))
                {
                    if (!clientesPorDoc.TryGetValue(nroCliente, out cliente))
                    {
                        totalClientesCount++;
                        var codigoCliente = $"CLI-{totalClientesCount:D5}";
                        var nombre = GetVal(primeraFila, "nombre");
                        if (string.IsNullOrWhiteSpace(nombre)) nombre = "Cliente";
                        var apellidos = GetVal(primeraFila, "apellidos", "apellido");
                        var tel = LimpiarTelefono(GetVal(primeraFila, "nodetelefonoprincipal", "telefono"));
                        var direccion = GetVal(primeraFila, "domicilio", "direccion");
                        if (string.IsNullOrWhiteSpace(direccion)) direccion = "Sin dirección";
                        var referencia = GetVal(primeraFila, "observacionesdeladireccion", "referencia");
                        var ubigeo = GetVal(primeraFila, "codigopostal", "ubigeo");
                        if (string.IsNullOrWhiteSpace(ubigeo) || !ubigeosValidos.Contains(ubigeo))
                        {
                            ubigeo = "130101"; // Default Trujillo
                        }

                        decimal? lat = ParseCoordenada(GetVal(primeraFila, "x"));
                        decimal? lng = ParseCoordenada(GetVal(primeraFila, "y"));

                        cliente = Cliente.Crear(
                            codigoCliente: codigoCliente,
                            documentoIdentidad: nroCliente,
                            nombres: nombre,
                            apellidos: string.IsNullOrWhiteSpace(apellidos) ? null : apellidos,
                            telefonoPrincipal: tel,
                            direccion: direccion,
                            ubigeoCodigo: ubigeo,
                            esClienteFacturacion: true,
                            esClienteServicio: true,
                            tipoDocumento: nroCliente.Length == 8 ? "DNI" : "OTRO",
                            tipoPersona: "NATURAL",
                            referencia: referencia,
                            lat: lat,
                            lng: lng,
                            codigoExterno: nroCliente
                        );

                        _db.Clientes.Add(cliente);
                        clientesPorCodigoExterno[nroCliente] = cliente;
                        clientesPorDoc[nroCliente] = cliente;
                        clientesCreados++;
                    }
                }

                // B) Resolver o crear Zona Operativa
                var regionServicio = GetVal(primeraFila, "regiondeservicio", "zona");
                ZonaOperativa? zona = null;
                if (!string.IsNullOrWhiteSpace(regionServicio))
                {
                    if (!zonasPorCodigo.TryGetValue(regionServicio, out zona))
                    {
                        var nombreZona = regionServicio.Replace("WZ_", "").Replace("_", " ").Trim();
                        zona = ZonaOperativa.Crear(
                            codigo: regionServicio,
                            nombre: string.IsNullOrWhiteSpace(nombreZona) ? regionServicio : nombreZona,
                            sucursalId: sedePrincipal.Id
                        );
                        _db.ZonasOperativas.Add(zona);
                        zonasPorCodigo[regionServicio] = zona;
                        zonasCreadas++;
                    }
                }

                // C) Resolver o crear Recurso Técnico (si está asignado a alguien real)
                var tecResponsable = GetVal(primeraFila, "cuadrillatecnicoresponsable", "tecnico");
                var tecNombre = GetVal(primeraFila, "nombrecuadrillatecnico");
                var tecApellido = GetVal(primeraFila, "apellidocuadrillatecnico");
                var nombreCompletoTec = $"{tecNombre} {tecApellido}".Trim();

                Recurso? recurso = null;
                if (!string.IsNullOrWhiteSpace(nombreCompletoTec) &&
                    !nombreCompletoTec.Contains("Siebel", StringComparison.OrdinalIgnoreCase) &&
                    !nombreCompletoTec.Contains("Administrator", StringComparison.OrdinalIgnoreCase))
                {
                    var tecKey = nombreCompletoTec.ToUpperInvariant();
                    if (!recursosPorNombre.TryGetValue(tecKey, out recurso))
                    {
                        var codTec = !string.IsNullOrWhiteSpace(tecResponsable) && tecResponsable.Length <= 30
                            ? tecResponsable.ToUpperInvariant()
                            : $"TEC-{recursosPorNombre.Count + 1:D3}";

                        recurso = Recurso.Crear(
                            codigo: codTec,
                            nombreCompleto: nombreCompletoTec,
                            tipo: TipoRecurso.Tecnico,
                            zonaOperativaId: zona?.Id,
                            email: tecResponsable.Contains('@') ? tecResponsable : null
                        );
                        _db.Recursos.Add(recurso);
                        recursosPorNombre[tecKey] = recurso;
                        tecnicosCreados++;
                    }
                }

                // D) Crear Orden de Trabajo
                totalOrdenesCount++;
                var codigoWo = $"WO-{totalOrdenesCount:D6}";
                var estadoSiebel = GetVal(primeraFila, "estadodeordendetrabajo", "estado");
                var obsIbs = GetVal(primeraFila, "descripciondeibs");
                var razones = GetVal(primeraFila, "razones");
                var obsGenerales = $"Importada desde Siebel. {obsIbs} {razones}".Trim();

                var orden = OrdenTrabajo.Crear(
                    codigoWo: codigoWo,
                    tipoOrdenId: tipoOrden.Id,
                    creadoPorId: usuarioEjecutorId,
                    clienteFacturacionId: cliente.Id,
                    clienteServicioId: cliente.Id,
                    zonaOperativaId: zona?.Id,
                    numeroOrden: nroWo,
                    codigoContrato: nroCliente,
                    numeroPedido: GetVal(primeraFila, "iddelencabezadodelpedido"),
                    estadoOrigen: estadoSiebel,
                    descargaMaterialesObligatoria: true,
                    referenciaExterna: nroWo,
                    listaPreciosId: listaPrecios.Id,
                    moneda: "PEN",
                    unidadOrganizativaId: sedePrincipal.Id
                );

                if (!string.IsNullOrWhiteSpace(obsGenerales))
                {
                    orden.ActualizarObservaciones(obsGenerales);
                }

                // E) Procesar cada línea de trabajo (Servicio / SL)
                int itemIdx = 1;
                foreach (var filaItem in filasWo)
                {
                    var slCode = GetVal(filaItem, "codigodesl", "sl");
                    var slNombre = GetVal(filaItem, "servicio");
                    if (string.IsNullOrWhiteSpace(slCode)) slCode = "GEN01";
                    if (string.IsNullOrWhiteSpace(slNombre)) slNombre = $"Servicio {slCode}";

                    // Resolver Producto Servicio
                    if (!productosPorCodigo.TryGetValue(slCode, out var prodServicio))
                    {
                        prodServicio = Producto.Crear(
                            codigo: slCode,
                            nombre: slNombre,
                            tipo: TipoProducto.Servicio,
                            precioBase: 0m
                        );
                        _db.Productos.Add(prodServicio);
                        productosPorCodigo[slCode] = prodServicio;
                        serviciosCreados++;

                        // Asegurar precio en lista
                        var elem = ElementoListaPrecios.Crear(listaPrecios.Id, prodServicio.Id, 0m);
                        _db.ElementosListaPrecios.Add(elem);
                        preciosPorProductoId[prodServicio.Id] = elem;
                    }
                    else if (!preciosPorProductoId.ContainsKey(prodServicio.Id))
                    {
                        var elem = ElementoListaPrecios.Crear(listaPrecios.Id, prodServicio.Id, 0m);
                        _db.ElementosListaPrecios.Add(elem);
                        preciosPorProductoId[prodServicio.Id] = elem;
                    }

                    // Resolver Configuración de Servicio (Work Template) con Puntos = 1.0m por defecto
                    if (!configsPorProductoId.TryGetValue(prodServicio.Id, out var configServicio))
                    {
                        configServicio = ConfiguracionServicio.Crear(
                            nombre: $"Plantilla {prodServicio.Nombre}",
                            productoId: prodServicio.Id,
                            duracionEstimadaMinutos: 60,
                            descripcion: "Configuración generada automáticamente para atención de servicio.",
                            esPredeterminada: true,
                            puntos: 1.0m
                        );
                        _db.ConfiguracionesServicio.Add(configServicio);
                        configsPorProductoId[prodServicio.Id] = configServicio;
                    }

                    var nroItem = GetVal(filaItem, "nodeitem");
                    var codigoTrabajo = $"{orden.CodigoWo}-T{itemIdx:D2}";
                    var puntosTrabajo = configServicio.Puntos > 0 ? configServicio.Puntos : 1.0m;

                    var trabajo = orden.AgregarTrabajo(
                        codigoTrabajo: codigoTrabajo,
                        servicioId: prodServicio.Id,
                        itemNumero: itemIdx,
                        configuracionServicioId: configServicio.Id,
                        tarifaBase: 0m,
                        observaciones: GetVal(filaItem, "descripciondeibs"),
                        codigoExterno: string.IsNullOrWhiteSpace(nroItem) ? null : nroItem,
                        puntos: puntosTrabajo
                    );

                    trabajo.AplicarPlantilla(configServicio);
                    itemIdx++;
                }

                // F) Programar visita si tiene técnico asignado
                if (recurso != null)
                {
                    var nroVisita = GetVal(primeraFila, "nodevisita");
                    var codigoVisita = !string.IsNullOrWhiteSpace(nroVisita) ? nroVisita : $"{orden.CodigoWo}-V1";

                    DateTime fechaProg = DateTime.UtcNow;
                    var fechaCreacionStr = GetVal(primeraFila, "fechadecreacion");
                    if (DateTime.TryParse(fechaCreacionStr, CultureInfo.GetCultureInfo("es-PE"), DateTimeStyles.None, out var dtParsed))
                    {
                        fechaProg = dtParsed;
                    }

                    orden.ProgramarVisita(
                        codigoVisita: codigoVisita,
                        recursoTecnicoId: recurso.Id,
                        fechaProgramada: DateOnly.FromDateTime(fechaProg),
                        bloqueHorario: "08:00 - 18:00"
                    );

                    if (estadoSiebel.Equals("En progreso", StringComparison.OrdinalIgnoreCase))
                    {
                        orden.CambiarEstadoSistema(EstadoSistema.EnProgreso);
                    }
                }

                _db.OrdenesTrabajo.Add(orden);
                ordenesExistentes.Add(nroWo);
                ordenesCreadas++;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error procesando orden Siebel {NumeroOrden}", nroWo);
                errores.Add($"Orden {nroWo}: {ex.Message}");
            }
        }

        // Guardar todos los cambios acumulados
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Importación Siebel finalizada: {Creadas} creadas, {Omitidas} omitidas, {Clientes} clientes.",
            ordenesCreadas, ordenesOmitidas, clientesCreados);

        return new ResultadoImportacionSiebel(
            TotalFilas: lineas.Count,
            TotalOrdenesDetectadas: ordenesAgrupadas.Count,
            OrdenesCreadas: ordenesCreadas,
            OrdenesOmitidas: ordenesOmitidas,
            ClientesCreados: clientesCreados,
            ServiciosCreados: serviciosCreados,
            ZonasCreadas: zonasCreadas,
            TecnicosCreados: tecnicosCreados,
            Errores: errores
        );
    }

    private static Encoding DetectarEncoding(byte[] bytes)
    {
        if (bytes.Length >= 2 && bytes[0] == 0xFF && bytes[1] == 0xFE)
            return Encoding.Unicode; // UTF-16 LE

        if (bytes.Length >= 3 && bytes[0] == 0xEF && bytes[1] == 0xBB && bytes[2] == 0xBF)
            return Encoding.UTF8;

        // Inspeccionar primeros bytes para detectar null bytes típicos de UTF-16
        int nullCount = 0;
        int checkLen = Math.Min(bytes.Length, 200);
        for (int i = 0; i < checkLen; i++)
        {
            if (bytes[i] == 0) nullCount++;
        }

        if (nullCount > checkLen / 4)
            return Encoding.Unicode;

        return Encoding.UTF8;
    }

    private static string NormalizarNombreColumna(string col)
    {
        if (string.IsNullOrWhiteSpace(col)) return string.Empty;
        var lower = col.Trim().ToLowerInvariant();
        return Regex.Replace(lower, @"[^a-z0-9]", "");
    }

    private static List<string> ParseCsvLine(string line, char delimiter)
    {
        var result = new List<string>();
        if (line == null) return result;

        var inQuotes = false;
        var token = new StringBuilder();

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    token.Append('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == delimiter && !inQuotes)
            {
                result.Add(token.ToString().Trim());
                token.Clear();
            }
            else
            {
                token.Append(c);
            }
        }

        result.Add(token.ToString().Trim());
        return result;
    }

    private static string LimpiarTelefono(string? tel)
    {
        if (string.IsNullOrWhiteSpace(tel)) return "999999999";
        var digits = Regex.Replace(tel, @"[^\d]", "");
        if (digits.Length >= 9) return digits[^9..];
        if (digits.Length > 0) return digits;
        return "999999999";
    }

    private static decimal? ParseCoordenada(string? coord)
    {
        if (string.IsNullOrWhiteSpace(coord)) return null;
        var normalized = coord.Trim().Replace(',', '.');
        if (decimal.TryParse(normalized, NumberStyles.Any, CultureInfo.InvariantCulture, out var val))
            return val;
        return null;
    }
}
