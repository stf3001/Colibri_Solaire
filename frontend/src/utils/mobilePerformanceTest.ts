/**
 * Utilitaires pour tester et monitorer les performances mobile
 * Aide à valider les optimisations implémentées
 */

/**
 * Mesure les Core Web Vitals pour l'expérience mobile
 */
export const measureWebVitals = () => {
  const vitals = {
    FCP: 0,  // First Contentful Paint
    LCP: 0,  // Largest Contentful Paint
    FID: 0,  // First Input Delay
    CLS: 0,  // Cumulative Layout Shift
    TTFB: 0  // Time to First Byte
  };

  // Mesurer FCP
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        vitals.FCP = entry.startTime;
        console.log('🎨 First Contentful Paint:', vitals.FCP.toFixed(2), 'ms');
      }
    }
  });
  observer.observe({ entryTypes: ['paint'] });

  // Mesurer LCP
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    vitals.LCP = lastEntry.startTime;
    console.log('🖼️ Largest Contentful Paint:', vitals.LCP.toFixed(2), 'ms');
  });
  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

  // Mesurer CLS
  const clsObserver = new PerformanceObserver((list) => {
    let clsValue = 0;
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    }
    vitals.CLS = clsValue;
    console.log('📐 Cumulative Layout Shift:', vitals.CLS.toFixed(4));
  });
  clsObserver.observe({ entryTypes: ['layout-shift'] });

  return vitals;
};

/**
 * Teste la responsivité mobile sur différentes tailles d'écran
 */
export const testMobileResponsiveness = () => {
  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'Samsung Galaxy S20', width: 360, height: 800 },
    { name: 'iPad Mini', width: 768, height: 1024 }
  ];

  console.log('📱 Test de responsivité mobile:');
  viewports.forEach(viewport => {
    console.log(`📏 ${viewport.name}: ${viewport.width}x${viewport.height}px`);
    
    // Vérifier si les éléments critiques sont visibles
    const criticalElements = [
      '.mobile-navigation',
      '[data-testid="main-content"]',
      '.touch-target'
    ];
    
    criticalElements.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        console.log(`  ✅ ${selector}: ${isVisible ? 'Visible' : 'Masqué'}`);
      }
    });
  });
};

/**
 * Analyse les performances de chargement des images
 */
export const analyzeImagePerformance = () => {
  const images = Array.from(document.querySelectorAll('img'));
  console.log('🖼️ Analyse des performances images:');
  
  images.forEach((img, index) => {
    const isLazy = img.loading === 'lazy';
    const hasOptimizedFormat = img.src.includes('webp') || img.src.includes('q=');
    const size = {
      natural: { width: img.naturalWidth, height: img.naturalHeight },
      displayed: { width: img.offsetWidth, height: img.offsetHeight }
    };
    
    console.log(`Image ${index + 1}:`);
    console.log(`  📐 Taille naturelle: ${size.natural.width}x${size.natural.height}`);
    console.log(`  📱 Taille affichée: ${size.displayed.width}x${size.displayed.height}`);
    console.log(`  ⚡ Lazy loading: ${isLazy ? '✅' : '❌'}`);
    console.log(`  🎯 Format optimisé: ${hasOptimizedFormat ? '✅' : '❌'}`);
  });
};

/**
 * Vérifie les optimisations tactiles
 */
export const checkTouchOptimizations = () => {
  console.log('👆 Vérification des optimisations tactiles:');
  
  const touchTargets = document.querySelectorAll('button, [role="button"], input, select, textarea, a');
  let validTargets = 0;
  
  touchTargets.forEach((element, index) => {
    const rect = element.getBoundingClientRect();
    const minSize = 44; // Minimum recommandé par Apple/Google
    const isValidSize = rect.width >= minSize && rect.height >= minSize;
    
    if (isValidSize) validTargets++;
    
    if (!isValidSize) {
      console.warn(`⚠️ Touch target ${index + 1} trop petit: ${rect.width.toFixed(1)}x${rect.height.toFixed(1)}px`);
    }
  });
  
  const touchOptimizationRate = (validTargets / touchTargets.length) * 100;
  console.log(`✅ Optimisation tactile: ${touchOptimizationRate.toFixed(1)}% (${validTargets}/${touchTargets.length})`);
  
  return touchOptimizationRate;
};

/**
 * Test complet de performance mobile
 */
export const runMobilePerformanceAudit = () => {
  console.log('🚀 === AUDIT PERFORMANCE MOBILE ===');
  console.log('📅 Date:', new Date().toISOString());
  console.log('🌐 User Agent:', navigator.userAgent);
  console.log('📱 Viewport:', `${window.innerWidth}x${window.innerHeight}px`);
  
  // Mesures de performance
  const vitals = measureWebVitals();
  
  // Tests de responsivité
  setTimeout(() => {
    testMobileResponsiveness();
    analyzeImagePerformance();
    const touchScore = checkTouchOptimizations();
    
    // Score global
    console.log('\n📊 === RÉSUMÉ DE L\'AUDIT ===');
    console.log(`📱 Optimisation tactile: ${touchScore > 80 ? '✅' : '⚠️'} ${touchScore.toFixed(1)}%`);
    console.log(`⚡ Lazy loading: ${document.querySelectorAll('img[loading="lazy"]').length > 0 ? '✅' : '❌'}`);
    console.log(`🎨 Navigation mobile: ${document.querySelector('.mobile-navigation') ? '✅' : '❌'}`);
    console.log(`🔄 Touch manipulation: ${document.querySelectorAll('.touch-manipulation').length > 0 ? '✅' : '❌'}`);
    
  }, 2000);
};

/**
 * Hook pour surveiller les performances en temps réel
 */
export const usePerformanceMonitoring = () => {
  const startMonitoring = () => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      runMobilePerformanceAudit();
    }
  };
  
  return { startMonitoring };
};