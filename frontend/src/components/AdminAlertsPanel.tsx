import React, { useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { AnniversaryAlertResponse } from 'types';

interface Props {
  anniversaryAlerts: AnniversaryAlertResponse[];
  isLoading: boolean;
}

const AdminAlertsPanel: React.FC<Props> = React.memo(({ anniversaryAlerts, isLoading }) => {
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Alertes anniversaire</h3>
        </div>
        <div className="text-center py-8 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Alertes anniversaire ({anniversaryAlerts.length})</h3>
      </div>
      
      {anniversaryAlerts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucune alerte anniversaire</p>
        </div>
      ) : (
        <div className="space-y-4">
          {anniversaryAlerts.map((alert) => (
            <Card key={alert.user_id} className="p-4 border-orange-200 bg-orange-50">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{alert.full_name}</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Anniversaire: {formatDate(alert.anniversary_date)}</div>
                    <div>Dans: {alert.days_until_anniversary} jours</div>
                    <div>Bons en attente: {alert.vouchers_pending}</div>
                    <div>Parrainages: {alert.referral_count}</div>
                  </div>
                </div>
                <Badge className="bg-orange-500 text-white">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Urgent
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
});

AdminAlertsPanel.displayName = 'AdminAlertsPanel';

export default AdminAlertsPanel;
