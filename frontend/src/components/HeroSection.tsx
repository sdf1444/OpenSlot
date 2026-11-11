type HeroSectionProps = {
  onCreate: () => void;
  onManageBooking: () => void;
};

export function HeroSection({ onCreate, onManageBooking }: HeroSectionProps) {
  return (
    <section className="hero">
      <div>
        <p className="eyebrow">APPOINTMENT AVAILABILITY</p>
        <h1>
          Find a time
          <br />
          <span>that works for you.</span>
        </h1>
        <p className="hero-copy">
          Browse upcoming appointments, reserve a slot, or cancel using your
          confirmation code.
        </p>
      </div>
      <div className="hero-buttons">
        <button className="button button-outline" onClick={onManageBooking}>
          Manage a booking
        </button>
        <button className="button button-primary" onClick={onCreate}>
          ＋ Add appointment
        </button>
      </div>
    </section>
  );
}
