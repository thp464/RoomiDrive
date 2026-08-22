import { useState, type FormEvent } from "react";
import { X, MapPin, Gauge } from "lucide-react";

const FLOORS = ["Floor 1", "Floor 2", "Floor 3", "Floor 4", "Floor 5", "Floor 6"];
const ELEVATORS = ["Service Elevator", "Main Elevator"];

interface Props {
  onClose: () => void;
  onSubmit: (parkingLocation: string, parkingNote: string, milesLeft: number) => Promise<void>;
}

export function CheckinModal({ onClose, onSubmit }: Props) {
  const [floor, setFloor] = useState("");
  const [elevator, setElevator] = useState("");
  const [parkingNote, setParkingNote] = useState("");
  const [milesLeft, setMilesLeft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(`${floor} - ${elevator}`, parkingNote, parseFloat(milesLeft));
    } catch {
      setError("Couldn't check in — try refreshing.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 z-50">
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm sm:max-w-lg">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-semibold">Check in car</h3>
          <button onClick={onClose} className="text-text-faint hover:text-text transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
                <MapPin size={12} /> Floor
              </span>
              <select
                required
                className="input"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
              >
                <option value="" disabled>
                  Select floor
                </option>
                {FLOORS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
                <MapPin size={12} /> Elevator
              </span>
              <select
                required
                className="input"
                value={elevator}
                onChange={(e) => setElevator(e.target.value)}
              >
                <option value="" disabled>
                  Select elevator
                </option>
                {ELEVATORS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-xs text-text-muted mb-1.5 block">
              Details (optional)
            </span>
            <textarea
              className="input min-h-20 resize-none"
              placeholder="e.g. back row near the pillar"
              value={parkingNote}
              onChange={(e) => setParkingNote(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
              <Gauge size={12} /> Miles left
            </span>
            <input
              required
              type="number"
              step="0.1"
              min="0"
              className="input font-mono"
              placeholder="220"
              value={milesLeft}
              onChange={(e) => setMilesLeft(e.target.value)}
            />
          </label>

          {error && <p className="text-maintenance text-sm">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
            {submitting ? "Checking in..." : "Confirm check in"}
          </button>
        </form>
      </div>
    </div>
  );
}
