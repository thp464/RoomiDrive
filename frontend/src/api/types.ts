export type VehicleStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE";

export interface Holder {
  id: number;
  name: string;
  email: string;
}

export interface Vehicle {
  id: number;
  name: string;
  status: VehicleStatus;
  held_by: Holder | null;
  checked_out_at: string | null;
  estimated_return_at: string | null;
  destination_note: string | null;
  current_mileage: number | null;
  fuel_pct: number | null;
  last_parking_note: string | null;
  last_checkin_at: string | null;
}

export interface CurrentUser {
  id: number;
  email: string;
  name: string;
  is_household_admin: boolean;
  household_id: number;
}

export interface CheckoutPayload {
  estimated_return_at?: string | null;
  destination_note?: string | null;
}

export interface CheckinPayload {
  parking_note: string;
  mileage: number;
  fuel_pct: number;
  lat?: number | null;
  lng?: number | null;
}
