import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserGuardContext } from 'app/auth';
import brain from 'brain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, User, Building, FileText, ChevronRight, ChevronLeft } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import type { UserType } from 'types';

interface OnboardingData {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  userType: string;
  siret?: string;
  gdprConsent: boolean;
}

const STEPS = [
  {
    id: 1,
    title: 'Informations personnelles',
    description: 'Renseignez vos informations de base',
    icon: User
  },
  {
    id: 2,
    title: 'Type de profil',
    description: 'Choisissez votre statut professionnel',
    icon: Building
  },
  {
    id: 3,
    title: 'Finalisation',
    description: 'Validation de votre profil',
    icon: FileText
  }
];

export default function OnboardingPage() {
  const { user } = useUserGuardContext();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    userType: '',
    siret: '',
    gdprConsent: false
  });

  useEffect(() => {
    // Pré-remplir les données depuis Stack Auth
    if (user.displayName) {
      setFormData(prev => ({ ...prev, fullName: user.displayName }));
    }
    if (user.primaryEmail) {
      setFormData(prev => ({ ...prev, email: user.primaryEmail }));
    }
  }, [user]);

  const handleInputChange = (field: keyof OnboardingData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.fullName.trim().length > 0 && formData.email.trim().length > 0 && formData.phone.trim().length > 0 && formData.city.trim().length > 0;
      case 2:
        return formData.userType !== '';
      case 3:
        return formData.gdprConsent;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      toast.error('Veuillez remplir tous les champs obligatoires');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsLoading(true);
    try {
      await brain.create_user_profile({
        full_name: formData.fullName,
        user_type: formData.userType as UserType,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        siret: formData.siret || null,
        gdpr_consent: formData.gdprConsent
      });

      toast.success('Profil créé avec succès!');
      
      // Redirection selon le type d'utilisateur
      if (formData.userType === 'professionnel') {
        navigate('/contrat-apporteur');
      } else {
        navigate('/guide-parrainage?onboarding=true');
      }
    } catch (error: any) {
      console.error('Erreur lors de la création du profil:', error);
      console.log('DEBUG - Type of error:', typeof error);
      console.log('DEBUG - Error status:', error?.status);
      console.log('DEBUG - Error keys:', Object.keys(error || {}));
      console.log('DEBUG - Full error object:', JSON.stringify(error, null, 2));
      
      // Si le profil existe déjà (409), traiter comme un succès
      if (error?.status === 409) {
        console.log('DEBUG - Detected 409 error, redirecting...');
        toast.success('Profil déjà existant, redirection en cours...');
        
        // Redirection selon le type d'utilisateur
        if (formData.userType === 'professionnel') {
          navigate('/contrat-apporteur');
        } else {
          navigate('/guide-parrainage?onboarding=true');
        }
        return;
      }
      
      // Pour toute autre erreur
      toast.error('Erreur lors de la création du profil');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Nom complet *
              </Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Votre nom et prénom"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="votre.email@exemple.com"
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Cet email sera utilisé pour vous contacter
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Téléphone *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="06 12 34 56 78"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium">
                Ville *
              </Label>
              <Input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Votre ville"
                className="w-full"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-sm font-medium">Type de profil *</Label>
              
              <div className="grid gap-4">
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.userType === 'professionnel' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('userType', 'professionnel')}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      formData.userType === 'professionnel' 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`} />
                    <div>
                      <h3 className="font-medium">Professionnel (BtoB)</h3>
                      <p className="text-sm text-gray-600">Entreprise, artisan, commercial</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.userType === 'particulier' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('userType', 'particulier')}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      formData.userType === 'particulier' 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`} />
                    <div>
                      <h3 className="font-medium">Particulier (BtoC)</h3>
                      <p className="text-sm text-gray-600">Apporteur individuel</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            

          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">Récapitulatif de votre profil</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Nom complet:</span>
                  <span className="text-sm font-medium">{formData.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm font-medium">{user.primaryEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Type:</span>
                  <Badge variant={formData.userType === 'professionnel' ? 'default' : 'secondary'}>
                    {formData.userType === 'professionnel' ? 'Professionnel' : 'Particulier'}
                  </Badge>
                </div>

              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="gdprConsent"
                  checked={formData.gdprConsent}
                  onCheckedChange={(checked) => handleInputChange('gdprConsent', checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="gdprConsent" className="text-sm leading-relaxed text-gray-900 font-medium">
                  <span className="font-semibold text-gray-900">Consentement RGPD *</span>
                  <br />
                  <span className="text-gray-800 font-normal">
                    J'accepte que mes données personnelles soient utilisées uniquement pour 
                    la mise en relation commerciale dans le cadre du programme d'apporteurs 
                    d'affaires Voltalia/Leroy Merlin. Ces données seront conservées conformément 
                    au RGPD et je peux exercer mes droits à tout moment.
                  </span>
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-slate-700 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <img 
                src="https://static.databutton.com/public/37fe5734-c127-47a0-bff0-150639aa4c74/Voltalia.png" 
                alt="Voltalia" 
                className="h-8 w-auto"
              />
              <img 
                src="https://static.databutton.com/public/37fe5734-c127-47a0-bff0-150639aa4c74/Leroy_Merlin.svg" 
                alt="Leroy Merlin" 
                className="h-8 w-auto"
              />
            </div>
          </div>
          <CardTitle className="text-2xl">Configuration de votre profil</CardTitle>
          <CardDescription>
            Finalisons votre inscription au réseau d'ambassadeurs
          </CardDescription>
          
          {/* Progress indicators */}
          <div className="flex justify-center mt-6">
            <div className="flex items-center space-x-4">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : isActive 
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'bg-gray-100 border-gray-300 text-gray-400'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="text-center">
                        <p className={`text-xs font-medium ${
                          isActive ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </p>
                      </div>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={`w-8 h-px ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-8">
            {renderStepContent()}
          </div>
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Précédent</span>
            </Button>
            
            {currentStep < 3 ? (
              <Button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className="flex items-center space-x-2"
              >
                <span>Suivant</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!validateStep(3) || isLoading}
                className="flex items-center space-x-2"
              >
                <span>{isLoading ? 'Création...' : 'Finaliser'}</span>
                {!isLoading && <CheckCircle className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
