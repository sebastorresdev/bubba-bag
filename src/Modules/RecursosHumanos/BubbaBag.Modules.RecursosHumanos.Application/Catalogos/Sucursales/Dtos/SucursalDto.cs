using System;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Sucursales.Dtos;

public record SucursalDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string? Ciudad,
    string? Direccion,
    string? Telefono,
    bool EsSedePrincipal,
    bool Activo
);
