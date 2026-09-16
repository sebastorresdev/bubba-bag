using System;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Cargos.Dtos;

public record CargoDetalleDto(
    Guid Id,
    string Nombre,
    Guid DepartamentoId,
    string DepartamentoNombre,
    decimal? SalarioReferencial,
    bool Activo,
    int TotalEmpleados
);
