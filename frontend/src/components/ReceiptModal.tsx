import { formatDateTime } from "../lib/dates";
import type { Receipt } from "../types";

type ReceiptModalProps = {
  receipt: Receipt;
  onClose: () => void;
};

export function ReceiptModal({ receipt, onClose }: ReceiptModalProps) {
  return (
    <div className="backdrop">
      <section className="modal receipt" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <span className="check">✓</span>
        <p className="eyebrow">BOOKING CONFIRMED</p>
        <h2>Thank you, {receipt.patientName}.</h2>
        <p className="modal-intro">
          {receipt.serviceType} with {receipt.clinicName}
          <br />
          {formatDateTime(receipt.startsAt)}
        </p>
        <div className="code">
          <span>CANCELLATION CODE</span>
          <b>{receipt.confirmationCode}</b>
        </div>
        <p className="hint">
          Save this code with your email address if you need to cancel.
        </p>
        <button className="button button-primary full" onClick={onClose}>
          Done
        </button>
      </section>
    </div>
  );
}
