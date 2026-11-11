using System.ComponentModel.DataAnnotations;

namespace AppointmentSlots.Api.Contracts;

/// <summary>Credentials submitted to start a coordinator session.</summary>
public sealed record CoordinatorLoginRequest
{
    /// <summary>The coordinator username.</summary>
    [Required, StringLength(100)]
    public required string Username { get; init; }

    /// <summary>The coordinator password.</summary>
    [Required, StringLength(200)]
    public required string Password { get; init; }
}

/// <summary>Current authentication state and the request-verification token.</summary>
/// <param name="IsAuthenticated">Whether the current request has a coordinator session.</param>
/// <param name="Username">The signed-in coordinator username, if authenticated.</param>
/// <param name="RequestToken">The token to include in the X-CSRF-TOKEN header on write requests.</param>
public sealed record CoordinatorSessionResponse(
    bool IsAuthenticated,
    string? Username,
    string RequestToken);
