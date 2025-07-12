import { useStackApp, useUser } from "@stackframe/react";
import { Navigate } from "react-router-dom";

const popFromLocalStorage = (key: string): string | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const value = localStorage.getItem(key);
    localStorage.removeItem(key);
    return value;
  }

  return null;
};

// Fonction pour vérifier si un utilisateur est admin
const isAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const adminEmails = ['stephane.a@voltalia-ms.com'];
  return adminEmails.includes(email.toLowerCase());
};

export const CustomLoginRedirect = () => {
  const app = useStackApp();
  const user = useUser();

  const queryParams = new URLSearchParams(window.location.search);
  const next = queryParams.get('next') || popFromLocalStorage('dtbn-login-next');

  // Si une redirection spécifique est demandée, l'utiliser
  if (next) {
    return <Navigate to={next} replace={true} />;
  }

  // Sinon, rediriger selon le type d'utilisateur
  if (user && isAdmin(user.primaryEmail)) {
    return <Navigate to="/admin" replace={true} />;
  }

  // Utilisateur normal vers le dashboard
  return <Navigate to="/dashboard-page" replace={true} />;
};