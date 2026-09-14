using System.Threading;
using System.Threading.Tasks;

namespace BubbaBag.SharedKernel;

/// <summary>
/// Servicio centralizado para generación atómica y secuencial de códigos de negocio (ej. CLI-000001, WO-000001).
/// </summary>
public interface ICodigoSecuencialService
{
    /// <summary>
    /// Genera el siguiente código secuencial formateado de forma segura y libre de bloqueos.
    /// </summary>
    /// <param name="prefijo">Prefijo identificador (ej: "CLI", "WO", "VIS", "TSK")</param>
    /// <param name="nombreSecuencia">Nombre de la secuencia en base de datos (ej: "seq_clientes")</param>
    /// <param name="esquema">Esquema en PostgreSQL (ej: "crm", "serviciocampo")</param>
    /// <param name="longitud">Cantidad de dígitos con relleno de ceros a la izquierda (por defecto 6)</param>
    /// <param name="cancellationToken">Token de cancelación</param>
    Task<string> SiguienteCodigoAsync(
        string prefijo,
        string nombreSecuencia,
        string esquema,
        int longitud = 6,
        CancellationToken cancellationToken = default);
}
