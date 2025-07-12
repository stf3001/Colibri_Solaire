import React from 'react';
import { useUser } from '@stackframe/react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';

// Fonction pour vérifier si l'utilisateur est admin
const isAdmin = (userEmail: string | null | undefined): boolean => {
  return userEmail === "stephane.a@voltalia-ms.com";
};

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const user = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Si pas d'utilisateur connecté ou pas admin, rediriger
    if (!user || !isAdmin(user.primaryEmail)) {
      toast.error('Accès restreint aux administrateurs.');
      navigate('/dashboard-page');
      return;
    }
  }, [user, navigate]);

  // Si pas d'utilisateur ou pas admin, ne rien afficher (redirection en cours)
  if (!user || !isAdmin(user.primaryEmail)) {
    return null;
  }

  // Si admin, afficher le contenu
  return <>{children}</>;
}
