using AppointmentSlots.Api.Domain;
using Microsoft.EntityFrameworkCore;
namespace AppointmentSlots.Api.Infrastructure;

public static class DatabaseInitializer
{
    public static async Task InitializeAsync(AppointmentDbContext db, CancellationToken ct = default)
    {
        await db.Database.EnsureCreatedAsync(ct);
        if (await db.Slots.AnyAsync(ct)) return;
        var now = DateTimeOffset.UtcNow;
        db.Slots.AddRange(
            Seed("General consultation", "Dr Rowan", "Riverside Community Clinic", now.UtcDateTime.Date.AddDays(3).AddHours(9), 30),
            Seed("Physiotherapy assessment", "Alex Morgan", "Riverside Community Clinic", now.UtcDateTime.Date.AddDays(3).AddHours(10), 45),
            Seed("Wellbeing review", "Dr Rowan", "Riverside Community Clinic", now.UtcDateTime.Date.AddDays(4).AddHours(14), 30));
        await db.SaveChangesAsync(ct);
    }
    private static AppointmentSlot Seed(string service, string provider, string clinic, DateTimeOffset startsAt, int minutes)
    {
        var now = DateTimeOffset.UtcNow;
        var slot = new AppointmentSlot
        {
            ServiceType = service,
            ProviderName = provider,
            ClinicName = clinic,
            StartsAt = startsAt,
            EndsAt = startsAt.AddMinutes(minutes),
            State = SlotState.Available,
            Revision = 1,
            CreatedAt = now,
            UpdatedAt = now
        };
        slot.Events.Add(new AppointmentEvent { EventType = "SlotPublished", Description = "Appointment slot published", OccurredAt = now });
        return slot;
    }
}
