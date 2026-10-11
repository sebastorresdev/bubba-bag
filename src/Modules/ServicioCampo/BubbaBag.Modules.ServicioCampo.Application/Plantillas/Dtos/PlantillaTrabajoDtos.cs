using System;
using System.Collections.Generic;

namespace BubbaBag.Modules.ServicioCampo.Application.Plantillas.Dtos;

public record PlantillaTrabajoListadoDto(
    Guid Id,
    string Codigo,
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

public record PlantillaTrabajoDetalleDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string? Descripcion,
    Guid ProductoId,
    string ProductoCodigo,
    string ProductoNombre,
    int DuracionEstimadaMinutos,
    bool EsPredeterminada,
    bool Activo,
    DateTime CreatedAt,
    List<PlantillaServicioItemDto> Servicios,
    List<PlantillaTareaItemDto> Tareas,
    List<PlantillaMaterialItemDto> Materiales);

public record PlantillaServicioItemDto(
    Guid Id,
    Guid ProductoId,
    string ProductoCodigo,
    string ProductoNombre,
    bool EsPredeterminada);

public record PlantillaTareaItemDto(
    Guid Id,
    Guid TareaId,
    string TareaCodigo,
    string TareaNombre,
    int OrdenSecuencia,
    bool EsObligatoria,
    bool RequiereEvidencia,
    string? Instrucciones,
    int DuracionEstimadaMinutos);

public record PlantillaMaterialItemDto(
    Guid Id,
    Guid ProductoId,
    string ProductoCodigo,
    string ProductoNombre,
    decimal CantidadPrevista,
    bool EsObligatorio,
    string? Observaciones,
    bool EsSerializado,
    string UnidadMedida);

public record TareaDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string? Descripcion,
    int DuracionEstimadaMinutos,
    bool RequiereEvidenciaFotografica,
    bool Activo);

public record GuardarPlantillaServicioDto(
    Guid ProductoId,
    bool EsPredeterminada);

public record GuardarPlantillaTareaDto(
    Guid TareaId,
    int OrdenSecuencia,
    bool EsObligatoria,
    bool RequiereEvidencia,
    string? Instrucciones);

public record GuardarPlantillaMaterialDto(
    Guid ProductoId,
    decimal CantidadPrevista,
    bool EsObligatorio,
    string? Observaciones);

public record CrearPlantillaTrabajoRequest(
    string Codigo,
    string Nombre,
    Guid ProductoId,
    int DuracionEstimadaMinutos,
    string? Descripcion,
    bool EsPredeterminada,
    List<GuardarPlantillaServicioDto>? Servicios,
    List<GuardarPlantillaTareaDto>? Tareas,
    List<GuardarPlantillaMaterialDto>? Materiales);

public record ActualizarPlantillaTrabajoRequest(
    string Nombre,
    Guid ProductoId,
    int DuracionEstimadaMinutos,
    string? Descripcion,
    bool EsPredeterminada,
    List<GuardarPlantillaServicioDto>? Servicios,
    List<GuardarPlantillaTareaDto>? Tareas,
    List<GuardarPlantillaMaterialDto>? Materiales);

public record CrearTareaRequest(
    string Codigo,
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
