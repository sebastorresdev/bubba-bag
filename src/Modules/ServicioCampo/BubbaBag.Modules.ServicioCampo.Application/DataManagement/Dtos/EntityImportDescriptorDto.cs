using System.Collections.Generic;

namespace BubbaBag.Modules.ServicioCampo.Application.DataManagement.Dtos;

public class EntityImportDescriptorDto
{
    public string EntityName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string IconName { get; set; } = "Document";
    public string PrimaryKeyField { get; set; } = string.Empty;
    public List<EntityFieldDescriptorDto> Fields { get; set; } = new();
}

public class EntityFieldDescriptorDto
{
    public string SystemName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public bool IsPrimary { get; set; }
    public string Type { get; set; } = "text"; // "text", "decimal", "integer", "boolean", "enum", "lookup"
    public List<string>? Options { get; set; }
    public string? LookupTarget { get; set; }
    public List<string> Synonyms { get; set; } = new();

    public EntityFieldDescriptorDto() { }

    public EntityFieldDescriptorDto(
        string systemName,
        string displayName,
        bool isRequired = false,
        bool isPrimary = false,
        string type = "text",
        List<string>? options = null,
        string? lookupTarget = null,
        params string[] synonyms)
    {
        SystemName = systemName;
        DisplayName = displayName;
        IsRequired = isRequired;
        IsPrimary = isPrimary;
        Type = type;
        Options = options;
        LookupTarget = lookupTarget;
        if (synonyms != null && synonyms.Length > 0)
        {
            Synonyms.AddRange(synonyms);
        }
    }
}
