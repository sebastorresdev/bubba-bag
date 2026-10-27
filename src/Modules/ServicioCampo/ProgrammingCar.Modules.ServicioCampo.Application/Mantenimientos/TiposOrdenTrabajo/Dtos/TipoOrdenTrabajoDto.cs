using System;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Dtos;

public record TipoOrdenTrabajoDto(
    Guid Id,
    string Nombre,
    string? Descripcion,
    bool RequiereVisitaCampo,
    bool ExigeFirmaCliente,
    bool ExigeEvidenciasFotograficas,
    string ColorHex,
    bool Activo,
    Guid? ListaPreciosId = null,
    string? ListaPreciosNombre = null);
