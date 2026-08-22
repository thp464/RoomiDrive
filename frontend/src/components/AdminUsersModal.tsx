// src/components/AdminUsersModal.tsx
//
// Lets a household admin view current members and add a new roommate
// with a temporary password, without needing /docs. Mirrors the
// structural pattern of CheckoutModal/CheckinModal.
import { useEffect, useState } from "react";
import {
  addHouseholdUser,
  listHouseholdUsers,
  type HouseholdUser,
} from "../api/admin";

interface AdminUsersModalProps {
  open: boolean;
  onClose: () => void;
}

const emptyForm = {
  email: "",
  name: "",
  temporary_password: "",
  is_household_admin: false,
};

export default function AdminUsersModal({ open, onClose }: AdminUsersModalProps) {
  const [users, setUsers] = useState<HouseholdUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<HouseholdUser | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setJustAdded(null);
    refreshUsers();
  }, [open]);

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
      setError(
        typeof detail === "string" ? detail : "Couldn't add that user."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-neutral-900 text-neutral-100 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <h2 className="font-[Space_Grotesk] text-lg font-semibold">
            Household members
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          <h3 className="mb-2 font-[Inter] text-sm font-medium text-neutral-400">
            Current members
          </h3>
          {loadingUsers ? (
            <p className="font-[Inter] text-sm text-neutral-500">Loading…</p>
          ) : (
            <ul className="mb-6 divide-y divide-neutral-800 rounded-lg border border-neutral-800">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <div>
                    <p className="font-[Inter] text-sm font-medium">{u.name}</p>
                    <p className="font-[JetBrains_Mono] text-xs text-neutral-500">
                      {u.email}
                    </p>
                  </div>
                  {u.is_household_admin && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-[Inter] text-xs text-amber-400">
                      admin
                    </span>
                  )}
                </li>
              ))}
              {users.length === 0 && (
                <li className="px-3 py-2 font-[Inter] text-sm text-neutral-500">
                  No members yet.
                </li>
              )}
            </ul>
          )}

          <h3 className="mb-2 font-[Inter] text-sm font-medium text-neutral-400">
            Add a roommate
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block font-[Inter] text-xs text-neutral-400">
                Name
              </label>
              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 font-[Inter] text-sm outline-none focus:border-emerald-400"
                placeholder="Alex Roommate"
              />
            </div>
            <div>
              <label className="mb-1 block font-[Inter] text-xs text-neutral-400">
                Email
              </label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 font-[Inter] text-sm outline-none focus:border-emerald-400"
                placeholder="roommate@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block font-[Inter] text-xs text-neutral-400">
                Temporary password
              </label>
              <input
                required
                type="text"
                value={form.temporary_password}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    temporary_password: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 font-[JetBrains_Mono] text-sm outline-none focus:border-emerald-400"
                placeholder="changeme123"
              />
              <p className="mt-1 font-[Inter] text-xs text-neutral-500">
                They'll use this to log in for the first time. There's no
                forced reset yet — worth doing before this goes beyond a POC.
              </p>
            </div>
            <label className="flex items-center gap-2 font-[Inter] text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={form.is_household_admin}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    is_household_admin: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-neutral-600 bg-neutral-800"
              />
              Make this person a household admin
            </label>

            {error && (
              <p className="font-[Inter] text-sm text-red-400">{error}</p>
            )}
            {justAdded && (
              <p className="font-[Inter] text-sm text-emerald-400">
                Added {justAdded.name}. They can log in now.
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-emerald-500 px-4 py-2 font-[Inter] text-sm font-medium text-neutral-950 transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {submitting ? "Adding…" : "Add roommate"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
