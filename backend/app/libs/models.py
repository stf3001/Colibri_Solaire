from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from enum import Enum

class LeadStatus(str, Enum):
    """Enumeration for lead statuses."""
    soumis = 'soumis'
    visite = 'visité'
    signe = 'signé'
    installe = 'installé'

class UserType(str, Enum):
    """Enumeration for user types."""
    professionnel = 'professionnel'
    particulier = 'particulier'

class CommissionStatus(str, Enum):
    """Enumeration for commission statuses."""
    pending = 'pending'
    paid = 'paid'

class PaymentStatus(str, Enum):
    """Enumeration for payment statuses."""
    requested = 'requested'
    processing = 'processing'
    completed = 'completed'

class UserProfile(BaseModel):
    """Data model for a user profile."""
    user_id: UUID
    full_name: str
    user_type: UserType
    email: str | None = None
    phone: str | None = None
    city: str | None = None
    siret: str | None = None
    gdpr_consent_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class Lead(BaseModel):
    """Data model for a lead."""
    id: int
    user_id: UUID
    prospect_name: str
    prospect_phone: str
    prospect_email: str
    prospect_city: str | None = None
    notes: str | None = None
    status: LeadStatus = LeadStatus.soumis
    gdpr_consent_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class Commission(BaseModel):
    """Data model for a commission."""
    id: int
    lead_id: int
    user_id: UUID
    amount: float
    status: CommissionStatus = CommissionStatus.pending
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class Payment(BaseModel):
    """Data model for a payment."""
    id: int
    user_id: UUID
    amount_requested: float
    status: PaymentStatus = PaymentStatus.requested
    requested_at: datetime
    processed_at: datetime | None = None

    class Config:
        orm_mode = True

class SenderType(str, Enum):
    """Enumeration for message sender types."""
    admin = 'admin'
    apporteur = 'apporteur'

class MessageType(str, Enum):
    """Enumeration for message types."""
    announcement = 'announcement'  # Annonce générale à tous
    private = 'private'  # Message privé à un utilisateur spécifique

class Message(BaseModel):
    """Data model for a message (announcement or private)."""
    id: int
    sender_id: str  # UUID de l'expéditeur
    sender_type: SenderType
    recipient_id: str | None = None  # NULL pour annonces, UUID pour messages privés
    message_type: MessageType
    subject: str
    content: str
    is_read: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class AnnouncementRead(BaseModel):
    """Data model for tracking which announcements users have read."""
    id: int
    message_id: int
    user_id: str  # UUID de l'utilisateur
    read_at: datetime

    class Config:
        orm_mode = True
