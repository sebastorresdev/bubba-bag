using System;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Dtos;

public record TipoTareaServicioDto(
    Guid Id,
    string CodigoTarea,
    string Nombre,
    Guid? ClienteFacturacionId,
    string? ClienteFacturacionNombre,
    string? ClienteFacturacionCodigo,
    int DuracionEstimadaMinutos,
    bool Activo);
