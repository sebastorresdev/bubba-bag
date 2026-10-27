using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Commands.ActualizarTipoOrdenTrabajo;

public record ActualizarTipoOrdenTrabajoCommand(
    Guid Id,
    string Nombre,
    bool RequiereVisitaCampo,
    bool ExigeFirmaCliente,
    bool ExigeEvidenciasFotograficas,
    string? Descripcion = null,
    string ColorHex = "#0f6cbd",
    Guid? ListaPreciosId = null
) : ICommand<Result>;
