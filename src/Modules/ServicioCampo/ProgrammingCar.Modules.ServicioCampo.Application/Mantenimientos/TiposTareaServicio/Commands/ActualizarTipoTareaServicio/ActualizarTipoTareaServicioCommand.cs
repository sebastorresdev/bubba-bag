using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Commands.ActualizarTipoTareaServicio;

public record ActualizarTipoTareaServicioCommand(
    Guid Id,
    string Nombre,
    Guid? ClienteFacturacionId = null,
    int DuracionEstimadaMinutos = 60
) : ICommand<Result>;
