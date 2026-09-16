using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Commands.EliminarMotivoIncidencia;

public record EliminarMotivoIncidenciaCommand(Guid Id) : ICommand<Result>;
