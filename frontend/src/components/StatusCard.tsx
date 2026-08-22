import { Car, Clock, MapPin, Fuel, Gauge } from "lucide-react";
import type { Vehicle } from "../types";

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
  MAINTENANCE: {
    label: "In maintenance",
    color: "text-maintenance",
    dim: "bg-maintenance-dim",
    ring: "border-maintenance/30",
    glow: "shadow-[0_0_60px_-15px_var(--color-maintenance)]",
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

export function StatusCard({ vehicle }: { vehicle: Vehicle }) {
  const cfg = STATUS_CONFIG[vehicle.status];

  return (
    <div
      className={`relative bg-surface border ${cfg.ring} rounded-3xl p-7 overflow-hidden`}
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
            <h2 className={`font-display text-3xl font-semibold ${cfg.color}`}>
              {cfg.label}
            </h2>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${cfg.dim} flex items-center justify-center shrink-0`}>
          <Car size={22} className={cfg.color} strokeWidth={2} />
        </div>
      </div>

      {vehicle.status === "IN_USE" && vehicle.held_by && (
        <div className="relative grid grid-cols-2 gap-3 mb-2">
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
        <div className="relative grid grid-cols-2 gap-3 mb-2 pt-2 border-t border-border/60">
          {vehicle.last_parking_note && (
            <InfoRow icon={<MapPin size={14} />} label="Parked at">
              {vehicle.last_parking_note}
            </InfoRow>
          )}
          {vehicle.current_mileage != null && (
            <InfoRow icon={<Gauge size={14} />} label="Mileage" mono>
              {vehicle.current_mileage.toLocaleString()} mi
            </InfoRow>
          )}
          {vehicle.fuel_pct != null && (
            <InfoRow icon={<Fuel size={14} />} label="Fuel / charge" mono>
              {vehicle.fuel_pct}%
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
