"""
Proof-of-concept auth + household-scoping test.

1. Bootstraps a new household with an admin user.
2. Admin adds a second (non-admin) roommate account.
3. Roommate logs in and successfully checks out the household vehicle.
4. A user from a completely separate household cannot see or touch it.
5. An unauthenticated request is rejected outright.

Run with the server already running:
    uvicorn main:app --reload
    python test_auth_flow.py
"""
import time
import httpx

BASE_URL = "http://localhost:8000"


def bootstrap(client: httpx.Client, suffix: str) -> str:
    resp = client.post(f"{BASE_URL}/api/auth/bootstrap-household", json={
        "household_name": f"Household-{suffix}",
        "admin_name": "Admin",
        "admin_email": f"admin-{suffix}@example.com",
        "admin_password": "adminpass123",
        "vehicle_name": "Test Car",
    })
    resp.raise_for_status()
    return resp.json()["access_token"]


def main():
    suffix = str(int(time.time() * 1000))
    with httpx.Client(timeout=10.0) as client:
        admin_token = bootstrap(client, suffix)
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("✅ Bootstrapped household + admin account")

        # Admin adds a roommate
        roommate_email = f"roommate-{suffix}@example.com"
        resp = client.post(f"{BASE_URL}/api/admin/users", headers=admin_headers, json={
            "email": roommate_email,
            "name": "Roommate",
            "temporary_password": "roompass123",
        })
        resp.raise_for_status()
        print("✅ Admin added roommate:", resp.json()["email"])

        # Roommate logs in
        resp = client.post(f"{BASE_URL}/api/auth/login", data={
            "username": roommate_email,
            "password": "roompass123",
        })
        resp.raise_for_status()
        roommate_headers = {"Authorization": f"Bearer {resp.json()['access_token']}"}
        print("✅ Roommate logged in")

        # Roommate finds their household's vehicle
        resp = client.get(f"{BASE_URL}/api/vehicles", headers=roommate_headers)
        resp.raise_for_status()
        vehicle_id = resp.json()[0]["id"]

        # Roommate checks it out
        resp = client.post(f"{BASE_URL}/api/vehicles/{vehicle_id}/checkout",
                            headers=roommate_headers,
                            json={"destination_note": "grocery run"})
        resp.raise_for_status()
        body = resp.json()
        assert body["held_by"]["email"] == roommate_email
        print(f"✅ Roommate checked out vehicle (held_by = {body['held_by']['email']})")

        # A completely separate household cannot see this vehicle
        other_token = bootstrap(client, suffix + "-other")
        other_headers = {"Authorization": f"Bearer {other_token}"}
        resp = client.get(f"{BASE_URL}/api/vehicles/{vehicle_id}", headers=other_headers)
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}"
        print("✅ Cross-household access correctly blocked (404)")

        # No token at all
        resp = client.get(f"{BASE_URL}/api/vehicles/{vehicle_id}")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("✅ Unauthenticated access correctly blocked (401)")

        print("\n✅ ALL AUTH / HOUSEHOLD-SCOPING TESTS PASSED")


if __name__ == "__main__":
    main()
