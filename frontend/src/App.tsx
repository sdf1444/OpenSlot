import { FormEvent, useEffect, useMemo, useState } from 'react';

type SlotState = 'Available' | 'Booked' | 'Cancelled';
type Slot = { id: string; serviceType: string; providerName: string; clinicName: string; startsAt: string; endsAt: string; state: SlotState; revision: number };
type EventItem = { id: string; eventType: string; description: string; occurredAt: string };
type SlotDetail = Slot & { events: EventItem[] };
type Receipt = { confirmationCode: string; patientName: string; serviceType: string; clinicName: string; startsAt: string; message: string };
type Dialog = 'create' | 'book' | 'cancel' | null;

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) } });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try { message = (await response.json()).title ?? message; } catch { /* keep fallback */ }
    throw new Error(message);
  }
  return (response.status === 204 ? null : await response.json()) as T;
}
const dateTime = (value: string) => new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
const dateOnly = (value: string) => new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(value));
const localInput = (hoursAhead = 24) => { const d = new Date(Date.now() + hoursAhead * 3600000); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

export default function App() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<SlotDetail | null>(null);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const counts = useMemo(() => ({ available: slots.filter(x => x.state === 'Available').length, booked: slots.filter(x => x.state === 'Booked').length }), [slots]);

  async function refresh(keepId?: string) {
    setLoading(true); setError('');
    try {
      const q = new URLSearchParams(); if (search.trim()) q.set('search', search.trim());
      const rows = await api<Slot[]>(`/api/appointments/slots?${q}`);
      setSlots(rows);
      const id = keepId ?? selected?.id;
      setSelected(id && rows.some(x => x.id === id) ? await api<SlotDetail>(`/api/appointments/slots/${id}`) : null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load appointments.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void refresh(selected?.id); }, 250); return () => window.clearTimeout(timer); }, [search]);
  async function openSlot(id: string) {
    setError('');
    try { setSelected(await api<SlotDetail>(`/api/appointments/slots/${id}`)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load appointment.'); }
  }
  async function createSlot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const payload = { serviceType: f.get('serviceType'), providerName: f.get('providerName'), clinicName: f.get('clinicName'), startsAt: new Date(String(f.get('startsAt'))).toISOString(), endsAt: new Date(String(f.get('endsAt'))).toISOString() };
    try {
      const result = await api<SlotDetail>('/api/appointments/slots', { method: 'POST', body: JSON.stringify(payload) });
      setDialog(null); await refresh(result.id); setNotice('Appointment slot published.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not publish slot.'); }
  }
  async function bookSlot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!selected) return; const f = new FormData(e.currentTarget);
    try {
      const result = await api<Receipt>(`/api/appointments/slots/${selected.id}/bookings`, { method: 'POST', body: JSON.stringify({ patientName: f.get('name'), email: f.get('email') }) });
      setDialog(null); setReceipt(result); await refresh(selected.id);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not book appointment.'); }
  }
  async function cancelBooking(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    try {
      await api<null>('/api/appointments/bookings/cancel', { method: 'POST', body: JSON.stringify({ email: f.get('email'), confirmationCode: f.get('code') }) });
      setDialog(null); setNotice('Appointment cancelled and the time is available again.'); await refresh(selected?.id);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not cancel appointment.'); }
  }
  async function cancelSlot() {
    if (!selected || !window.confirm('Remove this unbooked appointment slot?')) return;
    try {
      await api<SlotDetail>(`/api/appointments/slots/${selected.id}/cancel`, { method: 'PATCH', body: JSON.stringify(selected.revision) });
      await refresh(selected.id); setNotice('Appointment slot cancelled.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not cancel the slot.'); }
  }
  const clearMessages = () => { setError(''); setNotice(''); };

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#top"><span className="brand-mark">O</span><span>OpenSlot<span className="brand-dot">.</span></span></a><div className="topbar-meta"><span className="live-dot"/> Community clinic demo <span className="divider"/> Synthetic records</div></header>
    <main id="top" className="page-wrap">
      <section className="hero"><div><p className="eyebrow">APPOINTMENT AVAILABILITY</p><h1>Find a time<br/><span>that works for you.</span></h1><p className="hero-copy">Browse upcoming appointments, reserve a slot, or cancel using your confirmation code.</p></div><div className="hero-buttons"><button className="button button-outline" onClick={() => { setDialog('cancel'); clearMessages(); }}>Manage a booking</button><button className="button button-primary" onClick={() => { setDialog('create'); clearMessages(); }}>＋ Add appointment</button></div></section>
      <section className="stats"><article><span>Available slots</span><strong>{counts.available}</strong><small>Ready to book</small></article><article><span>Booked slots</span><strong>{counts.booked}</strong><small>Future appointments</small></article><article><span>Services</span><strong>{new Set(slots.map(x => x.serviceType)).size}</strong><small>Across this clinic</small></article></section>
      {error && <div className="message error" role="alert">{error}<button onClick={clearMessages}>×</button></div>}{notice && <div className="message success" role="status">{notice}<button onClick={clearMessages}>×</button></div>}
      <section className="workspace"><div className="slots-panel"><div className="panel-heading"><div><p className="eyebrow">UPCOMING</p><h2>Appointment slots</h2></div><label className="search"><span>⌕</span><input aria-label="Search appointments" placeholder="Search service or clinic" value={search} onChange={e => setSearch(e.target.value)}/></label></div>
        {loading ? <div className="empty">Loading appointments…</div> : slots.length === 0 ? <div className="empty"><span className="empty-icon">◷</span><b>No appointments found</b><p>Try another search or add a new slot.</p></div> : <div className="slot-list">{slots.map(slot => <button key={slot.id} className={`slot-card ${selected?.id === slot.id ? 'selected' : ''}`} onClick={() => void openSlot(slot.id)}><div className="date-box"><b>{new Intl.DateTimeFormat('en-GB',{day:'2-digit'}).format(new Date(slot.startsAt))}</b><span>{new Intl.DateTimeFormat('en-GB',{month:'short'}).format(new Date(slot.startsAt)).toUpperCase()}</span></div><div className="slot-copy"><span className="service">{slot.serviceType}</span><h3>{slot.providerName}</h3><p>{slot.clinicName}</p><p>{dateTime(slot.startsAt)} – {new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit'}).format(new Date(slot.endsAt))}</p></div><span className={`badge ${slot.state.toLowerCase()}`}>{slot.state}</span></button>)}</div>}
      </div>
      <aside className="detail-panel">{!selected ? <div className="detail-empty"><span className="empty-icon">↖</span><b>Select an appointment</b><p>View details and book an available time.</p></div> : <><div className="detail-head"><div><span className={`badge ${selected.state.toLowerCase()}`}>{selected.state}</span><p className="eyebrow">{selected.clinicName}</p><h2>{selected.serviceType}</h2><p className="provider">with {selected.providerName}</p></div><button className="close" aria-label="Close details" onClick={() => setSelected(null)}>×</button></div><div className="appointment-info"><span>Date and time</span><b>{dateOnly(selected.startsAt)}</b><small>{dateTime(selected.startsAt)} – {new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit'}).format(new Date(selected.endsAt))}</small><span>Location</span><b>{selected.clinicName}</b><span>Appointment length</span><b>{Math.round((new Date(selected.endsAt).getTime()-new Date(selected.startsAt).getTime())/60000)} minutes</b></div>{selected.state === 'Available' ? <button className="button button-primary full" onClick={() => { setDialog('book'); clearMessages(); }}>Book this appointment</button> : <p className="closed">{selected.state === 'Booked' ? 'This time is currently booked.' : 'This slot has been cancelled.'}</p>}{selected.state === 'Available' && <button className="text-danger" onClick={() => void cancelSlot()}>Remove this slot</button>}<div className="activity"><h3>Activity</h3>{selected.events.map(event => <div className="event" key={event.id}><i/><div><b>{event.eventType}</b><p>{event.description}</p><time>{dateTime(event.occurredAt)}</time></div></div>)}</div></>}</aside></section>
      <footer className="footer">Personal portfolio demo using synthetic data only. Not a medical device or clinical service; do not enter real patient information.</footer>
    </main>
    {dialog && <div className="backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setDialog(null); }}><section className="modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={() => setDialog(null)} aria-label="Close">×</button>
      {dialog === 'create' && <form onSubmit={e => void createSlot(e)}><p className="eyebrow">COORDINATOR</p><h2>Add appointment</h2><label>Service<input name="serviceType" required minLength={3} maxLength={70} placeholder="General consultation"/></label><label>Provider<input name="providerName" required minLength={2} maxLength={70} placeholder="Provider name"/></label><label>Clinic<input name="clinicName" required minLength={3} maxLength={100} placeholder="Clinic location"/></label><div className="form-row"><label>Starts<input name="startsAt" type="datetime-local" required defaultValue={localInput(48)}/></label><label>Ends<input name="endsAt" type="datetime-local" required defaultValue={localInput(48.5)}/></label></div><button className="button button-primary full" type="submit">Publish slot</button></form>}
      {dialog === 'book' && selected && <form onSubmit={e => void bookSlot(e)}><p className="eyebrow">BOOK APPOINTMENT</p><h2>{selected.serviceType}</h2><p className="modal-intro">{dateTime(selected.startsAt)} · {selected.clinicName}</p><label>Name<input name="name" required minLength={2} maxLength={70} autoComplete="name"/></label><label>Email address<input name="email" type="email" required maxLength={120} autoComplete="email"/></label><p className="hint">A confirmation code will be shown after booking. Keep it to cancel online.</p><button className="button button-primary full" type="submit">Confirm booking</button></form>}
      {dialog === 'cancel' && <form onSubmit={e => void cancelBooking(e)}><p className="eyebrow">MANAGE BOOKING</p><h2>Cancel appointment</h2><p className="modal-intro">Enter the email address and confirmation code from your booking.</p><label>Email address<input name="email" type="email" required maxLength={120} autoComplete="email"/></label><label>Confirmation code<input name="code" required minLength={6} maxLength={16} autoCapitalize="characters"/></label><button className="button button-primary full" type="submit">Cancel appointment</button></form>}
    </section></div>}
    {receipt && <div className="backdrop"><section className="modal receipt" role="dialog" aria-modal="true"><button className="modal-close" onClick={() => setReceipt(null)} aria-label="Close">×</button><span className="check">✓</span><p className="eyebrow">BOOKING CONFIRMED</p><h2>Thank you, {receipt.patientName}.</h2><p className="modal-intro">{receipt.serviceType} with {receipt.clinicName}<br/>{dateTime(receipt.startsAt)}</p><div className="code"><span>CANCELLATION CODE</span><b>{receipt.confirmationCode}</b></div><p className="hint">Save this code with your email address if you need to cancel.</p><button className="button button-primary full" onClick={() => setReceipt(null)}>Done</button></section></div>}
  </div>;
}
