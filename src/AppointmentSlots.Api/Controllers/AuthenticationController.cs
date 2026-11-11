using System.Security.Claims;
using AppointmentSlots.Api.Application;
using AppointmentSlots.Api.Contracts;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AppointmentSlots.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthenticationController(
    CoordinatorCredentials credentials,
    IAntiforgery antiforgery) : ControllerBase
{
    [HttpGet("session")]
    public ActionResult<CoordinatorSessionResponse> GetSession(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var tokens = antiforgery.GetAndStoreTokens(HttpContext);
        return Ok(new CoordinatorSessionResponse(
            User.Identity?.IsAuthenticated == true,
            User.Identity?.Name,
            tokens.RequestToken!));
    }

    [AllowAnonymous]
    [EnableRateLimiting("coordinator-login")]
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        CoordinatorLoginRequest request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (!credentials.IsValid(request.Username, request.Password))
        {
            return Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Invalid username or password."
            });
        }

        var identity = new ClaimsIdentity(
            [new Claim(ClaimTypes.Name, credentials.Username)],
            CookieAuthenticationDefaults.AuthenticationScheme);
        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity),
            new AuthenticationProperties { IsPersistent = false });

        return NoContent();
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }
}
