namespace AppointmentSlots.Api.Domain;
public static class BookingRules
{
    public static bool CanBook(SlotState state, DateTimeOffset startsAt, DateTimeOffset now) =>
        state == SlotState.Available && startsAt > now;

    public static bool CanCancel(BookingState state, DateTimeOffset startsAt, DateTimeOffset now) =>
        state == BookingState.Confirmed && startsAt > now;

    public static bool Overlaps(DateTimeOffset firstStart, DateTimeOffset firstEnd,
        DateTimeOffset secondStart, DateTimeOffset secondEnd) =>
        firstStart < secondEnd && firstEnd > secondStart;
}
