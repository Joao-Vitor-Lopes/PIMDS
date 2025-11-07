using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace PrimeGorilaAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IAController : ControllerBase
    {
        private readonly IConfiguration _cfg;
        private readonly HttpClient _http;

        public IAController(IConfiguration cfg)
        {
            _cfg = cfg;
            _http = new HttpClient();
        }

        public class SuggestRequest { public string Text { get; set; } }

        [HttpPost("suggest")]
        public async Task<IActionResult> Suggest([FromBody] SuggestRequest req)
        {
            var text = req?.Text ?? "";
            if (string.IsNullOrWhiteSpace(text))
                return Ok(new { suggestion = "Descreva o problema para receber sugestões automáticas." });

            var provider = _cfg["IA:Provider"] ?? "none";

            if (provider == "openai")
            {
                var apiKey = _cfg["IA:OpenAIKey"] ?? Environment.GetEnvironmentVariable("IA__OpenAIKey");
                if (string.IsNullOrWhiteSpace(apiKey))
                    return BadRequest(new { error = "OpenAI key não configurada" });

                try
                {
                    _http.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

                    var payload = new
                    {
                        model = "gpt-4o-mini",
                        input = $"Você é um assistente técnico. Dada a descrição abaixo, forneça uma sugestão prática e curta:\n\n\"{text}\"",
                        max_output_tokens = 120
                    };

                    var response = await _http.PostAsync(
                        "https://api.openai.com/v1/responses",
                        new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json")
                    );

                    if (!response.IsSuccessStatusCode)
                    {
                        var err = await response.Content.ReadAsStringAsync();
                        Console.WriteLine($"[OpenAI Error] {err}");
                        return Ok(new { suggestion = SuggestByKeywords(text) });
                    }

                    var body = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(body);

                    // Extrai texto do campo de resposta (ajuste se o formato mudar)
                    if (doc.RootElement.TryGetProperty("output", out var output) && output.GetArrayLength() > 0)
                    {
                        var content = output[0].GetProperty("content");
                        if (content.GetArrayLength() > 0 && content[0].TryGetProperty("text", out var txt))
                        {
                            var suggestion = txt.GetString();
                            return Ok(new { suggestion });
                        }
                    }

                    // fallback
                    return Ok(new { suggestion = SuggestByKeywords(text) });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[IAController] Erro: {ex.Message}");
                    return Ok(new { suggestion = SuggestByKeywords(text) });
                }
            }

            // fallback local
            return Ok(new { suggestion = SuggestByKeywords(text) });
        }

        private string SuggestByKeywords(string text)
        {
            var t = (text ?? "").ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(t)) return "Descreva o problema para receber sugestões automáticas.";
            if (t.Contains("senha")) return "Sugestão: Verifique 'Esqueci minha senha' ou solicite redefinição.";
            if (t.Contains("wifi") || t.Contains("wi-fi")) return "Sugestão: Reinicie o roteador e verifique a conexão.";
            if (t.Contains("catraca")) return "Sugestão: Checar sensor e reiniciar o controlador da catraca.";
            return "Sugestão: Chamado encaminhado ao time técnico para análise.";
        }
    }
}
