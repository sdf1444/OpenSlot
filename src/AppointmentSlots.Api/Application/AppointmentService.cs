using System.Data;
using System.Security.Cryptography;
using AppointmentSlots.Api.Contracts;
using AppointmentSlots.Api.Domain;
using AppointmentSlots.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Npgsql;
namespace AppointmentSlots.Api.Application;

public sealed class AppointmentService(AppointmentDbContext db, TimeProvider clock)
{
    public async Task<IReadOnlyList<SlotSummaryResponse>> ListAsync(string? search, DateTimeOffset? date, CancellationToken ct)
    {
        var query = db.Slots.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(x => x.ServiceType.ToLower().Contains(term) || x.ProviderName.ToLower().Contains(term) || x.ClinicName.ToLower().Contains(term));
        }
        if (date is not null)
        {
            var dayStart = new DateTimeOffset(date.Value.UtcDateTime.Date, TimeSpan.Zero);
            var nextDay = dayStart.AddDays(1);
            query = query.Where(x => x.StartsAt >= dayStart && x.StartsAt < nextDay);
        }
        return await query.OrderBy(x => x.StartsAt).Take(100)
            .Select(x => new SlotSummaryResponse(x.Id, x.ServiceType, x.ProviderName, x.ClinicName,
                x.StartsAt, x.EndsAt, x.State, x.Revision)).ToListAsync(ct);
    }

    public async Task<SlotDetailResponse> GetAsync(Guid id, CancellationToken ct)
    {
        var slot = await db.Slots.AsNoTracking().Include(x => x.Events).SingleOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new ApiException(404, "Appointment slot was not found.");
        return ToDetail(slot);
    }

    public async Task<SlotDetailResponse> CreateAsync(CreateSlotRequest request, CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        var start = request.StartsAt.ToUniversalTime();
        var end = request.EndsAt.ToUniversalTime();
        if (start <= now) throw new ApiException(400, "An appointment must start in the future.");
        if (end <= start) throw new ApiException(400, "The end time must be later than the start time.");
        var provider = request.ProviderName.Trim();
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        try
        {
            var conflict = await db.Slots.AnyAsync(x => x.ProviderName.ToLower() == provider.ToLower()
                && x.State != SlotState.Cancelled && x.StartsAt < end && x.EndsAt > start, ct);
            if (conflict) throw new ApiException(409, "This provider already has an appointment during that time.");
            var slot = new AppointmentSlot
            {
                ServiceType = request.ServiceType.Trim(), ProviderName = provider, ClinicName = request.ClinicName.Trim(),
                StartsAt = start, EndsAt = end, State = SlotState.Available, CreatedAt = now, UpdatedAt = now, Revision = 1
            };
            slot.Events.Add(new AppointmentEvent { EventType = "SlotPublished", Description = "Appointment slot published", OccurredAt = now });
            db.Slots.Add(slot);
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return ToDetail(slot);
        }
        catch (PostgresException ex) when (ex.SqlState is PostgresErrorCodes.SerializationFailure or PostgresErrorCodes.UniqueViolation)
        { throw new ApiException(409, "This provider's schedule changed while the slot was being published. Refresh and try again."); }
        catch (DbUpdateException)
        { throw new ApiException(409, "This provider already has a slot at that time."); }
    }

    public async Task<BookingReceipt> BookAsync(Guid slotId, BookSlotRequest request, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        try
        {
            var slot = await db.Slots.Include(x => x.Booking).Include(x => x.Events).SingleOrDefaultAsync(x => x.Id == slotId, ct)
                ?? throw new ApiException(404, "Appointment slot was not found.");
            var now = clock.GetUtcNow();
            if (!BookingRules.CanBook(slot.State, slot.StartsAt, now))
                throw new ApiException(409, "This appointment is unavailable or has already started.");
            var email = request.Email.Trim().ToLowerInvariant();
            var code = Convert.ToHexString(RandomNumberGenerator.GetBytes(4));
            var booking = slot.Booking;
            if (booking is null)
            {
                booking = new AppointmentBooking
                {
                    AppointmentSlotId = slot.Id, PatientName = request.PatientName.Trim(), Email = email,
                    ConfirmationCode = code, State = BookingState.Confirmed, CreatedAt = now, UpdatedAt = now
                };
                db.Bookings.Add(booking);
                slot.Booking = booking;
            }
            else
            {
                booking.PatientName = request.PatientName.Trim(); booking.Email = email;
                booking.ConfirmationCode = code; booking.State = BookingState.Confirmed; booking.UpdatedAt = now;
            }
            slot.State = SlotState.Booked; slot.Revision++; slot.UpdatedAt = now;
            var appointmentBooked = new AppointmentEvent
            {
                AppointmentSlotId = slot.Id, EventType = "AppointmentBooked",
                Description = "An appointment was booked", OccurredAt = now
            };
            db.Events.Add(appointmentBooked);
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return new BookingReceipt(booking.Id, code, booking.PatientName, slot.ServiceType, slot.ClinicName,
                slot.StartsAt, "Appointment booked. Keep your code if you need to cancel.");
        }
        catch (PostgresException ex) when (ex.SqlState is PostgresErrorCodes.SerializationFailure or PostgresErrorCodes.UniqueViolation)
        { throw new ApiException(409, "The slot changed while you were booking. Refresh and try again."); }
        catch (DbUpdateConcurrencyException)
        { throw new ApiException(409, "The slot changed while you were booking. Refresh and try again."); }
        catch (DbUpdateException)
        { throw new ApiException(409, "The slot changed while you were booking. Refresh and try again."); }
    }

    public async Task CancelBookingAsync(CancelBookingRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var code = request.ConfirmationCode.Trim().ToUpperInvariant();
        var booking = await db.Bookings.Include(x => x.Slot).ThenInclude(x => x.Events)
            .SingleOrDefaultAsync(x => x.Email == email && x.ConfirmationCode == code, ct)
            ?? throw new ApiException(404, "No appointment matches that email and confirmation code.");
        if (!BookingRules.CanCancel(booking.State, booking.Slot.StartsAt, clock.GetUtcNow()))
            throw new ApiException(409, "This appointment can no longer be cancelled online.");
        var now = clock.GetUtcNow();
        booking.State = BookingState.Cancelled; booking.UpdatedAt = now;
        booking.Slot.State = SlotState.Available; booking.Slot.Revision++; booking.Slot.UpdatedAt = now;
        var appointmentCancelled = new AppointmentEvent
        {
            AppointmentSlotId = booking.Slot.Id, EventType = "AppointmentCancelled",
            Description = "An appointment was cancelled", OccurredAt = now
        };
        db.Events.Add(appointmentCancelled);
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException) { throw new ApiException(409, "The appointment changed while you were cancelling it. Refresh and try again."); }
    }

    public async Task<SlotDetailResponse> CancelSlotAsync(Guid id, int expectedRevision, CancellationToken ct)
    {
        var slot = await db.Slots.Include(x => x.Booking).Include(x => x.Events).SingleOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new ApiException(404, "Appointment slot was not found.");
        if (slot.Revision != expectedRevision) throw new ApiException(409, "The slot changed. Refresh and try again.");
        if (slot.State != SlotState.Available) throw new ApiException(409, "Only an unbooked slot can be removed.");
        slot.State = SlotState.Cancelled; slot.Revision++; slot.UpdatedAt = clock.GetUtcNow();
        var slotCancelled = new AppointmentEvent
        {
            AppointmentSlotId = slot.Id, EventType = "SlotCancelled",
            Description = "Appointment slot removed", OccurredAt = slot.UpdatedAt
        };
        db.Events.Add(slotCancelled);
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException) { throw new ApiException(409, "The slot changed concurrently. Refresh and try again."); }
        return ToDetail(slot);
    }

    private static SlotDetailResponse ToDetail(AppointmentSlot slot) => new(slot.Id, slot.ServiceType,
        slot.ProviderName, slot.ClinicName, slot.StartsAt, slot.EndsAt, slot.State, slot.Revision,
        slot.Events.OrderByDescending(x => x.OccurredAt).Select(x => new AppointmentEventResponse(x.Id, x.EventType, x.Description, x.OccurredAt)).ToArray());
}
