import { client } from "./client";
import type { GasExpense, GasExpensePayload } from "../types";

export async function listGasExpenses(vehicleId: number): Promise<GasExpense[]> {
  const res = await client.get(`/vehicles/${vehicleId}/gas-expenses`);
  return res.data;
}

export async function createGasExpense(
  vehicleId: number,
  payload: GasExpensePayload
): Promise<GasExpense> {
  const res = await client.post(`/vehicles/${vehicleId}/gas-expenses`, payload);
  return res.data;
}

export async function deleteGasExpense(vehicleId: number, expenseId: number): Promise<void> {
  await client.delete(`/vehicles/${vehicleId}/gas-expenses/${expenseId}`);
}
