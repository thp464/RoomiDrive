import { useState, type FormEvent } from "react";
import { Car, KeyRound, Users } from "lucide-react";
import { login, bootstrapHousehold } from "../api/auth";
import { useAuth } from "../context/AuthContext";

type Mode = "login" | "bootstrap";

export function AuthScreen() {
  const { loginWithToken } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Bootstrap fields
  const [householdName, setHouseholdName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [vehicleName, setVehicleName] = useState("");

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const token = await login(email, password);
      await loginWithToken(token);
    } catch {
      setError("Incorrect email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBootstrap(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const token = await bootstrapHousehold({
        household_name: householdName,
        admin_name: adminName,
        admin_email: email,
        admin_password: password,
        vehicle_name: vehicleName || "Household Car",
      });
      await loginWithToken(token);
    } catch {
      setError("Couldn't create household. That email may already be registered.");
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
          <span className="font-display font-semibold text-lg tracking-tight">FleetSync</span>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl shadow-black/20">
          <div className="flex mb-6 bg-bg rounded-lg p-1 border border-border">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${
                mode === "login" ? "bg-surface-raised text-text" : "text-text-muted"
              }`}
            >
              Log in
            </button>
            <button
              onClick={() => setMode("bootstrap")}
              className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${
                mode === "bootstrap" ? "bg-surface-raised text-text" : "text-text-muted"
              }`}
            >
              New household
            </button>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <Field label="Email">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                />
              </Field>
              <Field label="Password">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                />
              </Field>
              {error && <p className="text-maintenance text-sm">{error}</p>}
              <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
                <KeyRound size={15} />
                {submitting ? "Logging in..." : "Log in"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleBootstrap} className="space-y-3">
              <Field label="Household name">
                <input
                  required
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  className="input"
                  placeholder="Maple St House"
                />
              </Field>
              <Field label="Your name">
                <input
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="input"
                  placeholder="Alex"
                />
              </Field>
              <Field label="Vehicle name">
                <input
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  className="input"
                  placeholder="The Subaru"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                />
              </Field>
              <Field label="Password">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="At least 6 characters"
                />
              </Field>
              {error && <p className="text-maintenance text-sm">{error}</p>}
              <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
                <Users size={15} />
                {submitting ? "Creating..." : "Create household"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-text-faint mt-5">
          Roommate already set up your household? Ask them to add your account, then log in.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-text-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}
