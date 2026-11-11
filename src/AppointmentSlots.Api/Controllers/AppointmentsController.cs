using AppointmentSlots.Api.Application;
using AppointmentSlots.Api.Contracts;
using Microsoft.AspNetCore.Mvc;
namespace AppointmentSlots.Api.Controllers;

[ApiController]
[Route("api/appointments")]
public sealed class AppointmentsController(AppointmentService appointments) : ControllerBase
{
    [HttpGet("slots")]
    public async Task<ActionResult<IReadOnlyList<SlotSummaryResponse>>> ListSlots(
        [FromQuery] string? search, [FromQuery] DateTimeOffset? date, CancellationToken ct) =>
        Ok(await appointments.ListAsync(search, date, ct));

    [HttpGet("slots/{id:guid}")]
    public async Task<ActionResult<SlotDetailResponse>> GetSlot(Guid id, CancellationToken ct) =>
        Ok(await appointments.GetAsync(id, ct));

    [HttpPost("slots")]
    public async Task<ActionResult<SlotDetailResponse>> CreateSlot(CreateSlotRequest request, CancellationToken ct)
    {
        var slot = await appointments.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetSlot), new { id = slot.Id }, slot);
    }

    [HttpPost("slots/{id:guid}/bookings")]
    public async Task<ActionResult<BookingReceipt>> Book(Guid id, BookSlotRequest request, CancellationToken ct) =>
        Ok(await appointments.BookAsync(id, request, ct));

    [HttpPost("bookings/cancel")]
    public async Task<IActionResult> CancelBooking(CancelBookingRequest request, CancellationToken ct)
    {
        await appointments.CancelBookingAsync(request, ct);
        return NoContent();
    }

    [HttpPatch("slots/{id:guid}/cancel")]
    public async Task<ActionResult<SlotDetailResponse>> CancelSlot(Guid id, [FromBody] int expectedRevision, CancellationToken ct) =>
        Ok(await appointments.CancelSlotAsync(id, expectedRevision, ct));
}
