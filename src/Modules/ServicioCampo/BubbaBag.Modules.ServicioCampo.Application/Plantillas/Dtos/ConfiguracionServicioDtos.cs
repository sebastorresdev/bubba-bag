using System;
using System.Collections.Generic;

namespace BubbaBag.Modules.ServicioCampo.Application.Plantillas.Dtos;

public record ConfiguracionServicioListadoDto(
    Guid Id,
    string Nombre,
    string? Descripcion,
    Guid ProductoId,
    string ProductoCodigo,
    string ProductoNombre,
    int DuracionEstimadaMinutos,
    bool EsPredeterminada,
    bool Activo,
    int CantidadTareas,
    int CantidadMateriales,
    DateTime CreatedAt);

public record ConfiguracionServicioDetalleDto(
    Guid Id,
    string Nombre,
    string? Descripcion,
    Guid ProductoId,
    string ProductoCodigo,
    string ProductoNombre,
    int DuracionEstimadaMinutos,
    bool EsPredeterminada,
    bool Activo,
    DateTime CreatedAt,
    List<ConfiguracionTareaItemDto> Tareas,
    List<ConfiguracionMaterialItemDto> Materiales);

public record ConfiguracionTareaItemDto(
    Guid Id,
    Guid TareaId,
    string TareaNombre,
    int OrdenSecuencia,
    bool EsObligatoria,
    bool RequiereEvidencia,
    string? Instrucciones,
    int DuracionEstimadaMinutos);

public record ConfiguracionMaterialItemDto(
    Guid Id,
    Guid ProductoId,
    string ProductoCodigo,
    string ProductoNombre,
    decimal CantidadPrevista,
    bool EsObligatorio,
    string? Observaciones,
    bool EsSerializado,
    string UnidadMedida,
    Guid? UnidadMedidaId = null);

public record TareaDto(
    Guid Id,
    string Nombre,
    string? Descripcion,
    int DuracionEstimadaMinutos,
    bool RequiereEvidenciaFotografica,
    bool Activo);

public record GuardarConfiguracionTareaDto(
    Guid TareaId,
    int OrdenSecuencia,
    bool EsObligatoria,
    bool RequiereEvidencia,
    string? Instrucciones);

public record GuardarConfiguracionMaterialDto(
    Guid ProductoId,
    decimal CantidadPrevista,
    bool EsObligatorio,
    string? Observaciones,
    Guid? UnidadMedidaId = null);

public record CrearConfiguracionServicioRequest(
    string Nombre,
    Guid ProductoId,
    int DuracionEstimadaMinutos,
    string? Descripcion,
    bool EsPredeterminada,
    List<GuardarConfiguracionTareaDto>? Tareas,
    List<GuardarConfiguracionMaterialDto>? Materiales);

public record ActualizarConfiguracionServicioRequest(
    string Nombre,
    Guid ProductoId,
    int DuracionEstimadaMinutos,
    string? Descripcion,
    bool EsPredeterminada,
    List<GuardarConfiguracionTareaDto>? Tareas,
    List<GuardarConfiguracionMaterialDto>? Materiales);

public record CrearTareaRequest(
    string Nombre,
    string? Descripcion,
    int DuracionEstimadaMinutos,
    bool RequiereEvidenciaFotografica);

public record ActualizarTareaRequest(
    string Nombre,
    string? Descripcion,
    int DuracionEstimadaMinutos,
    bool RequiereEvidenciaFotografica);

public record CambiarEstadoPlantillaRequest(bool Activo);
