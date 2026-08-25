import { Clock, X } from "lucide-react";
import type { Reservation } from "../types";
import { useAuth } from "../context/AuthContext";

function formatTime(iso: string): string {
  const d = new Date(iso + (iso.endsWith("Z") ? "" : "Z"));
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ReservationsPanel({
  reservations,
  onCancel,
}: {
  reservations: Reservation[];
  onCancel: (id: number) => void;
}) {
  const { user } = useAuth();

  if (reservations.length === 0) {
    return (
      <p className="text-sm text-text-muted text-center py-8">
        No upcoming reservations.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {reservations.map((r) => {
        const canCancel = r.user.id === user?.id || user?.is_household_admin;
        return (
          <li key={r.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{r.user.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Clock size={12} className="text-text-faint shrink-0" />
                {formatTime(r.start_at)} → {formatTime(r.end_at)}
              </div>
              {r.note && <p className="text-xs text-text-faint mt-1">{r.note}</p>}
            </div>
            {canCancel && (
              <button
                onClick={() => onCancel(r.id)}
                title="Cancel reservation"
                className="text-text-faint hover:text-maintenance transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
