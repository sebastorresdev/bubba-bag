namespace BubbaBag.Modules.Crm.Application.Ubigeos.Dtos;

public record UbigeoDto(
    string Codigo,
    string Departamento,
    string Provincia,
    string Distrito,
    string? CapitalLegal,
    string? RegionNatural
);
