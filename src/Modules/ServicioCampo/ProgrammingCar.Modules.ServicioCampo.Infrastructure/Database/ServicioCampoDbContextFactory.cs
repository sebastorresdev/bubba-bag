using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ProgrammingCar.Modules.ServicioCampo.Infrastructure.Database;

public sealed class ServicioCampoDbContextFactory : IDesignTimeDbContextFactory<ServicioCampoDbContext>
{
    public ServicioCampoDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ServicioCampoDbContext>();
        optionsBuilder.UseNpgsql("Host=localhost;Database=bubbabag;Username=postgres;Password=postgres");
        return new ServicioCampoDbContext(optionsBuilder.Options);
    }
}
