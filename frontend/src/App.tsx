import { FormEvent, useEffect, useMemo, useState } from "react";

import { AppHeader } from "./components/AppHeader";
import { BookingModal } from "./components/BookingModal";
import { HeroSection } from "./components/HeroSection";
import { MessageBanner } from "./components/MessageBanner";
import { ReceiptModal } from "./components/ReceiptModal";
import { SlotDetailPanel } from "./components/SlotDetailPanel";
import { SlotList } from "./components/SlotList";
import { StatsPanel } from "./components/StatsPanel";
import { api } from "./lib/api";
import type { Dialog, Receipt, Slot, SlotDetail } from "./types";

export default function App() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<SlotDetail | null>(null);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const counts = useMemo(
    () => ({
      available: slots.filter((slot) => slot.state === "Available").length,
      booked: slots.filter((slot) => slot.state === "Booked").length,
      services: new Set(slots.map((slot) => slot.serviceType)).size,
    }),
    [slots],
  );

  async function refresh(keepId?: string) {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams();
      if (search.trim()) {
        query.set("search", search.trim());
      }

      const rows = await api<Slot[]>(`/api/appointments/slots?${query}`);
      setSlots(rows);

      const id = keepId ?? selected?.id;
      if (id && rows.some((slot) => slot.id === id)) {
        setSelected(await api<SlotDetail>(`/api/appointments/slots/${id}`));
        return;
      }

      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load appointments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh(selected?.id);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  async function openSlot(id: string) {
    setError("");

    try {
      setSelected(await api<SlotDetail>(`/api/appointments/slots/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load appointment.");
    }
  }

  async function createSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const payload = {
      serviceType: String(form.get("serviceType") ?? ""),
      providerName: String(form.get("providerName") ?? ""),
      clinicName: String(form.get("clinicName") ?? ""),
      startsAt: new Date(String(form.get("startsAt") ?? "")).toISOString(),
      endsAt: new Date(String(form.get("endsAt") ?? "")).toISOString(),
    };

    try {
      const result = await api<SlotDetail>("/api/appointments/slots", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setDialog(null);
      await refresh(result.id);
      setNotice("Appointment slot published.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish slot.");
    }
  }

  async function bookSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selected) {
      return;
    }

    const form = new FormData(event.currentTarget);

    try {
      const result = await api<Receipt>(`/api/appointments/slots/${selected.id}/bookings`, {
        method: "POST",
        body: JSON.stringify({
          patientName: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
        }),
      });

      setDialog(null);
      setReceipt(result);
      await refresh(selected.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not book appointment.");
    }
  }

  async function cancelBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    try {
      await api<null>("/api/appointments/bookings/cancel", {
        method: "POST",
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          confirmationCode: String(form.get("code") ?? ""),
        }),
      });

      setDialog(null);
      setNotice("Appointment cancelled and the time is available again.");
      await refresh(selected?.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel appointment.");
    }
  }

  async function cancelSlot() {
    if (!selected || !window.confirm("Remove this unbooked appointment slot?")) {
      return;
    }

    try {
      await api<SlotDetail>(`/api/appointments/slots/${selected.id}/cancel`, {
        method: "PATCH",
        body: JSON.stringify(selected.revision),
      });

      await refresh(selected.id);
      setNotice("Appointment slot cancelled.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel the slot.");
    }
  }

  const clearMessages = () => {
    setError("");
    setNotice("");
  };

  return (
    <div className="app-shell">
      <AppHeader />
      <main id="top" className="page-wrap">
        <HeroSection
          onCreate={() => {
            setDialog("create");
            clearMessages();
          }}
          onManageBooking={() => {
            setDialog("cancel");
            clearMessages();
          }}
        />

        <StatsPanel
          available={counts.available}
          booked={counts.booked}
          services={counts.services}
        />

        {error && <MessageBanner kind="error" message={error} onDismiss={clearMessages} />}
        {notice && <MessageBanner kind="success" message={notice} onDismiss={clearMessages} />}

        <section className="workspace">
          <SlotList
            slots={slots}
            selectedId={selected?.id}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            onSelect={openSlot}
          />

          <SlotDetailPanel
            selected={selected}
            onClose={() => setSelected(null)}
            onBook={() => {
              setDialog("book");
              clearMessages();
            }}
            onCancelSlot={() => void cancelSlot()}
          />
        </section>

        <footer className="footer">
          Personal portfolio demo using synthetic data only. Not a medical device or clinical
          service; do not enter real patient information.
        </footer>
      </main>

      {dialog && (
        <BookingModal
          dialog={dialog}
          selected={selected}
          onClose={() => setDialog(null)}
          onCreate={createSlot}
          onBook={bookSlot}
          onCancel={cancelBooking}
        />
      )}

      {receipt && <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
