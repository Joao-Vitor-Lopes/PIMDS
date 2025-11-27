using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace PrimeGorilaAPI.Services
{
    public class IAService
    {
        private readonly string _apiKey;
        private readonly HttpClient _http;

        public IAService(IConfiguration config, HttpClient http)
        {
            // Lê da configuração (appsettings.*) ou de variável de ambiente
            _apiKey = config["Groq:ApiKey"] 
                      ?? Environment.GetEnvironmentVariable("GROQ_API_KEY")
                      ?? throw new InvalidOperationException("Chave Groq não encontrada. Defina Groq:ApiKey ou a variável de ambiente GROQ_API_KEY.");

            _http = http;
            _http.BaseAddress = new Uri("https://api.groq.com/openai/v1/");
        }

        public async Task<string> GerarSugestaoAsync(string texto)
        {
            var requestBody = new
            {
                model = "llama-3.1-8b-instant",
                messages = new[]
                {
                    new { role = "system", content = "Você é um assistente técnico que sugere soluções curtas para chamados." },
                    new { role = "user", content = texto }
                },
                max_tokens = 100
            };

            var json = JsonSerializer.Serialize(requestBody);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");

            _http.DefaultRequestHeaders.Clear();
            _http.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");

            var response = await _http.PostAsync("chat/completions", content);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadAsStringAsync();

            using var doc = JsonDocument.Parse(result);

            // Tenta pegar o texto de resposta de forma segura
            if (doc.RootElement.TryGetProperty("choices", out var choices) &&
                choices.GetArrayLength() > 0 &&
                choices[0].TryGetProperty("message", out var message) &&
                message.TryGetProperty("content", out var contentEl))
            {
                return contentEl.GetString() ?? string.Empty;
            }

            return string.Empty;
        }
    }
}
