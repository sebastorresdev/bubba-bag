namespace BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.Enums;

public enum TipoCompensacionHorasExtra
{
    NoAplica = 0,                       // No genera horas extra (dirección / confianza o política)
    PagoPlanilla = 1,                   // Se liquida y paga en dinero con recargo legal en nómina
    BancoHoras = 2                      // Se acumulan minutos para canjear por tiempo de descanso libre
}
