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
    decimal PrecioBase = 0m,
    List<ServicioPasoInput>? Pasos = null,
    List<ServicioMaterialInput>? MaterialesTeoricos = null,
    List<Guid>? SucursalesHabilitadasIds = null
) : ICommand<Result<Guid>>;
