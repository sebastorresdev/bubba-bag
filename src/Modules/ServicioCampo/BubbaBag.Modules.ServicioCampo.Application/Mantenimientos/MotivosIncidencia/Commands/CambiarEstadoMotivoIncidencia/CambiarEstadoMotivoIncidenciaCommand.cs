using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Commands.CambiarEstadoMotivoIncidencia;

public record CambiarEstadoMotivoIncidenciaCommand(Guid Id, bool Activo) : ICommand<Result>;
