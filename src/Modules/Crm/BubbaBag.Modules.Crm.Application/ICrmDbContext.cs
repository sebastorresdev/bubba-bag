using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.Crm.Domain.Clientes;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Crm.Application;

public interface ICrmDbContext
{
    DbSet<Cliente> Clientes { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
