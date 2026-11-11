using System.Threading.RateLimiting;
using System.Text.Json.Serialization;
using AppointmentSlots.Api.Application;
using AppointmentSlots.Api.Infrastructure;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;

var builder = WebApplication.CreateBuilder(args);
var connection = builder.Configuration.GetConnectionString("Appointments")
    ?? throw new InvalidOperationException("The 'Appointments' connection string is not configured.");
var coordinatorUsername = builder.Configuration["Coordinator:Username"] ?? "coordinator";
var coordinatorPassword = builder.Configuration["Coordinator:Password"];
var useSecureCookies = !builder.Environment.IsDevelopment();
if (string.IsNullOrWhiteSpace(coordinatorUsername) || coordinatorUsername.Length > 100)
{
    throw new InvalidOperationException("Coordinator:Username must contain between 1 and 100 characters.");
}

if (string.IsNullOrWhiteSpace(coordinatorPassword) || coordinatorPassword.Length < 16)
{
    throw new InvalidOperationException(
        "Configure Coordinator:Password with a unique value of at least 16 characters.");
}

builder.Services.AddDbContext<AppointmentDbContext>(o => o.UseNpgsql(connection));
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<AppointmentService>();
builder.Services.AddSingleton(new CoordinatorCredentials(coordinatorUsername, coordinatorPassword));
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = useSecureCookies
            ? "__Host-OpenSlot.Coordinator"
            : "OpenSlot.Coordinator";
        options.Cookie.Path = "/";
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = useSecureCookies
            ? CookieSecurePolicy.Always
            : CookieSecurePolicy.SameAsRequest;
        options.Cookie.SameSite = SameSiteMode.Strict;
        options.SlidingExpiration = true;
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.Cookie.Name = useSecureCookies
        ? "__Host-OpenSlot.Antiforgery"
        : "OpenSlot.Antiforgery";
    options.Cookie.Path = "/";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = useSecureCookies
        ? CookieSecurePolicy.Always
        : CookieSecurePolicy.SameAsRequest;
    options.Cookie.SameSite = SameSiteMode.Strict;
});
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("coordinator-login", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(5),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddHealthChecks().AddDbContextCheck<AppointmentDbContext>(name: "database");
var app = builder.Build();
app.UseMiddleware<ApiExceptionMiddleware>();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<AntiforgeryValidationMiddleware>();
app.MapControllers();
app.MapHealthChecks("/api/health");
app.MapFallbackToFile("index.html");
await using (var scope = app.Services.CreateAsyncScope())
    await DatabaseInitializer.InitializeAsync(scope.ServiceProvider.GetRequiredService<AppointmentDbContext>());
app.Run();
public partial class Program { }
