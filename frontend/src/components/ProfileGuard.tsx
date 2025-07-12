import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserGuardContext } from 'app/auth';
import brain from 'brain';
import { Loader2 } from 'lucide-react';
import type { ProfileCheckResponse } from 'types';

interface ProfileGuardProps {
  children: React.ReactNode;
}

/**
 * Component that checks if user has completed profile setup.
 * Redirects to onboarding if profile is incomplete.
 */
export function ProfileGuard({ children }: ProfileGuardProps) {
  const { user } = useUserGuardContext();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const response = await brain.check_profile_completion();
        const data: ProfileCheckResponse = await response.json();
        
        // Si l'user_id est invalide, permettre l'accès au dashboard
        // pour éviter les boucles de redirection
        if (data.missing_fields.includes('invalid_user_id')) {
          console.log('ProfileGuard: User ID invalide, autorisation d\'accès au dashboard');
          setProfileComplete(true);
          return;
        }
        
        if (!data.is_complete) {
          // Check if it's specifically a contract signature issue
          if (data.missing_fields.includes('contract_signature')) {
            // Redirect to contract page for professionals who need to sign
            console.log('ProfileGuard: Redirection vers contrat-apporteur pour signature');
            navigate('/contrat-apporteur', { replace: true });
          } else if (data.missing_fields.includes('referral_guide_acceptance')) {
            // Only redirect to guide if other essential fields are complete
            const essentialFields = data.missing_fields.filter(field => field !== 'referral_guide_acceptance');
            if (essentialFields.length === 0) {
              // Profile is complete except for guide acceptance - allow access to dashboard
              console.log('ProfileGuard: Profil complet sauf guide parrainage, autorisation d\'accès au dashboard');
              setProfileComplete(true);
            } else {
              // Redirect to referral guide for individuals who need to accept it
              console.log('ProfileGuard: Redirection vers guide-parrainage pour acceptation');
              navigate('/guide-parrainage?onboarding=true', { replace: true });
            }
          } else if (data.missing_fields.length > 0) {
            // Redirect to onboarding for other missing fields
            console.log('ProfileGuard: Redirection vers onboarding-page pour champs manquants:', data.missing_fields);
            navigate('/onboarding-page', { replace: true });
          }
        } else {
          console.log('ProfileGuard: Profil complet, autorisation d\'accès au dashboard');
          setProfileComplete(true);
        }
      } catch (error) {
        console.error('Error checking profile completion:', error);
        // On error, allow access to dashboard to avoid loops
        console.log('ProfileGuard: Erreur lors de la vérification, autorisation d\'accès au dashboard');
        setProfileComplete(true);
      } finally {
        setIsChecking(false);
      }
    };

    if (user) {
      checkProfile();
    }
  }, [user, navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-slate-700 to-slate-800 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Vérification de votre profil...</p>
        </div>
      </div>
    );
  }

  return profileComplete ? <>{children}</> : null;
}
