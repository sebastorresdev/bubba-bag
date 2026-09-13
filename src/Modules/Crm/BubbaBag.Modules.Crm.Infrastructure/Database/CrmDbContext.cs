using System.Reflection;
using BubbaBag.Modules.Crm.Application;
using BubbaBag.Modules.Crm.Domain.Clientes;
using BubbaBag.Modules.Crm.Domain.Ubigeos;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Crm.Infrastructure.Database;

public class CrmDbContext : DbContext, ICrmDbContext
{
    public CrmDbContext(DbContextOptions<CrmDbContext> options) : base(options)
    {
    }

    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Ubigeo> Ubigeos => Set<Ubigeo>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("crm");
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }
}
