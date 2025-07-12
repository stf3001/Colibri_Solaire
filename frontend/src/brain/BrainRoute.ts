import {
  AcceptReferralGuideData,
  AppApisAdminSendPrivateMessageRequest,
  AppApisMessagingSendPrivateMessageRequest,
  CheckHealthData,
  CheckProfileCompletionData,
  ContractGenerationRequest,
  ContractSignatureRequest,
  CreateLeadRequest,
  CreateUserProfileData,
  CreateUserProfileRequest,
  DeleteMessageForUserData,
  DeleteMessageRequest,
  DeleteUserData,
  DeleteUserRequest,
  GenerateContractData,
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
  GetLightIcoData,
  GetManifestData,
  GetMyContractData,
  GetMyMessagesData,
  GetPaymentRequestsData,
  GetReferralGuideStatusData,
  GetServiceWorkerData,
  GetUserDetailsData,
  GetUsersWithStatsData,
  GuideAcceptanceRequest,
  MarkAnnouncementReadData,
  MarkAsReadRequest,
  MarkPrivateMessageReadData,
  ProcessPaymentData,
  ProcessPaymentRequest,
  RequestPaymentData,
  RequestPaymentForUserData,
  RequestPaymentForUserRequest,
  SendAnnouncementData,
  SendAnnouncementRequest,
  SendPrivateMessageFromAdminData,
  SendPrivateMessageFromUserData,
  SignContractData,
  SubmitLeadData,
  UpdateLeadStatusData,
  UpdateLeadStatusRequest,
} from "./data-contracts";

export namespace Brain {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * @description Servir une icône PNG de la taille demandée
   * @tags dbtn/module:static_icons
   * @name get_icon
   * @summary Get Icon
   * @request GET:/routes/icon-{size}.png
   */
  export namespace get_icon {
    export type RequestParams = {
      /** Size */
      size: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetIconData;
  }

  /**
   * @description Servir le favicon en format ICO
   * @tags dbtn/module:static_icons
   * @name get_favicon
   * @summary Get Favicon
   * @request GET:/routes/favicon.ico
   */
  export namespace get_favicon {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetFaviconData;
  }

  /**
   * @description Retourne l'icône soleil en format ICO pour le thème clair.
   * @tags dbtn/module:pwa_endpoints
   * @name get_light_ico
   * @summary Get Light Ico
   * @request GET:/routes/light.ico
   */
  export namespace get_light_ico {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetLightIcoData;
  }

  /**
   * @description Retourne l'icône soleil en format ICO pour le thème sombre.
   * @tags dbtn/module:pwa_endpoints
   * @name get_dark_ico
   * @summary Get Dark Ico
   * @request GET:/routes/dark.ico
   */
  export namespace get_dark_ico {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetDarkIcoData;
  }

  /**
   * @description Endpoint pour servir le manifest PWA de l'application AmbassyApp. Permet aux navigateurs de détecter l'app comme installable.
   * @tags dbtn/module:pwa_endpoints
   * @name get_manifest
   * @summary Get Manifest
   * @request GET:/routes/manifest.json
   */
  export namespace get_manifest {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetManifestData;
  }

  /**
   * @description Endpoint pour servir le Service Worker JavaScript. Gère le cache et le fonctionnement hors ligne.
   * @tags dbtn/module:pwa_endpoints
   * @name get_service_worker
   * @summary Get Service Worker
   * @request GET:/routes/sw.js
   */
  export namespace get_service_worker {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetServiceWorkerData;
  }

  /**
   * @description Enregistre l'acceptation du guide de parrainage et envoie un email
   * @tags dbtn/module:referral_guide, dbtn/hasAuth
   * @name accept_referral_guide
   * @summary Accept Referral Guide
   * @request POST:/routes/accept-referral-guide
   */
  export namespace accept_referral_guide {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = GuideAcceptanceRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AcceptReferralGuideData;
  }

  /**
   * @description Vérifie si l'utilisateur a accepté le guide de parrainage
   * @tags dbtn/module:referral_guide, dbtn/hasAuth
   * @name get_referral_guide_status
   * @summary Get Referral Guide Status
   * @request GET:/routes/referral-guide-status
   */
  export namespace get_referral_guide_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetReferralGuideStatusData;
  }

  /**
   * @description Get the pending commission balance for the authenticated user
   * @tags Commissions, dbtn/module:commissions, dbtn/hasAuth
   * @name get_commission_balance
   * @summary Get Commission Balance
   * @request GET:/routes/api/commissions/balance
   */
  export namespace get_commission_balance {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCommissionBalanceData;
  }

  /**
   * @description Request payment for pending commissions
   * @tags Commissions, dbtn/module:commissions, dbtn/hasAuth
   * @name request_payment
   * @summary Request Payment
   * @request POST:/routes/api/commissions/request-payment
   */
  export namespace request_payment {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RequestPaymentData;
  }

  /**
   * @description Submits a new lead for the authenticated user.
   * @tags Leads, dbtn/module:leads, dbtn/hasAuth
   * @name submit_lead
   * @summary Submit Lead
   * @request POST:/routes/api/leads/submit
   */
  export namespace submit_lead {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateLeadRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SubmitLeadData;
  }

  /**
   * @description Fetches all leads for the authenticated user, ordered by creation date. Includes commission status for 'installed' leads.
   * @tags Leads, dbtn/module:leads, dbtn/hasAuth
   * @name get_all_leads
   * @summary Get All Leads
   * @request GET:/routes/api/leads
   */
  export namespace get_all_leads {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAllLeadsData;
  }

  /**
   * @description Récupère les statistiques générales pour l'admin. Accès restreint aux administrateurs.
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name get_admin_stats
   * @summary Get Admin Stats
   * @request GET:/routes/api/admin/stats
   */
  export namespace get_admin_stats {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAdminStatsData;
  }

  /**
   * @description Récupère tous les détails d'un utilisateur pour l'admin. Accès restreint aux administrateurs.
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name get_user_details
   * @summary Get User Details
   * @request GET:/routes/api/admin/user-details/{user_id}
   */
  export namespace get_user_details {
    export type RequestParams = {
      /** User Id */
      userId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetUserDetailsData;
  }

  /**
   * @description Supprime complètement un utilisateur et toutes ses données. ATTENTION: Action irréversible ! Accès restreint aux administrateurs.
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name delete_user
   * @summary Delete User
   * @request DELETE:/routes/api/admin/delete-user
   */
  export namespace delete_user {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = DeleteUserRequest;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteUserData;
  }

  /**
   * @description Récupère tous les utilisateurs avec leurs statistiques détaillées. Accès restreint aux administrateurs.
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name get_users_with_stats
   * @summary Get Users With Stats
   * @request GET:/routes/api/admin/users-with-stats
   */
  export namespace get_users_with_stats {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetUsersWithStatsData;
  }

  /**
   * @description Récupère tous les leads de tous les apporteurs pour l'admin. Accès restreint aux administrateurs. MISE À JOUR : Inclut maintenant prospect_city.
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name get_all_leads_admin
   * @summary Get All Leads Admin
   * @request GET:/routes/api/admin/all-leads
   */
  export namespace get_all_leads_admin {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAllLeadsAdminData;
  }

  /**
   * @description Permet à l'admin de changer le statut d'un lead. NOUVEAU SYSTÈME : - Si installé + professionnel : Commission 5% du montant HT (obligatoire) - Si installé + particulier : Bon d'achat selon grille (250€, 900€, 1500€) - Limite particuliers : 5 parrainages max par an Accès restreint aux administrateurs.
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name update_lead_status
   * @summary Update Lead Status
   * @request PUT:/routes/api/admin/update-lead-status
   */
  export namespace update_lead_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UpdateLeadStatusRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateLeadStatusData;
  }

  /**
   * @description Récupère tous les apporteurs pour l'admin. Accès restreint aux administrateurs.
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name get_all_users_admin
   * @summary Get All Users Admin
   * @request GET:/routes/api/admin/all-users
   */
  export namespace get_all_users_admin {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAllUsersAdminData;
  }

  /**
   * @description Récupère toutes les demandes de paiement avec pagination et filtrage. Accès restreint aux administrateurs.
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name get_payment_requests
   * @summary Get Payment Requests
   * @request GET:/routes/api/admin/payment-requests
   */
  export namespace get_payment_requests {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPaymentRequestsData;
  }

  /**
   * @description Marque une demande de paiement comme payée. Met à jour les commissions correspondantes vers 'paid'. Accès restreint aux administrateurs.
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name process_payment
   * @summary Process Payment
   * @request POST:/routes/api/admin/process-payment
   */
  export namespace process_payment {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ProcessPaymentRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ProcessPaymentData;
  }

  /**
   * @description Récupère la liste des utilisateurs particuliers qui approchent de leur date anniversaire et ont des bons d'achat en attente. Accès restreint aux administrateurs.
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name get_anniversary_alerts
   * @summary Get Anniversary Alerts
   * @request GET:/routes/api/admin/anniversary-alerts
   */
  export namespace get_anniversary_alerts {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAnniversaryAlertsData;
  }

  /**
   * @description Envoie un message privé à un utilisateur spécifique. Accès restreint aux administrateurs.
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name send_private_message_from_admin
   * @summary Send Private Message From Admin
   * @request POST:/routes/api/admin/send-private-message
   */
  export namespace send_private_message_from_admin {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppApisAdminSendPrivateMessageRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SendPrivateMessageFromAdminData;
  }

  /**
   * @description Demande un paiement pour un utilisateur spécifique. Accès restreint aux administrateurs.
   * @tags Admin, dbtn/module:admin, dbtn/hasAuth
   * @name request_payment_for_user
   * @summary Request Payment For User
   * @request POST:/routes/api/admin/request-payment-for-user
   */
  export namespace request_payment_for_user {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = RequestPaymentForUserRequest;
    export type RequestHeaders = {};
    export type ResponseBody = RequestPaymentForUserData;
  }

  /**
   * @description Récupère tous les messages privés reçus par l'admin connecté. Accessible uniquement aux admins.
   * @tags Messaging, dbtn/module:messaging, dbtn/hasAuth
   * @name get_admin_received_messages
   * @summary Get Admin Received Messages
   * @request GET:/routes/api/messaging/admin/received
   */
  export namespace get_admin_received_messages {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAdminReceivedMessagesData;
  }

  /**
   * @description Envoie une annonce générale à tous les apporteurs. Accessible uniquement aux admins.
   * @tags Messaging, dbtn/module:messaging, dbtn/hasAuth
   * @name send_announcement
   * @summary Send Announcement
   * @request POST:/routes/api/messaging/send-announcement
   */
  export namespace send_announcement {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SendAnnouncementRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SendAnnouncementData;
  }

  /**
   * @description Supprime un message pour l'apporteur connecté : - Pour les annonces : marque comme supprimée dans announcement_reads - Pour les messages privés : supprime le message seulement s'il est l'expéditeur ou le destinataire
   * @tags Messaging, dbtn/module:messaging, dbtn/hasAuth
   * @name delete_message_for_user
   * @summary Delete Message For User
   * @request DELETE:/routes/api/messaging/delete-for-user
   */
  export namespace delete_message_for_user {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = DeleteMessageRequest;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteMessageForUserData;
  }

  /**
   * @description Récupère tous les messages de l'apporteur connecté : - Annonces générales (non archivées) - Messages privés reçus et envoyés
   * @tags Messaging, dbtn/module:messaging, dbtn/hasAuth
   * @name get_my_messages
   * @summary Get My Messages
   * @request GET:/routes/api/messaging/my-messages
   */
  export namespace get_my_messages {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMyMessagesData;
  }

  /**
   * @description Marque une annonce comme lue pour l'apporteur connecté.
   * @tags Messaging, dbtn/module:messaging, dbtn/hasAuth
   * @name mark_announcement_read
   * @summary Mark Announcement Read
   * @request POST:/routes/api/messaging/mark-announcement-read
   */
  export namespace mark_announcement_read {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = MarkAsReadRequest;
    export type RequestHeaders = {};
    export type ResponseBody = MarkAnnouncementReadData;
  }

  /**
   * @description Marque un message privé comme lu.
   * @tags Messaging, dbtn/module:messaging, dbtn/hasAuth
   * @name mark_private_message_read
   * @summary Mark Private Message Read
   * @request POST:/routes/api/messaging/mark-private-message-read
   */
  export namespace mark_private_message_read {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = MarkAsReadRequest;
    export type RequestHeaders = {};
    export type ResponseBody = MarkPrivateMessageReadData;
  }

  /**
   * @description Permet à un apporteur d'envoyer un message privé à l'admin. Le recipient_id sera l'ID de l'admin (à définir).
   * @tags Messaging, dbtn/module:messaging, dbtn/hasAuth
   * @name send_private_message_from_user
   * @summary Send Private Message From User
   * @request POST:/routes/api/messaging/send-private-message
   */
  export namespace send_private_message_from_user {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppApisMessagingSendPrivateMessageRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SendPrivateMessageFromUserData;
  }

  /**
   * @description Get comprehensive dashboard data for the authenticated user
   * @tags Dashboard, dbtn/module:dashboard, dbtn/hasAuth
   * @name get_dashboard_data
   * @summary Get Dashboard Data
   * @request GET:/routes/api/dashboard/data
   */
  export namespace get_dashboard_data {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetDashboardDataData;
  }

  /**
   * @description Génère un nouveau contrat pour l'utilisateur
   * @tags dbtn/module:contracts, dbtn/hasAuth
   * @name generate_contract
   * @summary Generate Contract
   * @request POST:/routes/generate-contract
   */
  export namespace generate_contract {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ContractGenerationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateContractData;
  }

  /**
   * @description Signe électroniquement un contrat
   * @tags dbtn/module:contracts, dbtn/hasAuth
   * @name sign_contract
   * @summary Sign Contract
   * @request POST:/routes/sign-contract
   */
  export namespace sign_contract {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ContractSignatureRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SignContractData;
  }

  /**
   * @description Récupère le contrat de l'utilisateur connecté
   * @tags dbtn/module:contracts, dbtn/hasAuth
   * @name get_my_contract
   * @summary Get My Contract
   * @request GET:/routes/my-contract
   */
  export namespace get_my_contract {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMyContractData;
  }

  /**
   * @description Récupère tous les contrats (admin seulement)
   * @tags dbtn/module:contracts, dbtn/hasAuth
   * @name get_all_contracts
   * @summary Get All Contracts
   * @request GET:/routes/all-contracts
   */
  export namespace get_all_contracts {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAllContractsData;
  }

  /**
   * @description Creates a user profile in the database after successful registration. This endpoint is called right after Stack Auth account creation.
   * @tags dbtn/module:users, dbtn/hasAuth
   * @name create_user_profile
   * @summary Create User Profile
   * @request POST:/routes/profile
   */
  export namespace create_user_profile {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateUserProfileRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateUserProfileData;
  }

  /**
   * @description Checks if the user has completed their profile setup. Returns profile status and missing fields if incomplete.
   * @tags dbtn/module:users, dbtn/hasAuth
   * @name check_profile_completion
   * @summary Check Profile Completion
   * @request GET:/routes/profile/check
   */
  export namespace check_profile_completion {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckProfileCompletionData;
  }
}
