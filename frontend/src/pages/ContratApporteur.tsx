import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserGuardContext } from 'app/auth';
import brain from 'brain';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Check, Loader2, Download, FileText, Building2 } from 'lucide-react';
import type { ProfileCheckResponse } from 'types';

interface Contract {
  id: number;
  contract_type: string;
  company_name: string;
  siret_number: string;
  contract_html: string;
  is_signed: boolean;
  signed_at: string | null;
  created_at: string;
}

const ContratApporteur = () => {
  const { user } = useUserGuardContext();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasShownToast, setHasShownToast] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [siretNumber, setSiretNumber] = useState('');
  const [generating, setGenerating] = useState(false);
  const [signing, setSigning] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    loadContract();
  }, []);

  const loadContract = async () => {
    try {
      setLoading(true);
      const response = await brain.get_my_contract();
      
      if (response.status === 404) {
        // Pas de contrat existant, vérifier si le profil est complet
        try {
          const profileResponse = await brain.check_profile_completion();
          const profileData: ProfileCheckResponse = await profileResponse.json();
          
          // Stocker les données du profil
          if (profileData.user_profile) {
            setUserProfile(profileData.user_profile);
          }
          
          if (!profileData.is_complete) {
            // Profil incomplet, rediriger vers onboarding
            toast.info('Veuillez compléter votre profil d\'abord.');
            navigate('/onboarding');
            return;
          }
        } catch (profileError) {
          console.error('Erreur lors de la vérification du profil:', profileError);
          toast.error('Erreur lors de la vérification du profil. Redirection vers l\'onboarding.');
          navigate('/onboarding');
          return;
        }
        
        // Profil complet mais pas de contrat, on peut rester sur cette page
        setContract(null);
      } else {
        const data = await response.json();
        setContract(data);
        
        // Ne plus rediriger automatiquement si contrat signé
        // L'utilisateur peut maintenant consulter son contrat signé
        if (data.is_signed && !hasShownToast) {
          setHasShownToast(true);
          toast.success('Votre contrat est déjà signé.');
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du contrat:', error);
      toast.error('Erreur lors du chargement du contrat');
    } finally {
      setLoading(false);
    }
  };

  const generateContract = async () => {
    if (!companyName.trim() || !siretNumber.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setGenerating(true);
      const response = await brain.generate_contract({
        company_name: companyName,
        siret_number: siretNumber
      });
      
      if (response.ok) {
        const data = await response.json();
        setContract(data);
        setShowCompanyForm(false);
        toast.success('Contrat généré avec succès');
      } else {
        const errorText = await response.text();
        console.error('Erreur lors de la génération:', errorText);
        toast.error('Erreur lors de la génération du contrat');
      }
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      toast.error('Erreur lors de la génération du contrat');
    } finally {
      setGenerating(false);
    }
  };

  const signContract = async () => {
    if (!accepted) {
      toast.error('Vous devez accepter les termes du contrat');
      return;
    }

    if (!contract?.id) {
      toast.error('Aucun contrat à signer');
      return;
    }

    try {
      setSigning(true);
      const response = await brain.sign_contract({
        contract_id: contract.id
      });
      
      if (response.ok) {
        toast.success('Contrat signé avec succès!');
        // Mettre à jour l'état local du contrat
        setContract({ ...contract, is_signed: true, signed_at: new Date().toISOString() });
        setHasShownToast(true); // Éviter les messages multiples
      } else {
        const errorText = await response.text();
        console.error('Erreur lors de la signature:', errorText);
        toast.error('Erreur lors de la signature du contrat');
      }
    } catch (error) {
      console.error('Erreur lors de la signature:', error);
      toast.error('Erreur lors de la signature du contrat');
    } finally {
      setSigning(false);
    }
  };

  const downloadPdf = async () => {
    if (!contract?.contract_html) {
      toast.error('Aucun contrat à télécharger');
      return;
    }

    try {
      setDownloadingPdf(true);
      
      // Créer une nouvelle fenêtre avec le contrat HTML
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Veuillez autoriser les pop-ups pour télécharger le PDF');
        return;
      }
      
      // Injecter le HTML du contrat avec styles d'impression
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Contrat d'Apporteur d'Affaires</title>
          <style>
            @media print {
              @page { margin: 2cm; }
              body { font-family: Arial, sans-serif; }
            }
            body { font-family: Arial, sans-serif; padding: 20px; }
          </style>
        </head>
        <body>
          ${contract.contract_html}
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Attendre que le contenu soit chargé puis imprimer
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      };
      
      toast.success('Fenêtre d\'impression ouverte');
      
    } catch (error) {
      console.error('Erreur lors de l\'ouverture:', error);
      toast.error('Erreur lors de l\'ouverture du contrat');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement de votre contrat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* En-tête */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Contrat d'Apporteur d'Affaires
            </h1>
            <p className="text-gray-600">
              Veuillez examiner et signer votre contrat d'apporteur d'affaires
            </p>
          </div>

          {!contract ? (
            /* Génération du contrat */
            <>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Informations de votre société
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">
                    Pour générer votre contrat d'apporteur d'affaires, nous avons besoin 
                    des informations suivantes sur votre société :
                  </p>
                  
                  <div className="space-y-4 max-w-md">
                    <div>
                      <Label htmlFor="company-name">Nom ou raison sociale *</Label>
                      <Input
                        id="company-name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ex: SARL MonEntreprise ou Dupont Jean"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="siret-number">Numéro SIRET *</Label>
                      <Input
                        id="siret-number"
                        value={siretNumber}
                        onChange={(e) => setSiretNumber(e.target.value)}
                        placeholder="14 chiffres (ex: 12345678901234)"
                        maxLength={14}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Vous pouvez trouver votre SIRET sur vos documents officiels ou sur le site sirene.fr
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button 
                      onClick={generateContract}
                      disabled={generating || !companyName.trim() || !siretNumber.trim()}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Génération en cours...
                        </>
                      ) : (
                        'Générer mon contrat'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : contract.is_signed ? (
            /* Contrat déjà signé */
            <Card className="mb-8">
              <CardContent className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Contrat déjà signé
                </h2>
                <p className="text-gray-600 mb-6">
                  Votre contrat a été signé le {new Date(contract.signed_at!).toLocaleDateString('fr-FR')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => navigate('/dashboard')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Accéder à mon espace
                  </Button>
                  <Button 
                    onClick={downloadPdf}
                    disabled={downloadingPdf}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    {downloadingPdf ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Ouverture...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger PDF
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Affichage et signature du contrat */
            <>
              {/* Aperçu du contrat */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Votre contrat d'apporteur d'affaires</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-6 bg-white overflow-y-auto">
                    <div 
                      dangerouslySetInnerHTML={{ __html: contract.contract_html }}
                      className="prose prose-sm max-w-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Section de signature */}
              <Card>
                <CardHeader>
                  <CardTitle>Signature électronique</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Acceptation des termes */}
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="accept-contract"
                        checked={accepted}
                        onCheckedChange={(checked) => setAccepted(checked as boolean)}
                      />
                      <label 
                        htmlFor="accept-contract"
                        className="text-base text-gray-900 leading-relaxed cursor-pointer font-medium"
                      >
                        J'ai lu et j'accepte les termes et conditions du contrat d'apporteur d'affaires. 
                        Je comprends mes obligations et les conditions de rémunération décrites dans ce contrat.
                      </label>
                    </div>

                    {/* Informations de signature */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Informations de signature</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Signataire :</strong> {userProfile?.full_name || 'Non renseigné'}</p>
                        <p><strong>ID Utilisateur :</strong> {user.sub}</p>
                        <p><strong>Date :</strong> {new Date().toLocaleDateString('fr-FR')}</p>
                        <p><strong>Heure :</strong> {new Date().toLocaleTimeString('fr-FR')}</p>
                      </div>
                    </div>

                    {/* Bouton de signature */}
                    <div className="text-center">
                      <Button 
                        onClick={signContract}
                        disabled={!accepted || signing}
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 px-8"
                      >
                        {signing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Signature en cours...
                          </>
                        ) : (
                          'Signer électroniquement'
                        )}
                      </Button>
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                      En cliquant sur "Signer électroniquement", vous acceptez de signer ce contrat 
                      avec la même valeur juridique qu'une signature manuscrite.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContratApporteur;
