using System;
using System.Collections.Generic;
using System.Linq;
using BubbaBag.Modules.GestionDatos.Application.Dtos;
using BubbaBag.Modules.GestionDatos.Application.Services;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.Authorization;

namespace BubbaBag.Modules.GestionDatos.Infrastructure.Services;

public class EntityImportMetadataService : IEntityImportMetadataService
{
    private readonly IEnumerable<IEntityImportProvider> _providers;
    private readonly ICurrentUser _user;

    public EntityImportMetadataService(IEnumerable<IEntityImportProvider> providers, ICurrentUser user)
    {
        _providers = providers;
        _user = user;
    }

    public List<EntityImportDescriptorDto> GetAvailableEntities()
    {
        if (!_user.IsAuthenticated || !_user.HasPermission(Permissions.GestionDatos.Importar)) return [];
        var list = new List<EntityImportDescriptorDto>();
        foreach (var provider in _providers)
        {
            list.AddRange(provider.GetDescriptors());
        }
        return list.Where(e => ImportacionAcceso.PuedeGestionarEntidad(_user, e.EntityName)).ToList();
    }

    public EntityImportDescriptorDto? GetEntityDescriptor(string entityName)
    {
        return GetAvailableEntities()
            .FirstOrDefault(e => e.EntityName.Equals(entityName, StringComparison.OrdinalIgnoreCase));
    }
}

