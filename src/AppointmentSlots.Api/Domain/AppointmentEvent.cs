namespace AppointmentSlots.Api.Domain;
public sealed class AppointmentEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AppointmentSlotId { get; set; }
    public string EventType { get; set; } = "";
    public string Description { get; set; } = "";
    public DateTimeOffset OccurredAt { get; set; }
}
