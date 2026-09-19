using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Domain.Organizacion;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Sucursales.Commands;

public record CrearSucursalCommand(
    string Codigo,
    string Nombre,
    string? Ciudad = null,
    string? Direccion = null,
    string? Telefono = null,
    bool EsSedePrincipal = false
) : ICommand<Result<Guid>>;

public class CrearSucursalHandler : ICommandHandler<CrearSucursalCommand, Result<Guid>>
{
    private readonly IRecursosHumanosDbContext _context;

    public CrearSucursalHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearSucursalCommand command, CancellationToken cancellationToken = default)
    {
        var codigoUpper = command.Codigo.Trim().ToUpperInvariant();
        var existeCodigo = await _context.Sucursales
            .AnyAsync(s => s.Codigo == codigoUpper, cancellationToken);

        if (existeCodigo)
        {
            return Result<Guid>.Failure($"Ya existe una sucursal con el código '{codigoUpper}'.");
        }

        if (command.EsSedePrincipal)
        {
            var otrasPrincipales = await _context.Sucursales
                .Where(s => s.EsSedePrincipal)
                .ToListAsync(cancellationToken);
            foreach (var op in otrasPrincipales)
            {
                op.Actualizar(op.Nombre, op.Ciudad, op.Direccion, op.Telefono, false);
            }
        }

        var sucursal = Sucursal.Crear(
            codigo: codigoUpper,
            nombre: command.Nombre,
            ciudad: command.Ciudad,
            direccion: command.Direccion,
            telefono: command.Telefono,
            esSedePrincipal: command.EsSedePrincipal
        );

        await _context.Sucursales.AddAsync(sucursal, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(sucursal.Id);
    }
}

public record ActualizarSucursalCommand(
    Guid Id,
    string Nombre,
    string? Ciudad = null,
    string? Direccion = null,
    string? Telefono = null,
    bool EsSedePrincipal = false
) : ICommand<Result>;

public class ActualizarSucursalHandler : ICommandHandler<ActualizarSucursalCommand, Result>
{
    private readonly IRecursosHumanosDbContext _context;

    public ActualizarSucursalHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(ActualizarSucursalCommand command, CancellationToken cancellationToken = default)
    {
        var sucursal = await _context.Sucursales
            .FirstOrDefaultAsync(s => s.Id == command.Id, cancellationToken);

        if (sucursal == null)
        {
            return Result.Failure($"No se encontró la sucursal con id '{command.Id}'.");
        }

        if (command.EsSedePrincipal && !sucursal.EsSedePrincipal)
        {
            var otrasPrincipales = await _context.Sucursales
                .Where(s => s.EsSedePrincipal && s.Id != command.Id)
                .ToListAsync(cancellationToken);
            foreach (var op in otrasPrincipales)
            {
                op.Actualizar(op.Nombre, op.Ciudad, op.Direccion, op.Telefono, false);
            }
        }

        sucursal.Actualizar(
            command.Nombre,
            command.Ciudad,
            command.Direccion,
            command.Telefono,
            command.EsSedePrincipal
        );

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public record CambiarEstadoSucursalCommand(Guid Id, bool Activo) : ICommand<Result>;

public class CambiarEstadoSucursalHandler : ICommandHandler<CambiarEstadoSucursalCommand, Result>
{
    private readonly IRecursosHumanosDbContext _context;

    public CambiarEstadoSucursalHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(CambiarEstadoSucursalCommand command, CancellationToken cancellationToken = default)
    {
        var sucursal = await _context.Sucursales
            .FirstOrDefaultAsync(s => s.Id == command.Id, cancellationToken);

        if (sucursal == null)
        {
            return Result.Failure($"No se encontró la sucursal con id '{command.Id}'.");
        }

        if (command.Activo)
            sucursal.Activar();
        else
            sucursal.Desactivar();

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
