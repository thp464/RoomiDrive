// src/components/AdminUsersModal.tsx
//
// Lets a household admin view current members and add a new roommate
// with a temporary password, without needing /docs. Uses the same
// design tokens as StatusCard/Dashboard (font-display, text-text-*,
// btn-primary/btn-secondary, border-border, available/in-use/maintenance
// status colors).
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { addHouseholdUser, listHouseholdUsers } from "../api/admin";
import type { CurrentUser } from "../types";

interface AdminUsersModalProps {
  onClose: () => void;
}

const emptyForm = {
  email: "",
  name: "",
  temporary_password: "",
  is_household_admin: false,
};

export function AdminUsersModal({ onClose }: AdminUsersModalProps) {
  const [users, setUsers] = useState<CurrentUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<CurrentUser | null>(null);

  useEffect(() => {
    refreshUsers();
  }, []);

  async function refreshUsers() {
    setLoadingUsers(true);
    try {
      const data = await listHouseholdUsers();
      setUsers(data);
    } catch {
      setError("Couldn't load household members.");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setJustAdded(null);
    setSubmitting(true);
    try {
      const created = await addHouseholdUser(form);
      setUsers((prev) => [...prev, created]);
      setJustAdded(created);
      setForm(emptyForm);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Couldn't add that user.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display font-semibold tracking-tight">
            Household members
          </h2>
          <button
            onClick={onClose}
            title="Close"
            className="text-text-faint hover:text-text transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-5 py-4">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-faint">
            Current members
          </h3>

          {loadingUsers ? (
            <p className="text-sm text-text-muted py-2">Loading...</p>
          ) : (
            <ul className="mb-6 divide-y divide-border rounded-lg border border-border">
              {users.map((u) => (
                <li key={u.id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <p className="text-sm text-text">{u.name}</p>
                    <p className="text-xs text-text-faint">{u.email}</p>
                  </div>
                  {u.is_household_admin && (
                    <span className="rounded-full bg-in-use-dim px-2 py-0.5 text-xs text-in-use">
                      admin
                    </span>
                  )}
                </li>
              ))}
              {users.length === 0 && (
                <li className="px-3 py-3 text-sm text-text-muted">No members yet.</li>
              )}
            </ul>
          )}

          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-faint">
            Add a roommate
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-text-muted">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Alex Roommate"
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text outline-none focus:border-available"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-muted">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="roommate@example.com"
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text outline-none focus:border-available"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-muted">
                Temporary password
              </label>
              <input
                required
                value={form.temporary_password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, temporary_password: e.target.value }))
                }
                placeholder="changeme123"
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 font-mono text-sm text-text outline-none focus:border-available"
              />
              <p className="mt-1 text-xs text-text-faint">
                They'll use this to log in the first time. Nothing forces a
                reset yet — worth adding before this goes beyond a POC.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={form.is_household_admin}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_household_admin: e.target.checked }))
                }
                className="h-4 w-4 rounded border-border"
              />
              Make this person a household admin
            </label>

            {error && <p className="text-sm text-maintenance">{error}</p>}
            {justAdded && (
              <p className="text-sm text-available">
                Added {justAdded.name}. They can log in now.
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? "Adding..." : "Add roommate"}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary">
                Done
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}