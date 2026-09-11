using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.FieldService.Domain.Mantenimientos;

/// <summary>
/// Catálogo de Tipos de Tarea / Subtareas de Servicio (Incident Types / Códigos SL de Siebel o Internos).
/// Ejemplos: 'IB01' (Instalación Básica), 'IA01' (Adicional), 'PC01' (Reposición Antena), 'PC03' (Recableado), 'ENC01' (Envío Encomienda).
/// </summary>
public class TipoTareaServicio : Entity<Guid>
{
    public string CodigoTarea { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public string Categoria { get; private set; } = default!; // 'INSTALACION', 'AVERIA', 'LOGISTICA', 'ADMIN'
    public int DuracionEstimadaMinutos { get; private set; }
    public bool EsTareaSiebel { get; private set; }
    public bool Activo { get; private set; }

    private TipoTareaServicio() { }

    public static TipoTareaServicio Crear(
        string codigoTarea,
        string nombre,
        string categoria,
        int duracionMinutos = 60,
        bool esTareaSiebel = true)
    {
        return new TipoTareaServicio
        {
            Id = Guid.NewGuid(),
            CodigoTarea = codigoTarea.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            Categoria = categoria.Trim().ToUpperInvariant(),
            DuracionEstimadaMinutos = duracionMinutos,
            EsTareaSiebel = esTareaSiebel,
            Activo = true
        };
    }

    public void Actualizar(string nombre, string categoria, int duracionMinutos, bool esTareaSiebel)
    {
        Nombre = nombre.Trim();
        Categoria = categoria.Trim().ToUpperInvariant();
        DuracionEstimadaMinutos = duracionMinutos;
        EsTareaSiebel = esTareaSiebel;
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
