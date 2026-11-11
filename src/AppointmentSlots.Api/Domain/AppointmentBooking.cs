namespace AppointmentSlots.Api.Domain;

public sealed class AppointmentBooking
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AppointmentSlotId { get; set; }
    public AppointmentSlot Slot { get; set; } = null!;
    public string PatientName { get; set; } = "";
    public string Email { get; set; } = "";
    public string ConfirmationCode { get; set; } = "";
    public BookingState State { get; set; } = BookingState.Confirmed;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
