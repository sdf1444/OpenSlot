import type { FormEvent } from "react";

import { localInput } from "../lib/dates";
import type { Dialog, SlotDetail } from "../types";

type BookingModalProps = {
  dialog: Exclude<Dialog, null>;
  selected: SlotDetail | null;
  onClose: () => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onBook: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onCancel: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function BookingModal({
  dialog,
  selected,
  onClose,
  onCreate,
  onBook,
  onCancel,
}: BookingModalProps) {
  return (
    <div
      className="backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="modal" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {dialog === "create" && (
          <form onSubmit={(event) => void onCreate(event)}>
            <p className="eyebrow">COORDINATOR</p>
            <h2>Add appointment</h2>
            <label>
              Service
              <input
                name="serviceType"
                required
                minLength={3}
                maxLength={70}
                placeholder="General consultation"
              />
            </label>
            <label>
              Provider
              <input
                name="providerName"
                required
                minLength={2}
                maxLength={70}
                placeholder="Provider name"
              />
            </label>
            <label>
              Clinic
              <input
                name="clinicName"
                required
                minLength={3}
                maxLength={100}
                placeholder="Clinic location"
              />
            </label>
            <div className="form-row">
              <label>
                Starts
                <input
                  name="startsAt"
                  type="datetime-local"
                  required
                  defaultValue={localInput(48)}
                />
              </label>
              <label>
                Ends
                <input
                  name="endsAt"
                  type="datetime-local"
                  required
                  defaultValue={localInput(48.5)}
                />
              </label>
            </div>
            <button className="button button-primary full" type="submit">
              Publish slot
            </button>
          </form>
        )}

        {dialog === "book" && selected && (
          <form onSubmit={(event) => void onBook(event)}>
            <p className="eyebrow">BOOK APPOINTMENT</p>
            <h2>{selected.serviceType}</h2>
            <p className="modal-intro">
              {new Intl.DateTimeFormat("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(selected.startsAt))} · {selected.clinicName}
            </p>
            <label>
              Name
              <input
                name="name"
                required
                minLength={2}
                maxLength={70}
                autoComplete="name"
              />
            </label>
            <label>
              Email address
              <input
                name="email"
                type="email"
                required
                maxLength={120}
                autoComplete="email"
              />
            </label>
            <p className="hint">
              A confirmation code will be shown after booking. Keep it to cancel online.
            </p>
            <button className="button button-primary full" type="submit">
              Confirm booking
            </button>
          </form>
        )}

        {dialog === "cancel" && (
          <form onSubmit={(event) => void onCancel(event)}>
            <p className="eyebrow">MANAGE BOOKING</p>
            <h2>Cancel appointment</h2>
            <p className="modal-intro">
              Enter the email address and confirmation code from your booking.
            </p>
            <label>
              Email address
              <input
                name="email"
                type="email"
                required
                maxLength={120}
                autoComplete="email"
              />
            </label>
            <label>
              Confirmation code
              <input
                name="code"
                required
                minLength={6}
                maxLength={16}
                autoCapitalize="characters"
              />
            </label>
            <button className="button button-primary full" type="submit">
              Cancel appointment
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
