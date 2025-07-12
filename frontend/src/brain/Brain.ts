import {
  AcceptReferralGuideData,
  AcceptReferralGuideError,
  AppApisAdminSendPrivateMessageRequest,
  AppApisMessagingSendPrivateMessageRequest,
  CheckHealthData,
  CheckProfileCompletionData,
  ContractGenerationRequest,
  ContractSignatureRequest,
  CreateLeadRequest,
  CreateUserProfileData,
  CreateUserProfileError,
  CreateUserProfileRequest,
  DeleteMessageForUserData,
  DeleteMessageForUserError,
  DeleteMessageRequest,
  DeleteUserData,
  DeleteUserError,
  DeleteUserRequest,
  GenerateContractData,
  GenerateContractError,
  GetAdminReceivedMessagesData,
  GetAdminStatsData,
  GetAllContractsData,
  GetAllLeadsAdminData,
  GetAllLeadsData,
  GetAllUsersAdminData,
  GetAnniversaryAlertsData,
  GetCommissionBalanceData,
  GetDarkIcoData,
  GetDashboardDataData,
  GetFaviconData,
  GetIconData,
  GetIconError,
  GetIconParams,
  GetLightIcoData,
  GetManifestData,
  GetMyContractData,
  GetMyMessagesData,
  GetPaymentRequestsData,
  GetPaymentRequestsError,
  GetPaymentRequestsParams,
  GetReferralGuideStatusData,
  GetServiceWorkerData,
  GetUserDetailsData,
  GetUserDetailsError,
  GetUserDetailsParams,
  GetUsersWithStatsData,
  GuideAcceptanceRequest,
  MarkAnnouncementReadData,
  MarkAnnouncementReadError,
  MarkAsReadRequest,
  MarkPrivateMessageReadData,
  MarkPrivateMessageReadError,
  ProcessPaymentData,
  ProcessPaymentError,
  ProcessPaymentRequest,
  RequestPaymentData,
  RequestPaymentForUserData,
  RequestPaymentForUserError,
  RequestPaymentForUserRequest,
  SendAnnouncementData,
  SendAnnouncementError,
  SendAnnouncementRequest,
  SendPrivateMessageFromAdminData,
  SendPrivateMessageFromAdminError,
  SendPrivateMessageFromUserData,
  SendPrivateMessageFromUserError,
  SignContractData,
  SignContractError,
  SubmitLeadData,
  SubmitLeadError,
  UpdateLeadStatusData,
  UpdateLeadStatusError,
  UpdateLeadStatusRequest,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * @description Servir une icône PNG de la taille demandée
   *
   * @tags dbtn/module:static_icons
   * @name get_icon
   * @summary Get Icon
   * @request GET:/routes/icon-{size}.png
   */
  get_icon = ({ size, ...query }: GetIconParams, params: RequestParams = {}) =>
    this.request<GetIconData, GetIconError>({
      path: `/routes/icon-${size}.png`,
      method: "GET",
      ...params,
    });

  /**
   * @description Servir le favicon en format ICO
   *
   * @tags dbtn/module:static_icons
   * @name get_favicon
   * @summary Get Favicon
   * @request GET:/routes/favicon.ico
   */
  get_favicon = (params: RequestParams = {}) =>
    this.request<GetFaviconData, any>({
      path: `/routes/favicon.ico`,
      method: "GET",
      ...params,
    });

  /**
   * @description Retourne l'icône soleil en format ICO pour le thème clair.
   *
   * @tags dbtn/module:pwa_endpoints
   * @name get_light_ico
   * @summary Get Light Ico
   * @request GET:/routes/light.ico
   */
  get_light_ico = (params: RequestParams = {}) =>
    this.request<GetLightIcoData, any>({
      path: `/routes/light.ico`,
      method: "GET",
      ...params,
    });

  /**
   * @description Retourne l'icône soleil en format ICO pour le thème sombre.
   *
   * @tags dbtn/module:pwa_endpoints
   * @name get_dark_ico
   * @summary Get Dark Ico
   * @request GET:/routes/dark.ico
   */
  get_dark_ico = (params: RequestParams = {}) =>
    this.request<GetDarkIcoData, any>({
      path: `/routes/dark.ico`,
      method: "GET",
      ...params,
    });

  /**
   * @description Endpoint pour servir le manifest PWA de l'application AmbassyApp. Permet aux navigateurs de détecter l'app comme installable.
   *
   * @tags dbtn/module:pwa_endpoints
   * @name get_manifest
   * @summary Get Manifest
   * @request GET:/routes/manifest.json
   */
  get_manifest = (params: RequestParams = {}) =>
    this.request<GetManifestData, any>({
      path: `/routes/manifest.json`,
      method: "GET",
      ...params,
    });

  /**
   * @description Endpoint pour servir le Service Worker JavaScript. Gère le cache et le fonctionnement hors ligne.
   *
   * @tags dbtn/module:pwa_endpoints
   * @name get_service_worker
   * @summary Get Service Worker
   * @request GET:/routes/sw.js
   */
  get_service_worker = (params: RequestParams = {}) =>
    this.request<GetServiceWorkerData, any>({
      path: `/routes/sw.js`,
      method: "GET",
      ...params,
    });

  /**
   * @description Enregistre l'acceptation du guide de parrainage et envoie un email
   *
   * @tags dbtn/module:referral_guide, dbtn/hasAuth
   * @name accept_referral_guide
   * @summary Accept Referral Guide
   * @request POST:/routes/accept-referral-guide
   */
  accept_referral_guide = (data: GuideAcceptanceRequest, params: RequestParams = {}) =>
    this.request<AcceptReferralGuideData, AcceptReferralGuideError>({
      path: `/routes/accept-referral-guide`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Vérifie si l'utilisateur a accepté le guide de parrainage
   *
   * @tags dbtn/module:referral_guide, dbtn/hasAuth
   * @name get_referral_guide_status
   * @summary Get Referral Guide Status
   * @request GET:/routes/referral-guide-status
   */
  get_referral_guide_status = (params: RequestParams = {}) =>
    this.request<GetReferralGuideStatusData, any>({
      path: `/routes/referral-guide-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the pending commission balance for the authenticated user
   *
   * @tags Commissions, dbtn/module:commissions, dbtn/hasAuth
   * @name get_commission_balance
   * @summary Get Commission Balance
   * @request GET:/routes/api/commissions/balance
   */
  get_commission_balance = (params: RequestParams = {}) =>
    this.request<GetCommissionBalanceData, any>({
      path: `/routes/api/commissions/balance`,
      method: "GET",
      ...params,
    });

  /**
   * @description Request payment for pending commissions
   *
   * @tags Commissions, dbtn/module:commissions, dbtn/hasAuth
   * @name request_payment
   * @summary Request Payment
   * @request POST:/routes/api/commissions/request-payment
   */
  request_payment = (params: RequestParams = {}) =>
    this.request<RequestPaymentData, any>({
      path: `/routes/api/commissions/request-payment`,
      method: "POST",
      ...params,
    });

  /**
   * @description Submits a new lead for the authenticated user.
   *
   * @tags Leads, dbtn/module:leads, dbtn/hasAuth
   * @name submit_lead
   * @summary Submit Lead
   * @request POST:/routes/api/leads/submit
   */
  submit_lead = (data: CreateLeadRequest, params: RequestParams = {}) =>
    this.request<SubmitLeadData, SubmitLeadError>({
      path: `/routes/api/leads/submit`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fetches all leads for the authenticated user, ordered by creation date. Includes commission status for 'installed' leads.
   *
   * @tags Leads, dbtn/module:leads, dbtn/hasAuth
   * @name get_all_leads
   * @summary Get All Leads
   * @request GET:/routes/api/leads
   */
  get_all_leads = (params: RequestParams = {}) =>
    this.request<GetAllLeadsData, any>({
      path: `/routes/api/leads`,
      method: "GET",
      ...params,
    });

  /**
   * @description Récupère les statistiques générales pour l'admin. Accès restreint aux administrateurs.
   *
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name get_admin_stats
   * @summary Get Admin Stats
   * @request GET:/routes/api/admin/stats
   */
  get_admin_stats = (params: RequestParams = {}) =>
    this.request<GetAdminStatsData, any>({
      path: `/routes/api/admin/stats`,
      method: "GET",
      ...params,
    });

  /**
   * @description Récupère tous les détails d'un utilisateur pour l'admin. Accès restreint aux administrateurs.
   *
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name get_user_details
   * @summary Get User Details
   * @request GET:/routes/api/admin/user-details/{user_id}
   */
  get_user_details = ({ userId, ...query }: GetUserDetailsParams, params: RequestParams = {}) =>
    this.request<GetUserDetailsData, GetUserDetailsError>({
      path: `/routes/api/admin/user-details/${userId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Supprime complètement un utilisateur et toutes ses données. ATTENTION: Action irréversible ! Accès restreint aux administrateurs.
   *
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name delete_user
   * @summary Delete User
   * @request DELETE:/routes/api/admin/delete-user
   */
  delete_user = (data: DeleteUserRequest, params: RequestParams = {}) =>
    this.request<DeleteUserData, DeleteUserError>({
      path: `/routes/api/admin/delete-user`,
      method: "DELETE",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Récupère tous les utilisateurs avec leurs statistiques détaillées. Accès restreint aux administrateurs.
   *
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name get_users_with_stats
   * @summary Get Users With Stats
   * @request GET:/routes/api/admin/users-with-stats
   */
  get_users_with_stats = (params: RequestParams = {}) =>
    this.request<GetUsersWithStatsData, any>({
      path: `/routes/api/admin/users-with-stats`,
      method: "GET",
      ...params,
    });

  /**
   * @description Récupère tous les leads de tous les apporteurs pour l'admin. Accès restreint aux administrateurs. MISE À JOUR : Inclut maintenant prospect_city.
   *
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name get_all_leads_admin
   * @summary Get All Leads Admin
   * @request GET:/routes/api/admin/all-leads
   */
  get_all_leads_admin = (params: RequestParams = {}) =>
    this.request<GetAllLeadsAdminData, any>({
      path: `/routes/api/admin/all-leads`,
      method: "GET",
      ...params,
    });

  /**
   * @description Permet à l'admin de changer le statut d'un lead. NOUVEAU SYSTÈME : - Si installé + professionnel : Commission 5% du montant HT (obligatoire) - Si installé + particulier : Bon d'achat selon grille (250€, 900€, 1500€) - Limite particuliers : 5 parrainages max par an Accès restreint aux administrateurs.
   *
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name update_lead_status
   * @summary Update Lead Status
   * @request PUT:/routes/api/admin/update-lead-status
   */
  update_lead_status = (data: UpdateLeadStatusRequest, params: RequestParams = {}) =>
    this.request<UpdateLeadStatusData, UpdateLeadStatusError>({
      path: `/routes/api/admin/update-lead-status`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Récupère tous les apporteurs pour l'admin. Accès restreint aux administrateurs.
   *
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name get_all_users_admin
   * @summary Get All Users Admin
   * @request GET:/routes/api/admin/all-users
   */
  get_all_users_admin = (params: RequestParams = {}) =>
    this.request<GetAllUsersAdminData, any>({
      path: `/routes/api/admin/all-users`,
      method: "GET",
      ...params,
    });

  /**
   * @description Récupère toutes les demandes de paiement avec pagination et filtrage. Accès restreint aux administrateurs.
   *
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name get_payment_requests
   * @summary Get Payment Requests
   * @request GET:/routes/api/admin/payment-requests
   */
  get_payment_requests = (query: GetPaymentRequestsParams, params: RequestParams = {}) =>
    this.request<GetPaymentRequestsData, GetPaymentRequestsError>({
      path: `/routes/api/admin/payment-requests`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Marque une demande de paiement comme payée. Met à jour les commissions correspondantes vers 'paid'. Accès restreint aux administrateurs.
   *
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name process_payment
   * @summary Process Payment
   * @request POST:/routes/api/admin/process-payment
   */
  process_payment = (data: ProcessPaymentRequest, params: RequestParams = {}) =>
    this.request<ProcessPaymentData, ProcessPaymentError>({
      path: `/routes/api/admin/process-payment`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Récupère la liste des utilisateurs particuliers qui approchent de leur date anniversaire et ont des bons d'achat en attente. Accès restreint aux administrateurs.
   *
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name get_anniversary_alerts
   * @summary Get Anniversary Alerts
   * @request GET:/routes/api/admin/anniversary-alerts
   */
  get_anniversary_alerts = (params: RequestParams = {}) =>
    this.request<GetAnniversaryAlertsData, any>({
      path: `/routes/api/admin/anniversary-alerts`,
      method: "GET",
      ...params,
    });

  /**
   * @description Envoie un message privé à un utilisateur spécifique. Accès restreint aux administrateurs.
   *
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name send_private_message_from_admin
   * @summary Send Private Message From Admin
   * @request POST:/routes/api/admin/send-private-message
   */
  send_private_message_from_admin = (data: AppApisAdminSendPrivateMessageRequest, params: RequestParams = {}) =>
    this.request<SendPrivateMessageFromAdminData, SendPrivateMessageFromAdminError>({
      path: `/routes/api/admin/send-private-message`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Demande un paiement pour un utilisateur spécifique. Accès restreint aux administrateurs.
   *
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name request_payment_for_user
   * @summary Request Payment For User
   * @request POST:/routes/api/admin/request-payment-for-user
   */
  request_payment_for_user = (data: RequestPaymentForUserRequest, params: RequestParams = {}) =>
    this.request<RequestPaymentForUserData, RequestPaymentForUserError>({
      path: `/routes/api/admin/request-payment-for-user`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Récupère tous les messages privés reçus par l'admin connecté. Accessible uniquement aux admins.
   *
   * @tags Messaging, dbtn/module:messaging, dbtn/hasAuth
   * @name get_admin_received_messages
   * @summary Get Admin Received Messages
   * @request GET:/routes/api/messaging/admin/received
   */
  get_admin_received_messages = (params: RequestParams = {}) =>
    this.request<GetAdminReceivedMessagesData, any>({
      path: `/routes/api/messaging/admin/received`,
      method: "GET",
      ...params,
    });

  /**
   * @description Envoie une annonce générale à tous les apporteurs. Accessible uniquement aux admins.
   *
   * @tags Messaging, dbtn/module:messaging, dbtn/hasAuth
   * @name send_announcement
   * @summary Send Announcement
   * @request POST:/routes/api/messaging/send-announcement
   */
  send_announcement = (data: SendAnnouncementRequest, params: RequestParams = {}) =>
    this.request<SendAnnouncementData, SendAnnouncementError>({
      path: `/routes/api/messaging/send-announcement`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Supprime un message pour l'apporteur connecté : - Pour les annonces : marque comme supprimée dans announcement_reads - Pour les messages privés : supprime le message seulement s'il est l'expéditeur ou le destinataire
   *
   * @tags Messaging, dbtn/module:messaging, dbtn/hasAuth
   * @name delete_message_for_user
   * @summary Delete Message For User
   * @request DELETE:/routes/api/messaging/delete-for-user
   */
  delete_message_for_user = (data: DeleteMessageRequest, params: RequestParams = {}) =>
    this.request<DeleteMessageForUserData, DeleteMessageForUserError>({
      path: `/routes/api/messaging/delete-for-user`,
      method: "DELETE",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Récupère tous les messages de l'apporteur connecté : - Annonces générales (non archivées) - Messages privés reçus et envoyés
   *
   * @tags Messaging, dbtn/module:messaging, dbtn/hasAuth
   * @name get_my_messages
   * @summary Get My Messages
   * @request GET:/routes/api/messaging/my-messages
   */
  get_my_messages = (params: RequestParams = {}) =>
    this.request<GetMyMessagesData, any>({
      path: `/routes/api/messaging/my-messages`,
      method: "GET",
      ...params,
    });

  /**
   * @description Marque une annonce comme lue pour l'apporteur connecté.
   *
   * @tags Messaging, dbtn/module:messaging, dbtn/hasAuth
   * @name mark_announcement_read
   * @summary Mark Announcement Read
   * @request POST:/routes/api/messaging/mark-announcement-read
   */
  mark_announcement_read = (data: MarkAsReadRequest, params: RequestParams = {}) =>
    this.request<MarkAnnouncementReadData, MarkAnnouncementReadError>({
      path: `/routes/api/messaging/mark-announcement-read`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Marque un message privé comme lu.
   *
   * @tags Messaging, dbtn/module:messaging, dbtn/hasAuth
   * @name mark_private_message_read
   * @summary Mark Private Message Read
   * @request POST:/routes/api/messaging/mark-private-message-read
   */
  mark_private_message_read = (data: MarkAsReadRequest, params: RequestParams = {}) =>
    this.request<MarkPrivateMessageReadData, MarkPrivateMessageReadError>({
      path: `/routes/api/messaging/mark-private-message-read`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Permet à un apporteur d'envoyer un message privé à l'admin. Le recipient_id sera l'ID de l'admin (à définir).
   *
   * @tags Messaging, dbtn/module:messaging, dbtn/hasAuth
   * @name send_private_message_from_user
   * @summary Send Private Message From User
   * @request POST:/routes/api/messaging/send-private-message
   */
  send_private_message_from_user = (data: AppApisMessagingSendPrivateMessageRequest, params: RequestParams = {}) =>
    this.request<SendPrivateMessageFromUserData, SendPrivateMessageFromUserError>({
      path: `/routes/api/messaging/send-private-message`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get comprehensive dashboard data for the authenticated user
   *
   * @tags Dashboard, dbtn/module:dashboard, dbtn/hasAuth
   * @name get_dashboard_data
   * @summary Get Dashboard Data
   * @request GET:/routes/api/dashboard/data
   */
  get_dashboard_data = (params: RequestParams = {}) =>
    this.request<GetDashboardDataData, any>({
      path: `/routes/api/dashboard/data`,
      method: "GET",
      ...params,
    });

  /**
   * @description Génère un nouveau contrat pour l'utilisateur
   *
   * @tags dbtn/module:contracts, dbtn/hasAuth
   * @name generate_contract
   * @summary Generate Contract
   * @request POST:/routes/generate-contract
   */
  generate_contract = (data: ContractGenerationRequest, params: RequestParams = {}) =>
    this.request<GenerateContractData, GenerateContractError>({
      path: `/routes/generate-contract`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Signe électroniquement un contrat
   *
   * @tags dbtn/module:contracts, dbtn/hasAuth
   * @name sign_contract
   * @summary Sign Contract
   * @request POST:/routes/sign-contract
   */
  sign_contract = (data: ContractSignatureRequest, params: RequestParams = {}) =>
    this.request<SignContractData, SignContractError>({
      path: `/routes/sign-contract`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Récupère le contrat de l'utilisateur connecté
   *
   * @tags dbtn/module:contracts, dbtn/hasAuth
   * @name get_my_contract
   * @summary Get My Contract
   * @request GET:/routes/my-contract
   */
  get_my_contract = (params: RequestParams = {}) =>
    this.request<GetMyContractData, any>({
      path: `/routes/my-contract`,
      method: "GET",
      ...params,
    });

  /**
   * @description Récupère tous les contrats (admin seulement)
   *
   * @tags dbtn/module:contracts, dbtn/hasAuth
   * @name get_all_contracts
   * @summary Get All Contracts
   * @request GET:/routes/all-contracts
   */
  get_all_contracts = (params: RequestParams = {}) =>
    this.request<GetAllContractsData, any>({
      path: `/routes/all-contracts`,
      method: "GET",
      ...params,
    });

  /**
   * @description Creates a user profile in the database after successful registration. This endpoint is called right after Stack Auth account creation.
   *
   * @tags dbtn/module:users, dbtn/hasAuth
   * @name create_user_profile
   * @summary Create User Profile
   * @request POST:/routes/profile
   */
  create_user_profile = (data: CreateUserProfileRequest, params: RequestParams = {}) =>
    this.request<CreateUserProfileData, CreateUserProfileError>({
      path: `/routes/profile`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Checks if the user has completed their profile setup. Returns profile status and missing fields if incomplete.
   *
   * @tags dbtn/module:users, dbtn/hasAuth
   * @name check_profile_completion
   * @summary Check Profile Completion
   * @request GET:/routes/profile/check
   */
  check_profile_completion = (params: RequestParams = {}) =>
    this.request<CheckProfileCompletionData, any>({
      path: `/routes/profile/check`,
      method: "GET",
      ...params,
    });
}
