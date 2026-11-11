import { formatClockTime, formatDateOnly, formatDateTime } from "../lib/dates";
import type { SlotDetail } from "../types";

type SlotDetailPanelProps = {
  selected: SlotDetail | null;
  canManage: boolean;
  onClose: () => void;
  onBook: () => void;
  onCancelSlot: () => void;
};

export function SlotDetailPanel({
  selected,
  canManage,
  onClose,
  onBook,
  onCancelSlot,
}: SlotDetailPanelProps) {
  if (!selected) {
    return (
      <aside className="detail-panel">
        <div className="detail-empty">
          <span className="empty-icon">↖</span>
          <b>Select an appointment</b>
          <p>View details and book an available time.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="detail-panel">
      <div className="detail-head">
        <div>
          <span className={`badge ${selected.state.toLowerCase()}`}>
            {selected.state}
          </span>
          <p className="eyebrow">{selected.clinicName}</p>
          <h2>{selected.serviceType}</h2>
          <p className="provider">with {selected.providerName}</p>
        </div>
        <button className="close" aria-label="Close details" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="appointment-info">
        <span>Date and time</span>
        <b>{formatDateOnly(selected.startsAt)}</b>
        <small>
          {formatDateTime(selected.startsAt)} –{" "}
          {formatClockTime(selected.endsAt)}
        </small>
        <span>Location</span>
        <b>{selected.clinicName}</b>
        <span>Appointment length</span>
        <b>
          {Math.round(
            (new Date(selected.endsAt).getTime() -
              new Date(selected.startsAt).getTime()) /
              60000,
          )}{" "}
          minutes
        </b>
      </div>

      {selected.state === "Available" ? (
        <button className="button button-primary full" onClick={onBook}>
          Book this appointment
        </button>
      ) : (
        <p className="closed">
          {selected.state === "Booked"
            ? "This time is currently booked."
            : "This slot has been cancelled."}
        </p>
      )}

      {canManage && selected.state === "Available" && (
        <button className="text-danger" onClick={onCancelSlot}>
          Remove this slot
        </button>
      )}

      <div className="activity">
        <h3>Activity</h3>
        {selected.events.map((event) => (
          <div className="event" key={event.id}>
            <i />
            <div>
              <b>{event.eventType}</b>
              <p>{event.description}</p>
              <time>{formatDateTime(event.occurredAt)}</time>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
