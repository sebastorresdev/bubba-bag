using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Clientes;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Clientes.Commands.CrearCliente;

public class CrearClienteHandler : ICommandHandler<CrearClienteCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;
    private readonly ICodigoSecuencialService _codigoSecuencialService;

    public CrearClienteHandler(IServicioCampoDbContext context, ICodigoSecuencialService codigoSecuencialService)
    {
        _context = context;
        _codigoSecuencialService = codigoSecuencialService;
    }

    public async Task<Result<Guid>> HandleAsync(CrearClienteCommand request, CancellationToken cancellationToken)
    {
        var docNormalizado = request.DocumentoIdentidad.Trim();
        var ubigeoNormalizado = request.UbigeoCodigo.Trim();

        // Validación de duplicidad de documento
        if (await _context.Clientes.AnyAsync(c => c.DocumentoIdentidad == docNormalizado, cancellationToken))
        {
            return Result<Guid>.Failure($"Ya existe un cliente registrado con el documento '{docNormalizado}'.");
        }

        var codigoCliente = await _codigoSecuencialService.SiguienteCodigoAsync(
            prefijo: "CLI",
            nombreSecuencia: "seq_clientes",
            esquema: "crm",
            longitud: 6,
            cancellationToken: cancellationToken);

        var nombres = !string.IsNullOrWhiteSpace(request.Nombres)
            ? request.Nombres
            : request.RazonSocial ?? string.Empty;

        var esFacturacion = request.EsClienteFacturacion ||
                            string.Equals(request.TipoPersona, "JURIDICA", StringComparison.OrdinalIgnoreCase);

        var cliente = Cliente.Crear(
            codigoCliente: codigoCliente,
            documentoIdentidad: docNormalizado,
            nombres: nombres,
            apellidos: request.Apellidos,
            telefonoPrincipal: request.TelefonoPrincipal,
            direccion: request.Direccion,
            ubigeoCodigo: ubigeoNormalizado,
            esClienteFacturacion: esFacturacion,
            esClienteServicio: request.EsClienteServicio,
            tipoDocumento: request.TipoDocumento ?? "DNI",
            tipoPersona: request.TipoPersona ?? "NATURAL",
            razonSocial: request.RazonSocial,
            telefonoSecundario: request.TelefonoSecundario,
            email: request.Email,
            referencia: request.ReferenciaUbicacion,
            lat: request.CoordenadaLat,
            lng: request.CoordenadaLng);

        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(cliente.Id);
    }
}
