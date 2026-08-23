import { client } from "./client";
import type { CurrentUser } from "../types";

export interface BootstrapPayload {
  household_name: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
  vehicle_name: string;
  setup_secret: string;
}

export async function bootstrapHousehold(payload: BootstrapPayload): Promise<string> {
  const res = await client.post("/auth/bootstrap-household", payload);
  return res.data.access_token;
}

export async function login(email: string, password: string): Promise<string> {
  // Backend expects OAuth2 form encoding, not JSON, for /auth/login
  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", password);
  const res = await client.post("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return res.data.access_token;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const res = await client.get("/auth/me");
  return res.data;
}
