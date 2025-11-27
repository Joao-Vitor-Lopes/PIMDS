using Microsoft.AspNetCore.Mvc;
using PrimeGorilaAPI.Services;
using System.Text.Json;

namespace PrimeGorilaAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IAController : ControllerBase
    {
        private readonly IAService _ia;

        public IAController(IAService ia)
        {
            _ia = ia;
        }

        [HttpPost("sugerir")]
        public async Task<IActionResult> Sugerir([FromBody] JsonElement body)
        {
            if (!body.TryGetProperty("text", out JsonElement textElement))
                return BadRequest(new { erro = "Campo 'text' não encontrado no JSON enviado." });

            string texto = textElement.GetString() ?? "";

            string resposta = await _ia.GerarSugestaoAsync(texto);

            return Ok(new { sugestao = resposta });
        }
    }
}
