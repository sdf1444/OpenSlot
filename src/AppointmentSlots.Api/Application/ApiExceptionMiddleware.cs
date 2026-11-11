using System.Text.Json;
namespace AppointmentSlots.Api.Application;

public sealed class ApiExceptionMiddleware(RequestDelegate next, ILogger<ApiExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try { await next(context); }
        catch (Exception exception)
        {
            var status = exception is ApiException api ? api.StatusCode : 500;
            if (status == 500) logger.LogError(exception, "Unhandled request failure");
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                type = "about:blank",
                title = status == 500 ? "An unexpected server error occurred." : exception.Message,
                status,
                traceId = context.TraceIdentifier
            }));
        }
    }
}
