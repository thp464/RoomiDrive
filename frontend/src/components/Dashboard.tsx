import { useEffect, useState, useCallback } from "react";
import { Car, LogOut, RefreshCw, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { listVehicles, checkoutVehicle, checkinVehicle, listTrips } from "../api/vehicles";
import type { Vehicle, Trip } from "../types";
import { StatusCard } from "./StatusCard";
import { CheckoutModal } from "./CheckoutModal";
import { CheckinModal } from "./CheckinModal";
import { AdminUsersModal } from "./AdminUsersModal";
import { TripHistory } from "./TripHistory";

export function Dashboard() {
  const { user, logout } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const refresh = useCallback(async () => {
    const vehicles = await listVehicles();
    const v = vehicles[0] ?? null;
    setVehicle(v);
    setTrips(v ? await listTrips(v.id) : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleCheckout(destinationNote: string, estimatedReturnAt: string | null) {
    if (!vehicle) return;
    const updated = await checkoutVehicle(vehicle.id, {
      destination_note: destinationNote || null,
      estimated_return_at: estimatedReturnAt,
    });
    setVehicle(updated);
    setShowCheckout(false);
    setTrips(await listTrips(updated.id));
  }

  async function handleCheckin(parkingLocation: string, parkingNote: string, milesLeft: number) {
    if (!vehicle) return;
    const updated = await checkinVehicle(vehicle.id, {
      parking_location: parkingLocation,
      parking_note: parkingNote || null,
      miles_left: milesLeft,
    });
    setVehicle(updated);
    setShowCheckin(false);
    setTrips(await listTrips(updated.id));
  }

  const isMine = vehicle?.held_by?.email === user?.email;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-available-dim flex items-center justify-center">
              <Car size={16} className="text-available" strokeWidth={2.25} />
            </div>
            <span className="font-display font-semibold tracking-tight">FleetSync</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted hidden sm:block">{user?.name}</span>
            {user?.is_household_admin && (
              <button
                onClick={() => setShowAdmin(true)}
                className="text-text-faint hover:text-text transition-colors"
                title="Manage household"
              >
                <Users size={17} />
              </button>
            )}
            <button
              onClick={logout}
              className="text-text-faint hover:text-text transition-colors"
              title="Log out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-8">
        {loading ? (
          <div className="text-center text-text-muted py-16 text-sm">Loading...</div>
        ) : !vehicle ? (
          <div className="text-center text-text-muted py-16 text-sm">
            No vehicle found for your household yet.
          </div>
        ) : (
          <>
            <StatusCard vehicle={vehicle} />

            <div className="flex gap-3 mt-5">
              {vehicle.status === "AVAILABLE" && (
                <button onClick={() => setShowCheckout(true)} className="btn-primary flex-1">
                  Check out
                </button>
              )}
              {vehicle.status === "IN_USE" && (
                <button
                  onClick={() => setShowCheckin(true)}
                  disabled={!isMine}
                  title={!isMine ? `Only ${vehicle.held_by?.name} can check this in` : undefined}
                  className="btn-primary flex-1"
                >
                  Check in
                </button>
              )}
              <button onClick={refresh} className="btn-secondary" title="Refresh status">
                <RefreshCw size={15} />
              </button>
            </div>

            {vehicle.status === "IN_USE" && !isMine && (
              <p className="text-xs text-text-faint text-center mt-3">
                Only {vehicle.held_by?.name} can check the car back in.
              </p>
            )}

            <div className="mt-8">
              <h3 className="text-xs text-text-muted uppercase tracking-wider mb-3">
                Recent activity
              </h3>
              <div className="bg-surface border border-border rounded-2xl px-5 py-1">
                <TripHistory trips={trips} />
              </div>
            </div>
          </>
        )}
      </main>

      {showCheckout && (
        <CheckoutModal onClose={() => setShowCheckout(false)} onSubmit={handleCheckout} />
      )}
      {showCheckin && (
        <CheckinModal onClose={() => setShowCheckin(false)} onSubmit={handleCheckin} />
      )}
      {showAdmin && <AdminUsersModal onClose={() => setShowAdmin(false)} />}
    </div>
  );
}