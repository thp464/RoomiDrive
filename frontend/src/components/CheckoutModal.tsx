import { useState, type FormEvent } from "react";
import { X, MapPin, Clock } from "lucide-react";

interface Props {
  onClose: () => void;
  onSubmit: (destinationNote: string, estimatedReturnAt: string | null) => Promise<void>;
}

export function CheckoutModal({ onClose, onSubmit }: Props) {
  const [destination, setDestination] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(
        destination || "",
        returnTime ? new Date(returnTime).toISOString() : null
      );
    } catch {
      setError("Someone may have just taken it — refresh and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 z-50">
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-semibold">Check out car</h3>
          <button onClick={onClose} className="text-text-faint hover:text-text transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
              <MapPin size={12} /> Where are you headed? (optional)
            </span>
            <input
              className="input"
              placeholder="Costco run"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
              <Clock size={12} /> Estimated return (optional)
            </span>
            <input
              type="datetime-local"
              className="input"
              value={returnTime}
              onChange={(e) => setReturnTime(e.target.value)}
            />
          </label>

          {error && <p className="text-maintenance text-sm">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
            {submitting ? "Checking out..." : "Confirm check out"}
          </button>
        </form>
      </div>
    </div>
  );
}
