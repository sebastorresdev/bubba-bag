using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.Crm.Domain.Clientes;
using BubbaBag.Modules.Crm.Domain.Ubigeos;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Crm.Application;

public interface ICrmDbContext
{
    DbSet<Cliente> Clientes { get; }
    DbSet<Ubigeo> Ubigeos { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
