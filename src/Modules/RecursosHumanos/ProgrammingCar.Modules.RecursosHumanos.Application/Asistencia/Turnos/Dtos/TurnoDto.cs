using System;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Asistencia.Turnos.Dtos;

public record TurnoDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string HoraInicio,
    string HoraFin,
    bool CruzaMedianoche,
    int MinutosRefrigerio,
    int MinutosToleranciaEntrada,
    int MinutosToleranciaRefrigerio,
    decimal HorasJornada,
    bool Activo
);
