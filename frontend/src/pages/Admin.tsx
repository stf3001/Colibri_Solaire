import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { stackClientApp } from 'app/auth';
import brain from 'brain';
import {
  AdminStatsResponse,
  UpdateLeadStatusRequest,
  SendAnnouncementRequest,
  PaymentRequestResponse,
  ProcessPaymentRequest,
  AnniversaryAlertResponse
} from 'types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminGuard } from 'components/AdminGuard';
import AdminMobileNavigation from 'components/AdminMobileNavigation';
import AdminStatsPanel from 'components/AdminStatsPanel';
import AdminLeadsTable from 'components/AdminLeadsTable';
import AdminUsersTable from 'components/AdminUsersTable';
import AdminPaymentsTable from 'components/AdminPaymentsTable';
import AdminAlertsPanel from 'components/AdminAlertsPanel';
import AdminMessaging from 'components/AdminMessaging';
import AdminContracts from 'components/AdminContracts';
import { Pagination } from 'components/Pagination';
import { usePagination } from 'utils/usePagination';

const Admin = () => {
  // États principaux
  const [activeTab, setActiveTab] = useState('leads');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [selectedUserForPayment, setSelectedUserForPayment] = useState<any>(null);
  const [showPaymentConfirmDialog, setShowPaymentConfirmDialog] = useState(false);
  
  const queryClient = useQueryClient();

  // Hooks de pagination pour chaque onglet
  const leadsPagination = usePagination({ initialLimit: 20 });
  const usersPagination = usePagination({ initialLimit: 20 });
  const paymentsPagination = usePagination({ initialLimit: 20 });
  const contractsPagination = usePagination({ initialLimit: 20 });

  // Query keys optimisées avec paramètres pour éviter le cache excessif
  const queryKeys = useMemo(() => ({
    adminLeads: ['admin', 'leads', leadsPagination.queryParams],
    adminUsers: ['admin', 'users', usersPagination.queryParams],
    adminPayments: ['admin', 'payments', paymentsPagination.queryParams],
    adminContracts: ['admin', 'contracts', contractsPagination.queryParams],
    adminMessages: ['admin', 'messages'],
    adminAlerts: ['admin', 'alerts']
  }), [
    leadsPagination.queryParams,
    usersPagination.queryParams, 
    paymentsPagination.queryParams,
    contractsPagination.queryParams
  ]);

  // API Queries avec options optimisées pour réduire l'utilisation mémoire
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const response = await brain.get_admin_stats();
      return response.json();
    },
    staleTime: 60000, // 1 minute
    cacheTime: 180000, // 3 minutes - réduit de 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true
  });

  // Queries avec pagination
  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: queryKeys.adminLeads,
    queryFn: async () => {
      const response = await brain.get_all_leads_admin(leadsPagination.queryParams);
      return response.json();
    },
    enabled: activeTab === 'leads',
    staleTime: 30000, // 30s
    cacheTime: 60000, // 1min - réduit drastiquement
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false, // Désactivé pour réduire les requêtes
    keepPreviousData: true,
    retry: 1 // Réduire les tentatives pour éviter la surcharge
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: queryKeys.adminUsers,
    queryFn: async () => {
      const response = await brain.get_users_with_stats(usersPagination.queryParams);
      return response.json();
    },
    enabled: activeTab === 'users',
    staleTime: 30000,
    cacheTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    keepPreviousData: true,
    retry: 1
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: queryKeys.adminPayments,
    queryFn: async () => {
      const response = await brain.get_payment_requests(paymentsPagination.queryParams);
      return response.json();
    },
    enabled: activeTab === 'payments',
    staleTime: 30000,
    cacheTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    keepPreviousData: true,
    retry: 1
  });

  const { data: anniversaryAlerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['adminAlerts'],
    queryFn: async () => {
      const response = await brain.get_anniversary_alerts();
      return response.json();
    },
    enabled: activeTab === 'anniversary',
    staleTime: 60000, // 1 minute
    cacheTime: 180000, // 3 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true
  });

  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: queryKeys.adminContracts,
    queryFn: async () => {
      const response = await brain.get_all_contracts(contractsPagination.queryParams);
      return response.json();
    },
    enabled: activeTab === 'contracts',
    staleTime: 30000,
    cacheTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    keepPreviousData: true,
    retry: 1
  });

  const { data: receivedMessages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['adminMessages'],
    queryFn: async () => {
      const response = await brain.get_admin_received_messages();
      const data = await response.json();
      return data.messages || [];
    },
    enabled: activeTab === 'messages',
    staleTime: 30000,
    cacheTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true
  });

  // Extraction des données paginées
  const leads = leadsData?.data || [];
  const users = usersData?.data || [];
  const paymentRequests = paymentsData?.data || [];
  const contractsArray = contracts?.data || [];

  // Mise à jour des totaux pour la pagination
  useEffect(() => {
    if (leadsData?.total !== undefined) {
      leadsPagination.setTotal(leadsData.total);
    }
  }, [leadsData?.total, leadsPagination]);

  useEffect(() => {
    if (usersData?.total !== undefined) {
      usersPagination.setTotal(usersData.total);
    }
  }, [usersData?.total, usersPagination]);

  useEffect(() => {
    if (paymentsData?.total !== undefined) {
      paymentsPagination.setTotal(paymentsData.total);
    }
  }, [paymentsData?.total, paymentsPagination]);

  useEffect(() => {
    if (contracts?.total !== undefined) {
      contractsPagination.setTotal(contracts.total);
    }
  }, [contracts?.total, contractsPagination]);

  // Mutations
  const updateLeadMutation = useMutation({
    mutationFn: async (data: UpdateLeadStatusRequest) => {
      const response = await brain.update_lead_status(data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLeads'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      toast.success('Statut du lead mis à jour');
      setSelectedLead(null);
      setNewStatus('');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour : ' + (error?.response?.data?.detail || error.message));
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (data: { user_id: string }) => {
      const response = await brain.delete_user(data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      toast.success('Apporteur supprimé avec succès');
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression : ' + (error?.response?.data?.detail || error.message));
      setUserToDelete(null);
    }
  });

  const processPaymentMutation = useMutation({
    mutationFn: async (data: ProcessPaymentRequest) => {
      const response = await brain.process_payment(data);
      return response.json();
    },
    onSuccess: () => {
      toast.success('Paiement traité avec succès');
      queryClient.invalidateQueries({ queryKey: ['adminPayments'] });
    },
    onError: (error: any) => {
      toast.error('Erreur lors du traitement du paiement');
      console.error('Erreur traitement paiement:', error);
    }
  });

  const sendAnnouncementMutation = useMutation({
    mutationFn: async (data: SendAnnouncementRequest) => {
      const response = await brain.send_announcement(data);
      return response.json();
    },
    onSuccess: () => {
      toast.success('Annonce envoyée à tous les utilisateurs');
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi de l\'annonce');
    }
  });

  const sendPrivateMessageMutation = useMutation({
    mutationFn: async (data: { recipient_id: string; content: string }) => {
      const response = await brain.send_private_message_from_admin({
        user_id: data.recipient_id,
        subject: 'Message de l\'administration',
        content: data.content
      });
      return response.json();
    },
    onSuccess: () => {
      toast.success('Message privé envoyé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi du message');
    }
  });

  const requestPaymentForUserMutation = useMutation({
    mutationFn: async (data: { user_id: string }) => {
      const response = await brain.request_payment_for_user(data);
      return response.json();
    },
    onSuccess: () => {
      toast.success('Demande de paiement créée avec succès');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminPayments'] });
      setShowPaymentConfirmDialog(false);
      setSelectedUserForPayment(null);
    },
    onError: (error: any) => {
      toast.error('Erreur : ' + (error?.response?.data?.detail || error.message));
    }
  });

  // Handlers
  const handleEditLead = useCallback((lead: any) => {
    setSelectedLead(lead);
  }, []);

  const handleDeleteUser = useCallback((user: any) => {
    setUserToDelete(user);
  }, []);

  const handleRequestPayment = useCallback((user: any) => {
    setSelectedUserForPayment(user);
    setShowPaymentConfirmDialog(true);
  }, []);

  const handleProcessPayment = useCallback((payment: PaymentRequestResponse) => {
    processPaymentMutation.mutate({
      payment_id: payment.id,
      payment_method: 'virement',
      payment_date: new Date().toISOString()
    });
  }, [processPaymentMutation]);

  const handleSendAnnouncement = useCallback((data: SendAnnouncementRequest) => {
    sendAnnouncementMutation.mutate(data);
  }, [sendAnnouncementMutation]);

  const handleSendPrivateMessage = useCallback((data: { recipient_id: string; content: string }) => {
    sendPrivateMessageMutation.mutate(data);
  }, [sendPrivateMessageMutation]);

  const handleLogout = useCallback(async () => {
    await stackClientApp.signOut();
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const handleDialogClose = useCallback(() => {
    setSelectedLead(null);
    setNewStatus('');
  }, []);

  const handleDeleteDialogClose = useCallback(() => {
    setUserToDelete(null);
  }, []);

  const handlePaymentDialogClose = useCallback(() => {
    setShowPaymentConfirmDialog(false);
    setSelectedUserForPayment(null);
  }, []);

  // Mémorisation des configurations
  const tabsConfig = useMemo(() => [
    { value: 'leads', label: 'Prospects' },
    { value: 'users', label: 'Apporteurs' },
    { value: 'payments', label: 'Paiements' },
    { value: 'anniversary', label: 'Alertes' },
    { value: 'contracts', label: 'Contrats' },
    { value: 'user-management', label: 'Gestion' },
    { value: 'messages', label: 'Messages' }
  ], []);

  const statusOptions = useMemo(() => [
    { value: 'soumis', label: 'Soumis' },
    { value: 'visité', label: 'Visité' },
    { value: 'signé', label: 'Signé' },
    { value: 'installé', label: 'Installé' }
  ], []);

  // Mémorisation des props pour les composants
  const adminStatsProps = useMemo(() => ({
    stats,
    isLoading: statsLoading
  }), [stats, statsLoading]);

  const adminMobileNavProps = useMemo(() => ({
    currentTab: activeTab,
    onTabChange: handleTabChange,
    stats
  }), [activeTab, handleTabChange, stats]);

  const adminLeadsProps = useMemo(() => ({
    leads: leads,
    isLoading: leadsLoading,
    onEditLead: handleEditLead
  }), [leads, leadsLoading, handleEditLead]);

  const adminUsersProps = useMemo(() => ({
    users: users,
    isLoading: usersLoading,
    onDeleteUser: handleDeleteUser,
    onRequestPayment: handleRequestPayment
  }), [users, usersLoading, handleDeleteUser, handleRequestPayment]);

  const adminPaymentsProps = useMemo(() => ({
    paymentRequests: paymentRequests,
    isLoading: paymentsLoading,
    onProcessPayment: handleProcessPayment
  }), [paymentRequests, paymentsLoading, handleProcessPayment]);

  const adminAlertsProps = useMemo(() => ({
    anniversaryAlerts,
    isLoading: alertsLoading
  }), [anniversaryAlerts, alertsLoading]);

  const adminContractsProps = useMemo(() => ({
    contracts: contractsArray,
    isLoading: contractsLoading
  }), [contractsArray, contractsLoading]);

  const adminMessagingProps = useMemo(() => ({
    receivedMessages,
    users,
    messagesLoading,
    onSendAnnouncement: handleSendAnnouncement,
    onSendPrivateMessage: handleSendPrivateMessage
  }), [receivedMessages, users, messagesLoading, handleSendAnnouncement, handleSendPrivateMessage]);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-6 space-y-6">
          
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-slate-800">Administration</h1>
            <Button onClick={handleLogout} variant="outline">
              Déconnexion
            </Button>
          </div>

          {/* Stats Panel */}
          <AdminStatsPanel {...adminStatsProps} />

          {/* Mobile Navigation */}
          <AdminMobileNavigation 
            {...adminMobileNavProps}
          />
          
          {/* Desktop Tabs */}
          <div className="hidden lg:block">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-7">
                {tabsConfig.map(tab => (
                  <TabsTrigger value={tab.value} key={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value="leads">
                <AdminLeadsTable 
                  {...adminLeadsProps}
                />
                <Pagination 
                  currentPage={leadsPagination.paginationState.page}
                  totalPages={leadsData?.total_pages || 1}
                  totalItems={leadsData?.total || 0}
                  pageSize={leadsPagination.paginationState.limit}
                  onPageChange={leadsPagination.setPage}
                  onPageSizeChange={leadsPagination.setLimit}
                  isLoading={leadsLoading}
                />
              </TabsContent>
              
              <TabsContent value="users">
                <AdminUsersTable 
                  {...adminUsersProps}
                />
                <Pagination 
                  currentPage={usersPagination.paginationState.page}
                  totalPages={usersData?.total_pages || 1}
                  totalItems={usersData?.total || 0}
                  pageSize={usersPagination.paginationState.limit}
                  onPageChange={usersPagination.setPage}
                  onPageSizeChange={usersPagination.setLimit}
                  isLoading={usersLoading}
                />
              </TabsContent>
              
              <TabsContent value="payments">
                <AdminPaymentsTable 
                  {...adminPaymentsProps}
                />
                <Pagination 
                  currentPage={paymentsPagination.paginationState.page}
                  totalPages={paymentsData?.total_pages || 1}
                  totalItems={paymentsData?.total || 0}
                  pageSize={paymentsPagination.paginationState.limit}
                  onPageChange={paymentsPagination.setPage}
                  onPageSizeChange={paymentsPagination.setLimit}
                  isLoading={paymentsLoading}
                />
              </TabsContent>
              
              <TabsContent value="anniversary">
                <AdminAlertsPanel 
                  {...adminAlertsProps}
                />
              </TabsContent>
              
              <TabsContent value="contracts">
                <AdminContracts 
                  {...adminContractsProps}
                />
                <Pagination 
                  currentPage={contractsPagination.paginationState.page}
                  totalPages={contracts?.total_pages || 1}
                  totalItems={contracts?.total || 0}
                  pageSize={contractsPagination.paginationState.limit}
                  onPageChange={contractsPagination.setPage}
                  onPageSizeChange={contractsPagination.setLimit}
                  isLoading={contractsLoading}
                />
              </TabsContent>
              
              <TabsContent value="user-management">
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold mb-2">Gestion utilisateurs avancée</h3>
                  <p className="text-gray-600">Fonctionnalité en développement</p>
                </div>
              </TabsContent>
              
              <TabsContent value="messages">
                <AdminMessaging 
                  {...adminMessagingProps}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Dialogs */}
          {selectedLead && (
            <Dialog open={!!selectedLead} onOpenChange={handleDialogClose}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modifier le statut du lead</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Lead: {selectedLead.prospect_name}</Label>
                  </div>
                  <div>
                    <Label>Nouveau statut</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem value={option.value} key={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateLeadMutation.mutate({
                        lead_id: selectedLead.id,
                        new_status: newStatus
                      })}
                      disabled={!newStatus}
                    >
                      Mettre à jour
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedLead(null)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {userToDelete && (
            <Dialog open={!!userToDelete} onOpenChange={handleDeleteDialogClose}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmer la suppression</DialogTitle>
                </DialogHeader>
                <p>Êtes-vous sûr de vouloir supprimer l'apporteur {userToDelete.full_name} ?</p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => deleteUserMutation.mutate({ user_id: userToDelete.user_id })}
                  >
                    Supprimer
                  </Button>
                  <Button variant="outline" onClick={() => setUserToDelete(null)}>
                    Annuler
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {showPaymentConfirmDialog && selectedUserForPayment && (
            <Dialog open={showPaymentConfirmDialog} onOpenChange={handlePaymentDialogClose}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Demande de paiement</DialogTitle>
                </DialogHeader>
                <p>Créer une demande de paiement pour {selectedUserForPayment.full_name} ?</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => requestPaymentForUserMutation.mutate({ user_id: selectedUserForPayment.user_id })}
                  >
                    Confirmer
                  </Button>
                  <Button variant="outline" onClick={() => setShowPaymentConfirmDialog(false)}>
                    Annuler
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </AdminGuard>
  );
};

export default Admin;
