import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Building2,
  Check,
  Clock,
  Calendar,
  Eye,
  Download,
  FileIcon
} from 'lucide-react';

interface Contract {
  id: number;
  user_full_name: string;
  company_name: string;
  siret_number: string;
  contract_type?: string;
  is_signed: boolean;
  signed_at?: string;
  contract_html: string;
  created_at: string;
}

interface Props {
  contracts: Contract[];
  isLoading: boolean;
}

const AdminContracts: React.FC<Props> = React.memo(({ contracts, isLoading }) => {
  // États locaux pour les filtres
  const [contractSearchTerm, setContractSearchTerm] = useState('');
  const [contractStatusFilter, setContractStatusFilter] = useState<'all' | 'signed' | 'pending'>('all');
  const [selectedContractForView, setSelectedContractForView] = useState<Contract | null>(null);

  // Helper functions
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }, []);

  // Logique de filtrage
  const filteredContracts = useCallback(() => {
    return contracts.filter((contract) => {
      const matchesSearch = 
        contract.user_full_name?.toLowerCase().includes(contractSearchTerm.toLowerCase()) ||
        contract.company_name?.toLowerCase().includes(contractSearchTerm.toLowerCase()) ||
        contract.siret_number?.includes(contractSearchTerm);
      
      const matchesStatus = contractStatusFilter === 'all' || 
        (contractStatusFilter === 'signed' && contract.is_signed) ||
        (contractStatusFilter === 'pending' && !contract.is_signed);
      
      return matchesSearch && matchesStatus;
    });
  }, [contracts, contractSearchTerm, contractStatusFilter]);

  const handleDownloadPDF = useCallback(async (contract: Contract) => {
    try {
      // Générer le PDF côté client à partir du HTML du contrat
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Impossible d\'ouvrir la fenêtre de téléchargement');
        return;
      }
      
      // Créer le contenu HTML pour l'impression
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Contrat - ${contract.company_name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px;">
            <h2>Contrat d'Apporteur d'Affaires</h2>
            <p><strong>Entreprise:</strong> ${contract.company_name}</p>
            <p><strong>SIRET:</strong> ${contract.siret_number}</p>
            <p><strong>Apporteur:</strong> ${contract.user_full_name}</p>
            ${contract.is_signed ? `<p><strong>Signé le:</strong> ${formatDate(contract.signed_at!)}</p>` : '<p><strong>Statut:</strong> En attente de signature</p>'}
          </div>
          ${contract.contract_html}
          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print(); window.close();">Imprimer / Télécharger PDF</button>
            <button onclick="window.close();">Fermer</button>
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Auto-déclencher l'impression
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
      
      toast.success('Fenêtre de téléchargement PDF ouverte');
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      toast.error('Erreur lors de l\'ouverture du PDF');
    }
  }, [formatDate]);

  const filtered = filteredContracts();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <h3 className="text-lg font-semibold">Gestion des contrats</h3>
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h3 className="text-lg font-semibold">Gestion des contrats ({filtered.length})</h3>
        
        {/* Filtres et recherche */}
        <div className="flex flex-col lg:flex-row gap-2 w-full lg:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, entreprise, SIRET..."
              value={contractSearchTerm}
              onChange={(e) => setContractSearchTerm(e.target.value)}
              className="pl-10 w-full lg:w-64"
            />
          </div>
          <Select value={contractStatusFilter} onValueChange={setContractStatusFilter}>
            <SelectTrigger className="w-full lg:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les contrats</SelectItem>
              <SelectItem value="signed">Signés seulement</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <FileIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="font-medium text-gray-900 mb-2">Aucun contrat trouvé</h4>
          <p className="text-gray-600">
            {contracts.length === 0 
              ? "Aucun contrat n'a encore été créé."
              : "Aucun contrat ne correspond aux critères de recherche."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Apporteur</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>SIRET</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date de signature</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>
                    <div className="font-medium">{contract.user_full_name}</div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{contract.company_name}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Building2 className="h-3 w-3 mr-1" />
                        {contract.contract_type || 'Professionnel'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {contract.siret_number}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{contract.contract_type || 'Standard'}</Badge>
                  </TableCell>
                  <TableCell>
                    {contract.is_signed ? (
                      <Badge className="bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Signé
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        En attente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {contract.signed_at ? (
                      <div className="flex items-center text-sm">
                        <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                        {formatDate(contract.signed_at)}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedContractForView(contract)}
                        className="h-8 px-2"
                        title="Voir le contrat"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownloadPDF(contract)}
                        className="h-8 px-2 bg-blue-500 hover:bg-blue-600"
                        title="Télécharger PDF"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Modal de visualisation du contrat */}
      {selectedContractForView && (
        <Dialog open={!!selectedContractForView} onOpenChange={() => setSelectedContractForView(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Contrat - {selectedContractForView.company_name}
              </DialogTitle>
            </DialogHeader>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedContractForView.contract_html }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
});

AdminContracts.displayName = 'AdminContracts';

export default AdminContracts;
