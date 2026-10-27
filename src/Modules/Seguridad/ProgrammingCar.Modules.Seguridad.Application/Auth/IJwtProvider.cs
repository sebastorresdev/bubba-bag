using System.Collections.Generic;
using ProgrammingCar.Modules.Seguridad.Domain.Entities;

namespace ProgrammingCar.Modules.Seguridad.Application.Auth;

public interface IJwtProvider
{
    string GenerateToken(Usuario usuario, IList<string> roles);
}
