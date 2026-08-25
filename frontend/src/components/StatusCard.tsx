import { Car, Clock, MapPin, Gauge, CalendarClock } from "lucide-react";
import type { Vehicle, Reservation } from "../types";
import { useAuth } from "../context/AuthContext";

const STATUS_CONFIG = {
  AVAILABLE: {
    label: "Available",
    color: "text-available",
    dim: "bg-available-dim",
    ring: "border-available/30",
    glow: "shadow-[0_0_60px_-15px_var(--color-available)]",
  },
  IN_USE: {
    label: "In use",
    color: "text-inuse",
    dim: "bg-inuse-dim",
    ring: "border-inuse/30",
    glow: "shadow-[0_0_60px_-15px_var(--color-inuse)]",
  },
} as const;

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso + (iso.endsWith("Z") ? "" : "Z"));
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function StatusCard({
  vehicle,
  reservations,
}: {
  vehicle: Vehicle;
  reservations: Reservation[];
}) {
  const { user } = useAuth();
  const cfg = STATUS_CONFIG[vehicle.status];

  // reservations is already sorted ascending by start_at and pre-filtered to
  // end_at > now, so [0] is either the currently active one or the next
  // upcoming one -- either way, the one worth surfacing.
  const nextReservation = reservations[0];
  const reservationIsActive =
    nextReservation && new Date(nextReservation.start_at + "Z") <= new Date();

  return (
    <div
      className={`relative bg-surface border ${cfg.ring} rounded-3xl p-7 md:p-9 w-full overflow-hidden shadow-2xl shadow-black/20`}
    >
      {/* ambient status glow, the card's signature element */}
      <div className={`absolute inset-0 opacity-[0.15] ${cfg.glow} pointer-events-none`} />

      <div className="relative flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
            {vehicle.name}
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${cfg.color.replace("text-", "bg-")} ${
                vehicle.status === "IN_USE" ? "animate-pulse" : ""
              }`}
            />
            <h2 className={`font-display text-3xl md:text-4xl font-semibold ${cfg.color}`}>
              {cfg.label}
            </h2>
          </div>
        </div>
        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${cfg.dim} flex items-center justify-center shrink-0`}>
          <Car size={22} className={`md:size-7 ${cfg.color}`} strokeWidth={2} />
        </div>
      </div>

      {vehicle.status === "AVAILABLE" && nextReservation && (
        <div
          className={`relative flex items-start gap-2 rounded-xl px-3 py-2.5 mb-4 text-sm ${
            reservationIsActive ? "bg-inuse-dim text-inuse" : "bg-surface-raised text-text-muted"
          }`}
        >
          <CalendarClock size={15} className="shrink-0 mt-0.5" />
          <span>
            {reservationIsActive ? (
              <>
                Reserved by{" "}
                {nextReservation.user.email === user?.email ? "you" : nextReservation.user.name}{" "}
                until {formatTime(nextReservation.end_at)}
              </>
            ) : (
              <>
                Next reservation:{" "}
                {nextReservation.user.email === user?.email ? "you" : nextReservation.user.name},{" "}
                {formatTime(nextReservation.start_at)} – {formatTime(nextReservation.end_at)}
              </>
            )}
          </span>
        </div>
      )}

      {vehicle.status === "IN_USE" && vehicle.held_by && (
        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
          <InfoRow icon={<Clock size={14} />} label="Taken by">
            {vehicle.held_by.name}
          </InfoRow>
          <InfoRow icon={<Clock size={14} />} label="Since">
            {formatTime(vehicle.checked_out_at)}
          </InfoRow>
          {vehicle.estimated_return_at && (
            <InfoRow icon={<Clock size={14} />} label="Est. return">
              {formatTime(vehicle.estimated_return_at)}
            </InfoRow>
          )}
          {vehicle.destination_note && (
            <InfoRow icon={<MapPin size={14} />} label="Headed to">
              {vehicle.destination_note}
            </InfoRow>
          )}
        </div>
      )}

      {vehicle.status === "AVAILABLE" && vehicle.last_checkin_at && (
        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2 pt-2 border-t border-border/60">
          {vehicle.last_parking_location && (
            <InfoRow icon={<MapPin size={14} />} label="Parked at">
              {vehicle.last_parking_location}
            </InfoRow>
          )}
          {vehicle.last_parking_note && (
            <InfoRow icon={<MapPin size={14} />} label="Parking notes">
              {vehicle.last_parking_note}
            </InfoRow>
          )}
          {vehicle.miles_left != null && (
            <InfoRow icon={<Gauge size={14} />} label="Miles left" mono>
              {vehicle.miles_left.toLocaleString()} mi
            </InfoRow>
          )}
          <InfoRow icon={<Clock size={14} />} label="Last returned">
            {formatTime(vehicle.last_checkin_at)}
          </InfoRow>
        </div>
      )}

      {vehicle.status === "AVAILABLE" && !vehicle.last_checkin_at && (
        <p className="relative text-sm text-text-muted">
          No trips logged yet — first one's yours.
        </p>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-text-faint mt-0.5">{icon}</span>
      <div>
        <p className="text-[11px] text-text-faint uppercase tracking-wide">{label}</p>
        <p className={`text-sm text-text ${mono ? "font-mono" : ""}`}>{children}</p>
      </div>
    </div>
  );
}
