using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using BubbaBag.Modules.ServicioCampo.Domain.Tarifarios;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application;

public interface IServicioCampoDbContext
{
    DbSet<OrdenTrabajo> OrdenesTrabajo { get; }
    DbSet<OrdenTrabajoVisita> OrdenTrabajoVisitas { get; }
    DbSet<OrdenTrabajoVisitaEvidencia> OrdenTrabajoVisitaEvidencias { get; }
    DbSet<OrdenTrabajoTarea> OrdenTrabajoTareas { get; }
    DbSet<MotivoIncidencia> MotivosIncidencia { get; }
    DbSet<TipoOrdenTrabajo> TiposOrdenTrabajo { get; }
    DbSet<TipoTareaServicio> TiposTareaServicio { get; }
    DbSet<OrigenOrden> OrigenesOrden { get; }
    DbSet<Tarifario> Tarifarios { get; }
    DbSet<TarifarioRegla> TarifarioReglas { get; }
    DbSet<TarifarioReglaCriterio> TarifarioReglaCriterios { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
