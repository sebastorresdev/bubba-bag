using System;
using System.Collections.Generic;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Plantillas.Dtos;

public record ConfiguracionServicioProductoItemDto(
    Guid ProductoId,
    string Codigo,
    string Nombre);

public record ConfiguracionServicioListadoDto(
    Guid Id,
    string Nombre,
    string? Descripcion,
    Guid ProductoId,
    string ProductoCodigo,
    string ProductoNombre,
    int DuracionEstimadaMinutos,
    int? SlaHorasResolucion,
    decimal Puntos,
    bool EsPredeterminada,
    bool Activo,
    int CantidadTareas,
    int CantidadMateriales,
    DateTime CreatedAt,
    List<ConfiguracionServicioProductoItemDto>? Servicios = null);

public record ConfiguracionServicioDetalleDto(
    Guid Id,
    string Nombre,
    string? Descripcion,
    Guid ProductoId,
    string ProductoCodigo,
    string ProductoNombre,
    int DuracionEstimadaMinutos,
    int? SlaHorasResolucion,
    decimal Puntos,
    bool EsPredeterminada,
    bool Activo,
    DateTime CreatedAt,
    List<ConfiguracionTareaItemDto> Tareas,
    List<ConfiguracionMaterialItemDto> Materiales,
    List<ConfiguracionServicioProductoItemDto>? Servicios = null);

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
    List<GuardarConfiguracionMaterialDto>? Materiales,
    int? SlaHorasResolucion = null,
    decimal? Puntos = 1.0m,
    List<Guid>? ProductoIds = null);

public record ActualizarConfiguracionServicioRequest(
    string Nombre,
    Guid ProductoId,
    int DuracionEstimadaMinutos,
    string? Descripcion,
    bool EsPredeterminada,
    List<GuardarConfiguracionTareaDto>? Tareas,
    List<GuardarConfiguracionMaterialDto>? Materiales,
    int? SlaHorasResolucion = null,
    decimal? Puntos = null,
    List<Guid>? ProductoIds = null);

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
