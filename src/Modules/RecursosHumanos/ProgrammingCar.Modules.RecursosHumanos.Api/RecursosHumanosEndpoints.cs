using System;
using System.Threading.Tasks;
using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Dtos;
using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Queries.ObtenerCatalogosRrhh;

using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Dtos;
using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Commands.CrearDepartamento;
using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Commands.ActualizarDepartamento;
using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Commands.CambiarEstadoDepartamento;
using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Commands.EliminarDepartamento;
using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Queries.ObtenerDepartamentos;
using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Queries.ObtenerDepartamentoPorId;

using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Cargos.Dtos;
using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Cargos.Commands.CrearCargo;
using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Cargos.Commands.ActualizarCargo;
using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Cargos.Commands.CambiarEstadoCargo;
using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Cargos.Commands.EliminarCargo;
using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Cargos.Queries.ObtenerCargos;
using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Cargos.Queries.ObtenerCargoPorId;

using ProgrammingCar.Modules.RecursosHumanos.Application.Empleados.Dtos;
using ProgrammingCar.Modules.RecursosHumanos.Application.Empleados.Commands.CrearEmpleado;
using ProgrammingCar.Modules.RecursosHumanos.Application.Empleados.Commands.ActualizarEmpleado;
using ProgrammingCar.Modules.RecursosHumanos.Application.Empleados.Commands.DarDeBajaEmpleado;
using ProgrammingCar.Modules.RecursosHumanos.Application.Empleados.Commands.ReactivarEmpleado;
using ProgrammingCar.Modules.RecursosHumanos.Application.Empleados.Commands.EliminarEmpleado;
using ProgrammingCar.Modules.RecursosHumanos.Application.Empleados.Queries.ObtenerEmpleados;
using ProgrammingCar.Modules.RecursosHumanos.Application.Empleados.Queries.ObtenerEmpleado;
using ProgrammingCar.Modules.RecursosHumanos.Domain.Empleados;
using ProgrammingCar.SharedKernel.CQRS;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace ProgrammingCar.Modules.RecursosHumanos.Api;

public static class RecursosHumanosEndpoints
{
    public static void MapRecursosHumanosEndpoints(this IEndpointRouteBuilder app)
    {
        var rootGroup = app.MapGroup("/api/rrhh")
            .WithTags("Recursos Humanos")
            .RequireAuthorization(ProgrammingCar.SharedKernel.Authorization.Permissions.Rrhh.Acceso);

        // Catálogos
        rootGroup.MapGet("/catalogos", ObtenerCatalogos);

        // Departamentos
        var departamentosGroup = rootGroup.MapGroup("/departamentos");
        departamentosGroup.MapGet("/", ObtenerDepartamentos);
        departamentosGroup.MapGet("/{id:guid}", ObtenerDepartamentoPorId);
        departamentosGroup.MapPost("/", CrearDepartamento).RequireAuthorization(ProgrammingCar.SharedKernel.Authorization.Permissions.Rrhh.CatalogosGestionar);
        departamentosGroup.MapPut("/{id:guid}", ActualizarDepartamento).RequireAuthorization(ProgrammingCar.SharedKernel.Authorization.Permissions.Rrhh.CatalogosGestionar);
        departamentosGroup.MapDelete("/{id:guid}", EliminarDepartamento).RequireAuthorization(ProgrammingCar.SharedKernel.Authorization.Permissions.Rrhh.CatalogosGestionar);
        departamentosGroup.MapPatch("/{id:guid}/estado", CambiarEstadoDepartamento).RequireAuthorization(ProgrammingCar.SharedKernel.Authorization.Permissions.Rrhh.CatalogosGestionar);

        // Cargos
        var cargosGroup = rootGroup.MapGroup("/cargos");
        cargosGroup.MapGet("/", ObtenerCargos);
        cargosGroup.MapGet("/{id:guid}", ObtenerCargoPorId);
        cargosGroup.MapPost("/", CrearCargo).RequireAuthorization(ProgrammingCar.SharedKernel.Authorization.Permissions.Rrhh.CatalogosGestionar);
        cargosGroup.MapPut("/{id:guid}", ActualizarCargo).RequireAuthorization(ProgrammingCar.SharedKernel.Authorization.Permissions.Rrhh.CatalogosGestionar);
        cargosGroup.MapDelete("/{id:guid}", EliminarCargo).RequireAuthorization(ProgrammingCar.SharedKernel.Authorization.Permissions.Rrhh.CatalogosGestionar);
        cargosGroup.MapPatch("/{id:guid}/estado", CambiarEstadoCargo).RequireAuthorization(ProgrammingCar.SharedKernel.Authorization.Permissions.Rrhh.CatalogosGestionar);

        // Empleados
        var empleadosGroup = rootGroup.MapGroup("/empleados");

        empleadosGroup.MapGet("/", ObtenerEmpleados).RequireAuthorization(ProgrammingCar.SharedKernel.Authorization.Permissions.Rrhh.ColaboradoresVer);
        empleadosGroup.MapGet("/{id:guid}", ObtenerEmpleadoPorId).RequireAuthorization(ProgrammingCar.SharedKernel.Authorization.Permissions.Rrhh.ColaboradoresVer);
        empleadosGroup.MapPost("/", CrearEmpleado).RequireAuthorization(ProgrammingCar.SharedKernel.Authorization.Permissions.Rrhh.ColaboradoresGestionar);
        empleadosGroup.MapPut("/{id:guid}", ActualizarEmpleado).RequireAuthorization(ProgrammingCar.SharedKernel.Authorization.Permissions.Rrhh.ColaboradoresGestionar);
        empleadosGroup.MapPost("/{id:guid}/baja", DarDeBajaEmpleado).RequireAuthorization(ProgrammingCar.SharedKernel.Authorization.Permissions.Rrhh.ColaboradoresGestionar);
        empleadosGroup.MapPost("/{id:guid}/reactivar", ReactivarEmpleado).RequireAuthorization(ProgrammingCar.SharedKernel.Authorization.Permissions.Rrhh.ColaboradoresGestionar);
        empleadosGroup.MapDelete("/{id:guid}", EliminarEmpleado)
            .RequireAuthorization(ProgrammingCar.SharedKernel.Authorization.Permissions.Rrhh.ColaboradoresGestionar, ProgrammingCar.SharedKernel.Authorization.Permissions.Rrhh.SalariosConfidencial);
    }

    private static async Task<IResult> ObtenerCatalogos(IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerCatalogosRrhhQuery());
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> ObtenerEmpleados(
        IDispatcher dispatcher,
        string? searchTerm,
        EstadoEmpleado? estado,
        Guid? departamentoId,
        Guid? cargoId,
        int page = 1,
        int pageSize = 20)
    {
        var result = await dispatcher.QueryAsync(new ObtenerEmpleadosQuery(searchTerm, estado, departamentoId, cargoId, page, pageSize));
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> ObtenerEmpleadoPorId(
        IDispatcher dispatcher,
        Guid id)
    {
        var result = await dispatcher.QueryAsync(new ObtenerEmpleadoQuery(id));
        if (result.IsFailure)
        {
            return Results.NotFound(new ProgrammingCar.SharedKernel.Http.ErrorResponse(404, "Colaborador no encontrado", result.Error));
        }
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> CrearEmpleado(
        IDispatcher dispatcher,
        CrearEmpleadoCommand command)
    {
        var result = await dispatcher.SendAsync(command);
        if (result.IsFailure)
        {
            return Results.BadRequest(new ProgrammingCar.SharedKernel.Http.ErrorResponse(400, "Inconsistencia de negocio", result.Error));
        }
        return Results.Created($"/api/rrhh/empleados/{result.Value}", result.Value);
    }

    private static async Task<IResult> ActualizarEmpleado(
        IDispatcher dispatcher,
        Guid id,
        ActualizarEmpleadoCommand command)
    {
        if (id != command.Id)
        {
            return Results.BadRequest(new ProgrammingCar.SharedKernel.Http.ErrorResponse(400, "Identificador inválido", "El ID de la ruta no coincide con el del cuerpo de la solicitud."));
        }

        var result = await dispatcher.SendAsync(command);
        if (result.IsFailure)
        {
            return Results.BadRequest(new ProgrammingCar.SharedKernel.Http.ErrorResponse(400, "Inconsistencia de negocio", result.Error));
        }
        return Results.NoContent();
    }

    private static async Task<IResult> DarDeBajaEmpleado(
        IDispatcher dispatcher,
        Guid id,
        DarDeBajaRequest request)
    {
        var command = new DarDeBajaEmpleadoCommand(id, request.FechaCese, request.MotivoCese, request.ObservacionesCese);
        var result = await dispatcher.SendAsync(command);
        if (result.IsFailure)
        {
            return Results.BadRequest(new ProgrammingCar.SharedKernel.Http.ErrorResponse(400, "Error al dar de baja", result.Error));
        }
        return Results.Ok(new { Id = result.Value, Mensaje = "Colaborador dado de baja exitosamente." });
    }

    private static async Task<IResult> ReactivarEmpleado(
        IDispatcher dispatcher,
        Guid id)
    {
        var command = new ReactivarEmpleadoCommand(id);
        var result = await dispatcher.SendAsync(command);
        if (result.IsFailure)
        {
            return Results.BadRequest(new ProgrammingCar.SharedKernel.Http.ErrorResponse(400, "Error al reactivar colaborador", result.Error));
        }
        return Results.Ok(new { Id = result.Value, Mensaje = "Colaborador reactivado exitosamente." });
    }

    private static async Task<IResult> EliminarEmpleado(
        IDispatcher dispatcher,
        Guid id)
    {
        var result = await dispatcher.SendAsync(new EliminarEmpleadoCommand(id));
        if (result.IsFailure)
        {
            return Results.BadRequest(new ProgrammingCar.SharedKernel.Http.ErrorResponse(400, "Operación no permitida", result.Error));
        }
        return Results.NoContent();
    }

    // Departamentos
    private static async Task<IResult> ObtenerDepartamentos(
        IDispatcher dispatcher,
        string? searchTerm,
        bool? activo)
    {
        var result = await dispatcher.QueryAsync(new ObtenerDepartamentosQuery(activo, searchTerm));
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> ObtenerDepartamentoPorId(
        IDispatcher dispatcher,
        Guid id)
    {
        var result = await dispatcher.QueryAsync(new ObtenerDepartamentoPorIdQuery(id));
        if (result.IsFailure)
        {
            return Results.NotFound(new ProgrammingCar.SharedKernel.Http.ErrorResponse(404, "Departamento no encontrado", result.Error));
        }
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> CrearDepartamento(
        IDispatcher dispatcher,
        CrearDepartamentoCommand command)
    {
        var result = await dispatcher.SendAsync(command);
        if (result.IsFailure)
        {
            return Results.BadRequest(new ProgrammingCar.SharedKernel.Http.ErrorResponse(400, "Inconsistencia de negocio", result.Error));
        }
        return Results.Created($"/api/rrhh/departamentos/{result.Value}", result.Value);
    }

    private static async Task<IResult> ActualizarDepartamento(
        IDispatcher dispatcher,
        Guid id,
        ActualizarDepartamentoRequest request)
    {
        var command = new ActualizarDepartamentoCommand(id, request.Nombre, request.Descripcion, request.Activo);
        var result = await dispatcher.SendAsync(command);
        if (result.IsFailure)
        {
            return Results.BadRequest(new ProgrammingCar.SharedKernel.Http.ErrorResponse(400, "Inconsistencia de negocio", result.Error));
        }
        return Results.NoContent();
    }

    private static async Task<IResult> EliminarDepartamento(
        IDispatcher dispatcher,
        Guid id)
    {
        var result = await dispatcher.SendAsync(new EliminarDepartamentoCommand(id));
        if (result.IsFailure)
        {
            return Results.BadRequest(new ProgrammingCar.SharedKernel.Http.ErrorResponse(400, "Operación no permitida", result.Error));
        }
        return Results.NoContent();
    }

    private static async Task<IResult> CambiarEstadoDepartamento(
        IDispatcher dispatcher,
        Guid id,
        CambiarEstadoCatalogoRequest request)
    {
        var result = await dispatcher.SendAsync(new CambiarEstadoDepartamentoCommand(id, request.Activo));
        if (result.IsFailure)
        {
            return Results.BadRequest(new ProgrammingCar.SharedKernel.Http.ErrorResponse(400, "Error al cambiar estado", result.Error));
        }
        return Results.Ok(new { Id = result.Value, Mensaje = "Estado del departamento actualizado exitosamente." });
    }

    // Cargos
    private static async Task<IResult> ObtenerCargos(
        IDispatcher dispatcher,
        Guid? departamentoId,
        string? searchTerm,
        bool? activo)
    {
        var result = await dispatcher.QueryAsync(new ObtenerCargosQuery(departamentoId, activo, searchTerm));
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> ObtenerCargoPorId(
        IDispatcher dispatcher,
        Guid id)
    {
        var result = await dispatcher.QueryAsync(new ObtenerCargoPorIdQuery(id));
        if (result.IsFailure)
        {
            return Results.NotFound(new ProgrammingCar.SharedKernel.Http.ErrorResponse(404, "Cargo no encontrado", result.Error));
        }
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> CrearCargo(
        IDispatcher dispatcher,
        CrearCargoCommand command)
    {
        var result = await dispatcher.SendAsync(command);
        if (result.IsFailure)
        {
            return Results.BadRequest(new ProgrammingCar.SharedKernel.Http.ErrorResponse(400, "Inconsistencia de negocio", result.Error));
        }
        return Results.Created($"/api/rrhh/cargos/{result.Value}", result.Value);
    }

    private static async Task<IResult> ActualizarCargo(
        IDispatcher dispatcher,
        Guid id,
        ActualizarCargoRequest request)
    {
        var command = new ActualizarCargoCommand(id, request.Nombre, request.DepartamentoId, request.SalarioReferencial, request.Activo);
        var result = await dispatcher.SendAsync(command);
        if (result.IsFailure)
        {
            return Results.BadRequest(new ProgrammingCar.SharedKernel.Http.ErrorResponse(400, "Inconsistencia de negocio", result.Error));
        }
        return Results.NoContent();
    }

    private static async Task<IResult> EliminarCargo(
        IDispatcher dispatcher,
        Guid id)
    {
        var result = await dispatcher.SendAsync(new EliminarCargoCommand(id));
        if (result.IsFailure)
        {
            return Results.BadRequest(new ProgrammingCar.SharedKernel.Http.ErrorResponse(400, "Operación no permitida", result.Error));
        }
        return Results.NoContent();
    }

    private static async Task<IResult> CambiarEstadoCargo(
        IDispatcher dispatcher,
        Guid id,
        CambiarEstadoCatalogoRequest request)
    {
        var result = await dispatcher.SendAsync(new CambiarEstadoCargoCommand(id, request.Activo));
        if (result.IsFailure)
        {
            return Results.BadRequest(new ProgrammingCar.SharedKernel.Http.ErrorResponse(400, "Error al cambiar estado", result.Error));
        }
        return Results.Ok(new { Id = result.Value, Mensaje = "Estado del cargo actualizado exitosamente." });
    }
}

public record DarDeBajaRequest(DateOnly FechaCese, string MotivoCese, string? ObservacionesCese);
public record ActualizarDepartamentoRequest(string Nombre, string? Descripcion, bool Activo = true);
public record ActualizarCargoRequest(string Nombre, Guid DepartamentoId, decimal? SalarioReferencial, bool Activo = true);
public record CambiarEstadoCatalogoRequest(bool Activo);

