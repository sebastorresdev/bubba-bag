using System;
using System.Collections.Generic;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.Servicios.Commands.CrearServicio;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.Servicios.Commands.ActualizarServicio;

public record ActualizarServicioCommand(
    Guid Id,
    string Nombre,
    Guid CatalogoServicioId,
    int DuracionEstimadaMinutos,
    string? Descripcion,
    string? CodigoExterno,
    bool Activo,
    List<ServicioPasoInput>? Pasos,
    List<ServicioMaterialInput>? MaterialesTeoricos,
    List<Guid>? SucursalesHabilitadasIds
) : ICommand<Result>;
