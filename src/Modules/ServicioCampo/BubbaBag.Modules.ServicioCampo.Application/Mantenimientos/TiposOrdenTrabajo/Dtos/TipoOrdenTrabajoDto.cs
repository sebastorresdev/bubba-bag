using System;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Dtos;

public record TipoOrdenTrabajoDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string? Descripcion,
    bool RequiereVisitaCampo,
    bool ExigeFirmaCliente,
    bool ExigeEvidenciasFotograficas,
    string ColorHex,
    bool Activo);
