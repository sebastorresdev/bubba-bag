using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Commands.CrearTipoOrdenTrabajo;

public record CrearTipoOrdenTrabajoCommand(
    string Nombre,
    bool RequiereVisitaCampo = true,
    bool ExigeFirmaCliente = true,
    bool ExigeEvidenciasFotograficas = true,
    string? Descripcion = null,
    string ColorHex = "#0f6cbd",
    Guid? ListaPreciosId = null
) : ICommand<Result<Guid>>;
