import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUserGuardContext } from "app/auth";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import brain from "brain";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MobileNavigation } from "components/MobileNavigation";

// Schema for form validation using Zod
const formSchema = z.object({
  prospect_name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  prospect_phone: z.string().regex(/^(?:(?:\+|00)33[\s.-]{0,3}(?:\(0\)[\s.-]{0,3})?|0)[1-9](?:(?:[\s.-]?\d{2}){4}|\d{2}(?:[\s.-]?\d{3}){2})$/, { message: "Numéro de téléphone invalide." }),
  prospect_email: z.string().email({ message: "Adresse email invalide." }),
  prospect_city: z.string().min(2, { message: "La ville doit contenir au moins 2 caractères." }),
  notes: z.string().optional(),
  gdpr_consent: z.literal(true, {
    errorMap: () => ({ message: "Le consentement RGPD est obligatoire." }),
  }),
});

export default function LeadForm() {
    const { user } = useUserGuardContext();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            prospect_name: "",
            prospect_phone: "",
            prospect_email: "",
            prospect_city: "",
            notes: "",
            gdpr_consent: false,
        }
    });

    const mutation = useMutation({
        mutationFn: (newLead: z.infer<typeof formSchema>) => {
            return brain.submit_lead({
                prospect_name: newLead.prospect_name,
                prospect_phone: newLead.prospect_phone,
                prospect_email: newLead.prospect_email,
                prospect_city: newLead.prospect_city,
                notes: newLead.notes,
            });
        },
        onSuccess: () => {
            toast.success("Filleul soumis avec succès !");
            queryClient.invalidateQueries({ queryKey: ["dashboardData", user.id] });
            navigate("/dashboard-page");
        },
        onError: (error) => {
            toast.error("Erreur lors de la soumission.", {
                description: "Veuillez réessayer. Si le problème persiste, contactez le support.",
            });
            console.error("Submission error:", error);
        },
    });

    const onSubmit = (data: z.infer<typeof formSchema>) => {
        mutation.mutate(data);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-slate-700 to-slate-800 text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto pb-24 md:pb-8"> {/* Extra padding bottom for mobile nav */}
                <Button variant="ghost" onClick={() => navigate("/dashboard-page")} className="mb-4 text-white/80 hover:bg-white/10 touch-manipulation min-h-[44px]">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour au tableau de bord
                </Button>
                
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-white text-shadow">Saisir un nouveau filleul</CardTitle>
                        <CardDescription className="text-white/70">
                            Remplissez les informations ci-dessous. Les champs marqués d'un * sont obligatoires.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="prospect_name" className="text-white/90">Nom du filleul *</Label>
                                <Controller
                                    name="prospect_name"
                                    control={control}
                                    render={({ field }) => <Input id="prospect_name" {...field} className="bg-white/20 border-2 border-yellow-400/50 text-white placeholder:text-gray-300 focus:border-yellow-400 focus:bg-white/30" placeholder="John Doe" />}
                                />
                                {errors.prospect_name && <p className="text-red-400 text-sm">{errors.prospect_name.message}</p>}
                            </div>
                            
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="prospect_phone" className="text-white/90">Téléphone *</Label>
                                    <Controller
                                        name="prospect_phone"
                                        control={control}
                                        render={({ field }) => <Input id="prospect_phone" {...field} className="bg-white/20 border-2 border-yellow-400/50 text-white placeholder:text-gray-300 focus:border-yellow-400 focus:bg-white/30 min-h-[48px] text-base" placeholder="06 12 34 56 78" type="tel" autoComplete="tel" inputMode="tel" />}
                                    />
                                    {errors.prospect_phone && <p className="text-red-400 text-sm">{errors.prospect_phone.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="prospect_email" className="text-white/90">Email *</Label>
                                     <Controller
                                        name="prospect_email"
                                        control={control}
                                        render={({ field }) => <Input id="prospect_email" type="email" {...field} className="bg-white/20 border-2 border-yellow-400/50 text-white placeholder:text-gray-300 focus:border-yellow-400 focus:bg-white/30 min-h-[48px] text-base" placeholder="john.doe@email.com" autoComplete="email" inputMode="email" />}
                                    />
                                    {errors.prospect_email && <p className="text-red-400 text-sm">{errors.prospect_email.message}</p>}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="prospect_city" className="text-white/90">Ville *</Label>
                                <Controller
                                    name="prospect_city"
                                    control={control}
                                    render={({ field }) => <Input id="prospect_city" {...field} className="bg-white/20 border-2 border-yellow-400/50 text-white placeholder:text-gray-300 focus:border-yellow-400 focus:bg-white/30" placeholder="Paris" />}
                                />
                                {errors.prospect_city && <p className="text-red-400 text-sm">{errors.prospect_city.message}</p>}
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="notes" className="text-white/90">Notes (optionnel)</Label>
                                <Controller
                                    name="notes"
                                    control={control}
                                    render={({ field }) => <Textarea id="notes" {...field} className="bg-white/20 border-2 border-yellow-400/50 text-white placeholder:text-gray-300 focus:border-yellow-400 focus:bg-white/30 min-h-[100px] text-base resize-none" placeholder="Informations complémentaires..." rows={4} />}
                                />
                            </div>
                            
                            <div className="flex items-start space-x-3">
                                 <Controller
                                    name="gdpr_consent"
                                    control={control}
                                    render={({ field }) => (
                                        <Checkbox
                                            id="gdpr_consent"
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            className="mt-1 border-white/50 data-[state=checked]:bg-yellow-400"
                                        />
                                    )}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label
                                      htmlFor="gdpr_consent"
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white/80"
                                    >
                                      Je confirme avoir obtenu le consentement explicite du prospect pour la collecte et l'utilisation de ses données personnelles à des fins commerciales, conformément au RGPD. *
                                    </label>
                                    {errors.gdpr_consent && <p className="text-red-400 text-sm">{errors.gdpr_consent.message}</p>}
                                </div>
                            </div>
                            
                            <Button type="submit" disabled={isSubmitting || mutation.isPending} className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold shadow-md touch-manipulation min-h-[52px] py-4 text-lg">
                                {isSubmitting || mutation.isPending ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                                        Envoi en cours...
                                    </div>
                                ) : (
                                    "Soumettre le prospect"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
            <MobileNavigation />
        </div>
    );
}
