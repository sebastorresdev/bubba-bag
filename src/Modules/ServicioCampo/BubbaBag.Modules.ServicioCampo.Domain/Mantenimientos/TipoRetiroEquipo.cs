namespace BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;

/// <summary>
/// Naturaleza o tipo de retiro/devolución de un equipo seriado en campo o almacén.
/// Cobertura 360° para telecomunicaciones, field service y logística inversa.
/// </summary>
public enum TipoRetiroEquipo
{
    /// <summary>
    /// Falla técnica de componentes, no enciende, disco roto, tuner, tarjeta, desgaste normal. (Garantía normal).
    /// </summary>
    AveriaTecnica = 1,

    /// <summary>
    /// Cambio de tecnología: Upgrade a equipo superior o Downgrade de decos adicionales. (Equipo 100% operativo).
    /// </summary>
    CambioTecnologia = 2,

    /// <summary>
    /// Baja comercial: Cancelación voluntaria de contrato, corte por morosidad o mudanza. (Equipo 100% operativo).
    /// </summary>
    BajaComercial = 3,

    /// <summary>
    /// Daño físico o siniestro: Golpes, caídas, sobretensión/rayo, agua, daño imputable al abonado. (No cubre garantía).
    /// </summary>
    DanoSiniestro = 4,

    /// <summary>
    /// Falla de fábrica / DOA (Dead On Arrival): Equipo nuevo de empaque que falla en las primeras 24-72h. (RMA / Fabricante).
    /// </summary>
    DefectoFabricaDOA = 5,

    /// <summary>
    /// Fin de vida útil / Obsolescencia tecnológica (EOL): Retiro masivo de tecnologías apagadas (SD/MPEG-2) para chatarreo.
    /// </summary>
    ObsolescenciaEOL = 6,

    /// <summary>
    /// Retiro preventivo / Descarte: Cambio por sospecha en visita técnica sin falla confirmada (No Fault Found - NFF).
    /// </summary>
    PreventivoDescarte = 7,

    /// <summary>
    /// Administrativo / Auditoría: Retención por serie duplicada, sospecha de clonación o instrucción legal.
    /// </summary>
    AdministrativoAuditoria = 8
}
