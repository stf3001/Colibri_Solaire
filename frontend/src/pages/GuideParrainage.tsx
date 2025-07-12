import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import brain from 'brain';
import { 
  Gift, 
  Sun, 
  CheckCircle, 
  Users, 
  ArrowRight, 
  Mail,
  Star,
  Zap,
  ArrowLeft
} from 'lucide-react';

interface GuideParrainageProps {
  onAccept?: () => void;
  showAcceptButton?: boolean;
  isOnboarding?: boolean;
}

const GuideParrainage = ({ 
  onAccept, 
  showAcceptButton = false, 
  isOnboarding = false 
}: GuideParrainageProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Détecter le mode onboarding depuis l'URL
  const isOnboardingMode = isOnboarding || searchParams.get('onboarding') === 'true';
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Vérifier si l'utilisateur a déjà accepté le guide
  useEffect(() => {
    const checkGuideStatus = async () => {
      try {
        const response = await brain.get_referral_guide_status();
        const result = await response.json();
        setHasAccepted(result.has_accepted);
        
        // Si déjà accepté et pas en onboarding, rediriger
        if (result.has_accepted && !isOnboardingMode && !showAcceptButton) {
          toast.info('Vous avez déjà accepté le guide de parrainage');
          navigate('/dashboard-page');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    if (!isOnboardingMode || showAcceptButton) {
      checkGuideStatus();
    } else {
      setCheckingStatus(false);
    }
  }, [isOnboardingMode, showAcceptButton, navigate]);

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification du statut du guide...</p>
        </div>
      </div>
    );
  }

  const handleAccept = async () => {
    if (!accepted) {
      toast.error('Vous devez accepter les conditions du guide de parrainage');
      return;
    }

    setLoading(true);
    try {
      const response = await brain.accept_referral_guide({});
      const result = await response.json();
      
      if (onAccept) {
        onAccept();
      } else {
        toast.success('Guide de parrainage accepté avec succès! Un email de confirmation vous a été envoyé.');
        if (!isOnboardingMode) {
          navigate('/dashboard-page');
        } else {
          // En mode onboarding, rediriger vers le dashboard après acceptation
          setTimeout(() => navigate('/dashboard-page'), 1500);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'acceptation:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erreur lors de l\'acceptation du guide';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Bouton retour */}
          <div className="mb-6">
            <Button 
              onClick={() => navigate('/dashboard-page')}
              variant="outline"
              className="flex items-center gap-2 hover:bg-blue-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au tableau de bord
            </Button>
          </div>
          
          {/* En-tête */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6">
              <Gift className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🎁 Guide du Parrainage
            </h1>
            <p className="text-xl text-gray-600 font-medium">
              Voltalia x Leroy Merlin
            </p>
            <div className="mt-4 flex justify-center">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Sun className="h-4 w-4 mr-2" />
                Programme Solaire
              </Badge>
            </div>
          </div>

          {/* Section 1: Introduction */}
          <Card className="mb-8 border-none shadow-lg bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Sun className="h-8 w-8 text-yellow-600" />
                ☀️ Recommandez le solaire autour de vous et soyez récompensé(e) !
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg text-gray-700 leading-relaxed">
                Vous connaissez des personnes qui pourraient être intéressées par l'installation 
                de panneaux solaires ? Parfait ! Notre programme de parrainage vous permet de les 
                accompagner tout en étant récompensé(e) pour votre aide.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                En tant qu'ambassadeur particulier, vous aidez vos proches à découvrir les 
                avantages du solaire tout en bénéficiant de bons d'achat attractifs pour 
                chaque installation réalisée.
              </p>
              <div className="bg-white/70 p-4 rounded-lg border-l-4 border-yellow-500">
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Simple, transparent et rémunérateur !
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Comment ça fonctionne */}
          <Card className="mb-8 border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                ✅ Comment ça fonctionne ?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {/* Étape 1 */}
                <div className="flex gap-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-gray-900 mb-2">
                      Création de votre compte ambassadeur particulier
                    </h4>
                    <p className="text-gray-700">
                      Inscrivez-vous en tant que particulier et validez ce guide de parrainage. 
                      C'est rapide et gratuit !
                    </p>
                  </div>
                </div>

                {/* Étape 2 */}
                <div className="flex gap-4 p-4 bg-green-50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-gray-900 mb-2">
                      Déclaration de vos filleuls via le formulaire
                    </h4>
                    <p className="text-gray-700">
                      Utilisez notre formulaire simple pour saisir les coordonnées des personnes 
                      intéressées par le solaire. Assurez-vous d'avoir leur accord préalable.
                    </p>
                  </div>
                </div>

                {/* Étape 3 */}
                <div className="flex gap-4 p-4 bg-yellow-50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-gray-900 mb-2">
                      Projet signé puis installé
                    </h4>
                    <p className="text-gray-700">
                      Nos équipes contactent votre filleul, l'accompagnent dans son projet, 
                      et procèdent à l'installation de sa solution solaire.
                    </p>
                  </div>
                </div>

                {/* Étape 4 */}
                <div className="flex gap-4 p-4 bg-orange-50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-gray-900 mb-2">
                      Réception de vos bons d'achat selon la grille
                    </h4>
                    <p className="text-gray-700">
                      Une fois l'installation terminée, vous recevez automatiquement vos 
                      bons d'achat selon le nombre de parrainages réalisés.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Grille des récompenses */}
          <Card className="mb-8 border-none shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Gift className="h-8 w-8 text-emerald-600" />
                🎁 Grille des récompenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {/* Récompense 1 */}
                <div className="flex items-center justify-between p-6 bg-white rounded-xl border border-emerald-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Zap className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-xl text-gray-900">1 parrainage</p>
                      <p className="text-gray-600">Installation réalisée</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-600">250 €</p>
                    <p className="text-sm text-gray-600">en bon d'achat</p>
                  </div>
                </div>

                {/* Récompense 3 */}
                <div className="flex items-center justify-between p-6 bg-white rounded-xl border border-emerald-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-xl text-gray-900">3 parrainages</p>
                      <p className="text-gray-600">Installations réalisées</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-600">900 €</p>
                    <p className="text-sm text-gray-600">en bons d'achat</p>
                  </div>
                </div>

                {/* Récompense 5 */}
                <div className="flex items-center justify-between p-6 bg-white rounded-xl border border-emerald-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                      <Star className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-xl text-gray-900">5 parrainages</p>
                      <p className="text-gray-600">Installations réalisées</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">1 500 €</p>
                    <p className="text-sm text-gray-600">en bons d'achat</p>
                  </div>
                </div>
              </div>

              {/* Avertissement paliers */}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 font-medium flex items-center gap-2">
                  ⚠️ <strong>Important :</strong> Les paliers ne sont pas cumulables
                </p>
                <p className="text-amber-700 text-sm mt-2">
                  Vous recevez la récompense correspondant au palier atteint, 
                  et non la somme de tous les paliers précédents.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Message si déjà accepté */}
          {hasAccepted && !isOnboardingMode && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Guide de parrainage déjà accepté
                  </h3>
                  <p className="text-green-700">
                    Vous avez déjà accepté ce guide de parrainage. 
                    Vous pouvez maintenant utiliser votre espace ambassadeur.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section d'acceptation */}
          {showAcceptButton && !hasAccepted && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                  Acceptation du guide de parrainage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="accept-guide"
                    checked={accepted}
                    onCheckedChange={(checked) => setAccepted(checked as boolean)}
                  />
                  <label 
                    htmlFor="accept-guide"
                    className="text-sm text-gray-900 leading-5 cursor-pointer"
                  >
                    J'ai lu et j'accepte les conditions du guide de parrainage. 
                    Je comprends les règles de rémunération et m'engage à respecter 
                    les conditions de collecte des données personnelles (RGPD).
                  </label>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    Confirmation par email
                  </h4>
                  <p className="text-sm text-gray-600">
                    Après acceptation, vous recevrez un email de confirmation 
                    avec une copie de ce guide et vos accès à l'espace ambassadeur.
                  </p>
                </div>

                <div className="text-center">
                  <Button 
                    onClick={handleAccept}
                    disabled={!accepted || loading}
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 px-8"
                  >
                    {loading ? (
                      'Traitement en cours...'
                    ) : (
                      <>
                        J'accepte le guide de parrainage
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  En acceptant, vous confirmez avoir lu et compris toutes les 
                  conditions de ce guide de parrainage.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Navigation de retour si pas d'onboarding */}
          {!isOnboardingMode && !showAcceptButton && !hasAccepted && (
            <div className="text-center mt-8">
              <Button 
                onClick={() => navigate('/dashboard-page')}
                variant="outline"
                size="lg"
              >
                Retour au tableau de bord
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuideParrainage;