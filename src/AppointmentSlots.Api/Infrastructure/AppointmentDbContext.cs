using AppointmentSlots.Api.Domain;
using Microsoft.EntityFrameworkCore;
namespace AppointmentSlots.Api.Infrastructure;
public sealed class AppointmentDbContext(DbContextOptions<AppointmentDbContext> options) : DbContext(options)
{
    public DbSet<AppointmentSlot> Slots => Set<AppointmentSlot>();
    public DbSet<AppointmentBooking> Bookings => Set<AppointmentBooking>();
    public DbSet<AppointmentEvent> Events => Set<AppointmentEvent>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var slot = modelBuilder.Entity<AppointmentSlot>();
        slot.HasKey(x => x.Id);
        slot.Property(x => x.ServiceType).HasMaxLength(70).IsRequired();
        slot.Property(x => x.ProviderName).HasMaxLength(70).IsRequired();
        slot.Property(x => x.ClinicName).HasMaxLength(100).IsRequired();
        slot.Property(x => x.State).HasConversion<string>().HasMaxLength(20);
        slot.Property(x => x.Revision).IsConcurrencyToken();
        slot.HasIndex(x => new { x.ProviderName, x.StartsAt }).IsUnique();
        slot.HasIndex(x => new { x.State, x.StartsAt });
        slot.HasOne(x => x.Booking).WithOne(x => x.Slot).HasForeignKey<AppointmentBooking>(x => x.AppointmentSlotId).OnDelete(DeleteBehavior.Cascade);
        slot.HasMany(x => x.Events).WithOne().HasForeignKey(x => x.AppointmentSlotId).OnDelete(DeleteBehavior.Cascade);
        var booking = modelBuilder.Entity<AppointmentBooking>();
        booking.HasKey(x => x.Id);
        booking.Property(x => x.PatientName).HasMaxLength(70).IsRequired();
        booking.Property(x => x.Email).HasMaxLength(120).IsRequired();
        booking.Property(x => x.ConfirmationCode).HasMaxLength(16).IsRequired();
        booking.Property(x => x.State).HasConversion<string>().HasMaxLength(20);
        booking.HasIndex(x => x.ConfirmationCode).IsUnique();
        var ev = modelBuilder.Entity<AppointmentEvent>();
        ev.HasKey(x => x.Id);
        ev.Property(x => x.EventType).HasMaxLength(30).IsRequired();
        ev.Property(x => x.Description).HasMaxLength(240).IsRequired();
        ev.HasIndex(x => new { x.AppointmentSlotId, x.OccurredAt });
    }
}
