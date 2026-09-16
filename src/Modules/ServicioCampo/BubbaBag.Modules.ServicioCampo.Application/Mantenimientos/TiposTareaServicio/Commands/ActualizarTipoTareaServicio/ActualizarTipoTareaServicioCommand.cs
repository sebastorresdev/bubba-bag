using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Commands.ActualizarTipoTareaServicio;

public record ActualizarTipoTareaServicioCommand(
    Guid Id,
    string Nombre,
    Guid ClienteFacturacionId,
    int DuracionEstimadaMinutos
) : ICommand<Result>;
