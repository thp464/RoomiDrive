import { client } from "./client";
import type { Vehicle, CheckoutPayload, CheckinPayload, Trip } from "../types";

export async function listVehicles(): Promise<Vehicle[]> {
  const res = await client.get("/vehicles");
  return res.data;
}

export async function getVehicle(id: number): Promise<Vehicle> {
  const res = await client.get(`/vehicles/${id}`);
  return res.data;
}

export async function checkoutVehicle(id: number, payload: CheckoutPayload): Promise<Vehicle> {
  const res = await client.post(`/vehicles/${id}/checkout`, payload);
  return res.data;
}

export async function checkinVehicle(id: number, payload: CheckinPayload): Promise<Vehicle> {
  const res = await client.post(`/vehicles/${id}/checkin`, payload);
  return res.data;
}

export async function listTrips(id: number): Promise<Trip[]> {
  const res = await client.get(`/vehicles/${id}/trips`);
  return res.data;
}
