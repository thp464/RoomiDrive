// src/api/admin.ts
//
// Admin-only household user management. Mirrors the shape of
// backend/routers/admin.py (AddUserRequest / UserOut).
import { client } from "./client";

export interface HouseholdUser {
  id: number;
  email: string;
  name: string;
  is_household_admin: boolean;
  household_id: number;
  must_reset_password: boolean;
}

export interface AddUserPayload {
  email: string;
  name: string;
  temporary_password: string;
  is_household_admin: boolean;
}

export async function listHouseholdUsers(): Promise<HouseholdUser[]> {
  const { data } = await client.get<HouseholdUser[]>("/admin/users");
  return data;
}

export async function addHouseholdUser(
  payload: AddUserPayload
): Promise<HouseholdUser> {
  const { data } = await client.post<HouseholdUser>("/admin/users", payload);
  return data;
}
