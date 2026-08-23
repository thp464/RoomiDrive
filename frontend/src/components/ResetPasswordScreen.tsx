import { useState, type FormEvent } from "react";
import { Car, KeyRound } from "lucide-react";
import { changePassword } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export function ResetPasswordScreen() {
  const { user, refreshUser, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      await refreshUser();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Couldn't change password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 rounded-lg bg-available-dim flex items-center justify-center">
            <Car size={18} className="text-available" strokeWidth={2.25} />
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">RoomiDrive</span>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl shadow-black/20">
          <h2 className="font-display text-lg font-semibold mb-1">Set a new password</h2>
          <p className="text-sm text-text-muted mb-5">
            Hi {user?.name} — you're using a temporary password. Set your own before continuing.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="block text-xs text-text-muted mb-1.5">Temporary password</span>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input"
                placeholder="The one an admin gave you"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-text-muted mb-1.5">New password</span>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
                placeholder="At least 6 characters"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-text-muted mb-1.5">Confirm new password</span>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
              />
            </label>

            {error && <p className="text-maintenance text-sm">{error}</p>}

            <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
              <KeyRound size={15} />
              {submitting ? "Saving..." : "Set password"}
            </button>
          </form>
        </div>

        <button
          onClick={logout}
          className="block w-full text-center text-xs text-text-faint hover:text-text mt-5 transition-colors"
        >
          Log out instead
        </button>
      </div>
    </div>
  );
}
