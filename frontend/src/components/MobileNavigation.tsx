import { useLocation, useNavigate } from "react-router-dom";
import { useUserGuardContext } from "app/auth";
import { Home, FileText, Users, Euro, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import brain from "brain";

// Fonction pour vérifier si l'utilisateur est admin
const isAdmin = (userEmail: string | null | undefined): boolean => {
  return userEmail === "stephane.a@voltalia-ms.com";
};

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  adminOnly?: boolean;
}

export function MobileNavigation() {
  const { user } = useUserGuardContext();
  const navigate = useNavigate();
  const location = useLocation();
  const userIsAdmin = isAdmin(user.primaryEmail);

  // Récupérer les données du profil pour connaître le type d'utilisateur
  const { data: dashboardData } = useQuery({
    queryKey: ["dashboardData", user.id],
    queryFn: async () => {
      const response = await brain.get_dashboard_data();
      return response.json();
    },
    enabled: !!user
  });

  const userType = dashboardData?.user_profile?.user_type;
  const isIndividual = userType === 'particulier';

  // Configuration des éléments de navigation
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Accueil',
      icon: <Home className="h-5 w-5" />,
      path: '/dashboard-page'
    },
    {
      id: 'leads',
      label: 'Filleuls',
      icon: <Users className="h-5 w-5" />,
      path: '/leads-page'
    },
    {
      id: 'add-lead',
      label: 'Ajouter',
      icon: <Plus className="h-6 w-6" />,
      path: '/lead-form'
    },
    {
      id: 'commissions',
      label: isIndividual ? 'Bons' : 'Commissions',
      icon: <Euro className="h-5 w-5" />,
      path: '/commissions-page'
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: <Settings className="h-5 w-5" />,
      path: '/admin',
      adminOnly: true
    }
  ];

  // Filtrer les éléments selon les permissions
  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || userIsAdmin
  );

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Ne pas afficher sur la page d'accueil
  if (location.pathname === '/') {
    return null;
  }

  return (
    <>
      {/* Spacer pour éviter que le contenu soit caché par la bottom nav */}
      <div className="h-20 md:hidden" />
      
      {/* Bottom Navigation - Visible seulement sur mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/50 z-50 md:hidden">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {filteredNavItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200",
                "min-h-[60px] touch-manipulation", // Touch optimization
                isActive(item.path)
                  ? "bg-blue-500/20 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100/50 active:bg-gray-200/50"
              )}
            >
              <div className={cn(
                "transition-transform duration-200",
                isActive(item.path) ? "scale-110" : "scale-100"
              )}>
                {item.icon}
              </div>
              <span className={cn(
                "text-xs font-medium mt-1 transition-colors",
                isActive(item.path) ? "text-blue-600" : "text-gray-600"
              )}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
        
        {/* Indicateur de connexion */}
        <div className="absolute top-1 right-2 w-2 h-2 bg-green-500 rounded-full" />
      </nav>

      {/* Floating Action Button pour ajouter un lead - position centrale sur le bottom nav */}
      <button
        onClick={() => handleNavigation('/lead-form')}
        className={cn(
          "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 md:hidden",
          "w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full",
          "flex items-center justify-center shadow-lg",
          "hover:shadow-xl active:scale-95 transition-all duration-200",
          "touch-manipulation", // Touch optimization
          isActive('/lead-form') 
            ? "bg-gradient-to-r from-blue-600 to-blue-700 scale-110" 
            : ""
        )}
      >
        <Plus className="h-7 w-7 text-white" />
      </button>
    </>
  );
}

// Hook pour gérer la navigation mobile
export function useMobileNavigation() {
  const location = useLocation();
  
  const isHomePage = location.pathname === '/';
  const shouldShowBottomNav = !isHomePage;
  
  return {
    shouldShowBottomNav,
    currentPath: location.pathname
  };
}
