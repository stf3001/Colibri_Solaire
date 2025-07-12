import React, { useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserX, Euro } from 'lucide-react';

interface UserStat {
  user_id: string;
  full_name: string;
  user_type: 'professionnel' | 'particulier';
  email?: string;
  phone?: string;
  city?: string;
  total_leads: number;
  pending_commissions: number;
  paid_commissions: number;
  created_at: string;
  last_activity?: string;
}

interface Props {
  users: UserStat[];
  isLoading: boolean;
  onDeleteUser: (user: UserStat) => void;
  onRequestPayment: (user: UserStat) => void;
}

const AdminUsersTable: React.FC<Props> = React.memo(({ 
  users, 
  isLoading, 
  onDeleteUser, 
  onRequestPayment 
}) => {
  // Helper functions locales au composant
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }, []);

  const getUserTypeBadgeClass = useCallback((userType: string) => {
    return userType === 'professionnel' 
      ? 'bg-blue-500 text-white border-blue-600' 
      : 'bg-emerald-500 text-white border-emerald-600';
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-slate-800">Apporteurs d'affaires</h3>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement des apporteurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-slate-800">Apporteurs d'affaires ({users.length})</h3>
      </div>
      
      {users.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600">Aucun apporteur trouvé</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {users.map((userStat) => (
            <Card key={userStat.user_id} className="p-6 border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 bg-white">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-xl font-bold text-slate-800">{userStat.full_name}</h4>
                    <Badge className={`font-medium ${getUserTypeBadgeClass(userStat.user_type)}`}>
                      {userStat.user_type}
                    </Badge>
                  </div>
                  
                  {/* Informations de contact */}
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg border">
                    <p className="text-slate-600 font-medium mb-2">Informations de contact</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">✉️</span>
                        <span className="text-blue-600">{userStat.email || 'Non renseigné'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">📞</span>
                        <span>{userStat.phone || 'Non renseigné'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">📍</span>
                        <span>{userStat.city || 'Non renseigné'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-slate-50 p-3 rounded-lg border">
                      <p className="text-slate-600 font-medium">Prospects</p>
                      <p className="text-2xl font-bold text-slate-800">{userStat.total_leads}</p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-emerald-700 font-medium">Commissions</p>
                          <p className="text-xl font-bold text-emerald-800">
                            {formatCurrency(userStat.pending_commissions + userStat.paid_commissions)}
                          </p>
                        </div>
                        {userStat.pending_commissions > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="ml-2 border-emerald-500 text-emerald-700 hover:bg-emerald-100"
                            onClick={() => onRequestPayment(userStat)}
                            title={`Demander paiement de ${formatCurrency(userStat.pending_commissions)}`}
                          >
                            <Euro className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-blue-700 font-medium">Inscrit le</p>
                      <p className="text-sm font-semibold text-blue-800">{formatDate(userStat.created_at)}</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <p className="text-amber-700 font-medium">Dernière activité</p>
                      <p className="text-sm font-semibold text-amber-800">
                        {userStat.last_activity ? formatDate(userStat.last_activity) : 'Aucune'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 ml-4">
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => onDeleteUser(userStat)}
                    className="bg-red-500 hover:bg-red-600 border-red-600"
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
});

AdminUsersTable.displayName = 'AdminUsersTable';

export default AdminUsersTable;
