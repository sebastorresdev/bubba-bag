using System;
using System.Collections.Generic;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.Servicios.Commands.CrearServicio;

public record ServicioPasoInput(
    int NumeroPaso,
    string Descripcion,
    bool RequiereFoto,
    int TipoEvidencia,
    bool EsObligatorio
);

public record ServicioMaterialInput(
    Guid ProductoId,
    decimal CantidadTeorica,
    string UnidadMedida
);

public record CrearServicioCommand(
    string Codigo,
    string Nombre,
    Guid CatalogoServicioId,
    int DuracionEstimadaMinutos,
    string? Descripcion,
    string? CodigoExterno,
    List<ServicioPasoInput>? Pasos,
    List<ServicioMaterialInput>? MaterialesTeoricos,
    List<Guid>? SucursalesHabilitadasIds
) : ICommand<Result<Guid>>;
