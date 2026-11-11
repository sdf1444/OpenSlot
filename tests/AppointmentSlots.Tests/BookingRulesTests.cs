using AppointmentSlots.Api.Domain;
using Xunit;
namespace AppointmentSlots.Tests;
public sealed class BookingRulesTests
{
    public static TheoryData<SlotState, int, bool> BookCases => new()
    {
        { SlotState.Available, 2, true },
        { SlotState.Booked, 2, false },
        { SlotState.Cancelled, 2, false },
        { SlotState.Available, -1, false }
    };
    public static TheoryData<BookingState, int, bool> CancelCases => new()
    {
        { BookingState.Confirmed, 1, true },
        { BookingState.Cancelled, 1, false },
        { BookingState.Confirmed, -1, false }
    };
    [Theory]
    [MemberData(nameof(BookCases))]
    public void CanBook_requires_an_available_future_slot(SlotState state, int hoursAhead, bool expected)
    {
        var now = DateTimeOffset.UtcNow;
        Assert.Equal(expected, BookingRules.CanBook(state, now.AddHours(hoursAhead), now));
    }
    [Theory]
    [MemberData(nameof(CancelCases))]
    public void CanCancel_requires_a_confirmed_future_appointment(BookingState state, int daysAhead, bool expected)
    {
        var now = DateTimeOffset.UtcNow;
        Assert.Equal(expected, BookingRules.CanCancel(state, now.AddDays(daysAhead), now));
    }
    [Theory]
    [InlineData(9, 10, 10, 11, false)]
    [InlineData(9, 11, 10, 12, true)]
    [InlineData(10, 12, 9, 11, true)]
    [InlineData(9, 12, 10, 11, true)]
    public void Overlaps_detects_time_intersections(int firstStart, int firstEnd, int secondStart, int secondEnd, bool expected)
    {
        var day = new DateTimeOffset(2030, 1, 1, 0, 0, 0, TimeSpan.Zero);
        Assert.Equal(expected, BookingRules.Overlaps(day.AddHours(firstStart), day.AddHours(firstEnd), day.AddHours(secondStart), day.AddHours(secondEnd)));
    }
}
