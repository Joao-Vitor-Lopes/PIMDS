using Microsoft.EntityFrameworkCore;
using PrimeGorilaAPI.Models;

var builder = WebApplication.CreateBuilder(args);

// ====================================
// 🔹 LER CONFIGURAÇÕES EXTERNAS (secret.json) para poder ler a openAI mais segura
// ====================================
builder.Configuration
    .AddJsonFile("secret.json", optional: true, reloadOnChange: true);

// ====================================
// 🔹 CONFIGURAÇÃO DO BANCO DE DADOS
// ====================================
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ====================================
// 🔹 CONFIGURAÇÃO DE CORS
// ====================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirTudo", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ====================================
// 🔹 CONFIGURAÇÃO DE CONTROLLERS
// ====================================
builder.Services.AddControllers();

// ====================================
// 🔹 CONSTRUIR A APLICAÇÃO
// ====================================
var app = builder.Build();

// ====================================
// 🔹 MIDDLEWARES
// ====================================
app.UseCors("PermitirTudo");
// app.UseHttpsRedirection(); // desativado para evitar erro de porta

app.MapControllers();

// ====================================
// 🔹 INICIAR SERVIDOR
// ====================================
app.Run();
