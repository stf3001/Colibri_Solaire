import React, { useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { PaymentRequestResponse } from 'types';

interface Props {
  paymentRequests: PaymentRequestResponse[];
  isLoading: boolean;
  onProcessPayment: (payment: PaymentRequestResponse) => void;
}

const AdminPaymentsTable: React.FC<Props> = React.memo(({ 
  paymentRequests, 
  isLoading, 
  onProcessPayment 
}) => {
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Demandes de paiement</h3>
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
        <h3 className="text-lg font-semibold">Demandes de paiement ({paymentRequests.length})</h3>
      </div>
      
      {paymentRequests.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucune demande de paiement</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentRequests.map((payment) => (
            <Card key={payment.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{payment.apporteur_name}</h4>
                  <div className="text-sm text-gray-500 space-y-1">
                    <div>Montant: {formatCurrency(payment.amount_requested)}</div>
                    <div>Statut: {payment.status}</div>
                    <div>Demandé: {formatDate(payment.requested_at)}</div>
                    {payment.processed_at && (
                      <div>Traité: {formatDate(payment.processed_at)}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {payment.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => onProcessPayment(payment)}
                      className="bg-green-500 hover:bg-green-600"
                      title="Marquer comme payé"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
});

AdminPaymentsTable.displayName = 'AdminPaymentsTable';

export default AdminPaymentsTable;
