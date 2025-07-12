import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { useUser } from "@stackframe/react";
import { stackClientApp } from "app/auth";
import brain from 'brain';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText } from 'lucide-react';

export function UserButton() {
  const user = useUser();
  const navigate = useNavigate();

  // Récupérer les données du profil pour connaître le type d'utilisateur
  const { data: dashboardData } = useQuery({
    queryKey: ["dashboardData", user?.id],
    queryFn: async () => {
      const response = await brain.get_dashboard_data();
      return response.json();
    },
    enabled: !!user
  });

  if (!user) {
    return null;
  }

  const isIndividual = dashboardData?.user_profile?.user_type === 'particulier';

  const getInitials = (name) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0][0];
  }

  const handleSignOut = async () => {
    try {
      await stackClientApp.signOut();
      // Redirection manuelle vers la page d'accueil après déconnexion
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Forcer la redirection même en cas d'erreur
      navigate('/');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src={user.avatarUrl || ''} />
          <AvatarFallback>{getInitials(user.fullName || 'U')}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{user.fullName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Guide de parrainage pour les particuliers */}
        {isIndividual && (
          <>
            <DropdownMenuItem onClick={() => navigate('/guide-parrainage')}>
              <BookOpen className="h-4 w-4 mr-2" />
              Guide de parrainage
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {/* Contrat d'apporteur pour les professionnels */}
        {!isIndividual && (
          <>
            <DropdownMenuItem onClick={() => navigate('/contratapporteur')}>
              <FileText className="h-4 w-4 mr-2" />
              Contrat d'apporteur
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={handleSignOut}>
          Déconnexion
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-gray-500 font-mono">
            User ID: {user.id}
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
