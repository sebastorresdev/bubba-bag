using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Commands.ActualizarTipoTareaServicio;

public record ActualizarTipoTareaServicioCommand(
    Guid Id,
    string Nombre,
    Guid? ClienteFacturacionId = null,
    int DuracionEstimadaMinutos = 60
) : ICommand<Result>;
