using System;
using System.Collections.Generic;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.Modules.ServicioCampo.Domain.Productos;

namespace ProgrammingCar.Modules.ServicioCampo.Domain.Mantenimientos;

/// <summary>
/// Catálogo de Tipos de Orden de Trabajo (Contexto / Naturaleza Operativa).
/// Ejemplos: 'Atención en Campo', 'Logística / Encomienda', 'Recolección de Equipos', 'Instalación', 'Servicio Técnico'.
/// </summary>
public class TipoOrdenTrabajo : Entity<Guid>
{
    public string Nombre { get; private set; } = default!;
    public string? Descripcion { get; private set; }
    public bool RequiereVisitaCampo { get; private set; }
    public bool ExigeFirmaCliente { get; private set; } = true;
    public bool ExigeEvidenciasFotograficas { get; private set; } = true;
    public string ColorHex { get; private set; } = "#0f6cbd";
    public Guid? ListaPreciosId { get; private set; }
    public virtual ListaPrecios? ListaPrecios { get; private set; }
    public bool Activo { get; private set; }

    private readonly List<CampoDefinicion> _camposDefinicion = new();
    public IReadOnlyCollection<CampoDefinicion> CamposDefinicion => _camposDefinicion.AsReadOnly();

    private TipoOrdenTrabajo() { }

    public static TipoOrdenTrabajo Crear(
        string nombre,
        bool requiereVisitaCampo = true,
        bool exigeFirmaCliente = true,
        bool exigeEvidenciasFotograficas = true,
        string? descripcion = null,
        string colorHex = "#0f6cbd",
        Guid? listaPreciosId = null)
    {
        return new TipoOrdenTrabajo
        {
            Id = Guid.NewGuid(),
            Nombre = nombre.Trim(),
            RequiereVisitaCampo = requiereVisitaCampo,
            ExigeFirmaCliente = exigeFirmaCliente,
            ExigeEvidenciasFotograficas = exigeEvidenciasFotograficas,
            Descripcion = descripcion?.Trim(),
            ColorHex = colorHex,
            ListaPreciosId = listaPreciosId,
            Activo = true
        };
    }

    public void Actualizar(
        string nombre,
        bool requiereVisitaCampo,
        bool exigeFirmaCliente,
        bool exigeEvidenciasFotograficas,
        string? descripcion,
        string colorHex,
        Guid? listaPreciosId = null)
    {
        Nombre = nombre.Trim();
        RequiereVisitaCampo = requiereVisitaCampo;
        ExigeFirmaCliente = exigeFirmaCliente;
        ExigeEvidenciasFotograficas = exigeEvidenciasFotograficas;
        Descripcion = descripcion?.Trim();
        ColorHex = colorHex;
        ListaPreciosId = listaPreciosId;
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
