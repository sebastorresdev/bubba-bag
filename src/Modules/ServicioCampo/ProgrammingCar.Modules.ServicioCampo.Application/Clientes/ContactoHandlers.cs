using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.Modules.ServicioCampo.Application.Clientes.Dtos;
using ProgrammingCar.Modules.ServicioCampo.Domain.Clientes;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Clientes;

// Queries
public record ObtenerContactosQuery(
    string? Search = null,
    Guid? CuentaId = null,
    bool? SoloActivos = null
) : IQuery<Result<IReadOnlyList<ContactoDto>>>;

public record ObtenerContactoPorIdQuery(Guid Id) : IQuery<Result<ContactoDto>>;

// Commands
public record CrearContactoCommand(CrearContactoRequest Request) : ICommand<Result<Guid>>;
public record ActualizarContactoCommand(Guid Id, ActualizarContactoRequest Request) : ICommand<Result>;
public record CambiarEstadoContactoCommand(Guid Id, bool Activo) : ICommand<Result>;
public record EliminarContactoCommand(Guid Id) : ICommand<Result>;

public class ContactoHandlers :
    IQueryHandler<ObtenerContactosQuery, Result<IReadOnlyList<ContactoDto>>>,
    IQueryHandler<ObtenerContactoPorIdQuery, Result<ContactoDto>>,
    ICommandHandler<CrearContactoCommand, Result<Guid>>,
    ICommandHandler<ActualizarContactoCommand, Result>,
    ICommandHandler<CambiarEstadoContactoCommand, Result>,
    ICommandHandler<EliminarContactoCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public ContactoHandlers(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<IReadOnlyList<ContactoDto>>> HandleAsync(ObtenerContactosQuery request, CancellationToken ct = default)
    {
        var query = _context.Contactos.AsNoTracking().AsQueryable();

        if (request.SoloActivos.HasValue)
        {
            query = query.Where(c => c.Activo == request.SoloActivos.Value);
        }

        if (request.CuentaId.HasValue)
        {
            query = query.Where(c => c.CuentaId == request.CuentaId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim().ToUpper();
            query = query.Where(c =>
                c.Nombres.ToUpper().Contains(term) ||
                c.Apellidos.ToUpper().Contains(term) ||
                (c.Cargo != null && c.Cargo.ToUpper().Contains(term)) ||
                (c.Email != null && c.Email.ToUpper().Contains(term)) ||
                c.TelefonoMovil.Contains(term) ||
                (c.Cuenta != null && c.Cuenta.Nombres.ToUpper().Contains(term)));
        }

        var items = await query
            .OrderBy(c => c.Nombres)
            .ThenBy(c => c.Apellidos)
            .Select(c => new ContactoDto(
                c.Id,
                c.Nombres,
                c.Apellidos,
                (c.Nombres + " " + c.Apellidos).Trim(),
                c.Cargo,
                c.CuentaId,
                c.Cuenta != null ? c.Cuenta.Nombres : null,
                c.Email,
                c.TelefonoMovil,
                c.TelefonoTrabajo,
                c.Direccion,
                c.UbigeoCodigo,
                c.Ubigeo != null ? c.Ubigeo.Distrito : null,
                c.Ubigeo != null ? c.Ubigeo.Provincia : null,
                c.Ubigeo != null ? c.Ubigeo.Departamento : null,
                c.Activo,
                c.CreatedAt
            ))
            .ToListAsync(ct);

        return Result<IReadOnlyList<ContactoDto>>.Success(items);
    }

    public async Task<Result<ContactoDto>> HandleAsync(ObtenerContactoPorIdQuery request, CancellationToken ct = default)
    {
        var dto = await _context.Contactos
            .AsNoTracking()
            .Where(c => c.Id == request.Id)
            .Select(c => new ContactoDto(
                c.Id,
                c.Nombres,
                c.Apellidos,
                (c.Nombres + " " + c.Apellidos).Trim(),
                c.Cargo,
                c.CuentaId,
                c.Cuenta != null ? c.Cuenta.Nombres : null,
                c.Email,
                c.TelefonoMovil,
                c.TelefonoTrabajo,
                c.Direccion,
                c.UbigeoCodigo,
                c.Ubigeo != null ? c.Ubigeo.Distrito : null,
                c.Ubigeo != null ? c.Ubigeo.Provincia : null,
                c.Ubigeo != null ? c.Ubigeo.Departamento : null,
                c.Activo,
                c.CreatedAt
            ))
            .FirstOrDefaultAsync(ct);

        if (dto == null)
        {
            return Result<ContactoDto>.Failure("Contacto no encontrado.");
        }

        return Result<ContactoDto>.Success(dto);
    }

    public async Task<Result<Guid>> HandleAsync(CrearContactoCommand command, CancellationToken ct = default)
    {
        var req = command.Request;
        if (string.IsNullOrWhiteSpace(req.Nombres))
            return Result<Guid>.Failure("Los nombres del contacto son obligatorios.");

        if (string.IsNullOrWhiteSpace(req.Apellidos))
            return Result<Guid>.Failure("Los apellidos del contacto son obligatorios.");

        if (string.IsNullOrWhiteSpace(req.TelefonoMovil))
            return Result<Guid>.Failure("El teléfono móvil del contacto es obligatorio.");

        var contacto = Contacto.Crear(
            nombres: req.Nombres,
            apellidos: req.Apellidos,
            telefonoMovil: req.TelefonoMovil,
            cargo: req.Cargo,
            cuentaId: req.CuentaId,
            email: req.Email,
            telefonoTrabajo: req.TelefonoTrabajo,
            direccion: req.Direccion,
            ubigeoCodigo: req.UbigeoCodigo);

        _context.Contactos.Add(contacto);
        await _context.SaveChangesAsync(ct);

        // Si la cuenta asociada no tiene contacto principal, asignarlo automáticamente
        if (req.CuentaId.HasValue)
        {
            var cuenta = await _context.Clientes.FirstOrDefaultAsync(c => c.Id == req.CuentaId.Value, ct);
            if (cuenta != null && !cuenta.ContactoPrincipalId.HasValue)
            {
                cuenta.ActualizarContactoYDireccion(
                    telefono: cuenta.TelefonoPrincipal,
                    direccion: cuenta.Direccion,
                    ubigeoCodigo: cuenta.UbigeoCodigo,
                    referencia: cuenta.ReferenciaUbicacion,
                    lat: cuenta.CoordenadaLat,
                    lng: cuenta.CoordenadaLng,
                    nombreCuenta: cuenta.Nombres,
                    documentoIdentidad: cuenta.DocumentoIdentidad,
                    telefonoSecundario: cuenta.TelefonoSecundario,
                    email: cuenta.Email,
                    contactoPrincipalId: contacto.Id);
                await _context.SaveChangesAsync(ct);
            }
        }

        return Result<Guid>.Success(contacto.Id);
    }

    public async Task<Result> HandleAsync(ActualizarContactoCommand command, CancellationToken ct = default)
    {
        var req = command.Request;
        var contacto = await _context.Contactos.FirstOrDefaultAsync(c => c.Id == command.Id, ct);
        if (contacto == null)
            return Result.Failure("Contacto no encontrado.");

        if (string.IsNullOrWhiteSpace(req.Nombres))
            return Result.Failure("Los nombres del contacto son obligatorios.");

        if (string.IsNullOrWhiteSpace(req.Apellidos))
            return Result.Failure("Los apellidos del contacto son obligatorios.");

        if (string.IsNullOrWhiteSpace(req.TelefonoMovil))
            return Result.Failure("El teléfono móvil del contacto es obligatorio.");

        contacto.Actualizar(
            nombres: req.Nombres,
            apellidos: req.Apellidos,
            telefonoMovil: req.TelefonoMovil,
            cargo: req.Cargo,
            cuentaId: req.CuentaId,
            email: req.Email,
            telefonoTrabajo: req.TelefonoTrabajo,
            direccion: req.Direccion,
            ubigeoCodigo: req.UbigeoCodigo);

        await _context.SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result> HandleAsync(CambiarEstadoContactoCommand command, CancellationToken ct = default)
    {
        var contacto = await _context.Contactos.FirstOrDefaultAsync(c => c.Id == command.Id, ct);
        if (contacto == null)
            return Result.Failure("Contacto no encontrado.");

        if (command.Activo) contacto.Activar();
        else contacto.Desactivar();

        await _context.SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result> HandleAsync(EliminarContactoCommand command, CancellationToken ct = default)
    {
        var contacto = await _context.Contactos.FirstOrDefaultAsync(c => c.Id == command.Id, ct);
        if (contacto == null)
            return Result.Failure("Contacto no encontrado.");

        _context.Contactos.Remove(contacto);
        await _context.SaveChangesAsync(ct);
        return Result.Success();
    }
}
