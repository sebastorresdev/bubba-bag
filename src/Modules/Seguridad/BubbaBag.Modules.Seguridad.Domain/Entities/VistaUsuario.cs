using System;

namespace BubbaBag.Modules.Seguridad.Domain.Entities;

public class VistaUsuario
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public string Entidad { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool EsPredeterminada { get; set; }
    public bool EsSistema { get; set; }
    public string ConfiguracionJson { get; set; } = "{}";
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
}
