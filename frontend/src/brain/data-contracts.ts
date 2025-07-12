/** AdminStatsResponse */
export interface AdminStatsResponse {
  /** Total Users */
  total_users: number;
  /** Total Leads */
  total_leads: number;
  /** Total Commissions Paid */
  total_commissions_paid: number;
  /** Pending Commission Requests */
  pending_commission_requests: number;
  /** Anniversary Alerts */
  anniversary_alerts: number;
}

/** AnniversaryAlertResponse */
export interface AnniversaryAlertResponse {
  /** User Id */
  user_id: string;
  /** Full Name */
  full_name: string;
  /**
   * Anniversary Date
   * @format date-time
   */
  anniversary_date: string;
  /** Vouchers Pending */
  vouchers_pending: number;
  /** Days Until Anniversary */
  days_until_anniversary: number;
  /** Referral Count */
  referral_count: number;
}

/** CommissionBalance */
export interface CommissionBalance {
  /** Due Balance */
  due_balance: number;
}

/**
 * CommissionStatus
 * Enumeration for commission statuses.
 */
export enum CommissionStatus {
  Pending = "pending",
  Paid = "paid",
}

/** ContractGenerationRequest */
export interface ContractGenerationRequest {
  /** Company Name */
  company_name: string;
  /** Siret Number */
  siret_number: string;
}

/** ContractResponse */
export interface ContractResponse {
  /** Id */
  id: number;
  /** Contract Type */
  contract_type: string;
  /** Company Name */
  company_name: string;
  /** Siret Number */
  siret_number: string;
  /** Contract Html */
  contract_html: string;
  /** Is Signed */
  is_signed: boolean;
  /** Signed At */
  signed_at?: string | null;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
}

/** ContractSignatureRequest */
export interface ContractSignatureRequest {
  /** Contract Id */
  contract_id?: number | null;
}

/** CreateLeadRequest */
export interface CreateLeadRequest {
  /** Prospect Name */
  prospect_name: string;
  /** Prospect Phone */
  prospect_phone: string;
  /** Prospect Email */
  prospect_email: string;
  /** Prospect City */
  prospect_city?: string | null;
  /** Notes */
  notes?: string | null;
}

/**
 * CreateUserProfileRequest
 * Request model for creating a user profile.
 */
export interface CreateUserProfileRequest {
  /** Full Name */
  full_name: string;
  /** Enumeration for user types. */
  user_type: UserType;
  /** Phone */
  phone: string;
  /** Email */
  email: string;
  /**
   * City
   * @default "Non renseigné"
   */
  city?: string;
  /** Gdpr Consent */
  gdpr_consent: boolean;
}

/** CreateUserProfileResponse */
export interface CreateUserProfileResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** User Id */
  user_id: string;
}

/** DashboardResponse */
export interface DashboardResponse {
  /** Data model for a user profile. */
  user_profile: UserProfile;
  stats: DashboardStats;
  /** Commission Balance */
  commission_balance: number;
  /** Recent Leads */
  recent_leads: Lead[];
}

/** DashboardStats */
export interface DashboardStats {
  /** Total Leads */
  total_leads: number;
  /** Leads Submitted */
  leads_submitted: number;
  /** Leads Visited */
  leads_visited: number;
  /** Leads Signed */
  leads_signed: number;
  /** Leads Installed */
  leads_installed: number;
}

/** DeleteMessageRequest */
export interface DeleteMessageRequest {
  /** Message Id */
  message_id: number;
}

/** DeleteUserRequest */
export interface DeleteUserRequest {
  /** User Id */
  user_id: string;
  /** Confirm Deletion */
  confirm_deletion: boolean;
}

/** GuideAcceptanceRequest */
export type GuideAcceptanceRequest = object;

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/**
 * Lead
 * Data model for a lead.
 */
export interface Lead {
  /** Id */
  id: number;
  /**
   * User Id
   * @format uuid
   */
  user_id: string;
  /** Prospect Name */
  prospect_name: string;
  /** Prospect Phone */
  prospect_phone: string;
  /** Prospect Email */
  prospect_email: string;
  /** Prospect City */
  prospect_city?: string | null;
  /** Notes */
  notes?: string | null;
  /**
   * Enumeration for lead statuses.
   * @default "soumis"
   */
  status?: LeadStatus;
  /**
   * Gdpr Consent Date
   * @format date-time
   */
  gdpr_consent_date: string;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /**
   * Updated At
   * @format date-time
   */
  updated_at: string;
}

/** LeadDetails */
export interface LeadDetails {
  /** Id */
  id: number;
  /**
   * User Id
   * @format uuid
   */
  user_id: string;
  /** Prospect Name */
  prospect_name: string;
  /** Prospect Phone */
  prospect_phone: string;
  /** Prospect Email */
  prospect_email: string;
  /** Prospect City */
  prospect_city?: string | null;
  /** Notes */
  notes?: string | null;
  /**
   * Enumeration for lead statuses.
   * @default "soumis"
   */
  status?: LeadStatus;
  /**
   * Gdpr Consent Date
   * @format date-time
   */
  gdpr_consent_date: string;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /**
   * Updated At
   * @format date-time
   */
  updated_at: string;
  commission_status?: CommissionStatus | null;
}

/**
 * LeadStatus
 * Enumeration for lead statuses.
 */
export enum LeadStatus {
  Soumis = "soumis",
  Visite = "visité",
  Signe = "signé",
  Installe = "installé",
}

/** MarkAsReadRequest */
export interface MarkAsReadRequest {
  /** Message Id */
  message_id: number;
}

/**
 * Message
 * Data model for a message (announcement or private).
 */
export interface Message {
  /** Id */
  id: number;
  /** Sender Id */
  sender_id: string;
  /** Enumeration for message sender types. */
  sender_type: SenderType;
  /** Recipient Id */
  recipient_id?: string | null;
  /** Enumeration for message types. */
  message_type: MessageType;
  /** Subject */
  subject: string;
  /** Content */
  content: string;
  /**
   * Is Read
   * @default false
   */
  is_read?: boolean;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /**
   * Updated At
   * @format date-time
   */
  updated_at: string;
}

/**
 * MessageType
 * Enumeration for message types.
 */
export enum MessageType {
  Announcement = "announcement",
  Private = "private",
}

/** MessagesResponse */
export interface MessagesResponse {
  /** Announcements */
  announcements: Message[];
  /** Private Messages */
  private_messages: Message[];
  /** Unread Count */
  unread_count: number;
}

/** PaymentRequestResponse */
export interface PaymentRequestResponse {
  /** Id */
  id: number;
  /** User Id */
  user_id: string;
  /** Apporteur Name */
  apporteur_name: string;
  /** Amount Requested */
  amount_requested: number;
  /** Status */
  status: string;
  /**
   * Requested At
   * @format date-time
   */
  requested_at: string;
  /** Processed At */
  processed_at: string | null;
}

/** ProcessPaymentRequest */
export interface ProcessPaymentRequest {
  /** Payment Id */
  payment_id: number;
  /** Payment Method */
  payment_method: string;
  /** Payment Date */
  payment_date?: string | null;
}

/** ProfileCheckResponse */
export interface ProfileCheckResponse {
  /** Is Complete */
  is_complete: boolean;
  /** Missing Fields */
  missing_fields: string[];
  /** User Profile */
  user_profile?: Record<string, any> | null;
}

/** RequestPaymentForUserRequest */
export interface RequestPaymentForUserRequest {
  /** User Id */
  user_id: string;
}

/** SendAnnouncementRequest */
export interface SendAnnouncementRequest {
  /** Subject */
  subject: string;
  /** Content */
  content: string;
}

/**
 * SenderType
 * Enumeration for message sender types.
 */
export enum SenderType {
  Admin = "admin",
  Apporteur = "apporteur",
}

/** UpdateLeadStatusRequest */
export interface UpdateLeadStatusRequest {
  /** Lead Id */
  lead_id: number;
  /** Enumeration for lead statuses. */
  new_status: LeadStatus;
  /** Amount Ht */
  amount_ht?: number | null;
}

/** UserDetailsResponse */
export interface UserDetailsResponse {
  /** User Profile */
  user_profile: Record<string, any>;
  /** Leads */
  leads: Record<string, any>[];
  /** Commissions */
  commissions: Record<string, any>[];
  /** Payments */
  payments: Record<string, any>[];
  /** Messages */
  messages: Record<string, any>[];
}

/**
 * UserProfile
 * Data model for a user profile.
 */
export interface UserProfile {
  /**
   * User Id
   * @format uuid
   */
  user_id: string;
  /** Full Name */
  full_name: string;
  /** Enumeration for user types. */
  user_type: UserType;
  /** Email */
  email?: string | null;
  /** Phone */
  phone?: string | null;
  /** City */
  city?: string | null;
  /** Siret */
  siret?: string | null;
  /**
   * Gdpr Consent Date
   * @format date-time
   */
  gdpr_consent_date: string;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /**
   * Updated At
   * @format date-time
   */
  updated_at: string;
}

/** UserStatsResponse */
export interface UserStatsResponse {
  /** User Id */
  user_id: string;
  /** Full Name */
  full_name: string;
  /** User Type */
  user_type: string;
  /** Email */
  email?: string | null;
  /** Phone */
  phone?: string | null;
  /** City */
  city?: string | null;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /** Total Leads */
  total_leads: number;
  /** Pending Commissions */
  pending_commissions: number;
  /** Paid Commissions */
  paid_commissions: number;
  /** Last Activity */
  last_activity: string | null;
}

/**
 * UserType
 * Enumeration for user types.
 */
export enum UserType {
  Professionnel = "professionnel",
  Particulier = "particulier",
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

/** SendPrivateMessageRequest */
export interface AppApisAdminSendPrivateMessageRequest {
  /** User Id */
  user_id: string;
  /** Subject */
  subject: string;
  /** Content */
  content: string;
}

/** SendPrivateMessageRequest */
export interface AppApisMessagingSendPrivateMessageRequest {
  /** Recipient Id */
  recipient_id: string;
  /** Subject */
  subject: string;
  /** Content */
  content: string;
}

export type CheckHealthData = HealthResponse;

export interface GetIconParams {
  /** Size */
  size: number;
}

export type GetIconData = any;

export type GetIconError = HTTPValidationError;

export type GetFaviconData = any;

export type GetLightIcoData = any;

export type GetDarkIcoData = any;

export type GetManifestData = any;

export type GetServiceWorkerData = any;

export type AcceptReferralGuideData = any;

export type AcceptReferralGuideError = HTTPValidationError;

export type GetReferralGuideStatusData = any;

export type GetCommissionBalanceData = CommissionBalance;

export type RequestPaymentData = any;

export type SubmitLeadData = any;

export type SubmitLeadError = HTTPValidationError;

/** Response Get All Leads */
export type GetAllLeadsData = LeadDetails[];

export type GetAdminStatsData = AdminStatsResponse;

export interface GetUserDetailsParams {
  /** User Id */
  userId: string;
}

export type GetUserDetailsData = UserDetailsResponse;

export type GetUserDetailsError = HTTPValidationError;

export type DeleteUserData = any;

export type DeleteUserError = HTTPValidationError;

/** Response Get Users With Stats */
export type GetUsersWithStatsData = UserStatsResponse[];

export type GetAllLeadsAdminData = any;

export type UpdateLeadStatusData = any;

export type UpdateLeadStatusError = HTTPValidationError;

export type GetAllUsersAdminData = any;

export interface GetPaymentRequestsParams {
  /**
   * Page
   * Numéro de page
   * @min 1
   * @default 1
   */
  page?: number;
  /**
   * Limit
   * Nombre d'éléments par page
   * @min 1
   * @max 100
   * @default 20
   */
  limit?: number;
  /**
   * Status
   * Filtrer par statut (requested, paid, rejected)
   * @default ""
   */
  status?: string;
}

/** Response Get Payment Requests */
export type GetPaymentRequestsData = PaymentRequestResponse[];

export type GetPaymentRequestsError = HTTPValidationError;

export type ProcessPaymentData = any;

export type ProcessPaymentError = HTTPValidationError;

/** Response Get Anniversary Alerts */
export type GetAnniversaryAlertsData = AnniversaryAlertResponse[];

export type SendPrivateMessageFromAdminData = any;

export type SendPrivateMessageFromAdminError = HTTPValidationError;

export type RequestPaymentForUserData = any;

export type RequestPaymentForUserError = HTTPValidationError;

export type GetAdminReceivedMessagesData = any;

export type SendAnnouncementData = any;

export type SendAnnouncementError = HTTPValidationError;

export type DeleteMessageForUserData = any;

export type DeleteMessageForUserError = HTTPValidationError;

export type GetMyMessagesData = MessagesResponse;

export type MarkAnnouncementReadData = any;

export type MarkAnnouncementReadError = HTTPValidationError;

export type MarkPrivateMessageReadData = any;

export type MarkPrivateMessageReadError = HTTPValidationError;

export type SendPrivateMessageFromUserData = any;

export type SendPrivateMessageFromUserError = HTTPValidationError;

export type GetDashboardDataData = DashboardResponse;

export type GenerateContractData = any;

export type GenerateContractError = HTTPValidationError;

export type SignContractData = any;

export type SignContractError = HTTPValidationError;

/** Response Get My Contract */
export type GetMyContractData = ContractResponse | null;

/** Response Get All Contracts */
export type GetAllContractsData = ContractResponse[];

export type CreateUserProfileData = CreateUserProfileResponse;

export type CreateUserProfileError = HTTPValidationError;

export type CheckProfileCompletionData = ProfileCheckResponse;
