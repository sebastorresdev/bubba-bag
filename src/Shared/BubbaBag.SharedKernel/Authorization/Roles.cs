using System;
using System.Collections.Generic;

namespace BubbaBag.SharedKernel.Authorization;

public static class Roles
{
    // Roles fijos del sistema
    public const string SuperAdmin = "SuperAdmin";
    public const string Gerencia = "Gerencia";
    public const string RrhhAdmin = "RrhhAdmin";
    public const string RrhhAsistente = "RrhhAsistente";

    public static readonly IReadOnlyList<string> Fijos = new[]
    {
        SuperAdmin,
        Gerencia,
        RrhhAdmin,
        RrhhAsistente
    };

    // Agrupaciones para políticas y autorizaciones
    public static readonly string[] AccesoRrhhConfidencial = { SuperAdmin, Gerencia, RrhhAdmin };
    public static readonly string[] AccesoRrhhModulo = { SuperAdmin, Gerencia, RrhhAdmin, RrhhAsistente };
}
