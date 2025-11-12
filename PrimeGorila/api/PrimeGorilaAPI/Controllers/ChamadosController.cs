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

        // 🔹 Obter chamados de um usuário específico
        [HttpGet("{usuarioId}")]
        public IActionResult GetChamados(int usuarioId)
        {
            var chamados = _context.Chamado
                .Where(c => c.usuario_id == usuarioId)
                .OrderByDescending(c => c.data_abertura)
                .ToList();

            return Ok(chamados);
        }

        // 🔹 Obter todos os chamados (para técnicos)
        [HttpGet("todos")]
        public IActionResult GetTodos()
        {
            var chamados = _context.Chamado
                .OrderByDescending(c => c.data_abertura)
                .ToList();

            return Ok(chamados);
        }

        // 🔹 Criar novo chamado
        [HttpPost]
        public IActionResult Criar([FromBody] Chamado chamado)
        {
            if (chamado == null)
                return BadRequest("Chamado inválido.");

            if (string.IsNullOrWhiteSpace(chamado.titulo) || string.IsNullOrWhiteSpace(chamado.descricao))
                return BadRequest("Título e descrição são obrigatórios.");

            chamado.data_abertura = DateTime.Now;
            chamado.status = "Aberto";

            _context.Chamado.Add(chamado);
            _context.SaveChanges();

            return Ok(new { message = "Chamado criado com sucesso!" });
        }

        // 🔹 Resolver chamado
        [HttpPut("{id}")]
        public IActionResult ResolverChamado(int id)
        {
            var chamado = _context.Chamado.FirstOrDefault(c => c.id_chamado == id);
            if (chamado == null)
                return NotFound("Chamado não encontrado.");

            chamado.status = "Resolvido";
            _context.SaveChanges();

            return Ok(new { message = "Chamado resolvido com sucesso!" });
        }
    }
}
