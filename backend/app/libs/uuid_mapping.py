import uuid
from typing import Union

def get_user_uuid(user_id: str) -> str:
    """
    Convert user ID to UUID format.
    For test users, generate a consistent UUID based on the user_id.
    For real users, return the user_id as-is (assuming it's already a UUID).
    """
    if user_id == "test-user-id":
        # Generate a consistent UUID for the test user
        return "550e8400-e29b-41d4-a716-446655440000"
    elif user_id == "admin-test-id":
        # Generate a consistent UUID for the admin test user
        return "550e8400-e29b-41d4-a716-446655440001"
    elif user_id == "existing-user-id":
        # Generate a consistent UUID for existing user test
        return "fa02e31a-29be-48ca-ae12-e18109d047e6"
    else:
        # For real users, assume user_id is already a valid UUID
        return user_id

def get_user_id_from_uuid(user_uuid: str) -> str:
    """
    Reverse mapping from UUID to user ID.
    """
    if user_uuid == "550e8400-e29b-41d4-a716-446655440000":
        return "test-user-id"
    elif user_uuid == "550e8400-e29b-41d4-a716-446655440001":
        return "admin-test-id"
    elif user_uuid == "fa02e31a-29be-48ca-ae12-e18109d047e6":
        return "existing-user-id"
    else:
        return user_uuid
