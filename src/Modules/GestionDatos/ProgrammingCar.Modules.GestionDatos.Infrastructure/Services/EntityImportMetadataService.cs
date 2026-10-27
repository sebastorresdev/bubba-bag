using System;
using System.Collections.Generic;
using System.Linq;
using ProgrammingCar.Modules.GestionDatos.Application.Dtos;
using ProgrammingCar.Modules.GestionDatos.Application.Services;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.Authorization;

namespace ProgrammingCar.Modules.GestionDatos.Infrastructure.Services;

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

