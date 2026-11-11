export type SlotState = "Available" | "Booked" | "Cancelled";

export type Slot = {
  id: string;
  serviceType: string;
  providerName: string;
  clinicName: string;
  startsAt: string;
  endsAt: string;
  state: SlotState;
  revision: number;
};

export type EventItem = {
  id: string;
  eventType: string;
  description: string;
  occurredAt: string;
};

export type SlotDetail = Slot & { events: EventItem[] };

export type Receipt = {
  confirmationCode: string;
  patientName: string;
  serviceType: string;
  clinicName: string;
  startsAt: string;
  message: string;
};

export type Dialog = "create" | "book" | "cancel" | null;

export type CoordinatorSession = {
  isAuthenticated: boolean;
  username: string | null;
  requestToken: string;
};
