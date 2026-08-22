// src/api/admin.ts
//
// Admin-only household user management. Mirrors the shape of
// backend/routers/admin.py (AddUserRequest / UserOut).
import { api } from "./client";

export interface HouseholdUser {
  id: number;
  email: string;
  name: string;
  is_household_admin: boolean;
  household_id: number;
}

export interface AddUserPayload {
  email: string;
  name: string;
  temporary_password: string;
  is_household_admin: boolean;
}

export async function listHouseholdUsers(): Promise<HouseholdUser[]> {
  const { data } = await api.get<HouseholdUser[]>("/admin/users");
  return data;
}

export async function addHouseholdUser(
  payload: AddUserPayload
): Promise<HouseholdUser> {
  const { data } = await api.post<HouseholdUser>("/admin/users", payload);
  return data;
}
