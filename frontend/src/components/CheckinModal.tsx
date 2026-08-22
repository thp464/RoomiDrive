import { useState, type FormEvent } from "react";
import { X, MapPin, Gauge, Fuel } from "lucide-react";

interface Props {
  onClose: () => void;
  onSubmit: (parkingNote: string, mileage: number, fuelPct: number) => Promise<void>;
}

export function CheckinModal({ onClose, onSubmit }: Props) {
  const [parkingNote, setParkingNote] = useState("");
  const [mileage, setMileage] = useState("");
  const [fuelPct, setFuelPct] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(parkingNote, parseFloat(mileage), parseFloat(fuelPct));
    } catch {
      setError("Couldn't check in — try refreshing.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 z-50">
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-semibold">Check in car</h3>
          <button onClick={onClose} className="text-text-faint hover:text-text transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
              <MapPin size={12} /> Where'd you park it?
            </span>
            <input
              required
              className="input"
              placeholder="Parked on 24th St, across from the convenience store"
              value={parkingNote}
              onChange={(e) => setParkingNote(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
                <Gauge size={12} /> Mileage
              </span>
              <input
                required
                type="number"
                step="0.1"
                className="input font-mono"
                placeholder="45210.5"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
                <Fuel size={12} /> Fuel / charge %
              </span>
              <input
                required
                type="number"
                min="0"
                max="100"
                className="input font-mono"
                placeholder="62"
                value={fuelPct}
                onChange={(e) => setFuelPct(e.target.value)}
              />
            </label>
          </div>

          {error && <p className="text-maintenance text-sm">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
            {submitting ? "Checking in..." : "Confirm check in"}
          </button>
        </form>
      </div>
    </div>
  );
}
