using Microsoft.AspNetCore.Identity;

namespace ProgrammingCar.Modules.Seguridad.Domain.Entities;

public class Usuario : IdentityUser<Guid>
{
    public string NombreCompleto { get; set; } = string.Empty;
    public bool EsActivo { get; set; } = true;
}
