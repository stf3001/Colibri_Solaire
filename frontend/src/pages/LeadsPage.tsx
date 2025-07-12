import { useUserGuardContext } from "app/auth";
import { useQuery } from "@tanstack/react-query";
import brain from "brain";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertCircle } from "lucide-react";
import type { LeadDetails } from "types";
import { MobileNavigation } from "components/MobileNavigation";

const statusConfig = {
  soumis: { label: 'Soumis', className: 'bg-blue-500' },
  visité: { label: 'Visité', className: 'bg-yellow-500' },
  signé: { label: 'Signé', className: 'bg-green-500' },
  installé: { label: 'Installé', className: 'bg-purple-500' },
};

const commissionStatusConfig = {
    pending: { label: 'En attente', className: 'text-orange-400' },
    paid: { label: 'Payée', className: 'text-green-400' },
}

const LeadStatusIndicator = ({ status }) => {
  const config = statusConfig[status] || { label: 'Inconnu', className: 'bg-gray-500' };
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${config.className}`}></span>
      <span className="text-white/90">{config.label}</span>
    </div>
  );
};

const CommissionStatusIndicator = ({ status }) => {
    if (!status) return null;
    const config = commissionStatusConfig[status] || { label: '', className: 'text-gray-400'};
    return (
        <span className={`text-xs font-semibold ${config.className}`}>
            Commission: {config.label}
        </span>
    );
};

export default function LeadsPage() {
    const { user } = useUserGuardContext();
    const navigate = useNavigate();

    const { data: leads, isLoading, error } = useQuery<LeadDetails[]>({
        queryKey: ["allLeads", user.id],
        queryFn: async () => {
          const response = await brain.get_all_leads();
          return response.json();
        },
    });

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-red-900/10 text-white p-4">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Erreur de chargement des filleuls</h2>
                <p className="text-red-300/80 text-center max-w-md">
                    Nous n'avons pas pu charger la liste de vos filleuls. Veuillez réessayer plus tard ou contacter le support si le problème persiste.
                </p>
                <Button variant="outline" onClick={() => navigate("/dashboard-page")} className="mt-6 bg-transparent border-white/50 hover:bg-white/10">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                </Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-slate-700 to-slate-800 text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto pb-24 md:pb-8"> {/* Extra padding for mobile nav */}
                <Button variant="ghost" onClick={() => navigate("/dashboard-page")} className="mb-4 text-white/80 hover:bg-white/10 touch-manipulation min-h-[44px]">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour au tableau de bord
                </Button>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-white text-shadow">Tous vos filleuls</CardTitle>
                        <CardDescription className="text-white/70">
                            Voici la liste chronologique de tous les filleuls que vous avez soumis.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow className="border-b-white/20 hover:bg-white/5">
                                    <TableHead className="text-white/80">Nom du Filleul</TableHead>
                                    <TableHead className="text-white/80">Statut</TableHead>
                                    <TableHead className="text-right text-white/80">Date de soumission</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 7 }).map((_, index) => (
                                        <TableRow key={index} className="border-b-white/10">
                                            <TableCell><Skeleton className="h-5 w-40 bg-white/20" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-24 bg-white/20" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-5 w-28 bg-white/20 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : leads && leads.length > 0 ? (
                                    leads.map((lead) => (
                                        <TableRow key={lead.id} className="border-b-white/10 hover:bg-white/5">
                                            <TableCell className="font-medium text-white py-4">
                                                {lead.prospect_name}
                                                {lead.status === 'installé' && (
                                                    <div className="mt-1">
                                                        <CommissionStatusIndicator status={lead.commission_status} />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <LeadStatusIndicator status={lead.status} />
                                            </TableCell>
                                            <TableCell className="text-right text-white/70">
                                                {new Date(lead.created_at).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-16 text-white/70">
                                            <p className="font-semibold mb-2">Aucun filleul trouvé</p>
                                            <p className="text-sm">Vous n'avez pas encore soumis de filleul. Commencez dès maintenant !</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                         </Table>
                    </CardContent>
                </Card>
            </div>
            <MobileNavigation />
        </div>
    );
}
