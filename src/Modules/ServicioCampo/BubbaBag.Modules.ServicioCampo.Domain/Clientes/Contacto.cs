using System;
using BubbaBag.Modules.ServicioCampo.Domain.Ubigeos;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Clientes;

/// <summary>
/// Persona física de contacto con la que se interactúa para coordinar o brindar el servicio
/// (Titular en sitio, Administrador, Encargado, Familiar, etc.).
/// </summary>
public class Contacto : Entity<Guid>
{
    public string Nombres { get; private set; } = default!;
    public string Apellidos { get; private set; } = default!;
    public string? Cargo { get; private set; }

    public Guid? CuentaId { get; private set; }
    public Cliente? Cuenta { get; private set; }

    public string? Email { get; private set; }
    public string TelefonoMovil { get; private set; } = default!;
    public string? TelefonoTrabajo { get; private set; }

    public string? Direccion { get; private set; }
    public string? UbigeoCodigo { get; private set; }
    public Ubigeo? Ubigeo { get; private set; }

    public bool Activo { get; private set; } = true;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    public string NombreCompleto => $"{Nombres} {Apellidos}".Trim();

    private Contacto() { }

    public static Contacto Crear(
        string nombres,
        string apellidos,
        string telefonoMovil,
        string? cargo = null,
        Guid? cuentaId = null,
        string? email = null,
        string? telefonoTrabajo = null,
        string? direccion = null,
        string? ubigeoCodigo = null)
    {
        if (string.IsNullOrWhiteSpace(nombres))
            throw new ArgumentException("Los nombres del contacto son obligatorios.", nameof(nombres));

        if (string.IsNullOrWhiteSpace(apellidos))
            throw new ArgumentException("Los apellidos del contacto son obligatorios.", nameof(apellidos));

        if (string.IsNullOrWhiteSpace(telefonoMovil))
            throw new ArgumentException("El teléfono móvil del contacto es obligatorio.", nameof(telefonoMovil));

        return new Contacto
        {
            Id = Guid.NewGuid(),
            Nombres = nombres.Trim(),
            Apellidos = apellidos.Trim(),
            Cargo = string.IsNullOrWhiteSpace(cargo) ? null : cargo.Trim(),
            CuentaId = cuentaId,
            Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant(),
            TelefonoMovil = telefonoMovil.Trim(),
            TelefonoTrabajo = string.IsNullOrWhiteSpace(telefonoTrabajo) ? null : telefonoTrabajo.Trim(),
            Direccion = string.IsNullOrWhiteSpace(direccion) ? null : direccion.Trim(),
            UbigeoCodigo = string.IsNullOrWhiteSpace(ubigeoCodigo) ? null : ubigeoCodigo.Trim(),
            Activo = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Actualizar(
        string nombres,
        string apellidos,
        string telefonoMovil,
        string? cargo = null,
        Guid? cuentaId = null,
        string? email = null,
        string? telefonoTrabajo = null,
        string? direccion = null,
        string? ubigeoCodigo = null)
    {
        if (string.IsNullOrWhiteSpace(nombres))
            throw new ArgumentException("Los nombres del contacto son obligatorios.", nameof(nombres));

        if (string.IsNullOrWhiteSpace(apellidos))
            throw new ArgumentException("Los apellidos del contacto son obligatorios.", nameof(apellidos));

        if (string.IsNullOrWhiteSpace(telefonoMovil))
            throw new ArgumentException("El teléfono móvil del contacto es obligatorio.", nameof(telefonoMovil));

        Nombres = nombres.Trim();
        Apellidos = apellidos.Trim();
        Cargo = string.IsNullOrWhiteSpace(cargo) ? null : cargo.Trim();
        CuentaId = cuentaId;
        Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant();
        TelefonoMovil = telefonoMovil.Trim();
        TelefonoTrabajo = string.IsNullOrWhiteSpace(telefonoTrabajo) ? null : telefonoTrabajo.Trim();
        Direccion = string.IsNullOrWhiteSpace(direccion) ? null : direccion.Trim();
        UbigeoCodigo = string.IsNullOrWhiteSpace(ubigeoCodigo) ? null : ubigeoCodigo.Trim();
    }

    public void Activar() => Activo = true;
    public void Desactivar() => Activo = false;
}
