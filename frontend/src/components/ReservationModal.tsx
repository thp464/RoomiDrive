import { useState, type FormEvent } from "react";
import { X, Clock, MapPin } from "lucide-react";

interface Props {
  onClose: () => void;
  onSubmit: (startAt: string, endAt: string, note: string) => Promise<void>;
}

export function ReservationModal({ onClose, onSubmit }: Props) {
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(
        new Date(startAt).toISOString(),
        new Date(endAt).toISOString(),
        note
      );
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Couldn't create reservation.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 z-50">
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm sm:max-w-lg">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-semibold">Reserve a time</h3>
          <button onClick={onClose} className="text-text-faint hover:text-text transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
              <Clock size={12} /> Starts
            </span>
            <input
              type="datetime-local"
              required
              className="input"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
              <Clock size={12} /> Ends
            </span>
            <input
              type="datetime-local"
              required
              className="input"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
              <MapPin size={12} /> Note (optional)
            </span>
            <input
              className="input"
              placeholder="Airport run Saturday morning"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>

          {error && <p className="text-maintenance text-sm">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
            {submitting ? "Reserving..." : "Confirm reservation"}
          </button>
        </form>
      </div>
    </div>
  );
}
