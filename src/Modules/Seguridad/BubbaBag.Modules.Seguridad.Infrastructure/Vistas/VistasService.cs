using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BubbaBag.Modules.Seguridad.Application.Vistas;
using BubbaBag.Modules.Seguridad.Domain.Entities;
using BubbaBag.Modules.Seguridad.Infrastructure.Persistence;
using BubbaBag.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Seguridad.Infrastructure.Vistas;

public class VistasService : IVistasService
{
    private readonly SeguridadDbContext _dbContext;
    private readonly ICurrentUser _currentUser;

    public VistasService(SeguridadDbContext dbContext, ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    private async Task<Guid?> ResolverUsuarioIdValidoAsync(Guid usuarioId)
    {
        // 1. Si el usuarioId proporcionado existe en la base de datos actual, usarlo
        if (usuarioId != Guid.Empty && await _dbContext.Users.AnyAsync(u => u.Id == usuarioId))
        {
            return usuarioId;
        }

        // 2. Si el Guid del token quedó huérfano (BD recreada/resembrada o token anterior),
        // buscamos por el email del token
        var email = _currentUser.Email;
        if (!string.IsNullOrWhiteSpace(email))
        {
            var userByEmail = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (userByEmail != null)
            {
                return userByEmail.Id;
            }
        }

        // 3. Fallback en desarrollo: usuario SuperAdmin por defecto
        var admin = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == "admin@bubbabag.com");
        if (admin != null)
        {
            return admin.Id;
        }

        return null;
    }

    public async Task<Result<List<VistaUsuarioDto>>> ObtenerVistasPorEntidadAsync(Guid usuarioId, string entidad)
    {
        var idReal = await ResolverUsuarioIdValidoAsync(usuarioId);
        if (!idReal.HasValue)
        {
            return Result<List<VistaUsuarioDto>>.Success(new List<VistaUsuarioDto>());
        }
        usuarioId = idReal.Value;

        var vistas = await _dbContext.VistasUsuario
            .Where(v => v.UsuarioId == usuarioId && v.Entidad == entidad)
            .OrderByDescending(v => v.EsPredeterminada)
            .ThenBy(v => v.Nombre)
            .Select(v => new VistaUsuarioDto(
                v.Id,
                v.Entidad,
                v.Nombre,
                v.Descripcion,
                v.EsPredeterminada,
                v.EsSistema,
                v.ConfiguracionJson,
                v.FechaCreacion
            ))
            .ToListAsync();

        return Result<List<VistaUsuarioDto>>.Success(vistas);
    }

    public async Task<Result<VistaUsuarioDto>> GuardarVistaAsync(Guid usuarioId, GuardarVistaRequest request)
    {
        var idReal = await ResolverUsuarioIdValidoAsync(usuarioId);
        if (!idReal.HasValue)
        {
            return Result<VistaUsuarioDto>.Failure("No se pudo identificar una cuenta de usuario válida en el sistema.");
        }
        usuarioId = idReal.Value;

        if (string.IsNullOrWhiteSpace(request.Entidad) || string.IsNullOrWhiteSpace(request.Nombre))
        {
            return Result<VistaUsuarioDto>.Failure("El nombre y la entidad son obligatorios.");
        }

        if (request.EsPredeterminada)
        {
            var predeterminadasAnteriores = await _dbContext.VistasUsuario
                .Where(v => v.UsuarioId == usuarioId && v.Entidad == request.Entidad && v.EsPredeterminada)
                .ToListAsync();

            foreach (var v in predeterminadasAnteriores)
            {
                v.EsPredeterminada = false;
            }
        }

        var nuevaVista = new VistaUsuario
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            Entidad = request.Entidad.Trim(),
            Nombre = request.Nombre.Trim(),
            Descripcion = request.Descripcion?.Trim(),
            EsPredeterminada = request.EsPredeterminada,
            EsSistema = false,
            ConfiguracionJson = string.IsNullOrWhiteSpace(request.ConfiguracionJson) ? "{}" : request.ConfiguracionJson,
            FechaCreacion = DateTime.UtcNow
        };

        _dbContext.VistasUsuario.Add(nuevaVista);
        await _dbContext.SaveChangesAsync();

        var dto = new VistaUsuarioDto(
            nuevaVista.Id,
            nuevaVista.Entidad,
            nuevaVista.Nombre,
            nuevaVista.Descripcion,
            nuevaVista.EsPredeterminada,
            nuevaVista.EsSistema,
            nuevaVista.ConfiguracionJson,
            nuevaVista.FechaCreacion
        );

        return Result<VistaUsuarioDto>.Success(dto);
    }

    public async Task<Result<bool>> EstablecerPredeterminadaAsync(Guid usuarioId, string entidad, Guid? vistaId, string? vistaKey)
    {
        var idReal = await ResolverUsuarioIdValidoAsync(usuarioId);
        if (!idReal.HasValue)
        {
            return Result<bool>.Failure("No se pudo identificar una cuenta de usuario válida en el sistema.");
        }
        usuarioId = idReal.Value;

        if (string.IsNullOrWhiteSpace(entidad))
        {
            return Result<bool>.Failure("La entidad es obligatoria.");
        }

        var todasVistas = await _dbContext.VistasUsuario
            .Where(v => v.UsuarioId == usuarioId && v.Entidad == entidad)
            .ToListAsync();

        foreach (var v in todasVistas)
        {
            v.EsPredeterminada = false;
        }

        if (vistaId.HasValue && vistaId.Value != Guid.Empty)
        {
            var vistaPersonalizada = todasVistas.FirstOrDefault(v => v.Id == vistaId.Value);
            if (vistaPersonalizada != null)
            {
                vistaPersonalizada.EsPredeterminada = true;
            }
        }
        else if (!string.IsNullOrWhiteSpace(vistaKey))
        {
            var vistaSistema = todasVistas.FirstOrDefault(v => v.EsSistema && v.Nombre.Equals(vistaKey, StringComparison.OrdinalIgnoreCase));
            if (vistaSistema != null)
            {
                vistaSistema.EsPredeterminada = true;
            }
            else
            {
                _dbContext.VistasUsuario.Add(new VistaUsuario
                {
                    Id = Guid.NewGuid(),
                    UsuarioId = usuarioId,
                    Entidad = entidad,
                    Nombre = vistaKey,
                    EsPredeterminada = true,
                    EsSistema = true,
                    ConfiguracionJson = "{}",
                    FechaCreacion = DateTime.UtcNow
                });
            }
        }

        await _dbContext.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> EliminarVistaAsync(Guid usuarioId, Guid vistaId)
    {
        var idReal = await ResolverUsuarioIdValidoAsync(usuarioId);
        if (!idReal.HasValue)
        {
            return Result<bool>.Failure("No se pudo identificar una cuenta de usuario válida en el sistema.");
        }
        usuarioId = idReal.Value;

        var vista = await _dbContext.VistasUsuario
            .FirstOrDefaultAsync(v => v.Id == vistaId && v.UsuarioId == usuarioId);

        if (vista == null)
        {
            return Result<bool>.Failure("La vista no existe o no pertenece al usuario.");
        }

        if (vista.EsSistema)
        {
            return Result<bool>.Failure("No se pueden eliminar las vistas del sistema.");
        }

        _dbContext.VistasUsuario.Remove(vista);
        await _dbContext.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
}
