namespace AppointmentSlots.Api.Domain;
public sealed class AppointmentSlot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ServiceType { get; set; } = "";
    public string ProviderName { get; set; } = "";
    public string ClinicName { get; set; } = "";
    public DateTimeOffset StartsAt { get; set; }
    public DateTimeOffset EndsAt { get; set; }
    public SlotState State { get; set; } = SlotState.Available;
    public int Revision { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public AppointmentBooking? Booking { get; set; }
    public List<AppointmentEvent> Events { get; set; } = [];
}
