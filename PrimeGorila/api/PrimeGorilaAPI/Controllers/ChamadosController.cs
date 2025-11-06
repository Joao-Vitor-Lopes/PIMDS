using Microsoft.AspNetCore.Mvc;
using PrimeGorilaAPI.Models;
using System.Linq;

namespace PrimeGorilaAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChamadosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChamadosController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("{usuarioId}")]
        public IActionResult GetChamados(int usuarioId)
        {
            var chamados = _context.Chamado
                .Where(c => c.usuario_id == usuarioId)
                .ToList();

            return Ok(chamados);
        }

        [HttpPost]
        public IActionResult Criar([FromBody] Chamado chamado)
        {
            chamado.data_abertura = DateTime.Now;
            chamado.status = "Aberto";
            _context.Chamado.Add(chamado);
            _context.SaveChanges();
            return Ok(chamado);
        }
    }
}
