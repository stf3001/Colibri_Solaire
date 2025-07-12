from uuid import UUID

def map_user_id_to_uuid(user_id: str) -> UUID:
    """Maps user IDs to UUIDs, handling test users with fixed UUIDs."""
    if user_id == 'test-user-id':
        return UUID('00000000-0000-4000-8000-000000000001')
    elif user_id == 'admin-user-id':
        return UUID('00000000-0000-4000-8000-000000000002')
    else:
        return UUID(user_id)
