using Microsoft.EntityFrameworkCore;
using PrimeGorilaAPI.Models;
using PrimeGorilaAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// =====================
// 🔹 CONFIG BANCO
// =====================
builder.Services.AddDbContext<ApplicationDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// =====================
// 🔹 CORS
// =====================
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("PermitirTudo", p =>
        p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()
    );
});

// =====================
// 🔹 Swagger
// =====================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// =====================
// 🔹 Controllers
// =====================
builder.Services.AddControllers();

// =====================
// 🔹 IA Service
// =====================
builder.Services.AddHttpClient<IAService>();
builder.Services.AddScoped<IAService>();
builder.Services.AddHttpClient();


// =====================
// 🔹 Build
// =====================
var app = builder.Build();

// =====================
// 🔹 Middlewares
// =====================
app.UseCors("PermitirTudo");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

app.Run();
