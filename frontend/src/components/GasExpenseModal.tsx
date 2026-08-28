import { useState, type FormEvent } from "react";
import { X, DollarSign } from "lucide-react";

interface Props {
  onClose: () => void;
  onSubmit: (amount: number, note: string) => Promise<void>;
}

export function GasExpenseModal({ onClose, onSubmit }: Props) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(parseFloat(amount), note);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Couldn't log expense.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 z-50">
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm sm:max-w-lg">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-semibold">Log gas expense</h3>
          <button onClick={onClose} className="text-text-faint hover:text-text transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
              <DollarSign size={12} /> Amount
            </span>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              className="input font-mono"
              placeholder="42.50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-xs text-text-muted mb-1.5 block">Note (optional)</span>
            <input
              className="input"
              placeholder="Shell on Main St"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>

          {error && <p className="text-maintenance text-sm">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
            {submitting ? "Logging..." : "Log expense"}
          </button>
        </form>
      </div>
    </div>
  );
}
