import { useUserGuardContext } from "app/auth";
import { ProfileGuard } from "components/ProfileGuard";
import { UserButton } from "@/components/UserButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sun, Users, BarChart, Euro, ChevronRight, Settings } from "lucide-react";
import brain from "brain";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardData } from "types";
import { useNavigate } from "react-router-dom";
import { MessagingSection } from "components/MessagingSection";
import { MobileNavigation } from "components/MobileNavigation";

const StatCard = ({ title, value, icon, loading, onClick, blocked }) => {
  const CardWrapper = onClick ? 'button' : 'div';
  
  return (
    <CardWrapper
      onClick={onClick}
      className={`glass-card w-full text-left ${
        onClick ? 'cursor-pointer hover:bg-white/10 transition-colors' : ''
      } ${
        blocked ? 'border-red-400/50 bg-red-500/10' : ''
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={`text-sm font-medium text-shadow ${
          blocked ? 'text-red-200' : 'text-white/80'
        }`}>
          {title}
          {blocked && <span className="ml-2 text-red-300">⚠️ Limite atteinte</span>}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20 bg-white/20" />
        ) : (
          <div className={`text-2xl font-bold text-shadow flex items-center justify-between ${
            blocked ? 'text-red-200' : 'text-white'
          }`}>
            {value}
            {onClick && <ChevronRight className="h-5 w-5 text-white/60" />}
          </div>
        )}
      </CardContent>
    </CardWrapper>
  );
};

const statusConfig = {
  soumis: { label: 'Soumis', color: 'bg-blue-500' },
  visité: { label: 'Visité', color: 'bg-yellow-500' },
  signé: { label: 'Signé', color: 'bg-green-500' },
  installé: { label: 'Installé', color: 'bg-purple-500' },
};

const getStatusIndicator = (status) => {
  return statusConfig[status] || { label: 'Inconnu', color: 'bg-gray-500' };
};

// Fonction pour vérifier si l'utilisateur est admin
const isAdmin = (userEmail: string | null | undefined): boolean => {
  return userEmail === "stephane.a@voltalia-ms.com";
};

export default function DashboardPage() {
  const { user } = useUserGuardContext();
  const navigate = useNavigate();

  // Si l'utilisateur est admin, pas besoin de ProfileGuard
  const userIsAdmin = isAdmin(user.primaryEmail);

  // Navigation vers le formulaire de leads
  const navigateToLeadForm = () => {
    navigate("/lead-form");
  };

  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["dashboardData", user.id],
    queryFn: async () => {
      const response = await brain.get_dashboard_data();
      return response.json();
    },
  });

  // Adapter les stats selon le type d'utilisateur
  const userType = dashboardData?.user_profile?.user_type;
  const isIndividual = userType === 'particulier';
  
  const stats = [
    { 
      title: "Mes filleuls", 
      value: dashboardData?.stats.total_leads, 
      icon: <BarChart className="h-4 w-4 text-white/60" />, 
      loading: isLoading, 
      onClick: () => navigate("/leads-page") 
    },
    {
      title: isIndividual ? "Bons d'achat (Total)" : "Commissions (Total)",
      value: `€${dashboardData?.stats.total_commissions.toFixed(2)}`,
      icon: isIndividual ? <Sun className="h-4 w-4 text-white/60" /> : <Euro className="h-4 w-4 text-white/60" />,
      loading: isLoading
    },
    {
      title: isIndividual ? "Bons d'achat en attente" : "Commissions en attente",
      value: `€${dashboardData?.stats.pending_payments.toFixed(2)}`,
      icon: <Euro className="h-4 w-4 text-white/60" />,
      loading: isLoading,
      onClick: () => navigate("/commissions-page")
    },
  ];
  
  // Ajouter une stat spécifique aux particuliers
  if (isIndividual && dashboardData?.stats.referral_count_year !== null) {
    stats.splice(2, 0, {
      title: "Parrainages cette année",
      value: `${dashboardData.stats.referral_count_year}/${dashboardData.stats.max_referrals_per_year}`,
      icon: <Sun className="h-4 w-4 text-white/60" />,
      loading: isLoading,
      // Couleur différente si bloqué
      blocked: dashboardData.stats.is_blocked
    });
  }

  if (error) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-red-900/10 text-white">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Erreur de chargement</h2>
                <p>Nous n'avons pas pu charger les données du tableau de bord. Veuillez réessayer plus tard.</p>
                <p className="text-sm text-red-300/70 mt-4">{error.message}</p>
            </div>
        </div>
    )
  }

  // Si admin, bypass ProfileGuard, sinon utiliser ProfileGuard
  const content = (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-slate-700 to-slate-800">

      <header className="sticky top-0 z-10 bg-black/30 backdrop-blur-lg border-b border-white/10 p-3 md:p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex flex-col items-center gap-1 md:gap-2">
            <div className="flex items-center gap-2 md:gap-3">
              <img 
                src="https://static.databutton.com/public/37fe5734-c127-47a0-bff0-150639aa4c74/Voltalia.png" 
                alt="Voltalia" 
                className="h-6 md:h-8 w-auto"
              />
              <img 
                src="https://static.databutton.com/public/37fe5734-c127-47a0-bff0-150639aa4c74/Leroy_Merlin.svg" 
                alt="Leroy Merlin" 
                className="h-6 md:h-8 w-auto"
              />
            </div>
            <span className="text-xs md:text-sm text-yellow-400 font-medium text-center whitespace-nowrap">réseau Ambassadeurs</span>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {/* Bouton accès admin uniquement pour Stéphane */}
          {user.primaryEmail === "stephane.a@voltalia-ms.com" && (
            <Button
              onClick={() => navigate("/admin")}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-colors"
            >
              <Settings className="h-4 w-4 mr-2" />
              Accès Admin
            </Button>
          )}
          <UserButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
            <h2 className="text-3xl font-bold mb-1 text-shadow">
              Bonjour, {isLoading ? (
                <span className="inline-block w-24 h-8 bg-white/20 rounded animate-pulse"></span>
              ) : (
                // Afficher seulement le prénom (premier mot du nom complet)
                dashboardData?.user_profile?.full_name?.split(' ')[0] || user.displayName?.split(' ')[0] || "Utilisateur"
              )}!
            </h2>
            <p className="text-white/70 text-shadow">Bienvenue sur votre tableau de bord.</p>
        </div>

        {/* Stats Cards - Optimisées pour mobile avec touch targets */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => (
            <StatCard 
              key={index} 
              title={stat.title} 
              value={stat.value} 
              icon={stat.icon} 
              loading={stat.loading} 
              onClick={stat.onClick}
              blocked={stat.blocked}
            />
          ))}
        </div>
        
        {/* Message de blocage pour particuliers */}
        {isIndividual && dashboardData?.stats.is_blocked && (
          <div className="mb-8">
            <Card className="border-red-400/50 bg-red-500/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <span className="text-red-300 text-xl">⚠️</span>
                  </div>
                  <div>
                    <h3 className="text-red-200 font-medium">Limite annuelle atteinte</h3>
                    <p className="text-red-300/80 text-sm">
                      Vous avez atteint la limite de 5 parrainages pour cette année. 
                      Prochains parrainages possibles après le <strong>{dashboardData.stats.next_anniversary_date}</strong>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Section Messagerie */}
        <div className="mb-8">
          <MessagingSection />
        </div>

        <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-shadow">Leads Récents</h3>
            {/* Bouton adapté selon le type d'utilisateur et le blocage */}
            {isIndividual && dashboardData?.stats.is_blocked ? (
              <div className="text-center">
                <p className="text-red-300 text-sm mb-2">Création de leads bloquée</p>
                <Button 
                  disabled 
                  className="bg-gray-500 text-gray-300 cursor-not-allowed touch-manipulation"
                >
                  Limite atteinte (5/5)
                </Button>
              </div>
            ) : (
              <Button 
                onClick={navigateToLeadForm} 
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold shadow-md touch-manipulation min-h-[44px]"
              >
                Ajouter un nouveau Lead
              </Button>
            )}
        </div>
        
        <Card className="glass-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b-white/20 hover:bg-white/5">
                  <TableHead className="text-white/80">Nom du Prospect</TableHead>
                  <TableHead className="text-white/80">Statut</TableHead>
                  <TableHead className="text-right text-white/80">Date de création</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index} className="border-b-0">
                            <TableCell><Skeleton className="h-5 w-32 bg-white/20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24 bg-white/20" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-28 bg-white/20 ml-auto" /></TableCell>
                        </TableRow>
                    ))
                ) : dashboardData?.recent_leads.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center py-10 text-white/70">
                            Vous n'avez pas encore soumis de prospect.
                        </TableCell>
                    </TableRow>
                ) : (
                  dashboardData?.recent_leads.map((lead) => {
                    const statusInfo = getStatusIndicator(lead.status);
                    return (
                      <TableRow key={lead.id} className="border-b-0 hover:bg-white/5">
                        <TableCell className="font-medium text-white">{lead.prospect_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${statusInfo.color}`}></span>
                            <span className="text-white/90">{statusInfo.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-white/70">{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
      <MobileNavigation />
    </div>
  );

  return userIsAdmin ? content : (
    <ProfileGuard>
      {content}
    </ProfileGuard>
  );
}
