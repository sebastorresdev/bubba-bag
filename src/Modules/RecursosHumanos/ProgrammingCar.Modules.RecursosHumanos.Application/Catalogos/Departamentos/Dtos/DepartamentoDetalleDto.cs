using System;
using System.Collections.Generic;
using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Dtos;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Dtos;

public record DepartamentoDetalleDto(
    Guid Id,
    string Nombre,
    string? Descripcion,
    bool Activo,
    int TotalCargos,
    int TotalEmpleados,
    List<CargoCatalogoDto>? Cargos = null
);
