using System;
using System.Collections.Generic;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Dtos;

public record DepartamentoDetalleDto(
    Guid Id,
    string Nombre,
    string? Descripcion,
    bool Activo,
    int TotalCargos,
    int TotalEmpleados,
    List<CargoCatalogoDto>? Cargos = null
);
