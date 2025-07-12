import { APP_TITLE } from "app";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sun } from "lucide-react";
import { stackClientApp } from "app/auth";
import { useUser } from "@stackframe/react";
import { useNavigate } from "react-router-dom";

// Fonction pour vérifier si un utilisateur est admin
const isAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return email === 'stephane.a@voltalia-ms.com';
};

export default function App() {
  const user = useUser();
  const navigate = useNavigate();

  // Définir le titre de l'app
  useEffect(() => {
    document.title = "Espace Ambassadeurs SA-Voltalia";
  }, []);

  // IMPORTANT: Si utilisateur déjà connecté, rediriger automatiquement
  useEffect(() => {
    if (user) {
      console.log('Utilisateur déjà connecté, redirection...', user.primaryEmail);
      if (isAdmin(user.primaryEmail)) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard-page', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleGetStarted = async () => {
    // Utiliser stackClientApp normal
    await stackClientApp.redirectToSignIn();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-blue-600 to-slate-800 text-white flex flex-col items-center justify-center p-4 text-center">
      <div className="flex items-center justify-center gap-6 mb-8">
        {/* Logos partenaires */}
        <div className="flex items-center gap-4">
          <img 
            src="https://static.databutton.com/public/37fe5734-c127-47a0-bff0-150639aa4c74/Voltalia.png" 
            alt="Voltalia" 
            className="h-16 w-auto"
          />
          <img 
            src="https://static.databutton.com/public/37fe5734-c127-47a0-bff0-150639aa4c74/Leroy_Merlin.svg" 
            alt="Leroy Merlin" 
            className="h-16 w-auto"
          />
        </div>
      </div>
      
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-shadow mb-6">
          🌞 Faites briller le soleil avec nous 🌞
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold text-yellow-400 mb-6">
          
        </h2>
        <div className="inline-block bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-bold px-4 py-2 rounded-full text-lg">
          🏆 Espace Ambassadeurs
        </div>
      </div>
      
      <div className="flex gap-4">
        <Button
          onClick={handleGetStarted}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold shadow-lg text-lg py-3 px-8 rounded-full transition-transform transform hover:scale-105"
        >
          Se connecter / S'inscrire
        </Button>
      </div>
      
      {/* Section informative */}
      <div className="mt-12 max-w-4xl mx-auto">
        <h3 className="text-xl font-semibold text-yellow-400 mb-6">Comment ça marche ?</h3>
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl mb-2">1️⃣</div>
            <h4 className="font-semibold mb-2">Créez votre compte</h4>
            <p className="text-white/80">Inscrivez-vous en tant qu'apporteur professionnel ou particulier</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl mb-2">2️⃣</div>
            <h4 className="font-semibold mb-2">Saisissez vos prospects</h4>
            <p className="text-white/80">Ajoutez facilement vos leads solaires avec notre formulaire simple</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl mb-2">3️⃣</div>
            <h4 className="font-semibold mb-2">Suivez vos commissions</h4>
            <p className="text-white/80">Visualisez l'avancement de vos prospects et vos gains en temps réel</p>
          </div>
        </div>
      </div>
    </div>
  );
}