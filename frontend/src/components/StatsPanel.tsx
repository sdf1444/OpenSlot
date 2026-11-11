type StatsPanelProps = {
  available: number;
  booked: number;
  services: number;
};

export function StatsPanel({ available, booked, services }: StatsPanelProps) {
  return (
    <section className="stats">
      <article>
        <span>Available slots</span>
        <strong>{available}</strong>
        <small>Ready to book</small>
      </article>
      <article>
        <span>Booked slots</span>
        <strong>{booked}</strong>
        <small>Future appointments</small>
      </article>
      <article>
        <span>Services</span>
        <strong>{services}</strong>
        <small>Across this clinic</small>
      </article>
    </section>
  );
}
