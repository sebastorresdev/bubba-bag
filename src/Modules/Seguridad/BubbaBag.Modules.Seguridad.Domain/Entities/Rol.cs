using System;
using Microsoft.AspNetCore.Identity;

namespace BubbaBag.Modules.Seguridad.Domain.Entities;

public class Rol : IdentityRole<Guid>
{
    public string Descripcion { get; set; } = string.Empty;
}
