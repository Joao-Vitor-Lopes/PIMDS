using Microsoft.AspNetCore.Mvc;
using PrimeGorilaAPI.Models;
using System.Linq;

namespace PrimeGorilaAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AuthController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ====== LOGIN ======
        [HttpPost("login")]
        public IActionResult Login([FromBody] Usuario login)
        {
            var user = _context.Usuario.FirstOrDefault(u => u.email == login.email && u.senha == login.senha);
            if (user == null) return Unauthorized("Usuário ou senha inválidos");

            return Ok(new { user.id_usuario, user.nome, user.tipo_usuario });
        }

        // ====== CADASTRAR NOVO USUÁRIO ======
        [HttpPost("register")]
        public IActionResult Register([FromBody] Usuario novoUsuario)
        {
            if (_context.Usuario.Any(u => u.email == novoUsuario.email))
                return Conflict("E-mail já cadastrado.");

            // tipo_usuario já tem DEFAULT 'normal' no banco, então não precisa setar aqui
            _context.Usuario.Add(novoUsuario);
            _context.SaveChanges();

            return Ok(new { message = "Usuário cadastrado com sucesso!" });
        }
    }
}
