import { useState, useEffect } from "react";
import { useUserGuardContext } from "app/auth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, FileText, CheckCircle, ArrowLeft } from "lucide-react";
import brain from "brain";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ContractResponse, ProfileCheckResponse } from "types";

export default function ContratApporteurPage() {
    const { user } = useUserGuardContext();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const [companyName, setCompanyName] = useState("");
    const [siretNumber, setSiretNumber] = useState("");
    const [agreementChecked, setAgreementChecked] = useState(false);
    const [showContract, setShowContract] = useState(false);

    // Check if user already has a contract
    const { data: existingContract, isLoading: contractLoading } = useQuery<ContractResponse | null>({
        queryKey: ["userContract", user.id],
        queryFn: async () => {
            const response = await brain.get_my_contract();
            return response.json();
        },
    });

    // Get user profile data for auto-completion
    const { data: profileData, isLoading: profileLoading } = useQuery<ProfileCheckResponse>({
        queryKey: ["userProfile", user.id],
        queryFn: async () => {
            const response = await brain.check_profile_completion();
            return response.json();
        },
    });

    // Auto-complete form fields when profile data is loaded
    useEffect(() => {
        if (profileData?.user_profile) {
            const profile = profileData.user_profile;
            if (profile.full_name && !companyName) {
                setCompanyName(profile.full_name);
            }
            if (profile.siret && !siretNumber) {
                setSiretNumber(profile.siret);
            }
        }
    }, [profileData, companyName, siretNumber]);

    // Generate contract mutation
    const generateContractMutation = useMutation({
        mutationFn: () => brain.generate_contract({
            company_name: companyName,
            siret_number: siretNumber
        }),
        onSuccess: (response) => {
            toast.success("Contrat généré avec succès !");
            queryClient.invalidateQueries({ queryKey: ["userContract", user.id] });
            setShowContract(true);
        },
        onError: (error: any) => {
            console.error("Erreur génération contrat:", error);
            toast.error("Erreur lors de la génération du contrat");
        },
    });

    // Sign contract mutation
    const signContractMutation = useMutation({
        mutationFn: (contractId: number) => 
            brain.sign_contract({ contract_id: contractId }),
        onSuccess: () => {
            toast.success("Contrat signé avec succès !", {
                description: "Redirection vers votre tableau de bord..."
            });
            queryClient.invalidateQueries({ queryKey: ["userContract", user.id] });
            // Redirect to dashboard after successful signing
            setTimeout(() => navigate("/dashboard-page"), 1500);
        },
        onError: (error: any) => {
            console.error("Erreur signature contrat:", error);
            toast.error("Erreur lors de la signature du contrat");
        },
    });

    const handleGenerateContract = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!companyName.trim()) {
            toast.error("Veuillez saisir le nom de votre société");
            return;
        }
        
        if (!siretNumber.trim() || siretNumber.length !== 14) {
            toast.error("Veuillez saisir un numéro SIRET valide (14 chiffres)");
            return;
        }
        
        generateContractMutation.mutate();
    };

    const handleSignContract = () => {
        if (!agreementChecked) {
            toast.error("Veuillez accepter les termes du contrat");
            return;
        }
        
        if (existingContract?.id) {
            signContractMutation.mutate(existingContract.id);
        }
    };

    // If user already has a signed contract, redirect to dashboard
    useEffect(() => {
        if (existingContract?.is_signed) {
            navigate("/dashboard-page");
        }
    }, [existingContract, navigate]);

    if (contractLoading || profileLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 via-slate-700 to-slate-800 flex items-center justify-center">
                <Card className="glass-card w-full max-w-2xl mx-4">
                    <CardHeader className="text-center">
                        <Skeleton className="h-8 w-64 bg-white/20 mx-auto" />
                        <Skeleton className="h-4 w-96 bg-white/20 mx-auto mt-2" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full bg-white/20" />
                            <Skeleton className="h-12 w-full bg-white/20" />
                            <Skeleton className="h-10 w-32 bg-white/20" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-slate-700 to-slate-800 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <Button 
                    variant="ghost" 
                    onClick={() => navigate("/onboarding-page")} 
                    className="mb-6 text-white/80 hover:text-white hover:bg-white/10"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                </Button>

                {!existingContract ? (
                    // Generate contract form
                    <Card className="glass-card">
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl font-bold text-white text-shadow flex items-center justify-center gap-3">
                                <FileText className="h-8 w-8" />
                                Génération du Contrat d'Apporteur d'Affaires
                            </CardTitle>
                            <CardDescription className="text-white/70 text-lg">
                                Veuillez fournir les informations nécessaires pour générer votre contrat professionnel.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleGenerateContract} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="companyName" className="text-white/90 font-medium">
                                            Nom de la société / Raison sociale *
                                        </Label>
                                        <Input
                                            id="companyName"
                                            type="text"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder="Ex: SARL MonEntreprise"
                                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="siretNumber" className="text-white/90 font-medium">
                                            Numéro SIRET *
                                        </Label>
                                        <Input
                                            id="siretNumber"
                                            type="text"
                                            value={siretNumber}
                                            onChange={(e) => setSiretNumber(e.target.value.replace(/\D/g, ''))}
                                            placeholder="12345678901234"
                                            maxLength={14}
                                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                            required
                                        />
                                        <p className="text-white/60 text-sm">
                                            14 chiffres - Trouvez votre SIRET sur votre Kbis
                                        </p>
                                    </div>
                                </div>
                                
                                <Button 
                                    type="submit" 
                                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-lg py-6"
                                    disabled={generateContractMutation.isPending}
                                >
                                    {generateContractMutation.isPending ? "Génération en cours..." : "Générer le contrat"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                ) : existingContract.is_signed ? (
                    // Contract already signed
                    <Card className="glass-card">
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl font-bold text-white text-shadow flex items-center justify-center gap-3">
                                <CheckCircle className="h-8 w-8 text-green-400" />
                                Contrat Signé
                            </CardTitle>
                            <CardDescription className="text-white/70 text-lg">
                                Votre contrat d'apporteur d'affaires a été signé avec succès.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-white/80 mb-6">
                                Signé le {new Date(existingContract.signed_at!).toLocaleDateString('fr-FR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                            <Button 
                                onClick={() => navigate("/dashboard-page")} 
                                className="bg-green-500 hover:bg-green-600 text-white font-bold"
                            >
                                Accéder au tableau de bord
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    // Contract ready for signature
                    <div className="space-y-6">
                        <Card className="glass-card">
                            <CardHeader className="text-center">
                                <CardTitle className="text-3xl font-bold text-white text-shadow flex items-center justify-center gap-3">
                                    <FileText className="h-8 w-8" />
                                    Signature du Contrat
                                </CardTitle>
                                <CardDescription className="text-white/70 text-lg">
                                    Veuillez lire attentivement et signer votre contrat d'apporteur d'affaires.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        {/* Contract content */}
                        <Card className="glass-card">
                            <CardContent className="p-6">
                                <div 
                                    className="bg-white p-6 rounded-lg shadow-lg max-h-96 overflow-y-auto"
                                    dangerouslySetInnerHTML={{ __html: existingContract.contract_html }}
                                />
                                
                                {/* Date du jour */}
                                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-sm text-blue-800 font-medium">
                                        <span className="font-bold">Fait le :</span> {new Date().toLocaleDateString('fr-FR', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Signature section */}
                        <Card className="glass-card">
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-2">
                                        <Checkbox
                                            id="agreement"
                                            checked={agreementChecked}
                                            onCheckedChange={setAgreementChecked}
                                            className="mt-1 border-white/50 data-[state=checked]:bg-yellow-400"
                                        />
                                        <Label
                                            htmlFor="agreement"
                                            className="text-white/90 font-medium leading-relaxed cursor-pointer"
                                        >
                                            J'ai lu et j'accepte les termes et conditions de ce contrat d'apporteur d'affaires. 
                                            Je comprends que cette signature électronique a la même valeur légale qu'une signature manuscrite.
                                        </Label>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-white/20">
                                        <p className="text-white/70 text-sm mb-4">
                                            <AlertCircle className="h-4 w-4 inline mr-2" />
                                            En cliquant sur "Signer le contrat", vous acceptez définitivement les termes de ce contrat. 
                                            Cette action est irréversible et sera horodatée avec votre adresse IP.
                                        </p>
                                        
                                        <Button 
                                            onClick={handleSignContract}
                                            disabled={!agreementChecked || signContractMutation.isPending}
                                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold text-lg py-6"
                                        >
                                            {signContractMutation.isPending ? "Signature en cours..." : "✍️ Signer le contrat"}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
