import { useEffect, useState, useCallback } from "react";
import { Car, LogOut, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { listVehicles, checkoutVehicle, checkinVehicle } from "../api/vehicles";
import type { Vehicle } from "../types";
import { StatusCard } from "./StatusCard";
import { CheckoutModal } from "./CheckoutModal";
import { CheckinModal } from "./CheckinModal";

export function Dashboard() {
  const { user, logout } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);

  const refresh = useCallback(async () => {
    const vehicles = await listVehicles();
    setVehicle(vehicles[0] ?? null);
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
  }

  const isMine = vehicle?.held_by?.email === user?.email;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-available-dim flex items-center justify-center">
              <Car size={16} className="text-available" strokeWidth={2.25} />
            </div>
            <span className="font-display font-semibold tracking-tight">FleetSync</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted hidden sm:block">{user?.name}</span>
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

      <main className="max-w-3xl mx-auto px-5 py-8">
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
          </>
        )}
      </main>

      {showCheckout && (
        <CheckoutModal onClose={() => setShowCheckout(false)} onSubmit={handleCheckout} />
      )}
      {showCheckin && (
        <CheckinModal onClose={() => setShowCheckin(false)} onSubmit={handleCheckin} />
      )}
    </div>
  );
}
