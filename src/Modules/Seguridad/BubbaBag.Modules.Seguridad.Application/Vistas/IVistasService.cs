using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.Seguridad.Application.Vistas;

public interface IVistasService
{
    Task<Result<List<VistaUsuarioDto>>> ObtenerVistasPorEntidadAsync(Guid usuarioId, string entidad);
    Task<Result<VistaUsuarioDto>> GuardarVistaAsync(Guid usuarioId, GuardarVistaRequest request);
    Task<Result<bool>> EstablecerPredeterminadaAsync(Guid usuarioId, string entidad, Guid? vistaId, string? vistaKey);
    Task<Result<bool>> EliminarVistaAsync(Guid usuarioId, Guid vistaId);
}
