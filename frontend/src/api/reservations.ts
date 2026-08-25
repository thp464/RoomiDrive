import { client } from "./client";
import type { Reservation, ReservationPayload } from "../types";

export async function listReservations(vehicleId: number): Promise<Reservation[]> {
  const res = await client.get(`/vehicles/${vehicleId}/reservations`);
  return res.data;
}

export async function createReservation(
  vehicleId: number,
  payload: ReservationPayload
): Promise<Reservation> {
  const res = await client.post(`/vehicles/${vehicleId}/reservations`, payload);
  return res.data;
}

export async function cancelReservation(vehicleId: number, reservationId: number): Promise<void> {
  await client.delete(`/vehicles/${vehicleId}/reservations/${reservationId}`);
}
