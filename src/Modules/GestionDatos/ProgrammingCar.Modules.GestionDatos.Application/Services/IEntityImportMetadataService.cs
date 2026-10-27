using System.Collections.Generic;
using ProgrammingCar.Modules.GestionDatos.Application.Dtos;

namespace ProgrammingCar.Modules.GestionDatos.Application.Services;

public interface IEntityImportMetadataService
{
    List<EntityImportDescriptorDto> GetAvailableEntities();
    EntityImportDescriptorDto? GetEntityDescriptor(string entityName);
}

