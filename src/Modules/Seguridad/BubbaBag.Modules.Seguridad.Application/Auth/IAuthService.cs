using System;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.Seguridad.Application.Auth;

public interface IAuthService
{
    Task<Result<string>> LoginAsync(string email, string password);
    Task<Result<Guid>> RegisterAsync(string email, string password, string nombreCompleto, string rol);
}
