import pytest
import time
import concurrent.futures
from fastapi.testclient import TestClient
import uuid
import random
import string
from app import services


def random_email():
    """Generate a random email address."""
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"user_{random_str}@example.com"


def random_password():
    """Generate a random password."""
    return ''.join(random.choices(string.ascii_letters + string.digits + string.punctuation, k=12))


def random_name():
    """Generate a random name."""
    first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth"]
    last_names = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor"]
    return f"{random.choice(first_names)} {random.choice(last_names)}"


def register_user(client):
    """Register a random user and return response data."""
    email = random_email()
    password = random_password()
    name = random_name()
    
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "name": name
        }
    )
    
    return {
        "status_code": response.status_code,
        "email": email,
        "password": password,
        "response_time": response.elapsed.total_seconds()
    }


def login_user(client, email, password):
    """Login a user and return response data."""
    response = client.post(
        "/api/auth/login",
        data={
            "username": email,
            "password": password
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if response.status_code == 200:
        data = response.json()
        access_token = data.get("access_token")
        refresh_token = data.get("refresh_token")
    else:
        access_token = None
        refresh_token = None
    
    return {
        "status_code": response.status_code,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "response_time": response.elapsed.total_seconds()
    }


def verify_token(client, access_token):
    """Verify a token and return response data."""
    response = client.get(
        "/api/auth/verify",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    return {
        "status_code": response.status_code,
        "response_time": response.elapsed.total_seconds()
    }


def refresh_token(client, refresh_token_str):
    """Refresh a token and return response data."""
    response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": refresh_token_str}
    )
    
    if response.status_code == 200:
        data = response.json()
        access_token = data.get("access_token")
        refresh_token = data.get("refresh_token")
    else:
        access_token = None
        refresh_token = None
    
    return {
        "status_code": response.status_code,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "response_time": response.elapsed.total_seconds()
    }


@pytest.mark.skip(reason="This test is resource-intensive and should be run manually")
def test_registration_load(client):
    """Test registration performance under load."""
    num_users = 50  # Adjust based on desired load
    max_workers = 10  # Adjust based on system capabilities
    
    start_time = time.time()
    results = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_user = {executor.submit(register_user, client): i for i in range(num_users)}
        for future in concurrent.futures.as_completed(future_to_user):
            results.append(future.result())
    
    total_time = time.time() - start_time
    
    # Calculate statistics
    success_count = sum(1 for r in results if r["status_code"] == 201)
    avg_response_time = sum(r["response_time"] for r in results) / len(results)
    
    print(f"\nRegistration Load Test Results:")
    print(f"Total requests: {num_users}")
    print(f"Successful registrations: {success_count}")
    print(f"Success rate: {success_count/num_users*100:.2f}%")
    print(f"Average response time: {avg_response_time:.4f} seconds")
    print(f"Total test time: {total_time:.2f} seconds")
    print(f"Requests per second: {num_users/total_time:.2f}")
    
    assert success_count / num_users >= 0.95  # At least 95% success rate


@pytest.mark.skip(reason="This test is resource-intensive and should be run manually")
def test_login_load(client, db_session):
    """Test login performance under load."""
    num_users = 50  # Adjust based on desired load
    max_workers = 10  # Adjust based on system capabilities
    
    # Create test users first
    users = []
    for _ in range(num_users):
        email = random_email()
        password = random_password()
        name = random_name()
        services.create_user(db_session, email, password, name)
        users.append({"email": email, "password": password})
    
    start_time = time.time()
    results = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_login = {executor.submit(login_user, client, user["email"], user["password"]): i 
                           for i, user in enumerate(users)}
        for future in concurrent.futures.as_completed(future_to_login):
            results.append(future.result())
    
    total_time = time.time() - start_time
    
    # Calculate statistics
    success_count = sum(1 for r in results if r["status_code"] == 200)
    avg_response_time = sum(r["response_time"] for r in results) / len(results)
    
    print(f"\nLogin Load Test Results:")
    print(f"Total requests: {num_users}")
    print(f"Successful logins: {success_count}")
    print(f"Success rate: {success_count/num_users*100:.2f}%")
    print(f"Average response time: {avg_response_time:.4f} seconds")
    print(f"Total test time: {total_time:.2f} seconds")
    print(f"Requests per second: {num_users/total_time:.2f}")
    
    assert success_count / num_users >= 0.95  # At least 95% success rate


@pytest.mark.skip(reason="This test is resource-intensive and should be run manually")
def test_token_verification_load(client, db_session):
    """Test token verification performance under load."""
    num_users = 50  # Adjust based on desired load
    max_workers = 10  # Adjust based on system capabilities
    
    # Create test users and tokens first
    tokens = []
    for _ in range(num_users):
        user = services.create_user(db_session, random_email(), random_password(), random_name())
        access_token = services.create_access_token({"sub": user.email, "user_id": str(user.id)})
        tokens.append(access_token)
    
    start_time = time.time()
    results = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_verify = {executor.submit(verify_token, client, token): i for i, token in enumerate(tokens)}
        for future in concurrent.futures.as_completed(future_to_verify):
            results.append(future.result())
    
    total_time = time.time() - start_time
    
    # Calculate statistics
    success_count = sum(1 for r in results if r["status_code"] == 200)
    avg_response_time = sum(r["response_time"] for r in results) / len(results)
    
    print(f"\nToken Verification Load Test Results:")
    print(f"Total requests: {num_users}")
    print(f"Successful verifications: {success_count}")
    print(f"Success rate: {success_count/num_users*100:.2f}%")
    print(f"Average response time: {avg_response_time:.4f} seconds")
    print(f"Total test time: {total_time:.2f} seconds")
    print(f"Requests per second: {num_users/total_time:.2f}")
    
    assert success_count / num_users >= 0.95  # At least 95% success rate 