using System;
using Microsoft.AspNetCore.Identity;

namespace BubbaBag.Modules.Seguridad.Domain.Entities;

public class Rol : IdentityRole<Guid>
{
    public string Modulo { get; set; } = string.Empty;
    public string NombreVisible { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
}
