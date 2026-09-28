using System;
using System.Collections.Generic;
using System.Linq;
using BubbaBag.Modules.GestionDatos.Application.Dtos;
using BubbaBag.Modules.GestionDatos.Application.Services;

namespace BubbaBag.Modules.GestionDatos.Infrastructure.Services;

public class EntityImportMetadataService : IEntityImportMetadataService
{
    private readonly IEnumerable<IEntityImportProvider> _providers;

    public EntityImportMetadataService(IEnumerable<IEntityImportProvider> providers)
    {
        _providers = providers;
    }

    public List<EntityImportDescriptorDto> GetAvailableEntities()
    {
        var list = new List<EntityImportDescriptorDto>();
        foreach (var provider in _providers)
        {
            list.AddRange(provider.GetDescriptors());
        }
        return list;
    }

    public EntityImportDescriptorDto? GetEntityDescriptor(string entityName)
    {
        return GetAvailableEntities()
            .FirstOrDefault(e => e.EntityName.Equals(entityName, StringComparison.OrdinalIgnoreCase));
    }
}

