using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using BubbaBag.SharedKernel;
using Microsoft.AspNetCore.Http;

namespace BubbaBag.Api.Services;

public class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUser(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid Id => Guid.TryParse(_httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : Guid.Empty;

    public string Email => _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Email) ?? string.Empty;

    public IReadOnlyList<string> Roles => _httpContextAccessor.HttpContext?.User?.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList() ?? new List<string>();

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

    public bool IsInRole(string role) => 
        Roles.Any(r => string.Equals(r, role, StringComparison.OrdinalIgnoreCase));

    public bool HasAnyRole(params string[] roles) => 
        roles.Any(IsInRole);

    public bool HasPermission(string permission)
    {
        if (IsInRole(BubbaBag.SharedKernel.Authorization.Roles.SuperAdmin))
        {
            return true;
        }

        // 1. Revisar claims explícitos de permisos en el token
        var claims = _httpContextAccessor.HttpContext?.User?.FindAll("permission");
        if (claims != null && claims.Any(c => string.Equals(c.Value, permission, StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        // 2. Revisar si alguno de los roles asignados otorga el permiso
        return BubbaBag.SharedKernel.Authorization.RolePermissions.GetPermissionsForRoles(Roles).Contains(permission);
    }
}
