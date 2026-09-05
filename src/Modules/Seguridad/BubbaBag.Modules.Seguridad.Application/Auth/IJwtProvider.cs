using System.Collections.Generic;
using BubbaBag.Modules.Seguridad.Domain.Entities;

namespace BubbaBag.Modules.Seguridad.Application.Auth;

public interface IJwtProvider
{
    string GenerateToken(Usuario usuario, IList<string> roles);
}
