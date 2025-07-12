// Manifest PWA pour AmbassyApp
export const manifestData = {
  name: "AmbassyApp - Partenaires Solaire",
  short_name: "AmbassyApp",
  description: "Application pour les apporteurs d'affaires dans le secteur solaire. Gérez vos prospects et commissions facilement.",
  start_url: "/ambassadeurs/",
  display: "standalone" as const,
  background_color: "#f97316",
  theme_color: "#ea580c",
  orientation: "portrait-primary" as const,
  scope: "/ambassadeurs/",
  lang: "fr",
  categories: ["business", "productivity", "utilities"],
  screenshots: [],
  icons: [
    {
      src: "/icon-72.png",
      sizes: "72x72",
      type: "image/png"
    },
    {
      src: "/icon-96.png", 
      sizes: "96x96",
      type: "image/png"
    },
    {
      src: "/icon-128.png",
      sizes: "128x128", 
      type: "image/png"
    },
    {
      src: "/icon-144.png",
      sizes: "144x144",
      type: "image/png"
    },
    {
      src: "/icon-152.png",
      sizes: "152x152",
      type: "image/png"
    },
    {
      src: "/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: "/icon-384.png",
      sizes: "384x384",
      type: "image/png"
    },
    {
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable"
    }
  ],
  shortcuts: [
    {
      name: "Tableau de bord",
      short_name: "Dashboard",
      description: "Accéder directement au tableau de bord",
      url: "/ambassadeurs/dashboard-page",
      icons: [
        {
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' fill='%23f97316' rx='18'/%3E%3Ccircle cx='48' cy='48' r='15' fill='%23fbbf24'/%3E%3C/svg%3E",
          sizes: "96x96",
        },
      ],
    },
    {
      name: "Nouveau Lead",
      short_name: "Lead",
      description: "Ajouter un nouveau prospect",
      url: "/ambassadeurs/lead-form",
      icons: [
        {
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' fill='%23f97316' rx='18'/%3E%3Ccircle cx='48' cy='48' r='15' fill='%23fbbf24'/%3E%3C/svg%3E",
          sizes: "96x96",
        },
      ],
    },
    {
      name: "Mes Commissions",
      short_name: "Commissions",
      description: "Voir mes commissions et paiements",
      url: "/ambassadeurs/commissions-page",
      icons: [
        {
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' fill='%23f97316' rx='18'/%3E%3Ccircle cx='48' cy='48' r='15' fill='%23fbbf24'/%3E%3C/svg%3E",
          sizes: "96x96",
        },
      ],
    },
  ],
};

// Générer le manifest.json pour le servir
export const generateManifestJson = () => {
  return JSON.stringify(manifestData, null, 2);
};
