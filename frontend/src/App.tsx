import { FormEvent, useEffect, useMemo, useState } from "react";

import { AppHeader } from "./components/AppHeader";
import { BookingModal } from "./components/BookingModal";
import { HeroSection } from "./components/HeroSection";
import { LoginPage } from "./components/LoginPage";
import { MessageBanner } from "./components/MessageBanner";
import { ReceiptModal } from "./components/ReceiptModal";
import { SlotDetailPanel } from "./components/SlotDetailPanel";
import { SlotList } from "./components/SlotList";
import { StatsPanel } from "./components/StatsPanel";
import { api } from "./lib/api";
import type {
  CoordinatorSession,
  Dialog,
  Receipt,
  Slot,
  SlotDetail,
} from "./types";

export default function App() {
  return window.location.pathname === "/login" ? (
    <LoginPage />
  ) : (
    <AppointmentHome />
  );
}

function AppointmentHome() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<SlotDetail | null>(null);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<CoordinatorSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

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
      setError(
        err instanceof Error ? err.message : "Could not load appointments.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSession().then((currentSession) => {
      if (currentSession?.isAuthenticated) {
        void refresh();
      }
    });
  }, []);

  useEffect(() => {
    if (!sessionLoading && !session?.isAuthenticated) {
      window.location.replace("/login");
    }
  }, [session, sessionLoading]);

  useEffect(() => {
    if (!session?.isAuthenticated) {
      return;
    }

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
      setError(
        err instanceof Error ? err.message : "Could not load appointment.",
      );
    }
  }

  async function loadSession(): Promise<CoordinatorSession | null> {
    try {
      const currentSession = await api<CoordinatorSession>("/api/auth/session");
      setSession(currentSession);
      return currentSession;
    } catch (err) {
      setSession(null);
      setError(
        err instanceof Error
          ? err.message
          : "Could not check coordinator session.",
      );
      return null;
    } finally {
      setSessionLoading(false);
    }
  }

  async function logout() {
    if (!session?.requestToken) {
      return;
    }

    try {
      await api<null>("/api/auth/logout", {
        method: "POST",
        headers: { "X-CSRF-TOKEN": session.requestToken },
      });
      window.location.assign("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign out.");
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
        headers: { "X-CSRF-TOKEN": session?.requestToken ?? "" },
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
      const result = await api<Receipt>(
        `/api/appointments/slots/${selected.id}/bookings`,
        {
          method: "POST",
          headers: { "X-CSRF-TOKEN": session?.requestToken ?? "" },
          body: JSON.stringify({
            patientName: String(form.get("name") ?? ""),
            email: String(form.get("email") ?? ""),
          }),
        },
      );

      setDialog(null);
      setReceipt(result);
      await refresh(selected.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not book appointment.",
      );
    }
  }

  async function cancelBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    try {
      await api<null>("/api/appointments/bookings/cancel", {
        method: "POST",
        headers: { "X-CSRF-TOKEN": session?.requestToken ?? "" },
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          confirmationCode: String(form.get("code") ?? ""),
        }),
      });

      setDialog(null);
      setNotice("Appointment cancelled and the time is available again.");
      await refresh(selected?.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not cancel appointment.",
      );
    }
  }

  async function cancelSlot() {
    if (
      !selected ||
      !window.confirm("Remove this unbooked appointment slot?")
    ) {
      return;
    }

    try {
      await api<SlotDetail>(`/api/appointments/slots/${selected.id}/cancel`, {
        method: "PATCH",
        headers: { "X-CSRF-TOKEN": session?.requestToken ?? "" },
        body: JSON.stringify(selected.revision),
      });

      await refresh(selected.id);
      setNotice("Appointment slot cancelled.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not cancel the slot.",
      );
    }
  }

  const clearMessages = () => {
    setError("");
    setNotice("");
  };

  if (sessionLoading) {
    return (
      <main className="session-check" role="status">
        Checking coordinator access…
      </main>
    );
  }

  if (!session?.isAuthenticated) {
    return null;
  }

  return (
    <div className="app-shell">
      <AppHeader
        username={session?.isAuthenticated ? session.username : null}
        loading={sessionLoading}
        onLogout={() => void logout()}
      />
      <main id="top" className="page-wrap">
        <HeroSection
          canManage={session?.isAuthenticated === true}
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

        {error && (
          <MessageBanner
            kind="error"
            message={error}
            onDismiss={clearMessages}
          />
        )}
        {notice && (
          <MessageBanner
            kind="success"
            message={notice}
            onDismiss={clearMessages}
          />
        )}

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
            canManage={session?.isAuthenticated === true}
            onClose={() => setSelected(null)}
            onBook={() => {
              setDialog("book");
              clearMessages();
            }}
            onCancelSlot={() => void cancelSlot()}
          />
        </section>

        <footer className="footer">
          Personal portfolio demo using synthetic data only. Not a medical
          device or clinical service; do not enter real patient information.
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

      {receipt && (
        <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
      )}
    </div>
  );
}
