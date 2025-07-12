import { useState, useEffect } from 'react';

/**
 * Hook pour debouncer une valeur afin d'éviter les requêtes trop fréquentes
 * @param value - La valeur à debouncer
 * @param delay - Le délai en millisecondes (300ms par défaut pour les recherches)
 * @returns La valeur debouncée
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Créer un timer qui met à jour la valeur debouncée après le délai
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoyer le timer si la valeur change avant que le délai soit écoulé
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook pour debouncer spécifiquement les recherches avec un délai optimisé
 * @param searchTerm - Le terme de recherche
 * @param delay - Le délai en millisecondes (300ms par défaut)
 * @returns Le terme de recherche debouncé
 */
export function useSearchDebounce(searchTerm: string, delay: number = 300): string {
  return useDebounce(searchTerm, delay);
}
