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
  miles_left: number | null;
  last_parking_location: string | null;
  last_parking_note: string | null;
  last_checkin_at: string | null;
}

export interface CurrentUser {
  id: number;
  email: string;
  name: string;
  is_household_admin: boolean;
  household_id: number;
  must_reset_password: boolean;
}

export interface CheckoutPayload {
  estimated_return_at?: string | null;
  destination_note?: string | null;
}

export interface Trip {
  id: number;
  user: Holder;
  checked_out_at: string;
  estimated_return_at: string | null;
  destination_note: string | null;
  checked_in_at: string | null;
  parking_location: string | null;
  parking_note: string | null;
  miles_left: number | null;
}

export interface CheckinPayload {
  parking_location: string;
  parking_note?: string | null;
  miles_left: number;
  lat?: number | null;
  lng?: number | null;
}
