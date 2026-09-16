using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Commands.CrearTipoOrdenTrabajo;

public record CrearTipoOrdenTrabajoCommand(
    string Codigo,
    string Nombre,
    bool RequiereVisitaCampo = true,
    bool ExigeFirmaCliente = true,
    bool ExigeEvidenciasFotograficas = true,
    string? Descripcion = null,
    string ColorHex = "#0f6cbd"
) : ICommand<Result<Guid>>;
