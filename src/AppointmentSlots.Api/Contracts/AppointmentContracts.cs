using System.ComponentModel.DataAnnotations;
using AppointmentSlots.Api.Domain;
namespace AppointmentSlots.Api.Contracts;

public sealed record CreateSlotRequest(
    [param: Required, StringLength(70, MinimumLength = 3)] string ServiceType,
    [param: Required, StringLength(70, MinimumLength = 2)] string ProviderName,
    [param: Required, StringLength(100, MinimumLength = 3)] string ClinicName,
    DateTimeOffset StartsAt, DateTimeOffset EndsAt);

public sealed record BookSlotRequest(
    [param: Required, StringLength(70, MinimumLength = 2)] string PatientName,
    [param: Required, EmailAddress, StringLength(120)] string Email);

public sealed record CancelBookingRequest(
    [param: Required, EmailAddress] string Email,
    [param: Required, StringLength(16, MinimumLength = 6)] string ConfirmationCode);

public sealed record SlotSummaryResponse(Guid Id, string ServiceType, string ProviderName,
    string ClinicName, DateTimeOffset StartsAt, DateTimeOffset EndsAt, SlotState State, int Revision);

public sealed record SlotDetailResponse(Guid Id, string ServiceType, string ProviderName,
    string ClinicName, DateTimeOffset StartsAt, DateTimeOffset EndsAt, SlotState State,
    int Revision, IReadOnlyList<AppointmentEventResponse> Events);

public sealed record AppointmentEventResponse(Guid Id, string EventType, string Description, DateTimeOffset OccurredAt);

public sealed record BookingReceipt(Guid Id, string ConfirmationCode, string PatientName,
    string ServiceType, string ClinicName, DateTimeOffset StartsAt, string Message);
