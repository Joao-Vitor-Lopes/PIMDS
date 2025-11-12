using Microsoft.AspNetCore.Mvc;
using PrimeGorilaAPI.Models;
using System.Linq;
using Microsoft.Extensions.Logging;

namespace PrimeGorilaAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AuthController> _logger;

        public AuthController(ApplicationDbContext context, ILogger<AuthController> logger)
        {
            _context = context;
            _logger = logger;
        }

        public class LoginDto
        {
            public string? email { get; set; }
            public string? senha { get; set; }
        }

        // ====== LOGIN ======
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto dados)
        {
            if (dados == null)
            {
                _logger.LogWarning("Requisição de login com body nulo");
                return BadRequest("Dados de login ausentes.");
            }

            var email = (dados.email ?? string.Empty).Trim().ToLowerInvariant();
            var senha = (dados.senha ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(senha))
            {
                return BadRequest("Campos obrigatórios faltando.");
            }

            _logger.LogInformation("Tentativa de login: {Email}", email);

            var user = _context.Usuario
                .AsEnumerable() // força execução em memória para evitar erro de tradução LINQ
                .FirstOrDefault(u =>
                    !string.IsNullOrEmpty(u.email) &&
                    u.email.Trim().ToLowerInvariant() == email &&
                    (u.senha ?? string.Empty).Trim() == senha
                );

            if (user == null)
            {
                _logger.LogWarning("Login falhou para: {Email}", email);
                return Unauthorized("Usuário ou senha inválidos.");
            }

            return Ok(new
            {
                user.id_usuario,
                user.nome,
                user.tipo_usuario
            });
        }

        // ====== CADASTRAR NOVO USUÁRIO ======
        [HttpPost("register")]
        public IActionResult Register([FromBody] Usuario novoUsuario)
        {
            if (novoUsuario == null)
                return BadRequest("Dados do usuário ausentes.");

            var email = (novoUsuario.email ?? string.Empty).Trim().ToLowerInvariant();
            var senha = (novoUsuario.senha ?? string.Empty).Trim();
            novoUsuario.email = email;
            novoUsuario.senha = senha;

            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(senha))
                return BadRequest("Campos obrigatórios faltando.");

            if (_context.Usuario
                .AsEnumerable() // evita erro de tradução LINQ no Any()
                .Any(u =>
                    !string.IsNullOrEmpty(u.email) &&
                    u.email.Trim().ToLowerInvariant() == email))
            {
                return Conflict("E-mail já cadastrado.");
            }

            _context.Usuario.Add(novoUsuario);
            _context.SaveChanges();

            return Ok(new { message = "Usuário cadastrado com sucesso!" });
        }
    }
}
