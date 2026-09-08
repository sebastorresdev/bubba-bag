using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.TurnosYReglas;

public class Turno : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    
    // Franja horaria pura
    public TimeOnly HoraInicio { get; private set; }
    public TimeOnly HoraFin { get; private set; }
    public bool CruzaMedianoche { get; private set; }

    // Tiempos operativos y tolerancias
    public int MinutosRefrigerio { get; private set; } = 60;
    public int MinutosToleranciaEntrada { get; private set; } = 10;
    public int MinutosToleranciaRefrigerio { get; private set; } = 5;

    // Ventanas de captura de marcas
    public TimeOnly VentanaEntradaInicio { get; private set; }
    public TimeOnly VentanaEntradaFin { get; private set; }
    public TimeOnly VentanaSalidaInicio { get; private set; }
    public TimeOnly VentanaSalidaFin { get; private set; }

    public bool Activo { get; private set; } = true;

    private Turno() { }

    public Turno(
        Guid id,
        string codigo,
        string nombre,
        TimeOnly horaInicio,
        TimeOnly horaFin,
        int minutosRefrigerio = 60,
        int minutosToleranciaEntrada = 10,
        int minutosToleranciaRefrigerio = 5,
        TimeOnly? ventanaEntradaInicio = null,
        TimeOnly? ventanaEntradaFin = null,
        TimeOnly? ventanaSalidaInicio = null,
        TimeOnly? ventanaSalidaFin = null)
    {
        Id = id;
        Codigo = codigo.Trim().ToUpperInvariant();
        Nombre = nombre.Trim();
        HoraInicio = horaInicio;
        HoraFin = horaFin;
        CruzaMedianoche = horaFin < horaInicio;

        MinutosRefrigerio = Math.Max(0, minutosRefrigerio);
        MinutosToleranciaEntrada = Math.Max(0, minutosToleranciaEntrada);
        MinutosToleranciaRefrigerio = Math.Max(0, minutosToleranciaRefrigerio);

        // Si no se definen explícitamente, se calculan ventanas estándar (2h antes y 2h después)
        VentanaEntradaInicio = ventanaEntradaInicio ?? horaInicio.AddHours(-2);
        VentanaEntradaFin = ventanaEntradaFin ?? horaInicio.AddHours(2);
        VentanaSalidaInicio = ventanaSalidaInicio ?? horaFin.AddHours(-2);
        VentanaSalidaFin = ventanaSalidaFin ?? horaFin.AddHours(4);

        Activo = true;
    }

    public void Actualizar(
        string nombre,
        TimeOnly horaInicio,
        TimeOnly horaFin,
        int minutosRefrigerio,
        int minutosToleranciaEntrada,
        int minutosToleranciaRefrigerio,
        TimeOnly ventanaEntradaInicio,
        TimeOnly ventanaEntradaFin,
        TimeOnly ventanaSalidaInicio,
        TimeOnly ventanaSalidaFin)
    {
        Nombre = nombre.Trim();
        HoraInicio = horaInicio;
        HoraFin = horaFin;
        CruzaMedianoche = horaFin < horaInicio;

        MinutosRefrigerio = Math.Max(0, minutosRefrigerio);
        MinutosToleranciaEntrada = Math.Max(0, minutosToleranciaEntrada);
        MinutosToleranciaRefrigerio = Math.Max(0, minutosToleranciaRefrigerio);

        VentanaEntradaInicio = ventanaEntradaInicio;
        VentanaEntradaFin = ventanaEntradaFin;
        VentanaSalidaInicio = ventanaSalidaInicio;
        VentanaSalidaFin = ventanaSalidaFin;
    }

    public void CambiarEstado(bool activo)
    {
        Activo = activo;
    }

    /// <summary>
    /// Calcula las horas brutas de duración de la jornada teórica.
    /// </summary>
    public decimal ObtenerHorasBrutasJornada()
    {
        if (!CruzaMedianoche)
        {
            var diff = HoraFin.ToTimeSpan() - HoraInicio.ToTimeSpan();
            return (decimal)diff.TotalHours;
        }
        else
        {
            var hastaMedianoche = TimeSpan.FromHours(24) - HoraInicio.ToTimeSpan();
            var desdeMedianoche = HoraFin.ToTimeSpan();
            return (decimal)(hastaMedianoche + desdeMedianoche).TotalHours;
        }
    }

    /// <summary>
    /// Horas netas de trabajo descontando el tiempo de refrigerio.
    /// </summary>
    public decimal ObtenerHorasNetasJornada()
    {
        var brutas = ObtenerHorasBrutasJornada();
        var horasRefrigerio = (decimal)MinutosRefrigerio / 60m;
        return Math.Max(0, brutas - horasRefrigerio);
    }
}
