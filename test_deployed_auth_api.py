import httpx
import pytest
import uuid
import time

API_BASE = "https://authv2-production.up.railway.app/api/v1"

# --- Helper Function ---
def register_and_login(email_prefix="test_user", is_admin=False, password_override=None):
    """Helper to register and login a user, returns credentials and tokens."""
    random_part = str(uuid.uuid4())[:8]
    email = f"{email_prefix}_{random_part}@example.com"
    # Use environment variables or a secure way to manage default admin passwords
    password = password_override or ("AdminPassword123!" if is_admin else "TestPassword123!")
    name = f"{'Admin' if is_admin else 'Test'} User {random_part}"

    print(f"\n[Helper] Registering {'admin' if is_admin else 'user'}: {email}")
    reg_payload = {
        "email": email,
        "password": password,
        "name": name,
    }
    # Add superuser flag if registering admin - adjust field name if needed
    # Ensure your API supports this or handle admin creation differently
    if is_admin:
        reg_payload["is_superuser"] = True

    # Use /api/v1/users/register for registration
    reg_resp = httpx.post(f"{API_BASE}/users/register", json=reg_payload)
    print(f"[Helper] Register response: {reg_resp.status_code}")
    # Allow 400 if user/admin already exists (e.g., from previous test run or manual creation)
    # Registration endpoint is /api/v1/users/register
    assert reg_resp.status_code in (200, 201, 400), f"Registration failed unexpectedly: {reg_resp.text}"

    # If registration succeeded or user already existed, attempt login
    print(f"[Helper] Logging in {'admin' if is_admin else 'user'}: {email}")
    login_resp = httpx.post(f"{API_BASE}/auth/login", data={
        "username": email,
        "password": password
    })
    print(f"[Helper] Login response: {login_resp.status_code}")
    if login_resp.status_code != 200:
         pytest.fail(f"Login failed for {email}: {login_resp.status_code} - {login_resp.text}")
    tokens = login_resp.json()
    assert "access_token" in tokens
    # Ensure refresh token is returned for subsequent tests
    assert "refresh_token" in tokens, "Refresh token not found in login response"

    # Get user ID after successful login/registration
    user_id = None
    try:
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        me_resp = httpx.get(f"{API_BASE}/users/me", headers=headers)
        if me_resp.status_code == 200:
            user_id = me_resp.json().get("id")
            print(f"[Helper] Obtained User ID: {user_id}")
        else:
             print(f"[Helper] Warning: Could not get user ID after login ({me_resp.status_code})")
    except Exception as e:
        print(f"[Helper] Warning: Error getting user ID: {e}")


    return {"id": user_id, "email": email, "password": password, "name": name, "tokens": tokens}


# --- Fixtures ---

@pytest.fixture(scope="module")
def registered_user():
    """Registers a regular user once for the module."""
    return register_and_login(email_prefix="module_user")

@pytest.fixture(scope="module")
def registered_admin():
    """Registers an admin user once for the module."""
    # Note: Ensure your API allows creating superusers via registration
    # or handle admin creation differently if needed.
    return register_and_login(email_prefix="module_admin", is_admin=True)

# --- Health & Default Tests ---

def test_health_check():
    """GET /api/v1/health"""
    resp = httpx.get(f"{API_BASE}/health")
    print("\nHealth check response:", resp.json())
    assert resp.status_code == 200
    # Check for expected keys, allow various 'ok' statuses
    assert "status" in resp.json()

def test_root_endpoint():
    """GET /"""
    # Assuming the root might redirect or return a simple message/docs
    # Using the base URL without /api/v1
    root_url = API_BASE.replace("/api/v1", "")
    resp = httpx.get(root_url + "/")
    print(f"\nRoot endpoint ({root_url}/) response:", resp.status_code)
    # Check for common success codes or redirects
    assert resp.status_code in (200, 301, 302, 307, 308)

# --- Auth Tests ---

def test_login_existing_user(registered_user):
    """POST /api/v1/auth/login"""
    print(f"\nAttempting login for existing user: {registered_user['email']}")
    login_resp = httpx.post(f"{API_BASE}/auth/login", data={
        "username": registered_user['email'],
        "password": registered_user['password']
    })
    print("Login response:", login_resp.status_code, login_resp.text)
    assert login_resp.status_code == 200
    tokens = login_resp.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens

def test_token_refresh(registered_user):
    """POST /api/v1/auth/refresh"""
    print(f"\nAttempting to refresh token for: {registered_user['email']}")
    refresh_token = registered_user['tokens']['refresh_token']
    # Assuming refresh endpoint expects refresh token in body or specific header
    # Trying body first, adjust if needed. Using Authorization Bearer is also common.
    payload = {"refresh_token": refresh_token}
    refresh_resp = httpx.post(f"{API_BASE}/auth/refresh", json=payload)

    # Fallback: Try using Authorization header if body fails
    if refresh_resp.status_code != 200:
        print("Refresh with body failed, trying Authorization header...")
        refresh_headers = {"Authorization": f"Bearer {refresh_token}"}
        refresh_resp = httpx.post(f"{API_BASE}/auth/refresh", headers=refresh_headers)

    print("Refresh response:", refresh_resp.status_code, refresh_resp.text)
    assert refresh_resp.status_code == 200, "Token refresh failed"
    new_tokens = refresh_resp.json()
    assert "access_token" in new_tokens
    assert new_tokens["access_token"] != registered_user['tokens']['access_token']

    # Verify the new access token works
    new_access_headers = {"Authorization": f"Bearer {new_tokens['access_token']}"}
    verify_resp = httpx.get(f"{API_BASE}/users/me", headers=new_access_headers)
    print("Verify new token response:", verify_resp.status_code, verify_resp.text)
    assert verify_resp.status_code == 200
    assert verify_resp.json()["email"] == registered_user['email']

def test_password_reset_request():
    """POST /api/v1/auth/password-reset/request"""
    email_to_reset = f"pwd_reset_req_{str(uuid.uuid4())[:8]}@example.com"
    print(f"\nAttempting password reset request for: {email_to_reset}")
    # Endpoint expects email as a query parameter
    reset_req_resp = httpx.post(f"{API_BASE}/auth/password-reset/request", params={
        "email": email_to_reset
    })
    print("Password reset request response:", reset_req_resp.status_code, reset_req_resp.text)
    assert reset_req_resp.status_code == 200 # Should succeed even if user doesn't exist

def test_password_reset_verify_endpoint_exists():
    """POST /api/v1/auth/password-reset/verify (Basic Check)"""
    print("\nChecking password reset verify endpoint existence")
    # We can't actually verify without a real token, just check endpoint responds
    resp = httpx.post(f"{API_BASE}/auth/password-reset/verify", json={
        "token": "dummy_token",
        "new_password": "SomeNewPassword123!"
    })
    print("Password reset verify response:", resp.status_code, resp.text)
    # Expecting 400 Bad Request (invalid token) or similar, not 404 Not Found
    assert resp.status_code != 404

def test_password_reset_reset_endpoint_exists():
    """POST /api/v1/auth/password-reset/reset (Basic Check)"""
    print("\nChecking password reset actual reset endpoint existence")
    # Similar to verify, just check endpoint responds
    resp = httpx.post(f"{API_BASE}/auth/password-reset/reset", json={
        "token": "dummy_token",
        "new_password": "SomeNewPassword123!"
    })
    print("Password reset reset response:", resp.status_code, resp.text)
    assert resp.status_code != 404

def test_logout(registered_user):
    """POST /api/v1/auth/logout (assuming POST)"""
    print(f"\nAttempting to logout user: {registered_user['email']}")
    access_token = registered_user['tokens']['access_token']
    headers = {"Authorization": f"Bearer {access_token}"}

    # Check token is valid before logout
    verify_resp_before = httpx.get(f"{API_BASE}/users/me", headers=headers)
    assert verify_resp_before.status_code == 200

    # Call logout endpoint
    logout_resp = httpx.post(f"{API_BASE}/auth/logout", headers=headers)
    print("Logout response:", logout_resp.status_code, logout_resp.text)
    assert logout_resp.status_code in (200, 204) # Allow OK or No Content

    # Verify token is invalid after logout (allow a small delay for propagation)
    time.sleep(1)
    print("Verifying token after logout...")
    verify_resp_after = httpx.get(f"{API_BASE}/users/me", headers=headers)
    print("Verify after logout response:", verify_resp_after.status_code, verify_resp_after.text)
    assert verify_resp_after.status_code in (401, 403) # Expect Unauthorized or Forbidden

# --- User Tests ---

def test_register_endpoint_exists():
    """POST /api/v1/users/register (Basic Check via helper)"""
    # The fixture setup implicitly tests this, but we can add an explicit check
    print("\nChecking registration endpoint via helper")
    # If register_and_login doesn't raise an exception, the endpoint is likely reachable
    try:
        register_and_login("reg_check_user")
        assert True
    except Exception as e:
        pytest.fail(f"Registration endpoint check failed: {e}")

def test_verify_email_endpoint_exists():
    """POST /api/v1/users/verify-email (Basic Check)"""
    print("\nChecking verify email endpoint existence")
    # We can't actually verify without a real token, just check endpoint responds
    resp = httpx.post(f"{API_BASE}/users/verify-email", json={"token": "dummy_token"})
    print("Verify email response:", resp.status_code, resp.text)
    # Expecting 400 Bad Request (invalid token) or similar, not 404 Not Found
    assert resp.status_code != 404

def test_get_user_me(registered_user):
    """GET /api/v1/users/me"""
    print(f"\nAttempting to get profile for: {registered_user['email']}")
    headers = {"Authorization": f"Bearer {registered_user['tokens']['access_token']}"}
    me_resp = httpx.get(f"{API_BASE}/users/me", headers=headers)
    print("Me response:", me_resp.status_code, me_resp.text)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == registered_user['email']
    # Store user ID for later tests if needed
    registered_user['id'] = me_resp.json().get('id')


def test_update_user_me(registered_user):
    """PUT /api/v1/users/me"""
    print(f"\nAttempting to update profile for: {registered_user['email']}")
    headers = {"Authorization": f"Bearer {registered_user['tokens']['access_token']}"}
    new_name = f"Updated Name {str(uuid.uuid4())[:4]}"
    update_resp = httpx.put(f"{API_BASE}/users/me", headers=headers, json={
        "name": new_name
    })
    print("Update response:", update_resp.status_code, update_resp.text)
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == new_name

    # Verify the update
    verify_resp = httpx.get(f"{API_BASE}/users/me", headers=headers)
    assert verify_resp.status_code == 200
    assert verify_resp.json()["name"] == new_name

# --- Admin Tests ---

@pytest.mark.admin
def test_admin_list_users(registered_admin, registered_user):
    """GET /api/v1/admin/users"""
    print(f"\nAttempting to list users as admin: {registered_admin['email']}")
    headers = {"Authorization": f"Bearer {registered_admin['tokens']['access_token']}"}
    list_resp = httpx.get(f"{API_BASE}/admin/users", headers=headers)
    print("List users response:", list_resp.status_code)
    assert list_resp.status_code == 200
    users_list = list_resp.json()
    assert isinstance(users_list, list)
    emails_in_list = [user.get("email") for user in users_list]
    print(f"Emails found: {emails_in_list}")
    # Check that both users created by fixtures are present
    assert registered_admin['email'] in emails_in_list
    assert registered_user['email'] in emails_in_list

@pytest.mark.admin
def test_regular_user_cannot_list_users(registered_user):
    """GET /api/v1/admin/users (Permissions Check)"""
    print(f"\nAttempting to list users as regular user: {registered_user['email']}")
    headers = {"Authorization": f"Bearer {registered_user['tokens']['access_token']}"}
    list_resp = httpx.get(f"{API_BASE}/admin/users", headers=headers)
    print("List users response (regular user):", list_resp.status_code)
    assert list_resp.status_code == 403 # Expect Forbidden

@pytest.mark.admin
def test_admin_create_user(registered_admin):
    """POST /api/v1/admin/users"""
    print(f"\nAdmin {registered_admin['email']} attempting to create a new user")
    headers = {"Authorization": f"Bearer {registered_admin['tokens']['access_token']}"}
    random_part = str(uuid.uuid4())[:8]
    new_email = f"created_by_admin_{random_part}@example.com"
    new_password = "PasswordForAdminCreatedUser1!"
    new_name = f"Admin Created {random_part}"
    create_resp = httpx.post(f"{API_BASE}/admin/users", headers=headers, json={
        "email": new_email,
        "password": new_password,
        "name": new_name
    })
    print("Admin create user response:", create_resp.status_code, create_resp.text)
    assert create_resp.status_code in (200, 201)
    assert create_resp.json()["email"] == new_email

@pytest.mark.admin
def test_admin_get_user_by_id(registered_admin, registered_user):
    """GET /api/v1/admin/users/{user_id}"""
    user_id_to_get = registered_user.get('id')
    if not user_id_to_get:
         # Fetch the ID if not already stored in fixture
        user_me_headers = {"Authorization": f"Bearer {registered_user['tokens']['access_token']}"}
        me_resp = httpx.get(f"{API_BASE}/users/me", headers=user_me_headers)
        if me_resp.status_code == 200:
            user_id_to_get = me_resp.json().get("id")
            registered_user['id'] = user_id_to_get # Store it
        else:
             pytest.fail("Could not retrieve target user ID for admin test")

    print(f"\nAdmin {registered_admin['email']} attempting to get user ID: {user_id_to_get}")
    headers = {"Authorization": f"Bearer {registered_admin['tokens']['access_token']}"}
    get_resp = httpx.get(f"{API_BASE}/admin/users/{user_id_to_get}", headers=headers)
    print("Admin get user by ID response:", get_resp.status_code, get_resp.text)
    assert get_resp.status_code == 200
    assert get_resp.json()["email"] == registered_user['email']
    assert get_resp.json()["id"] == user_id_to_get

@pytest.mark.admin
def test_admin_update_user_by_id(registered_admin, registered_user):
    """PUT /api/v1/admin/users/{user_id}"""
    user_id_to_update = registered_user.get('id')
    if not user_id_to_update:
         pytest.fail("Target user ID not found for admin update test")

    print(f"\nAdmin {registered_admin['email']} attempting to update user ID: {user_id_to_update}")
    headers = {"Authorization": f"Bearer {registered_admin['tokens']['access_token']}"}
    updated_name = f"AdminUpdated_{str(uuid.uuid4())[:4]}"
    update_resp = httpx.put(f"{API_BASE}/admin/users/{user_id_to_update}", headers=headers, json={
        "name": updated_name,
        "is_active": False # Example: Deactivate user
    })
    print("Admin update user response:", update_resp.status_code, update_resp.text)
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == updated_name
    assert update_resp.json()["is_active"] == False

    # Verify change with another get call
    get_resp = httpx.get(f"{API_BASE}/admin/users/{user_id_to_update}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == updated_name
    assert get_resp.json()["is_active"] == False

    # --- Add Role / Remove Role Tests ---
    # These require the user model to support roles and the API to expose them
    # Assuming roles are simple strings in a list

    new_role = "tester_role"

    # Add Role
    print(f"\nAdmin attempting to add role '{new_role}' to user {user_id_to_update}")
    add_role_resp = httpx.post(f"{API_BASE}/admin/users/{user_id_to_update}/roles/{new_role}", headers=headers)
    print("Admin add role response:", add_role_resp.status_code, add_role_resp.text)
    assert add_role_resp.status_code == 200
    # Check if 'roles' field exists and includes the new role
    assert new_role in add_role_resp.json().get("roles", [])

    # Verify role addition
    get_resp_after_add = httpx.get(f"{API_BASE}/admin/users/{user_id_to_update}", headers=headers)
    assert new_role in get_resp_after_add.json().get("roles", [])

    # Remove Role
    print(f"\nAdmin attempting to remove role '{new_role}' from user {user_id_to_update}")
    remove_role_resp = httpx.delete(f"{API_BASE}/admin/users/{user_id_to_update}/roles/{new_role}", headers=headers)
    print("Admin remove role response:", remove_role_resp.status_code, remove_role_resp.text)
    assert remove_role_resp.status_code == 200
    assert new_role not in remove_role_resp.json().get("roles", [])

    # Verify role removal
    get_resp_after_remove = httpx.get(f"{API_BASE}/admin/users/{user_id_to_update}", headers=headers)
    assert new_role not in get_resp_after_remove.json().get("roles", [])


@pytest.mark.admin
def test_admin_get_audit_logs(registered_admin):
    """GET /api/v1/admin/audit-logs"""
    print(f"\nAdmin {registered_admin['email']} attempting to get audit logs")
    headers = {"Authorization": f"Bearer {registered_admin['tokens']['access_token']}"}
    audit_resp = httpx.get(f"{API_BASE}/admin/audit-logs", headers=headers)
    print("Admin get audit logs response:", audit_resp.status_code)
    assert audit_resp.status_code == 200
    logs = audit_resp.json()
    assert isinstance(logs, list)
    # Basic check if logs exist, more specific checks could be added
    # assert len(logs) > 0 # This might fail on a clean deployment

@pytest.mark.admin
def test_admin_get_audit_logs_summary(registered_admin):
    """GET /api/v1/admin/audit-logs/summary"""
    print(f"\nAdmin {registered_admin['email']} attempting to get audit logs summary")
    headers = {"Authorization": f"Bearer {registered_admin['tokens']['access_token']}"}
    summary_resp = httpx.get(f"{API_BASE}/admin/audit-logs/summary", headers=headers)
    print("Admin get audit summary response:", summary_resp.status_code)
    assert summary_resp.status_code == 200
    summary = summary_resp.json()
    # Check for expected keys in the summary
    assert "total_events" in summary
    assert "action_counts" in summary
    assert "most_active_users" in summary

@pytest.mark.admin
def test_admin_get_security_events(registered_admin):
    """GET /api/v1/admin/audit-logs/security"""
    print(f"\nAdmin {registered_admin['email']} attempting to get security events")
    headers = {"Authorization": f"Bearer {registered_admin['tokens']['access_token']}"}
    security_resp = httpx.get(f"{API_BASE}/admin/audit-logs/security", headers=headers)
    print("Admin get security events response:", security_resp.status_code)
    assert security_resp.status_code == 200
    events = security_resp.json()
    assert isinstance(events, list)
    # More specific checks could be added if certain security events are expected 