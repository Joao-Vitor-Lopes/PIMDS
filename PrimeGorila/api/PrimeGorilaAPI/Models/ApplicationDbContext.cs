using Microsoft.EntityFrameworkCore;

namespace PrimeGorilaAPI.Models
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<Usuario> Usuario { get; set; }
        public DbSet<Chamado> Chamado { get; set; }
    }
}
