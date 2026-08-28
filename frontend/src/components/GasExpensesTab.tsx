import { Fuel, X } from "lucide-react";
import type { GasExpense } from "../types";
import { useAuth } from "../context/AuthContext";

function formatDate(iso: string): string {
  const d = new Date(iso + (iso.endsWith("Z") ? "" : "Z"));
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function GasExpensesTab({
  expenses,
  onDelete,
}: {
  expenses: GasExpense[];
  onDelete: (id: number) => void;
}) {
  const { user } = useAuth();

  const totalsByUser = new Map<number, { name: string; total: number }>();
  for (const e of expenses) {
    const existing = totalsByUser.get(e.user.id);
    if (existing) {
      existing.total += e.amount;
    } else {
      totalsByUser.set(e.user.id, { name: e.user.name, total: e.amount });
    }
  }
  const totals = Array.from(totalsByUser.values()).sort((a, b) => b.total - a.total);
  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
        <h3 className="text-xs text-text-muted uppercase tracking-wider mb-4">
          Who's paid what
        </h3>
        {totals.length === 0 ? (
          <p className="text-sm text-text-muted">No gas expenses logged yet.</p>
        ) : (
          <div className="space-y-3">
            {totals.map((t) => (
              <div key={t.name} className="flex items-center justify-between">
                <span className="text-sm">{t.name}</span>
                <span className="font-mono text-sm text-available">{formatMoney(t.total)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-sm font-medium">Total</span>
              <span className="font-mono text-sm font-medium">{formatMoney(grandTotal)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5">
        {expenses.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-3">
            No gas expenses logged yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {expenses.map((e) => {
              const canDelete = e.user.id === user?.id || user?.is_household_admin;
              return (
                <li key={e.id} className="py-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="text-text-faint mt-0.5">
                      <Fuel size={14} />
                    </span>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-sm">{e.user.name}</span>
                        <span className="font-mono text-sm text-available">
                          {formatMoney(e.amount)}
                        </span>
                      </div>
                      <p className="text-xs text-text-faint mt-0.5">{formatDate(e.created_at)}</p>
                      {e.note && <p className="text-xs text-text-muted mt-1">{e.note}</p>}
                    </div>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => onDelete(e.id)}
                      title="Delete expense"
                      className="text-text-faint hover:text-maintenance transition-colors shrink-0"
                    >
                      <X size={16} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
