using System;
using System.Collections.Generic;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Almacenes.Ajustes;

public record LineaAjusteItemDto(
    string Id,
    Guid ProductoId,
    string CodigoProducto,
    string NombreProducto,
    string Unidad,
    decimal StockActual,
    string Tipo,
    decimal Cantidad,
    decimal CostoUnitario,
    decimal Total,
    bool EsSerializado,
    List<string> Series,
    string? MotivoLinea = null
);

public record AjusteInventarioDto(
    Guid Id,
    string Numero,
    string? NumeroAprobacion,
    string Tipo,
    Guid AlmacenId,
    string NombreAlmacen,
    Guid? UbicacionId,
    string? NombreUbicacion,
    string Fecha,
    string Motivo,
    string? DocumentoReferencia,
    string? Observaciones,
    string Estado,
    int TotalItems,
    decimal TotalCantidad,
    decimal ValorTotal,
    string UsuarioRegistro,
    DateTime FechaRegistro,
    string? UsuarioAprobacion,
    DateTime? FechaAprobacion,
    List<LineaAjusteItemDto> Lineas
);

public record GuardarAjusteLineaInput(
    Guid ProductoId,
    string? CodigoProducto,
    string? NombreProducto,
    string? Unidad,
    bool? EsSerializado,
    string Tipo,
    decimal Cantidad,
    decimal CostoUnitario,
    List<string>? Series,
    string? MotivoLinea
);

public record GuardarAjusteInput(
    string Tipo,
    Guid AlmacenId,
    Guid? UbicacionId,
    string Fecha,
    string Motivo,
    string? DocumentoReferencia,
    string? Observaciones,
    List<GuardarAjusteLineaInput> Lineas
);

public record AjusteIdentificadorDto(Guid Id, string Numero);
public record AprobacionAjusteDto(string NumeroAprobacion);

public record CrearAjusteCommand(GuardarAjusteInput Datos, Guid? RecuperacionId = null) : ICommand<Result<AjusteIdentificadorDto>>;
public record ActualizarAjusteCommand(Guid Id, GuardarAjusteInput Datos) : ICommand<Result<AjusteIdentificadorDto>>;
public record SolicitarAprobacionAjusteCommand(Guid Id) : ICommand<Result<AprobacionAjusteDto>>;
public record AplicarAjusteCommand(Guid Id) : ICommand<Result>;
public record RechazarAjusteCommand(Guid Id, string? Motivo) : ICommand<Result>;
public record AnularAjusteCommand(Guid Id) : ICommand<Result>;
public record EliminarAjusteCommand(Guid Id) : ICommand<Result>;

public record ObtenerAjustesQuery(Guid? AlmacenId = null) : IQuery<Result<List<AjusteInventarioDto>>>;
public record ObtenerAjustePorIdQuery(Guid Id) : IQuery<Result<AjusteInventarioDto>>;
