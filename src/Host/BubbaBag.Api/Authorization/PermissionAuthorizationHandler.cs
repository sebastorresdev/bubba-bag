using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using BubbaBag.SharedKernel.Authorization;
using Microsoft.AspNetCore.Authorization;

namespace BubbaBag.Api.Authorization;

public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (context.User.Identity == null || !context.User.Identity.IsAuthenticated)
        {
            return Task.CompletedTask;
        }

        // 1. Bypass absoluto para SuperAdmin
        if (context.User.IsInRole(Roles.SuperAdmin))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // 2. Revisar si tiene claim explícito de permiso
        var hasExplicitClaim = context.User.FindAll("permission")
            .Any(c => string.Equals(c.Value, requirement.Permission, StringComparison.OrdinalIgnoreCase));

        if (hasExplicitClaim)
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // 3. Revisar si alguno de sus roles mapea a este permiso
        var userRoles = context.User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        if (RolePermissions.GetPermissionsForRoles(userRoles).Contains(requirement.Permission))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        return Task.CompletedTask;
    }
}
