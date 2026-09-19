using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Commands.CrearTipoTareaServicio;

public record CrearTipoTareaServicioCommand(
    string CodigoTarea,
    string Nombre,
    Guid? ClienteFacturacionId = null,
    int DuracionEstimadaMinutos = 60
) : ICommand<Result<Guid>>;
