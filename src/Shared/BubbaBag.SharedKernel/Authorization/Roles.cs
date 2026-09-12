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

    // Servicio de Campo
    public const string ServicioCampoAdmin = "ServicioCampoAdmin";
    public const string ServicioCampoBackoffice = "ServicioCampoBackoffice";
    public const string ServicioCampoTecnico = "ServicioCampoTecnico";

    // CRM y Clientes
    public const string CrmAdmin = "CrmAdmin";
    public const string CrmOperador = "CrmOperador";

    public static readonly IReadOnlyList<string> Fijos = new[]
    {
        SuperAdmin,
        Gerencia,
        RrhhAdmin,
        RrhhAsistente,
        ServicioCampoAdmin,
        ServicioCampoBackoffice,
        ServicioCampoTecnico,
        CrmAdmin,
        CrmOperador
    };

    // Agrupaciones para compatibilidad
    public static readonly string[] AccesoRrhhConfidencial = { SuperAdmin, Gerencia, RrhhAdmin };
    public static readonly string[] AccesoRrhhModulo = { SuperAdmin, Gerencia, RrhhAdmin, RrhhAsistente };
    public static readonly string[] AccesoServicioCampo = { SuperAdmin, Gerencia, ServicioCampoAdmin, ServicioCampoBackoffice, ServicioCampoTecnico };
    public static readonly string[] AccesoCrm = { SuperAdmin, Gerencia, CrmAdmin, CrmOperador };
}
