import { Clock, MapPin } from "lucide-react";
import type { Trip } from "../types";

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

export function TripHistory({ trips }: { trips: Trip[] }) {
  if (trips.length === 0) {
    return (
      <p className="text-sm text-text-muted text-center py-8">
        No trips logged yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {trips.map((trip) => (
        <li key={trip.id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-medium text-sm">{trip.user.name}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                trip.checked_in_at
                  ? "bg-available-dim text-available"
                  : "bg-inuse-dim text-inuse"
              }`}
            >
              {trip.checked_in_at ? "Completed" : "In progress"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-text-faint shrink-0" />
              {formatTime(trip.checked_out_at)} → {formatTime(trip.checked_in_at)}
            </div>
            {trip.destination_note && (
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-text-faint shrink-0" />
                {trip.destination_note}
              </div>
            )}
            {trip.parking_location && (
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-text-faint shrink-0" />
                Parked at {trip.parking_location}
              </div>
            )}
            {trip.miles_left != null && (
              <div className="font-mono">{trip.miles_left.toLocaleString()} mi left</div>
            )}
          </div>

          {trip.parking_note && (
            <p className="text-xs text-text-faint mt-1.5">{trip.parking_note}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
