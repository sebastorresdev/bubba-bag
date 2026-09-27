using System.Collections.Generic;
using BubbaBag.Modules.ServicioCampo.Application.DataManagement.Dtos;

namespace BubbaBag.Modules.ServicioCampo.Application.DataManagement.Services;

public interface IEntityImportMetadataService
{
    IReadOnlyList<EntityImportDescriptorDto> GetAvailableEntities();
    EntityImportDescriptorDto? GetEntityDescriptor(string entityName);
}
