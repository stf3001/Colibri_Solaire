import { useUserGuardContext } from "app/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import brain from "brain";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Euro, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { CommissionBalance } from "types";
import { MobileNavigation } from "components/MobileNavigation";

export default function CommissionsPage() {
    const { user } = useUserGuardContext();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery<CommissionBalance>({
        queryKey: ["commissionBalance", user.id],
        queryFn: async () => {
          const response = await brain.get_commission_balance();
          return response.json();
        },
    });

    const paymentRequestMutation = useMutation({
        mutationFn: () => brain.request_payment(),
        onSuccess: () => {
            toast.success("Demande de paiement envoyée !", {
                description: "Votre demande a bien été prise en compte et sera traitée prochainement.",
            });
            // Refetch balance to show it's now 0
            queryClient.invalidateQueries({ queryKey: ["commissionBalance", user.id] });
            // Also refetch dashboard data as it might be affected
            queryClient.invalidateQueries({ queryKey: ["dashboardData", user.id] });
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.detail || "Une erreur est survenue.";
            toast.error("Échec de la demande", {
                description: errorMessage,
            });
        },
    });

    const handleRequestPayment = () => {
        if (data && data.due_balance > 0) {
            paymentRequestMutation.mutate();
        } else {
            toast.info("Aucun solde à réclamer", {
                description: "Vous n'avez actuellement aucune commission en attente de paiement.",
            });
        }
    };
    
    const dueBalance = data?.due_balance ?? 0;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-red-900/10 text-white p-4">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Erreur de chargement</h2>
                <p>Nous n'avons pas pu charger votre solde de commissions.</p>
                <Button variant="outline" onClick={() => navigate("/dashboard-page")} className="mt-6 bg-transparent border-white/50 hover:bg-white/10">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-slate-700 to-slate-800 text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto pb-24 md:pb-8"> {/* Extra padding for mobile nav */}
                <Button variant="ghost" onClick={() => navigate("/dashboard-page")} className="mb-4 text-white/80 hover:bg-white/10 touch-manipulation min-h-[44px]">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour au tableau de bord
                </Button>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-white text-shadow">Vos Commissions</CardTitle>
                        <CardDescription className="text-white/70">
                            Consultez votre solde de commissions et demandez un paiement.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-10">
                        <p className="text-lg text-white/80 mb-2">Solde actuellement dû</p>
                        {isLoading ? (
                            <Skeleton className="h-16 w-48 bg-white/20 mx-auto" />
                        ) : (
                            <div className="text-6xl font-bold text-white text-shadow flex items-center justify-center gap-2">
                                <Euro className="h-12 w-12" />
                                <span>{dueBalance.toFixed(2)}</span>
                            </div>
                        )}
                        <Button 
                            onClick={handleRequestPayment}
                            disabled={isLoading || paymentRequestMutation.isPending || dueBalance === 0}
                            className="mt-8 w-full max-w-xs mx-auto bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold shadow-lg text-lg py-6 touch-manipulation min-h-[52px]"
                        >
                            {paymentRequestMutation.isPending ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                                    Envoi en cours...
                                </div>
                            ) : (
                                'Demander le paiement'
                            )}
                        </Button>
                         {dueBalance === 0 && !isLoading && (
                            <p className="text-sm text-white/60 mt-4">Vous n'avez aucune commission en attente.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
            <MobileNavigation />
        </div>
    );
}
