using System.ComponentModel.DataAnnotations;
using AppointmentSlots.Api.Domain;
namespace AppointmentSlots.Api.Contracts;

public sealed record CreateSlotRequest(
    [property: Required, StringLength(70, MinimumLength = 3)] string ServiceType,
    [property: Required, StringLength(70, MinimumLength = 2)] string ProviderName,
    [property: Required, StringLength(100, MinimumLength = 3)] string ClinicName,
    DateTimeOffset StartsAt, DateTimeOffset EndsAt);

public sealed record BookSlotRequest(
    [property: Required, StringLength(70, MinimumLength = 2)] string PatientName,
    [property: Required, EmailAddress, StringLength(120)] string Email);

public sealed record CancelBookingRequest(
    [property: Required, EmailAddress] string Email,
    [property: Required, StringLength(16, MinimumLength = 6)] string ConfirmationCode);

public sealed record SlotSummaryResponse(Guid Id, string ServiceType, string ProviderName,
    string ClinicName, DateTimeOffset StartsAt, DateTimeOffset EndsAt, SlotState State, int Revision);

public sealed record SlotDetailResponse(Guid Id, string ServiceType, string ProviderName,
    string ClinicName, DateTimeOffset StartsAt, DateTimeOffset EndsAt, SlotState State,
    int Revision, IReadOnlyList<AppointmentEventResponse> Events);

public sealed record AppointmentEventResponse(Guid Id, string EventType, string Description, DateTimeOffset OccurredAt);

public sealed record BookingReceipt(Guid Id, string ConfirmationCode, string PatientName,
    string ServiceType, string ClinicName, DateTimeOffset StartsAt, string Message);
