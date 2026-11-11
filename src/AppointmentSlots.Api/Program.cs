using System.Text.Json.Serialization;
using AppointmentSlots.Api.Application;
using AppointmentSlots.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;
var builder = WebApplication.CreateBuilder(args);
var connection = builder.Configuration.GetConnectionString("Appointments")
    ?? "Host=localhost;Port=5432;Database=appointments;Username=appointments;Password=replace-with-a-unique-strong-password";
builder.Services.AddDbContext<AppointmentDbContext>(o => o.UseNpgsql(connection));
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<AppointmentService>();
builder.Services.AddControllers().AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddHealthChecks().AddDbContextCheck<AppointmentDbContext>(name: "database");
var app = builder.Build();
app.UseMiddleware<ApiExceptionMiddleware>();
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapControllers();
app.MapHealthChecks("/api/health");
app.MapFallbackToFile("index.html");
await using (var scope = app.Services.CreateAsyncScope())
    await DatabaseInitializer.InitializeAsync(scope.ServiceProvider.GetRequiredService<AppointmentDbContext>());
app.Run();
public partial class Program { }
