using Microsoft.EntityFrameworkCore;
using PrimeGorilaAPI.Models;

var builder = WebApplication.CreateBuilder(args);

// =====================================
// BANCO DE DADOS
// =====================================
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// =====================================
// CORS
// =====================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirTudo", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddControllers();

var app = builder.Build();

// =====================================
// MIDDLEWARES
// =====================================
app.UseCors("PermitirTudo");
// app.UseHttpsRedirection();

app.MapControllers();
app.Run();
