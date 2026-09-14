using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.Crm.Domain.Clientes;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Crm.Application.Clientes.Features;

public record CrearClienteCommand(
    string DocumentoIdentidad,
    string Nombres,
    string? Apellidos,
    string TelefonoPrincipal,
    string Direccion,
    string UbigeoCodigo,
    bool EsClienteFacturacion = false,
    bool EsClienteServicio = true,
    string TipoDocumento = "DNI",
    string TipoPersona = "NATURAL",
    string? RazonSocial = null,
    string? TelefonoSecundario = null,
    string? Email = null,
    string? ReferenciaUbicacion = null,
    decimal? CoordenadaLat = null,
    decimal? CoordenadaLng = null
) : ICommand<Result<Guid>>;

public class CrearClienteHandler : ICommandHandler<CrearClienteCommand, Result<Guid>>
{
    private readonly ICrmDbContext _context;
    private readonly ICodigoSecuencialService _codigoSecuencialService;

    public CrearClienteHandler(ICrmDbContext context, ICodigoSecuencialService codigoSecuencialService)
    {
        _context = context;
        _codigoSecuencialService = codigoSecuencialService;
    }

    public async Task<Result<Guid>> HandleAsync(CrearClienteCommand request, CancellationToken cancellationToken)
    {
        var docNormalizado = request.DocumentoIdentidad?.Trim();
        if (string.IsNullOrWhiteSpace(docNormalizado))
        {
            return Result<Guid>.Failure("El número de documento de identidad es obligatorio.");
        }

        var ubigeoNormalizado = request.UbigeoCodigo?.Trim();
        if (string.IsNullOrWhiteSpace(ubigeoNormalizado))
        {
            return Result<Guid>.Failure("El código de ubigeo es obligatorio.");
        }

        // Validación de duplicidad de documento
        if (await _context.Clientes.AnyAsync(c => c.DocumentoIdentidad == docNormalizado, cancellationToken))
        {
            return Result<Guid>.Failure($"Ya existe un cliente registrado con el documento '{docNormalizado}'.");
        }

        // Validaciones por tipo de persona
        if (string.Equals(request.TipoPersona, "JURIDICA", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(request.RazonSocial))
            {
                return Result<Guid>.Failure("Para personas jurídicas, la razón social es obligatoria.");
            }
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.Nombres))
            {
                return Result<Guid>.Failure("Los nombres son obligatorios para personas naturales.");
            }
            if (string.IsNullOrWhiteSpace(request.Apellidos))
            {
                return Result<Guid>.Failure("Los apellidos son obligatorios para personas naturales.");
            }
        }

        var codigoCliente = await _codigoSecuencialService.SiguienteCodigoAsync(
            prefijo: "CLI",
            nombreSecuencia: "seq_clientes",
            esquema: "crm",
            longitud: 6,
            cancellationToken: cancellationToken);

        var cliente = Cliente.Crear(
            codigoCliente: codigoCliente,
            documentoIdentidad: docNormalizado,
            nombres: request.Nombres,
            apellidos: request.Apellidos,
            telefonoPrincipal: request.TelefonoPrincipal,
            direccion: request.Direccion,
            ubigeoCodigo: ubigeoNormalizado,
            esClienteFacturacion: request.EsClienteFacturacion,
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
