import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Lead {
  id: number;
  prospect_name: string;
  prospect_phone?: string;
  prospect_email?: string;
  prospect_city?: string;
  apporteur_name?: string;
  status: string;
  created_at: string;
}

interface Props {
  leads: Lead[];
  isLoading: boolean;
  onEditLead: (lead: Lead) => void;
}

const AdminLeadsTable: React.FC<Props> = React.memo(({ leads, isLoading, onEditLead }) => {
  // Helper functions locales au composant
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'soumis': return 'bg-blue-100 text-blue-800';
      case 'visité': return 'bg-yellow-100 text-yellow-800';
      case 'signé': return 'bg-green-100 text-green-800';
      case 'installé': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Tous les filleuls</h3>
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
        <h3 className="text-lg font-semibold">Tous les filleuls ({leads.length})</h3>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Filleul</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Apporteur</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Aucun filleul trouvé
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{lead.prospect_name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">📞</span>
                        <span>{lead.prospect_phone || '-'}</span>
                      </div>
                      {lead.prospect_email && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">✉️</span>
                          <span className="text-blue-600">{lead.prospect_email}</span>
                        </div>
                      )}
                      {lead.prospect_city && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">📍</span>
                          <span>{lead.prospect_city}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{lead.apporteur_name || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(lead.created_at)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditLead(lead)}
                    >
                      Modifier
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

AdminLeadsTable.displayName = 'AdminLeadsTable';

export default AdminLeadsTable;
