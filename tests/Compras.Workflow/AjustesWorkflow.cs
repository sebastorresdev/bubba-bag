using ProgrammingCar.Modules.ServicioCampo.Application.Almacenes.Ajustes;
using ProgrammingCar.Modules.ServicioCampo.Domain.Almacenes;
using ProgrammingCar.Modules.ServicioCampo.Domain.Productos;
using ProgrammingCar.Modules.ServicioCampo.Domain.Organizacion;
using ProgrammingCar.Modules.ServicioCampo.Infrastructure.Database;
using ProgrammingCar.SharedKernel;
using Microsoft.EntityFrameworkCore;

internal static class AjustesWorkflow
{
    public static async Task RunAsync()
    {
        await using var db = new TestContext(new DbContextOptionsBuilder<ServicioCampoDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var sede = UnidadOrganizativa.Crear("AJUSTES", "Sede de pruebas");
        var almacen = Almacen.CrearBodega("AJUSTES", "Almacén de pruebas", sede.Id);
        var ubicacion = UbicacionInventario.Crear(almacen.Id, "PRINCIPAL", "Principal", true);
        var (grupo, unidad) = GrupoUnidadMedida.Crear("Unidades", "Unidad");
        var producto = Producto.Crear("AJU-PRUEBA", "Producto", grupoUnidadMedidaId: grupo.Id, unidadMedidaDefectoId: unidad.Id);
        db.UnidadesOrganizativas.Add(sede); db.Almacenes.Add(almacen); db.UbicacionesInventario.Add(ubicacion);
        db.GruposUnidadMedida.Add(grupo); db.UnidadesMedida.Add(unidad); db.Productos.Add(producto);
        await db.SaveChangesAsync();
        var usuario = new UsuarioPrueba(Guid.NewGuid(), "ana@example.test");
        db.UsuarioAlmacenAutorizaciones.Add(UsuarioAlmacenAutorizacion.Crear(usuario.Id, almacen.Id, esSupervisor: true)); await db.SaveChangesAsync();
        var handler = new AjustesHandlers(db, usuario);
        var datos = new GuardarAjusteInput("Entrada", almacen.Id, ubicacion.Id, "2026-10-14", "Regularización", null,
            "Estado local anterior: Aplicado; requiere revisión.",
            [new(producto.Id, null, null, null, false, "Entrada", 3, 5, [], null)]);
        var recuperacionId = Guid.NewGuid();
        var crear = new CrearAjusteCommand(datos, recuperacionId);
        var recuperado = await handler.HandleAsync(crear);
        Check(recuperado.IsSuccess && recuperado.Value.Id == recuperacionId, "La recuperación usa el identificador persistido por el navegador");
        var ajuste = await db.AjustesInventario.SingleAsync();
        Check(ajuste.Estado == "Borrador" && ajuste.UsuarioId == usuario.Id && ajuste.UsuarioRegistro == usuario.Email,
            "El estado local no aplica stock ni suplanta al registrador autenticado");
        Check(!await db.StocksAlmacen.AnyAsync() && !await db.MovimientosInventario.AnyAsync(), "Recuperar no modifica existencias ni Kardex");
        var reintento = await handler.HandleAsync(crear);
        Check(reintento.IsSuccess && reintento.Value == recuperado.Value && await db.AjustesInventario.CountAsync() == 1,
            "Respuesta perdida: reintentar la recuperación devuelve el mismo borrador");
        var otroUsuario = new UsuarioPrueba(Guid.NewGuid(), "otro@example.test");
        db.UsuarioAlmacenAutorizaciones.Add(UsuarioAlmacenAutorizacion.Crear(otroUsuario.Id, almacen.Id, esSupervisor: true)); await db.SaveChangesAsync();
        var otro = new AjustesHandlers(db, otroUsuario);
        Check((await otro.HandleAsync(crear)).IsFailure && await db.AjustesInventario.CountAsync() == 1,
            "Otro usuario no reutiliza la recuperación ajena");
        Check((await handler.HandleAsync(new CrearAjusteCommand(datos, Guid.Empty))).IsFailure, "Identificador vacío no crea un borrador");
        Check((await handler.HandleAsync(new CrearAjusteCommand(datos with {Lineas=[]}, Guid.NewGuid()))).IsFailure
            && await db.AjustesInventario.CountAsync() == 1, "Registro inválido no crea documentos");

        var sinSesion = new AjustesHandlers(db, new UsuarioPrueba(Guid.Empty, "", false));
        Check((await sinSesion.HandleAsync(new AplicarAjusteCommand(ajuste.Id))).IsFailure && ajuste.Estado == "Borrador"
            && !await db.StocksAlmacen.AnyAsync(), "Una identidad no autenticada no aplica ni modifica stock");
        Check((await handler.HandleAsync(new AplicarAjusteCommand(ajuste.Id))).IsSuccess, "Aplicación válida con identidad del servidor");
        Check(ajuste.UsuarioAprobacion == usuario.Email && ajuste.FechaAprobacion.HasValue && ajuste.Estado == "Aplicado",
            "La aprobación registra a Ana, sin parámetro de nombre enviado por el cliente");
        Check(await db.StocksAlmacen.SumAsync(s => s.CantidadDisponible) == 3
            && (await db.MovimientosInventario.SingleAsync()).UsuarioResponsableId == usuario.Id,
            "Aprobación y Kardex corresponden a la misma identidad autenticada");
        Check((await handler.HandleAsync(new AplicarAjusteCommand(ajuste.Id))).IsFailure
            && await db.StocksAlmacen.SumAsync(s => s.CantidadDisponible) == 3 && await db.MovimientosInventario.CountAsync() == 1,
            "Aplicación repetida no vuelve a aumentar el stock");

        var sinCorreo = new UsuarioPrueba(Guid.NewGuid(), "");
        db.UsuarioAlmacenAutorizaciones.Add(UsuarioAlmacenAutorizacion.Crear(sinCorreo.Id, almacen.Id, esSupervisor: true)); await db.SaveChangesAsync();
        var handlerSinCorreo = new AjustesHandlers(db, sinCorreo);
        var segundo = await handlerSinCorreo.HandleAsync(new CrearAjusteCommand(datos));
        Check(segundo.IsSuccess && (await handlerSinCorreo.HandleAsync(new AplicarAjusteCommand(segundo.Value.Id))).IsSuccess,
            "Usuario autenticado sin correo puede aplicar el ajuste");
        Check((await db.AjustesInventario.SingleAsync(a => a.Id == segundo.Value.Id)).UsuarioAprobacion == sinCorreo.Id.ToString(),
            "Sin correo se registra el ID autenticado y nunca un Supervisor genérico");
        Console.WriteLine("Ajustes: 14 comprobaciones de recuperación, identidad, estados y existencias correctas (InMemory).");
    }

    private static void Check(bool condition, string message) { if (!condition) throw new Exception(message); }
    private sealed record UsuarioPrueba(Guid Id, string Email, bool IsAuthenticated = true) : ICurrentUser
    {
        public string Nombre => "Usuario de prueba";
        public IReadOnlyList<string> Roles => [];
        public bool IsInRole(string role) => false;
        public bool HasAnyRole(params string[] roles) => false;
        public bool HasPermission(string permission) => IsAuthenticated;
    }
}
