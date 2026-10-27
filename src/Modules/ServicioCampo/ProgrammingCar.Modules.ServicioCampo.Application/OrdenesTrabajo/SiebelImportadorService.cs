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

public record FilaDetalleImportacionSiebel(
    int Fila,
    string NumeroOrden,
    string Cliente,
    string Servicio,
    string Tecnico,
    string Estado, // "Creada", "Actualizada", "Omitida", "Error", "Invalida"
    string Detalle
);

public record ResultadoImportacionSiebel(
    int TotalFilas,
    int TotalOrdenesDetectadas,
    int OrdenesCreadas,
    int OrdenesOmitidas,
    int ClientesCreados,
    int ServiciosCreados,
    int ZonasCreadas,
    int TecnicosCreados,
    List<string> Errores,
    List<FilaDetalleImportacionSiebel> Detalles,
    string? ReporteCsvBase64 = null
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
        var detalles = new List<FilaDetalleImportacionSiebel>();

        // 1. Leer buffer completo para determinar codificación
        using var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream, ct);
        var bytes = memoryStream.ToArray();

        if (bytes.Length == 0)
        {
            errores.Add("El archivo proporcionado está vacío.");
            return new ResultadoImportacionSiebel(0, 0, 0, 0, 0, 0, 0, 0, errores, detalles);
        }

        var encoding = DetectarEncoding(bytes);
        using var reader = new StreamReader(new MemoryStream(bytes), encoding);

        // 2. Leer encabezado y determinar delimitador
        var headerLine = await reader.ReadLineAsync(ct);
        if (string.IsNullOrWhiteSpace(headerLine))
        {
            errores.Add("El archivo no contiene encabezado con columnas válidas.");
            return new ResultadoImportacionSiebel(0, 0, 0, 0, 0, 0, 0, 0, errores, detalles);
        }

        var delimiter = headerLine.Contains('\t') ? '\t' : (headerLine.Contains(';') ? ';' : ',');
        var headerCols = ParseCsvLine(headerLine, delimiter);
        var colMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        for (int i = 0; i < headerCols.Count; i++)
        {
            var norm = NormalizarNombreColumna(headerCols[i]);
            if (!string.IsNullOrEmpty(norm) && !colMap.ContainsKey(norm))
            {
                colMap[norm] = i;
            }
        }

        // Mapeo inteligente con soporte de acrónimos y subcadenas
        void AsegurarColumna(string claveDestino, params string[] subcadenas)
        {
            if (colMap.ContainsKey(claveDestino)) return;
            for (int i = 0; i < headerCols.Count; i++)
            {
                var hNorm = NormalizarNombreColumna(headerCols[i]);
                if (subcadenas.All(sub => hNorm.Contains(sub, StringComparison.OrdinalIgnoreCase)))
                {
                    colMap[claveDestino] = i;
                    break;
                }
            }
        }

        AsegurarColumna("numerodeordendetrabajo", "orden", "trabajo");
        AsegurarColumna("nodewodeibs", "ibs");
        AsegurarColumna("proveedor", "proveedor");
        AsegurarColumna("nodecliente", "cliente");
        AsegurarColumna("codigodesl", "sl");
        AsegurarColumna("codigopostal", "postal");
        AsegurarColumna("nodetelefonoprincipal", "telefono");
        AsegurarColumna("domicilio", "domicilio");
        AsegurarColumna("nombrecuadrillatecnico", "nombre", "tecnico");
        AsegurarColumna("apellidocuadrillatecnico", "apellido", "tecnico");
        AsegurarColumna("cuadrillatecnicoresponsable", "responsable");
        AsegurarColumna("fechadecreacion", "creacion");

        // 3. Leer todas las filas de datos preservando el número de fila original
        var lineasConFila = new List<(int Fila, List<string> Row)>();
        string? line;
        int filaContador = 1; // Línea 1 fue encabezado
        while ((line = await reader.ReadLineAsync(ct)) != null)
        {
            filaContador++;
            if (string.IsNullOrWhiteSpace(line)) continue;
            var parts = ParseCsvLine(line, delimiter);
            lineasConFila.Add((filaContador, parts));
        }

        if (lineasConFila.Count == 0)
        {
            errores.Add("El archivo no contiene filas de datos.");
            return new ResultadoImportacionSiebel(0, 0, 0, 0, 0, 0, 0, 0, errores, detalles);
        }

        // Helper para extraer valores de fila
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
        var ordenesAgrupadas = new Dictionary<string, List<(int Fila, List<string> Row)>>(StringComparer.OrdinalIgnoreCase);
        foreach (var item in lineasConFila)
        {
            var nroWo = GetVal(item.Row, "numerodeordendetrabajo", "ordendetrabajo", "nrodeordendetrabajo", "nowo");
            if (string.IsNullOrWhiteSpace(nroWo))
            {
                detalles.Add(new FilaDetalleImportacionSiebel(
                    Fila: item.Fila,
                    NumeroOrden: "SIN_NUMERO",
                    Cliente: GetVal(item.Row, "nombre", "nodecliente"),
                    Servicio: GetVal(item.Row, "codigodesl", "servicio"),
                    Tecnico: GetVal(item.Row, "nombrecuadrillatecnico"),
                    Estado: "Invalida",
                    Detalle: "No se encontró un número de orden de trabajo válido en esta fila."
                ));
                continue;
            }

            if (!ordenesAgrupadas.TryGetValue(nroWo, out var list))
            {
                list = new List<(int Fila, List<string> Row)>();
                ordenesAgrupadas[nroWo] = list;
            }
            list.Add(item);
        }

        if (ordenesAgrupadas.Count == 0)
        {
            errores.Add($"No se encontraron números de orden de trabajo válidos en el archivo. Encabezados detectados ({headerCols.Count}): {string.Join(", ", headerCols.Take(10))}...");
            var repBase64 = GenerarReporteBase64(detalles, errores);
            return new ResultadoImportacionSiebel(lineasConFila.Count, 0, 0, 0, 0, 0, 0, 0, errores, detalles, repBase64);
        }

        // 5. Cargar catálogo de Sedes / Unidades Organizativas (Piura, Trujillo, Chimbote, Chiclayo, Lima)
        var sedes = await _db.UnidadesOrganizativas.Where(u => u.Activo).ToListAsync(ct);
        if (sedes.Count == 0)
        {
            var sedeDefault = UnidadOrganizativa.Crear("I280000", "PE-I280000-PROGRAMMING SAC TRUJILLO", "Trujillo", esSedePrincipal: true);
            _db.UnidadesOrganizativas.Add(sedeDefault);
            await _db.SaveChangesAsync(ct);
            sedes.Add(sedeDefault);
        }

        UnidadOrganizativa ResolverUnidad(string proveedorTexto)
        {
            if (string.IsNullOrWhiteSpace(proveedorTexto)) return sedes.First();
            var pUpper = proveedorTexto.ToUpperInvariant();

            // 1. Por código (I280000, I280010, I280020, I280030, I280070)
            var matchCodigo = sedes.FirstOrDefault(s => pUpper.Contains(s.Codigo.ToUpperInvariant()));
            if (matchCodigo != null) return matchCodigo;

            // 2. Por ciudad (Piura, Chiclayo, Chimbote, Trujillo, Lima)
            var matchCiudad = sedes.FirstOrDefault(s => !string.IsNullOrEmpty(s.Ciudad) && pUpper.Contains(s.Ciudad.ToUpperInvariant()));
            if (matchCiudad != null) return matchCiudad;

            // 3. Por coincidencia de nombre
            var matchNombre = sedes.FirstOrDefault(s => pUpper.Contains(s.Nombre.ToUpperInvariant()) || s.Nombre.ToUpperInvariant().Contains(pUpper));
            if (matchNombre != null) return matchNombre;

            return sedes.First();
        }

        // Cliente de Facturación: SIEMPRE DIRECTV
        var clienteDirectv = await _db.Clientes.FirstOrDefaultAsync(
            c => c.EsClienteFacturacion && (c.Nombres.ToUpper().Contains("DIRECTV") || (c.RazonSocial != null && c.RazonSocial.ToUpper().Contains("DIRECTV"))),
            ct);

        var totalClientesCount = await _db.Clientes.CountAsync(ct);
        if (clienteDirectv == null)
        {
            totalClientesCount++;
            clienteDirectv = Cliente.Crear(
                codigoCliente: $"CLI-{totalClientesCount:D5}",
                documentoIdentidad: "20509653199",
                nombres: "DIRECTV",
                apellidos: "PERU S.R.L.",
                telefonoPrincipal: "999999999",
                direccion: "Av. República de Colombia 791",
                ubigeoCodigo: "150131",
                esClienteFacturacion: true,
                esClienteServicio: false,
                tipoDocumento: "RUC",
                tipoPersona: "JURIDICA",
                codigoExterno: "DIRECTV"
            );
            _db.Clientes.Add(clienteDirectv);
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

        // Recursos existentes
        var recursosPorNombre = await _db.Recursos
            .ToDictionaryAsync(r => r.NombreCompleto.ToUpperInvariant(), r => r, StringComparer.OrdinalIgnoreCase, ct);

        // Servicios / Productos existentes
        var productosPorCodigo = await _db.Productos
            .Where(p => p.Tipo == TipoProducto.Servicio)
            .ToDictionaryAsync(p => p.Codigo, p => p, StringComparer.OrdinalIgnoreCase, ct);

        // Plantillas / Configuraciones existentes
        var configsExistentes = await _db.ConfiguracionesServicio
            .Include(c => c.Servicios)
            .Where(c => c.Activo)
            .ToListAsync(ct);

        // Elementos de lista de precios existentes
        var preciosPorProductoId = await _db.ElementosListaPrecios
            .Where(e => e.ListaPreciosId == listaPrecios.Id)
            .ToDictionaryAsync(e => e.ProductoId, e => e, ct);

        // Órdenes existentes indexadas para upsert inteligente
        var ordenesExistentesDb = await _db.OrdenesTrabajo
            .Include(o => o.Trabajos)
            .Where(o => o.NumeroOrden != null || o.ReferenciaExterna != null)
            .ToListAsync(ct);

        var ordenesPorNumero = ordenesExistentesDb
            .Where(o => !string.IsNullOrWhiteSpace(o.NumeroOrden))
            .ToDictionary(o => o.NumeroOrden!, o => o, StringComparer.OrdinalIgnoreCase);

        var totalOrdenesCount = await _db.OrdenesTrabajo.CountAsync(ct);

        int clientesCreados = 0;
        int serviciosCreados = 0;
        int tecnicosCreados = 0;
        int ordenesCreadas = 0;
        int ordenesActualizadas = 0;

        // 6. Procesar cada grupo de Orden de Trabajo
        foreach (var kvp in ordenesAgrupadas)
        {
            var nroWo = kvp.Key;
            var filasWo = kvp.Value;
            var primeraFilaInfo = filasWo[0];
            var primeraFila = primeraFilaInfo.Row;
            var filaOrigen = primeraFilaInfo.Fila;

            var nroCliente = GetVal(primeraFila, "nodecliente", "cliente", "numerodecliente");
            if (string.IsNullOrWhiteSpace(nroCliente))
                nroCliente = $"EXT-{nroWo}";

            // N° de WO de IBS (Columna clave requerida como código externo de trabajo)
            var nroWoIbs = GetVal(primeraFila, "nodewodeibs", "nowodeibs", "wodeibs", "nowo", "nrodewodeibs");

            var nombreCli = GetVal(primeraFila, "nombre");
            var apellidosCli = GetVal(primeraFila, "apellidos", "apellido");
            var clienteNombreCompleto = $"{nombreCli} {apellidosCli}".Trim();
            if (string.IsNullOrWhiteSpace(clienteNombreCompleto)) clienteNombreCompleto = "Cliente DirecTV";

            var slServiciosResumen = string.Join(", ", filasWo.Select(f => GetVal(f.Row, "codigodesl", "servicio")).Where(s => !string.IsNullOrEmpty(s)).Distinct());
            var tecNombre = GetVal(primeraFila, "nombrecuadrillatecnico");
            var tecApellido = GetVal(primeraFila, "apellidocuadrillatecnico");
            var nombreCompletoTec = $"{tecNombre} {tecApellido}".Trim();

            // Resolver sede según columna 'Proveedor' (ej. PE-I280030-PROGRAMMING SAC PIURA -> Piura)
            var proveedorTexto = GetVal(primeraFila, "proveedor");
            var unidadOrg = ResolverUnidad(proveedorTexto);

            // Si la orden ya existe en la BD, la actualizamos para corregir cliente de facturación, sede y código externo IBS
            if (ordenesPorNumero.TryGetValue(nroWo, out var ordenExistente))
            {
                ordenExistente.AsignarClienteFacturacion(clienteDirectv.Id);
                ordenExistente.AsignarUnidadOrganizativa(unidadOrg.Id);
                ordenExistente.AsignarZonaOperativa(null); // Sin zonas operativas
                ordenExistente.ActualizarReferencias(nroWo, !string.IsNullOrWhiteSpace(nroWoIbs) ? nroWoIbs : nroWo, nroCliente);

                foreach (var t in ordenExistente.Trabajos)
                {
                    if (!string.IsNullOrWhiteSpace(nroWoIbs))
                    {
                        t.ActualizarDatos(t.ReferenciaEquipo, t.Observaciones, nroWoIbs);
                    }
                }

                ordenesActualizadas++;
                detalles.Add(new FilaDetalleImportacionSiebel(
                    Fila: filaOrigen,
                    NumeroOrden: nroWo,
                    Cliente: clienteNombreCompleto,
                    Servicio: slServiciosResumen,
                    Tecnico: string.IsNullOrWhiteSpace(nombreCompletoTec) ? "Sin Asignar" : nombreCompletoTec,
                    Estado: "Actualizada",
                    Detalle: $"Orden actualizada con Facturación DIRECTV, Sede {unidadOrg.Nombre} y Cód. Externo {nroWoIbs ?? nroWo}."
                ));
                continue;
            }

            try
            {
                // A) Resolver o crear Cliente Abonado (Servicio)
                Cliente? clienteAbonado = null;
                if (!clientesPorCodigoExterno.TryGetValue(nroCliente, out clienteAbonado))
                {
                    if (!clientesPorDoc.TryGetValue(nroCliente, out clienteAbonado))
                    {
                        totalClientesCount++;
                        var codigoCliente = $"CLI-{totalClientesCount:D5}";
                        var tel = LimpiarTelefono(GetVal(primeraFila, "nodetelefonoprincipal", "telefono"));
                        var direccion = GetVal(primeraFila, "domicilio", "direccion");
                        if (string.IsNullOrWhiteSpace(direccion)) direccion = "Sin dirección";
                        var referencia = GetVal(primeraFila, "observacionesdeladireccion", "referencia");
                        var ubigeo = GetVal(primeraFila, "codigopostal", "ubigeo");
                        if (string.IsNullOrWhiteSpace(ubigeo) || !ubigeosValidos.Contains(ubigeo))
                        {
                            ubigeo = "130101"; // Default Trujillo
                        }

                        decimal? rawX = ParseCoordenada(GetVal(primeraFila, "x"));
                        decimal? rawY = ParseCoordenada(GetVal(primeraFila, "y"));
                        var (lat, lng) = CorregirCoordenadas(rawX, rawY);

                        clienteAbonado = Cliente.Crear(
                            codigoCliente: codigoCliente,
                            documentoIdentidad: nroCliente,
                            nombres: string.IsNullOrWhiteSpace(nombreCli) ? "Cliente" : nombreCli,
                            apellidos: string.IsNullOrWhiteSpace(apellidosCli) ? null : apellidosCli,
                            telefonoPrincipal: tel,
                            direccion: direccion,
                            ubigeoCodigo: ubigeo,
                            esClienteFacturacion: false,
                            esClienteServicio: true,
                            tipoDocumento: nroCliente.Length == 8 ? "DNI" : "OTRO",
                            tipoPersona: "NATURAL",
                            referencia: referencia,
                            lat: lat,
                            lng: lng,
                            codigoExterno: nroCliente
                        );

                        _db.Clientes.Add(clienteAbonado);
                        clientesPorCodigoExterno[nroCliente] = clienteAbonado;
                        clientesPorDoc[nroCliente] = clienteAbonado;
                        clientesCreados++;
                    }
                }

                // B) Resolver o crear Recurso Técnico (si está asignado a alguien real)
                var tecResponsable = GetVal(primeraFila, "cuadrillatecnicoresponsable", "tecnico");
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
                            zonaOperativaId: null, // Sin zona operativa
                            email: tecResponsable.Contains('@') ? tecResponsable : null
                        );
                        _db.Recursos.Add(recurso);
                        recursosPorNombre[tecKey] = recurso;
                        tecnicosCreados++;
                    }
                }

                // C) Crear Orden de Trabajo
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
                    clienteFacturacionId: clienteDirectv.Id, // DIRECTV SRL
                    clienteServicioId: clienteAbonado.Id,    // Abonado/Cliente de servicio
                    zonaOperativaId: null,                  // Sin zonas operativas
                    numeroOrden: nroWo,                     // 1-87461854669 (Número de orden Siebel)
                    codigoContrato: nroCliente,             // 31156902 (N° de cliente)
                    numeroPedido: GetVal(primeraFila, "iddelencabezadodelpedido"),
                    estadoOrigen: estadoSiebel,
                    descargaMaterialesObligatoria: true,
                    referenciaExterna: !string.IsNullOrWhiteSpace(nroWoIbs) ? nroWoIbs : nroWo, // 10.556.972 (N° WO de IBS)
                    listaPreciosId: listaPrecios.Id,
                    moneda: "PEN",
                    unidadOrganizativaId: unidadOrg.Id      // Asignada según Proveedor (Piura, Trujillo, etc.)
                );

                if (!string.IsNullOrWhiteSpace(obsGenerales))
                {
                    orden.ActualizarObservaciones(obsGenerales);
                }

                // D) Procesar cada línea de trabajo (Servicio / SL)
                int itemIdx = 1;
                foreach (var filaItemTuple in filasWo)
                {
                    var filaItem = filaItemTuple.Row;
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

                    // Resolver Configuración de Servicio (Plantilla) tomando los puntos configurados
                    var configServicio = configsExistentes.FirstOrDefault(c => (c.ProductoId == prodServicio.Id || c.Servicios.Any(s => s.ProductoId == prodServicio.Id)) && c.EsPredeterminada)
                        ?? configsExistentes.FirstOrDefault(c => c.ProductoId == prodServicio.Id || c.Servicios.Any(s => s.ProductoId == prodServicio.Id));

                    if (configServicio == null)
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
                        configsExistentes.Add(configServicio);
                    }

                    // Cód. Externo del Trabajo = N° de WO de IBS (ej. 10.556.972)
                    var woItemIbs = GetVal(filaItem, "nodewodeibs", "nowodeibs", "wodeibs", "nowo", "nrodewodeibs");
                    var codigoTrabajo = $"{orden.CodigoWo}-T{itemIdx:D2}";
                    var puntosTrabajo = configServicio.Puntos;

                    var trabajo = orden.AgregarTrabajo(
                        codigoTrabajo: codigoTrabajo,
                        servicioId: prodServicio.Id,
                        itemNumero: itemIdx,
                        configuracionServicioId: configServicio.Id,
                        tarifaBase: 0m,
                        observaciones: GetVal(filaItem, "descripciondeibs"),
                        codigoExterno: !string.IsNullOrWhiteSpace(woItemIbs) ? woItemIbs : (string.IsNullOrWhiteSpace(nroWoIbs) ? null : nroWoIbs),
                        puntos: puntosTrabajo
                    );

                    trabajo.AplicarPlantilla(configServicio);
                    itemIdx++;
                }

                // E) Programar visita si tiene técnico asignado
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
                ordenesPorNumero[nroWo] = orden;
                ordenesCreadas++;

                detalles.Add(new FilaDetalleImportacionSiebel(
                    Fila: filaOrigen,
                    NumeroOrden: nroWo,
                    Cliente: clienteNombreCompleto,
                    Servicio: slServiciosResumen,
                    Tecnico: recurso != null ? nombreCompletoTec : "Sin Asignar",
                    Estado: "Creada",
                    Detalle: $"Orden creada con {filasWo.Count} trabajo(s). Factura: DIRECTV. Sede: {unidadOrg.Nombre}. Cód. IBS: {nroWoIbs ?? "-"}"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error procesando orden Siebel {NumeroOrden}", nroWo);
                errores.Add($"Fila {filaOrigen} (Orden {nroWo}): {ex.Message}");
                detalles.Add(new FilaDetalleImportacionSiebel(
                    Fila: filaOrigen,
                    NumeroOrden: nroWo,
                    Cliente: clienteNombreCompleto,
                    Servicio: slServiciosResumen,
                    Tecnico: nombreCompletoTec,
                    Estado: "Error",
                    Detalle: ex.Message
                ));
            }
        }

        // Guardar todos los cambios acumulados
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Importación Siebel finalizada: {Creadas} creadas, {Actualizadas} actualizadas, {Clientes} clientes.",
            ordenesCreadas, ordenesActualizadas, clientesCreados);

        var reporteCsvBase64 = GenerarReporteBase64(detalles, errores);

        return new ResultadoImportacionSiebel(
            TotalFilas: lineasConFila.Count,
            TotalOrdenesDetectadas: ordenesAgrupadas.Count,
            OrdenesCreadas: ordenesCreadas + ordenesActualizadas,
            OrdenesOmitidas: 0,
            ClientesCreados: clientesCreados,
            ServiciosCreados: serviciosCreados,
            ZonasCreadas: 0,
            TecnicosCreados: tecnicosCreados,
            Errores: errores,
            Detalles: detalles,
            ReporteCsvBase64: reporteCsvBase64
        );
    }

    private static string GenerarReporteBase64(List<FilaDetalleImportacionSiebel> detalles, List<string> errores)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Fila;Numero_Orden;Cliente;Servicio;Tecnico;Estado;Detalle");

        foreach (var d in detalles)
        {
            sb.AppendLine($"{d.Fila};\"{EscaparCsv(d.NumeroOrden)}\";\"{EscaparCsv(d.Cliente)}\";\"{EscaparCsv(d.Servicio)}\";\"{EscaparCsv(d.Tecnico)}\";\"{EscaparCsv(d.Estado)}\";\"{EscaparCsv(d.Detalle)}\"");
        }

        if (detalles.Count == 0 && errores.Count > 0)
        {
            foreach (var err in errores)
            {
                sb.AppendLine($"0;\"GENERAL\";\"-\";\"-\";\"-\";\"Error General\";\"{EscaparCsv(err)}\"");
            }
        }

        var preamble = Encoding.UTF8.GetPreamble();
        var contentBytes = Encoding.UTF8.GetBytes(sb.ToString());
        var fullBytes = new byte[preamble.Length + contentBytes.Length];
        Buffer.BlockCopy(preamble, 0, fullBytes, 0, preamble.Length);
        Buffer.BlockCopy(contentBytes, 0, fullBytes, preamble.Length, contentBytes.Length);

        return Convert.ToBase64String(fullBytes);
    }

    private static string EscaparCsv(string? val)
    {
        if (string.IsNullOrEmpty(val)) return string.Empty;
        return val.Replace("\"", "\"\"").Replace("\r", " ").Replace("\n", " ");
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

    private static string QuitarDiacriticos(string texto)
    {
        if (string.IsNullOrWhiteSpace(texto)) return string.Empty;
        var normalizedString = texto.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(normalizedString.Length);

        foreach (var c in normalizedString)
        {
            var uc = CharUnicodeInfo.GetUnicodeCategory(c);
            if (uc != UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }

        return sb.ToString().Normalize(NormalizationForm.FormC);
    }

    private static string NormalizarNombreColumna(string col)
    {
        if (string.IsNullOrWhiteSpace(col)) return string.Empty;
        var sinDiacriticos = QuitarDiacriticos(col)
            .Replace("°", "o")
            .Replace("º", "o");
        var lower = sinDiacriticos.Trim().ToLowerInvariant();
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

    private static (decimal? Lat, decimal? Lng) CorregirCoordenadas(decimal? coord1, decimal? coord2)
    {
        if (!coord1.HasValue || !coord2.HasValue) return (coord1, coord2);
        var c1 = coord1.Value;
        var c2 = coord2.Value;

        // En Perú: Latitud negativa entre 0 y -19. Longitud negativa entre -68 y -82.
        if (c1 < -60m && c2 > -20m)
        {
            return (c2, c1);
        }
        if (c2 < -60m && c1 > -20m)
        {
            return (c1, c2);
        }

        return (c1, c2);
    }
}
