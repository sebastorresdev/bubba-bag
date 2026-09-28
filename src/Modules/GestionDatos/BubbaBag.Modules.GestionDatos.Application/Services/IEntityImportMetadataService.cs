using System.Collections.Generic;
using BubbaBag.Modules.GestionDatos.Application.Dtos;

namespace BubbaBag.Modules.GestionDatos.Application.Services;

public interface IEntityImportMetadataService
{
    List<EntityImportDescriptorDto> GetAvailableEntities();
    EntityImportDescriptorDto? GetEntityDescriptor(string entityName);
}

