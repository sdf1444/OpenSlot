import { formatClockTime, formatDateTime } from "../lib/dates";
import type { Slot } from "../types";

type SlotListProps = {
  slots: Slot[];
  selectedId?: string;
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (slotId: string) => Promise<void>;
};

export function SlotList({
  slots,
  selectedId,
  loading,
  search,
  onSearchChange,
  onSelect,
}: SlotListProps) {
  return (
    <div className="slots-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">UPCOMING</p>
          <h2>Appointment slots</h2>
        </div>
        <label className="search">
          <span>⌕</span>
          <input
            aria-label="Search appointments"
            placeholder="Search service or clinic"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
      </div>

      {loading ? (
        <div className="empty">Loading appointments…</div>
      ) : slots.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">◷</span>
          <b>No appointments found</b>
          <p>Try another search or add a new slot.</p>
        </div>
      ) : (
        <div className="slot-list">
          {slots.map((slot) => (
            <button
              key={slot.id}
              className={`slot-card ${selectedId === slot.id ? "selected" : ""}`}
              onClick={() => void onSelect(slot.id)}
            >
              <div className="date-box">
                <b>
                  {new Intl.DateTimeFormat("en-GB", {
                    day: "2-digit",
                  }).format(new Date(slot.startsAt))}
                </b>
                <span>
                  {new Intl.DateTimeFormat("en-GB", { month: "short" })
                    .format(new Date(slot.startsAt))
                    .toUpperCase()}
                </span>
              </div>
              <div className="slot-copy">
                <span className="service">{slot.serviceType}</span>
                <h3>{slot.providerName}</h3>
                <p>{slot.clinicName}</p>
                <p>
                  {formatDateTime(slot.startsAt)} – {formatClockTime(slot.endsAt)}
                </p>
              </div>
              <span className={`badge ${slot.state.toLowerCase()}`}>{slot.state}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
